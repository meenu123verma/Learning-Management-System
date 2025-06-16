using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.ApplicationInsights;
using finalpracticeproject.DTOs;
using Backendapi.Data;
using Backendapi.Models;

namespace finalpracticeproject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UsersController> _logger;
        private readonly TelemetryClient _telemetryClient;

        public UsersController(AppDbContext context, ILogger<UsersController> logger, TelemetryClient telemetryClient)
        {
            _context = context;
            _logger = logger;
            _telemetryClient = telemetryClient;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            _logger.LogInformation("Getting all users");
            _telemetryClient.TrackEvent("GetAllUsers");
            try
            {
                var users = await _context.Users.ToListAsync();
                _logger.LogInformation($"Retrieved {users.Count} users successfully");
                _telemetryClient.TrackMetric("UsersRetrieved", users.Count);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving users");
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(Guid id)
        {
            _logger.LogInformation($"Getting user with ID: {id}");
            _telemetryClient.TrackEvent("GetUserById", new Dictionary<string, string> { { "UserId", id.ToString() } });
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    _logger.LogWarning($"User with ID: {id} not found");
                    _telemetryClient.TrackEvent("UserNotFound", new Dictionary<string, string> { { "UserId", id.ToString() } });
                    return NotFound();
                }

                _logger.LogInformation($"Successfully retrieved user with ID: {id}");
                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while retrieving user with ID: {id}");
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(Guid id, UserCreateDto userDto)
        {
            _logger.LogInformation($"Updating user with ID: {id}");
            _telemetryClient.TrackEvent("UpdateUser", new Dictionary<string, string> { { "UserId", id.ToString() } });
            try
            {
                if (id != userDto.UserId)
                {
                    _logger.LogWarning($"ID mismatch: {id} != {userDto.UserId}");
                    _telemetryClient.TrackEvent("UserIdMismatch", new Dictionary<string, string>
                    {
                        { "RequestedId", id.ToString() },
                        { "DtoId", userDto.UserId.ToString() }
                    });
                    return BadRequest();
                }

                var user = await _context.Users
                    .Include(u => u.Courses)
                    .FirstOrDefaultAsync(u => u.UserId == id);

                if (user == null)
                {
                    _logger.LogWarning($"User with ID: {id} not found for update");
                    _telemetryClient.TrackEvent("UserNotFoundForUpdate", new Dictionary<string, string> { { "UserId", id.ToString() } });
                    return NotFound();
                }

                user.Name = userDto.Name;
                user.Email = userDto.Email;
                user.Role = userDto.Role;
                user.PasswordHash = userDto.PasswordHash;

                // Update courses if necessary (optional based on requirements)

                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Successfully updated user with ID: {id}");
                    _telemetryClient.TrackEvent("UserUpdated", new Dictionary<string, string> { { "UserId", id.ToString() } });
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    _logger.LogError(ex, $"Concurrency error while updating user with ID: {id}");
                    _telemetryClient.TrackException(ex);
                    if (!_context.Users.Any(e => e.UserId == id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while updating user with ID: {id}");
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(UserCreateDto userDto)
        {
            _logger.LogInformation($"Creating new user with email: {userDto.Email}");
            _telemetryClient.TrackEvent("CreateUser", new Dictionary<string, string> { { "Email", userDto.Email } });
            try
            {
                var user = new User
                {
                    UserId = userDto.UserId,
                    Name = userDto.Name,
                    Email = userDto.Email,
                    Role = userDto.Role,
                    PasswordHash = userDto.PasswordHash,
                    Courses = new List<Course>()
                };

                if (userDto.CourseIds != null && userDto.CourseIds.Count > 0)
                {
                    var courses = await _context.Courses
                        .Where(c => userDto.CourseIds.Contains(c.CourseId))
                        .ToListAsync();

                    user.Courses = courses;
                    _logger.LogInformation($"Added {courses.Count} courses to new user");
                    _telemetryClient.TrackMetric("CoursesAddedToUser", courses.Count);
                }

                _context.Users.Add(user);

                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Successfully created new user with ID: {user.UserId}");
                    _telemetryClient.TrackEvent("UserCreated", new Dictionary<string, string>
                    {
                        { "UserId", user.UserId.ToString() },
                        { "Email", user.Email },
                        { "Role", user.Role }
                    });
                }
                catch (DbUpdateException ex)
                {
                    _logger.LogError(ex, $"Database error while creating user with email: {userDto.Email}");
                    _telemetryClient.TrackException(ex);
                    if (UserExists(user.UserId))
                    {
                        return Conflict();
                    }
                    else
                    {
                        throw;
                    }
                }

                return CreatedAtAction("GetUser", new { id = user.UserId }, user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while creating new user with email: {userDto.Email}");
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            _logger.LogInformation($"Deleting user with ID: {id}");
            _telemetryClient.TrackEvent("DeleteUser", new Dictionary<string, string> { { "UserId", id.ToString() } });
            try
            {
                var user = await _context.Users
                    .Include(u => u.Courses)
                    .FirstOrDefaultAsync(u => u.UserId == id);

                if (user == null)
                {
                    _logger.LogWarning($"User with ID: {id} not found for deletion");
                    _telemetryClient.TrackEvent("UserNotFoundForDeletion", new Dictionary<string, string> { { "UserId", id.ToString() } });
                    return NotFound();
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Successfully deleted user with ID: {id}");
                _telemetryClient.TrackEvent("UserDeleted", new Dictionary<string, string> { { "UserId", id.ToString() } });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while deleting user with ID: {id}");
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        private bool UserExists(Guid id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }
    }
}
