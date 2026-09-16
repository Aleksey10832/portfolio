using System.ComponentModel.DataAnnotations;

namespace Portfolio.Api.Models;

public static class PortfolioRules
{
    public static readonly HashSet<string> Sections =
    [
        "skills",
        "jobs",
        "projects"
    ];

    public static readonly HashSet<string> Statuses =
    [
        "development",
        "abandoned",
        "paused",
        "completed"
    ];

    public static bool IsHttpUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return true;

        return Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp
                || uri.Scheme == Uri.UriSchemeHttps)
            && string.IsNullOrEmpty(uri.UserInfo);
    }
}

public sealed class AboutInput : IValidatableObject
{
    [StringLength(10000)]
    public string Text { get; set; } = "";

    [StringLength(2048)]
    public string? PhotoUrl { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (!PortfolioRules.IsHttpUrl(PhotoUrl))
        {
            yield return new ValidationResult(
                "Фото должно иметь абсолютный HTTP/HTTPS URL.",
                [nameof(PhotoUrl)]);
        }
    }
}

public sealed class PortfolioItemInput : IValidatableObject
{
    [Required, StringLength(160)]
    public string Title { get; set; } = "";

    [StringLength(10000)]
    public string Description { get; set; } = "";

    [Range(0, 100000)]
    public int Order { get; set; }

    [StringLength(2048)]
    public string? RepositoryUrl { get; set; }

    [StringLength(2048)]
    public string? DemoUrl { get; set; }

    [StringLength(30)]
    public string? Status { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (!PortfolioRules.IsHttpUrl(RepositoryUrl))
        {
            yield return new ValidationResult(
                "Репозиторий должен иметь абсолютный HTTP/HTTPS URL.",
                [nameof(RepositoryUrl)]);
        }

        if (!PortfolioRules.IsHttpUrl(DemoUrl))
        {
            yield return new ValidationResult(
                "Демо должно иметь абсолютный HTTP/HTTPS URL.",
                [nameof(DemoUrl)]);
        }

        if (Status is not null && !PortfolioRules.Statuses.Contains(Status))
        {
            yield return new ValidationResult(
                "Неизвестный статус.",
                [nameof(Status)]);
        }
    }
}

public sealed record AboutBlock(string Text, string? PhotoUrl);

public sealed record PortfolioItem(
    Guid Id,
    string Title,
    string Description,
    int Order,
    string? RepositoryUrl,
    string? DemoUrl,
    string? Status);

public sealed record PortfolioDocument(
    AboutBlock About,
    IReadOnlyList<PortfolioItem> Skills,
    IReadOnlyList<PortfolioItem> Jobs,
    IReadOnlyList<PortfolioItem> Projects);

public sealed class LoginInput
{
    [Required, StringLength(200)]
    public string Login { get; set; } = "";

    [Required, StringLength(1000)]
    public string Password { get; set; } = "";
}

public sealed class RefreshInput
{
    [Required, StringLength(200)]
    public string RefreshToken { get; set; } = "";
}

public sealed class ConfirmInput
{
    [Required, StringLength(200)]
    public string ConfirmToken { get; set; } = "";
}

public sealed record TokenPair(
    string AccessToken,
    string RefreshToken,
    string? ConfirmToken = null);