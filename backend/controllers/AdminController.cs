using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Api.Models;
using Portfolio.Api.Repositories;

namespace Portfolio.Api.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/admin")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AdminController(
    PortfolioRepository repository) : ControllerBase
{
    [HttpGet("portfolio")]
    public Task<PortfolioDocument> Get() => repository.GetAsync();

    [HttpPut("about")]
    public Task<AboutBlock> SaveAbout(AboutInput input) =>
        repository.SaveAboutAsync(input);

    [HttpDelete("about")]
    public async Task<IActionResult> ClearAbout()
    {
        await repository.ClearAboutAsync();
        return NoContent();
    }

    [HttpPost("{section}")]
    public async Task<IActionResult> Add(
        string section,
        PortfolioItemInput input)
    {
        var error = ValidateSection(section, input);
        if (error is not null)
            return error;

        var item = await repository.AddAsync(section, input);
        return StatusCode(StatusCodes.Status201Created, item);
    }

    [HttpPut("{section}/{id:guid}")]
    public async Task<IActionResult> Update(
        string section,
        Guid id,
        PortfolioItemInput input)
    {
        var error = ValidateSection(section, input);
        if (error is not null)
            return error;

        var item = await repository.UpdateAsync(section, id, input);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{section}/{id:guid}")]
    public async Task<IActionResult> Delete(string section, Guid id)
    {
        if (!PortfolioRules.Sections.Contains(section))
            return NotFound();

        var deleted = await repository.DeleteAsync(section, id);
        return deleted ? NoContent() : NotFound();
    }

    private IActionResult? ValidateSection(
        string section,
        PortfolioItemInput input)
    {
        if (!PortfolioRules.Sections.Contains(section))
            return NotFound();

        if (section == "projects"
            && (input.Status is null
                || !PortfolioRules.Statuses.Contains(input.Status)))
        {
            ModelState.AddModelError(
                nameof(input.Status),
                "Укажите статус проекта.");

            return ValidationProblem(ModelState);
        }

        return null;
    }
}