using Microsoft.AspNetCore.Mvc;
using Portfolio.Api.Models;
using Portfolio.Api.Repositories;

namespace Portfolio.Api.Controllers;

[ApiController]
[Route("api/portfolio")]
public sealed class PortfolioController(
    PortfolioRepository repository) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public Task<PortfolioDocument> Get() => repository.GetAsync();
}