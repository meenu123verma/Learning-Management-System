using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.ApplicationInsights;
using Backendapi.Data;
using Backendapi.Models;
using finalpracticeproject.DTOs;
using finalpracticeproject.Controllers;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Backendapi.Tests.Controllers
{
    [TestFixture]
    public class UsersControllerTests
    {
        private AppDbContext _context;
        private Mock<ILogger<UsersController>> _loggerMock;
        private TelemetryClient _telemetryClient;
        private UsersController _controller;
        private Guid _testUserId;

        [SetUp]
        public void Setup()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            // Setup logger mock
            _loggerMock = new Mock<ILogger<UsersController>>();

            // Setup telemetry client
            _telemetryClient = new TelemetryClient();

            // Create test user
            _testUserId = Guid.NewGuid();
            var user = new User
            {
                UserId = _testUserId,
                Name = "Test User",
                Email = "test@example.com",
                Role = "Instructor"
            };
            _context.Users.Add(user);
            _context.SaveChanges();

            // Create controller instance
            _controller = new UsersController(_context, _loggerMock.Object, _telemetryClient);

            // Setup controller context with claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
                new Claim(ClaimTypes.Role, "Instructor")
            };
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims))
                }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task GetUsers_ReturnsAllUsers()
        {
            // Arrange
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                Email = "test@example.com",
                Role = "User"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetUsers();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var users = okResult.Value as IEnumerable<User>;
            Assert.That(users, Is.Not.Null);
            Assert.That(users.Count(), Is.EqualTo(2)); // One from Setup and one from this test
            Assert.That(users.Any(u => u.UserId == _testUserId), Is.True); // Verify setup user exists
            Assert.That(users.Any(u => u.UserId == user.UserId), Is.True); // Verify test user exists
        }

        [Test]
        public async Task GetUser_WithValidId_ReturnsUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                UserId = userId,
                Name = "Test User",
                Email = "test@example.com",
                Role = "User"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetUser(userId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var returnedUser = okResult.Value as User;
            Assert.That(returnedUser, Is.Not.Null);
            Assert.That(returnedUser.UserId, Is.EqualTo(userId));
        }

        [Test]
        public async Task GetUser_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetUser(Guid.NewGuid());

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task PostUser_WithValidData_CreatesUser()
        {
            // Arrange
            var userDto = new UserCreateDto
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                Email = "test@example.com",
                Role = "User",
                PasswordHash = "test_hash"
            };

            // Act
            var result = await _controller.PostUser(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            var createdUser = createdResult.Value as User;
            Assert.That(createdUser, Is.Not.Null);
            Assert.That(createdUser.UserId, Is.EqualTo(userDto.UserId));
            Assert.That(createdUser.Email, Is.EqualTo(userDto.Email));
        }

        [Test]
        public async Task PutUser_WithValidData_UpdatesUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                UserId = userId,
                Name = "Original Name",
                Email = "original@example.com",
                Role = "User"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var userDto = new UserCreateDto
            {
                UserId = userId,
                Name = "Updated Name",
                Email = "updated@example.com",
                Role = "User",
                PasswordHash = "updated_hash"
            };

            // Act
            var result = await _controller.PutUser(userId, userDto);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            var updatedUser = await _context.Users.FindAsync(userId);
            Assert.That(updatedUser.Name, Is.EqualTo("Updated Name"));
            Assert.That(updatedUser.Email, Is.EqualTo("updated@example.com"));
        }

        [Test]
        public async Task DeleteUser_WithValidId_DeletesUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                UserId = userId,
                Name = "Test User",
                Email = "test@example.com",
                Role = "User"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            var deletedUser = await _context.Users.FindAsync(userId);
            Assert.That(deletedUser, Is.Null);
        }

        [Test]
        public async Task DeleteUser_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.DeleteUser(Guid.NewGuid());

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
}