using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.ApplicationInsights;
using Backendapi.Controllers;
using Backendapi.Data;
using Backendapi.Models;
using Backendapi.Services;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;
using Moq;

namespace Backendapi.Tests.Controllers
{
    [TestFixture]
    public class CoursesControllerTests
    {
        private AppDbContext _context;
        private IConfiguration _configuration;
        private Mock<ILogger<CoursesController>> _loggerMock;
        private TelemetryClient _telemetryClient;
        private Mock<IStorage> _storageMock;
        private CoursesController _controller;
        private Guid _testInstructorId;

        [SetUp]
        public void Setup()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            // Setup configuration
            var configValues = new Dictionary<string, string>
            {
                {"Jwt:Key", "your-512-bit-secret-key-here-must-be-at-least-64-bytes-long-for-hmac-sha512-algorithm"},
                {"Jwt:Issuer", "test-issuer"},
                {"Jwt:Audience", "test-audience"}
            };
            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configValues)
                .Build();

            // Setup logger mock
            _loggerMock = new Mock<ILogger<CoursesController>>();

            // Setup telemetry client
            _telemetryClient = new TelemetryClient();

            // Setup storage mock
            _storageMock = new Mock<IStorage>();

            // Create test instructor
            _testInstructorId = Guid.NewGuid();
            var instructor = new User
            {
                UserId = _testInstructorId,
                Name = "Test Instructor",
                Email = "instructor@test.com",
                Role = "Instructor"
            };
            _context.Users.Add(instructor);
            _context.SaveChanges();

            // Create controller instance
            _controller = new CoursesController(_context, _loggerMock.Object, _telemetryClient, _storageMock.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task GetCourses_ReturnsAllCourses()
        {
            // Arrange
            var course = new Course
            {
                CourseId = Guid.NewGuid(),
                Title = "Test Course",
                Description = "Test Description",
                InstructorId = _testInstructorId
            };
            await _context.Courses.AddAsync(course);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetCourses();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var courses = okResult.Value as IEnumerable<object>;
            Assert.That(courses, Is.Not.Null);
            Assert.That(courses.Count(), Is.EqualTo(1));
        }

        [Test]
        public async Task GetCourse_WithValidId_ReturnsCourse()
        {
            // Arrange
            var courseId = Guid.NewGuid();
            var course = new Course
            {
                CourseId = courseId,
                Title = "Test Course",
                Description = "Test Description",
                InstructorId = _testInstructorId
            };
            await _context.Courses.AddAsync(course);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetCourse(courseId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var returnedCourse = okResult.Value as Course;
            Assert.That(returnedCourse, Is.Not.Null);
            Assert.That(returnedCourse.CourseId, Is.EqualTo(courseId));
        }

        [Test]
        public async Task GetCourse_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetCourse(Guid.NewGuid());

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task GetInstructorCourses_ReturnsInstructorCourses()
        {
            // Arrange
            var course = new Course
            {
                CourseId = Guid.NewGuid(),
                Title = "Test Course",
                Description = "Test Description",
                InstructorId = _testInstructorId
            };
            await _context.Courses.AddAsync(course);
            await _context.SaveChangesAsync();

            // Setup user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testInstructorId.ToString()),
                new Claim(ClaimTypes.Role, "Instructor")
            };
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims))
                }
            };

            // Act
            var result = await _controller.GetInstructorCourses();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var courses = okResult.Value as IEnumerable<object>;
            Assert.That(courses, Is.Not.Null);
            Assert.That(courses.Count(), Is.EqualTo(1));
        }

        [Test]
        public async Task Enroll_WithValidCourseId_EnrollsUser()
        {
            // Arrange
            var courseId = Guid.NewGuid();
            var course = new Course
            {
                CourseId = courseId,
                Title = "Test Course",
                Description = "Test Description",
                InstructorId = _testInstructorId
            };
            await _context.Courses.AddAsync(course);
            await _context.SaveChangesAsync();

            // Setup user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testInstructorId.ToString()),
                new Claim(ClaimTypes.Role, "Student")
            };
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims))
                }
            };

            // Act
            var result = await _controller.Enroll(courseId);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            var response = okResult.Value as dynamic;
            Assert.That(response.message, Is.EqualTo("Successfully enrolled in course"));
        }

        [Test]
        public async Task Enroll_WithInvalidCourseId_ReturnsNotFound()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testInstructorId.ToString()),
                new Claim(ClaimTypes.Role, "Student")
            };
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims))
                }
            };

            // Act
            var result = await _controller.Enroll(Guid.NewGuid());

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }
    }
}