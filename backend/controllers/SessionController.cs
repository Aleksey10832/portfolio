using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Portfolio.Api.Models;
using Portfolio.Api.Services;

namespace Portfolio.Api.Controllers;

[ApiController]
[Route("api/session")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class SessionController(
    SessionService sessions) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginInput input)
    {
        if (!sessions.ValidateCredentials(input.Login, input.Password))
        {
            return Unauthorized(new
            {
                message = "Неверный логин или пароль."
            });
        }

        return Ok(await sessions.CreateAsync());
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshInput input)
    {
        var tokens = await sessions.RefreshAsync(input.RefreshToken);

        return tokens is null ? Unauthorized() : Ok(tokens);
    }

    [AllowAnonymous]
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(ConfirmInput input)
    {
        var confirmed = await sessions.ConfirmAsync(input.ConfirmToken);

        return confirmed ? NoContent() : Unauthorized();
    }

    [Authorize(Roles = "admin")]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new
    {
        login = "admin"
    });

    [Authorize(Roles = "admin")]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await sessions.DeleteAsync(User.FindFirst("sid")!.Value);
        return NoContent();
    }
}