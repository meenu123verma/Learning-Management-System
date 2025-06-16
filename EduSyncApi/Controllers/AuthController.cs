using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backendapi.Models;
using Backendapi.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Microsoft.ApplicationInsights;
using Microsoft.Extensions.Logging;

namespace Backendapi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext context, IConfiguration configuration, TelemetryClient telemetryClient, ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _telemetryClient = telemetryClient;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<User>> Register(UserDto request)
    {
        _telemetryClient.TrackEvent("UserRegistration", new Dictionary<string, string> { { "Email", request.Email } });
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            _telemetryClient.TrackEvent("RegistrationFailed", new Dictionary<string, string>
            {
                { "Email", request.Email },
                { "Reason", "Email already exists" }
            });
            return BadRequest("User already exists");
        }

        CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Role = request.Role ?? "User",
            PasswordHash = Convert.ToBase64String(passwordHash),
            PasswordSalt = Convert.ToBase64String(passwordSalt)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _telemetryClient.TrackEvent("UserRegistered", new Dictionary<string, string>
        {
            { "UserId", user.UserId.ToString() },
            { "Email", user.Email },
            { "Role", user.Role }
        });

        return Ok("User registered successfully");
    }

    [HttpPost("login")]
    public async Task<ActionResult<object>> Login(UserDto request)
    {
        _telemetryClient.TrackEvent("UserLoginAttempt", new Dictionary<string, string> { { "Email", request.Email } });
        _logger.LogInformation($"Login attempt for email: {request.Email}");
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            _logger.LogWarning($"Login failed: User not found for email {request.Email}");
            _telemetryClient.TrackEvent("LoginFailed", new Dictionary<string, string>
            {
                { "Email", request.Email },
                { "Reason", "User not found" }
            });
            return BadRequest("User not found");
        }

        _logger.LogInformation($"User found: {user.UserId}, Role: {user.Role}, HasPasswordHash: {!string.IsNullOrEmpty(user.PasswordHash)}, HasPasswordSalt: {!string.IsNullOrEmpty(user.PasswordSalt)}");

        // Check if both hash and salt are null
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            _logger.LogWarning($"Login failed: Invalid user account (no password hash) for email {request.Email}");
            return BadRequest("Invalid user account. Please register again.");
        }

        try
        {
            bool passwordValid = false;
            // Handle users with null password salt (old users)
            if (string.IsNullOrEmpty(user.PasswordSalt))
            {
                _logger.LogInformation($"Verifying password for old user (without salt)");
                passwordValid = VerifyPasswordHashWithoutSalt(request.Password, Convert.FromBase64String(user.PasswordHash));
                if (!passwordValid)
                {
                    _logger.LogWarning($"Login failed: Invalid password for old user {request.Email}");
                    _telemetryClient.TrackEvent("LoginFailed", new Dictionary<string, string>
                    {
                        { "Email", request.Email },
                        { "Reason", "Invalid password" }
                    });
                    return BadRequest("Wrong password");
                }

                _logger.LogInformation($"Password verified for old user, updating to new hash format");
                // Update user with new salt
                CreatePasswordHash(request.Password, out byte[] newHash, out byte[] newSalt);
                user.PasswordHash = Convert.ToBase64String(newHash);
                user.PasswordSalt = Convert.ToBase64String(newSalt);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"User password updated to new format");
            }
            else
            {
                _logger.LogInformation($"Verifying password for new user (with salt)");
                passwordValid = VerifyPasswordHash(request.Password,
                    Convert.FromBase64String(user.PasswordHash),
                    Convert.FromBase64String(user.PasswordSalt));
                if (!passwordValid)
                {
                    _logger.LogWarning($"Login failed: Invalid password for new user {request.Email}");
                    _telemetryClient.TrackEvent("LoginFailed", new Dictionary<string, string>
                    {
                        { "Email", request.Email },
                        { "Reason", "Invalid password" }
                    });
                    return BadRequest("Wrong password");
                }
                _logger.LogInformation($"Password verified for new user");
            }

            string token = CreateToken(user);
            _logger.LogInformation($"Login successful for user {user.UserId}, generated token");

            _telemetryClient.TrackEvent("UserLoggedIn", new Dictionary<string, string>
            {
                { "UserId", user.UserId.ToString() },
                { "Email", user.Email },
                { "Role", user.Role }
            });

            return Ok(new
            {
                token = token,
                user = new
                {
                    userId = user.UserId,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Login error for user {request.Email}: {ex.Message}");
            _telemetryClient.TrackException(ex);
            return BadRequest("An error occurred during login. Please try again.");
        }
    }

    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(30), // Token expires in 30 minutes
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512())
        {
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }

    private bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
    {
        using (var hmac = new HMACSHA512(storedSalt))
        {
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(storedHash);
        }
    }

    private bool VerifyPasswordHashWithoutSalt(string password, byte[] storedHash)
    {
        using (var hmac = new HMACSHA512())
        {
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(storedHash);
        }
    }
}

public class UserDto
{
    public string Name { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Role { get; set; }
}