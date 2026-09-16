using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using Portfolio.Api.Models;
using StackExchange.Redis;

namespace Portfolio.Api.Services;

public sealed class SessionService(
    IConnectionMultiplexer redis,
    IConfiguration configuration)
{
    public const string Issuer = "portfolio-api";
    public const string Audience = "portfolio-admin";

    private const int SessionLifetimeSeconds = 7 * 24 * 60 * 60;

    private readonly IDatabase _db = redis.GetDatabase();

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    // Общий hash tag позволяет выполнять Lua и в Redis Cluster.
    private static RedisKey SessionKey(string sid) =>
        $"portfolio:auth:{{{sid}}}:session";

    private static RedisKey ConfirmKey(string sid) =>
        $"portfolio:auth:{{{sid}}}:confirm";

    public bool ValidateCredentials(string login, string password)
    {
        return SecureEquals(login, configuration["ADMINLOGIN"]!)
            & SecureEquals(password, configuration["ADMINPASSWORD"]!);
    }

    public async Task<TokenPair> CreateAsync()
    {
        var sid = Guid.NewGuid().ToString("N");
        var jti = Guid.NewGuid().ToString("N");
        var refresh = CreateOpaqueToken(sid);
        var access = CreateAccessToken(sid, jti);

        const string script = """
            redis.call(
                'HSET', KEYS[1],
                'refreshHash', ARGV[1],
                'accessJti', ARGV[2]
            )

            redis.call('EXPIRE', KEYS[1], ARGV[3])
            return 1
            """;

        await _db.ScriptEvaluateAsync(
            script,
            [SessionKey(sid)],
            [
                Hash(refresh),
                jti,
                SessionLifetimeSeconds
            ]);

        return new TokenPair(access, refresh);
    }

    public async Task<TokenPair?> RefreshAsync(string refreshToken)
    {
        var sid = ExtractSessionId(refreshToken);
        if (sid is null)
            return null;

        var newJti = Guid.NewGuid().ToString("N");
        var nextRefresh = CreateOpaqueToken(sid);
        var confirm = CreateOpaqueToken(sid);

        var tokens = new TokenPair(
            CreateAccessToken(sid, newJti),
            nextRefresh,
            confirm);

        var serialized = JsonSerializer.Serialize(tokens, JsonOptions);

        const string script = """
            if redis.call('EXISTS', KEYS[1]) == 0 then
                return nil
            end

            local current = redis.call(
                'HGET', KEYS[1], 'refreshHash'
            )

            local previous = redis.call(
                'HGET', KEYS[1], 'previousRefreshHash'
            )

            local pending = redis.call(
                'HGET', KEYS[1], 'pendingTokens'
            )

            local confirmAlive = redis.call('EXISTS', KEYS[2])

            -- Повтор refresh до подтверждения возвращает ту же пару.
            if pending and confirmAlive == 1
                and (ARGV[1] == current or ARGV[1] == previous) then
                return pending
            end

            if ARGV[1] ~= current then
                return nil
            end

            redis.call(
                'HSET', KEYS[1],
                'previousRefreshHash', current,
                'refreshHash', ARGV[2],
                'accessJti', ARGV[3],
                'pendingTokens', ARGV[4]
            )

            redis.call('SET', KEYS[2], ARGV[5], 'EX', 30)

            return ARGV[4]
            """;

        var result = await _db.ScriptEvaluateAsync(
            script,
            [SessionKey(sid), ConfirmKey(sid)],
            [
                Hash(refreshToken),
                Hash(nextRefresh),
                newJti,
                serialized,
                Hash(confirm)
            ]);

        if (result.IsNull)
            return null;

        return JsonSerializer.Deserialize<TokenPair>(
            (string)result!,
            JsonOptions);
    }

    public async Task<bool> ConfirmAsync(string confirmToken)
    {
        var sid = ExtractSessionId(confirmToken);
        if (sid is null)
            return false;

        const string script = """
            if redis.call('EXISTS', KEYS[1]) == 0 then
                return 0
            end

            local expected = redis.call('GET', KEYS[2])

            if not expected or expected ~= ARGV[1] then
                return 0
            end

            redis.call(
                'HDEL', KEYS[1],
                'previousRefreshHash',
                'pendingTokens'
            )

            -- Ключ оставляем до исходного TTL:
            -- повтор подтверждения будет идемпотентным.
            return 1
            """;

        var result = await _db.ScriptEvaluateAsync(
            script,
            [SessionKey(sid), ConfirmKey(sid)],
            [Hash(confirmToken)]);

        return (long)result == 1;
    }

    public async Task<bool> IsAccessActiveAsync(string sid, string jti)
    {
        if (!Guid.TryParseExact(sid, "N", out _))
            return false;

        var activeJti = await _db.HashGetAsync(
            SessionKey(sid),
            "accessJti");

        return !activeJti.IsNullOrEmpty
            && SecureEquals(activeJti.ToString(), jti);
    }

    public async Task DeleteAsync(string sid)
    {
        await _db.KeyDeleteAsync(
            [SessionKey(sid), ConfirmKey(sid)]);
    }

    private string CreateAccessToken(string sid, string jti)
    {
        var now = DateTime.UtcNow;

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration["JWT_KEY"]!));

        var jwt = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, "admin"),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
                new Claim("sid", sid),
                new Claim(ClaimTypes.Role, "admin")
            ],
            notBefore: now,
            expires: now.AddMinutes(10),
            signingCredentials: new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }

    private static string CreateOpaqueToken(string sid) =>
        $"{sid}.{Base64UrlEncoder.Encode(
            RandomNumberGenerator.GetBytes(32))}";

    private static string? ExtractSessionId(string token)
    {
        var parts = token.Split('.');

        if (parts.Length != 2
            || !Guid.TryParseExact(parts[0], "N", out _)
            || parts[1].Length != 43)
        {
            return null;
        }

        return parts[0];
    }

    private static string Hash(string value) =>
        Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static bool SecureEquals(string left, string right)
    {
        var leftHash = SHA256.HashData(
            Encoding.UTF8.GetBytes(left));

        var rightHash = SHA256.HashData(
            Encoding.UTF8.GetBytes(right));

        return CryptographicOperations.FixedTimeEquals(
            leftHash,
            rightHash);
    }
}