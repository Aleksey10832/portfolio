using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Portfolio.Api.Repositories;
using Portfolio.Api.Services;
using StackExchange.Redis;

// Предполагается запуск из backend/.
// В production переменные можно передавать обычным окружением.
var envPath = Path.GetFullPath(
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"));

if (File.Exists(envPath))
{
    DotNetEnv.Env.NoClobber().Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

string Require(string name)
{
    var value = builder.Configuration[name];

    if (string.IsNullOrWhiteSpace(value))
        throw new InvalidOperationException($"Не задана переменная {name}.");

    return value;
}

var jwtKey = Require("JWT_KEY");
var redisConnection = Require("REDIS_CONNECTION");

Require("ADMINLOGIN");
Require("ADMINPASSWORD");

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "JWT_KEY должен содержать минимум 32 байта.");
}

builder.Services.AddControllers();
builder.Services.AddProblemDetails();

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var options = ConfigurationOptions.Parse(redisConnection);

    options.AbortOnConnectFail = false;
    options.ConnectTimeout = 5000;

    return ConnectionMultiplexer.Connect(options);
});

builder.Services.AddSingleton<PortfolioRepository>();
builder.Services.AddSingleton<SessionService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.IncludeErrorDetails = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = SessionService.Issuer,

            ValidateAudience = true,
            ValidAudience = SessionService.Audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),

            ValidateLifetime = true,
            RequireExpirationTime = true,

            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.FromSeconds(5)
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var sid = context.Principal?.FindFirst("sid")?.Value;
                var jti = context.Principal?.FindFirst("jti")?.Value;

                if (sid is null || jti is null)
                {
                    context.Fail("Некорректный токен.");
                    return;
                }

                var sessions = context.HttpContext.RequestServices
                    .GetRequiredService<SessionService>();

                if (!await sessions.IsAccessActiveAsync(sid, jti))
                {
                    context.Fail("Сессия завершена или токен заменён.");
                }
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    // Общий лимит входа подходит для панели с одним администратором.
    options.AddFixedWindowLimiter("login", limiter =>
    {
        limiter.PermitLimit = 10;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
        limiter.AutoReplenishment = true;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
});

var app = builder.Build();

app.UseExceptionHandler();

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";

    if (context.Request.Path.StartsWithSegments("/api/session")
        || context.Request.Path.StartsWithSegments("/api/admin"))
    {
        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers.Pragma = "no-cache";
    }

    await next();
});

app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();