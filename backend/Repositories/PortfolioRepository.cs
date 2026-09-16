using System.Text.Json;
using Portfolio.Api.Models;
using StackExchange.Redis;

namespace Portfolio.Api.Repositories;

public sealed class PortfolioRepository(IConnectionMultiplexer redis)
{
    private readonly IDatabase _db = redis.GetDatabase();

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    private const string AboutKey = "portfolio:content:about";

    private static string CollectionKey(string section) =>
        $"portfolio:content:{section}";

    public async Task<AboutBlock> GetAboutAsync()
    {
        var value = await _db.StringGetAsync(AboutKey);

        return value.IsNullOrEmpty
            ? new AboutBlock("", null)
            : JsonSerializer.Deserialize<AboutBlock>(
                value.ToString(), JsonOptions)!;
    }

    public async Task<AboutBlock> SaveAboutAsync(AboutInput input)
    {
        var about = new AboutBlock(
            input.Text?.Trim() ?? "",
            Normalize(input.PhotoUrl));

        await _db.StringSetAsync(
            AboutKey,
            JsonSerializer.Serialize(about, JsonOptions));

        return about;
    }

    public async Task ClearAboutAsync()
    {
        await _db.KeyDeleteAsync(AboutKey);
    }

    public async Task<IReadOnlyList<PortfolioItem>> GetItemsAsync(
        string section)
    {
        var values = await _db.HashGetAllAsync(CollectionKey(section));

        return values
            .Select(x => JsonSerializer.Deserialize<PortfolioItem>(
                x.Value.ToString(), JsonOptions)!)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Title, StringComparer.OrdinalIgnoreCase)
            .ThenBy(x => x.Id)
            .ToArray();
    }

    public async Task<PortfolioDocument> GetAsync()
    {
        var aboutTask = GetAboutAsync();
        var skillsTask = GetItemsAsync("skills");
        var jobsTask = GetItemsAsync("jobs");
        var projectsTask = GetItemsAsync("projects");

        await Task.WhenAll(
            aboutTask,
            skillsTask,
            jobsTask,
            projectsTask);

        return new PortfolioDocument(
            await aboutTask,
            await skillsTask,
            await jobsTask,
            await projectsTask);
    }

    public async Task<PortfolioItem> AddAsync(
        string section,
        PortfolioItemInput input)
    {
        var item = CreateItem(Guid.NewGuid(), section, input);

        await _db.HashSetAsync(
            CollectionKey(section),
            item.Id.ToString(),
            JsonSerializer.Serialize(item, JsonOptions));

        return item;
    }

    public async Task<PortfolioItem?> UpdateAsync(
        string section,
        Guid id,
        PortfolioItemInput input)
    {
        var item = CreateItem(id, section, input);

        // Проверка существования и обновление выполняются атомарно.
        const string script = """
            if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 0 then
                return 0
            end

            redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
            return 1
            """;

        var result = await _db.ScriptEvaluateAsync(
            script,
            [CollectionKey(section)],
            [
                id.ToString(),
                JsonSerializer.Serialize(item, JsonOptions)
            ]);

        return (long)result == 1 ? item : null;
    }

    public Task<bool> DeleteAsync(string section, Guid id) =>
        _db.HashDeleteAsync(CollectionKey(section), id.ToString());

    private static PortfolioItem CreateItem(
        Guid id,
        string section,
        PortfolioItemInput input)
    {
        var isProject = section == "projects";

        return new PortfolioItem(
            id,
            input.Title.Trim(),
            input.Description?.Trim() ?? "",
            input.Order,
            isProject ? Normalize(input.RepositoryUrl) : null,
            isProject ? Normalize(input.DemoUrl) : null,
            isProject ? input.Status : null);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}