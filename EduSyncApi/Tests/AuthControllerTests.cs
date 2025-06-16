using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.ApplicationInsights;
using Backendapi.Controllers;
using Backendapi.Data;
using Backendapi.Models;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Moq;

namespace Backendapi.Tests.Controllers
{
    [TestFixture]
    public class AuthControllerTests
    {
        private readonly Mock<AppDbContext> _mockContext;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<TelemetryClient> _mockTelemetryClient;
        private readonly Mock<ILogger<AuthController>> _mockLogger;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _mockContext = new Mock<AppDbContext>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockTelemetryClient = new Mock<TelemetryClient>();
            _mockLogger = new Mock<ILogger<AuthController>>();

            // Setup configuration
            var configValues = new Dictionary<string, string>
            {
                { "Jwt:Key", "your-256-bit-secret" },
                { "Jwt:Issuer", "test-issuer" },
                { "Jwt:Audience", "test-audience" }
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configValues.Select(x => new KeyValuePair<string, string?>(x.Key, x.Value)))
                .Build();

            _mockConfiguration.Setup(x => x["Jwt:Key"]).Returns("your-256-bit-secret");
            _mockConfiguration.Setup(x => x["Jwt:Issuer"]).Returns("test-issuer");
            _mockConfiguration.Setup(x => x["Jwt:Audience"]).Returns("test-audience");

            _controller = new AuthController(_mockContext.Object, configuration, _mockTelemetryClient.Object, _mockLogger.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _mockContext.Object.Database.EnsureDeleted();
            _mockContext.Object.Dispose();
        }

        [Test]
        public async Task Register_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var userDto = new UserDto
            {
                Name = "Test User",
                Email = "test@example.com",
                Password = "TestPassword123!",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult.Value, Is.EqualTo("User registered successfully"));
        }

        [Test]
        public async Task Register_WithExistingEmail_ReturnsBadRequest()
        {
            // Arrange
            var existingUser = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Existing User",
                Email = "existing@example.com",
                Role = "User",
                PasswordHash = "hash",
                PasswordSalt = "salt"
            };
            _mockContext.Object.Users.Add(existingUser);
            await _mockContext.Object.SaveChangesAsync();

            var userDto = new UserDto
            {
                Name = "New User",
                Email = "existing@example.com",
                Password = "TestPassword123!",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result.Result as BadRequestObjectResult;
            Assert.That(badRequestResult.Value, Is.EqualTo("User already exists"));
        }

        [Test]
        public async Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            string password = "TestPassword123!";
            CreatePasswordHash(password, out byte[] passwordHash, out byte[] passwordSalt);

            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                Email = "test@example.com",
                Role = "User",
                PasswordHash = Convert.ToBase64String(passwordHash),
                PasswordSalt = Convert.ToBase64String(passwordSalt)
            };
            _mockContext.Object.Users.Add(user);
            await _mockContext.Object.SaveChangesAsync();

            var userDto = new UserDto
            {
                Email = "test@example.com",
                Password = password
            };

            // Act
            var result = await _controller.Login(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var response = okResult.Value as dynamic;
            Assert.That(response.token, Is.Not.Null);
            Assert.That(response.user, Is.Not.Null);
            Assert.That(response.user.email, Is.EqualTo("test@example.com"));
        }

        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        [Test]
        public async Task Login_WithInvalidEmail_ReturnsBadRequest()
        {
            // Arrange
            var userDto = new UserDto
            {
                Email = "nonexistent@example.com",
                Password = "TestPassword123!"
            };

            // Act
            var result = await _controller.Login(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result.Result as BadRequestObjectResult;
            Assert.That(badRequestResult.Value, Is.EqualTo("User not found"));
        }

        [Test]
        public async Task Login_WithInvalidPassword_ReturnsBadRequest()
        {
            // Arrange
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                Email = "test@example.com",
                Role = "User",
                PasswordHash = "hash",
                PasswordSalt = "salt"
            };
            _mockContext.Object.Users.Add(user);
            await _mockContext.Object.SaveChangesAsync();

            var userDto = new UserDto
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            // Act
            var result = await _controller.Login(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result.Result as BadRequestObjectResult;
            Assert.That(badRequestResult.Value, Is.EqualTo("Wrong password"));
        }
    }
}