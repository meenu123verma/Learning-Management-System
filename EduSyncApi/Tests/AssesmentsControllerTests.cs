using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.ApplicationInsights;
using Backendapi.Controllers;
using Backendapi.Data;
using Backendapi.Models;
using finalpracticeproject.DTOs;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Moq;
using System.Linq;

namespace Backendapi.Tests.Controllers
{
    [TestFixture]
    public class AssessmentsControllerTests
    {
        private AppDbContext _context;
        private Mock<ILogger<AssessmentsController>> _loggerMock;
        private TelemetryClient _telemetryClient;
        private AssessmentsController _controller;

        [SetUp]
        public void Setup()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            // Setup logger mock
            _loggerMock = new Mock<ILogger<AssessmentsController>>();

            // Setup telemetry client
            _telemetryClient = new TelemetryClient();

            // Create controller instance
            _controller = new AssessmentsController(_context, _loggerMock.Object, _telemetryClient);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task GetAssessments_ReturnsAllAssessments()
        {
            // Arrange
            var courseId = Guid.NewGuid();
            var course = new Course
            {
                CourseId = courseId,
                Title = "Test Course",
                Description = "Test Description",
                InstructorId = Guid.NewGuid()
            };
            await _context.Courses.AddAsync(course);

            var assessment = new Assessment
            {
                AssessmentId = Guid.NewGuid(),
                CourseId = courseId,
                Title = "Test Assessment",
                MaxScore = 100,
                Questions = new List<Question>
                {
                    new Question
                    {
                        QuestionId = Guid.NewGuid(),
                        QuestionText = "Test Question",
                        Options = new List<Option>
                        {
                            new Option
                            {
                                OptionId = Guid.NewGuid(),
                                Text = "Option 1",
                                IsCorrect = true
                            }
                        }
                    }
                }
            };
            await _context.Assessments.AddAsync(assessment);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetAssessments();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Value, Is.Not.Null);
            var assessments = result.Value as IEnumerable<Assessment>;
            Assert.That(assessments, Is.Not.Null);
            Assert.That(assessments.Count(), Is.EqualTo(1));
            var firstAssessment = assessments.First();
            Assert.That(firstAssessment.Title, Is.EqualTo("Test Assessment"));
            Assert.That(firstAssessment.MaxScore, Is.EqualTo(100));
        }

        [Test]
        public async Task GetAssessment_WithValidId_ReturnsAssessment()
        {
            // Arrange
            var assessmentId = Guid.NewGuid();
            var assessment = new Assessment
            {
                AssessmentId = assessmentId,
                Title = "Test Assessment",
                MaxScore = 100,
                Questions = new List<Question>
                {
                    new Question
                    {
                        QuestionId = Guid.NewGuid(),
                        QuestionText = "Test Question",
                        Options = new List<Option>
                        {
                            new Option
                            {
                                OptionId = Guid.NewGuid(),
                                Text = "Option 1",
                                IsCorrect = true
                            }
                        }
                    }
                }
            };
            await _context.Assessments.AddAsync(assessment);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetAssessment(assessmentId);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Value, Is.Not.Null);
            var returnedAssessment = result.Value as Assessment;
            Assert.That(returnedAssessment, Is.Not.Null);
            Assert.That(returnedAssessment.AssessmentId, Is.EqualTo(assessmentId));
            Assert.That(returnedAssessment.Title, Is.EqualTo("Test Assessment"));
            Assert.That(returnedAssessment.MaxScore, Is.EqualTo(100));
        }

        [Test]
        public async Task GetAssessment_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetAssessment(Guid.NewGuid());

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task PostAssessment_WithValidData_CreatesAssessment()
        {
            // Arrange
            var assessmentDto = new AssessmentCreateDto
            {
                AssessmentId = Guid.NewGuid(),
                Title = "Test Assessment",
                MaxScore = 100,
                Questions = new List<QuestionCreateDto>
                {
                    new QuestionCreateDto
                    {
                        QuestionId = Guid.NewGuid(),
                        QuestionText = "Test Question",
                        Options = new List<OptionCreateDto>
                        {
                            new OptionCreateDto
                            {
                                OptionId = Guid.NewGuid(),
                                Text = "Option 1",
                                IsCorrect = true
                            }
                        }
                    }
                }
            };

            // Act
            var result = await _controller.PostAssessment(assessmentDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            var createdAssessment = createdResult.Value as dynamic;
            Assert.That(createdAssessment.AssessmentId, Is.EqualTo(assessmentDto.AssessmentId));
            Assert.That(createdAssessment.Title, Is.EqualTo(assessmentDto.Title));
        }

        [Test]
        public async Task PutAssessment_WithValidData_UpdatesAssessment()
        {
            // Arrange
            var assessmentId = Guid.NewGuid();
            var assessment = new Assessment
            {
                AssessmentId = assessmentId,
                Title = "Original Title",
                MaxScore = 100,
                Questions = new List<Question>()
            };
            await _context.Assessments.AddAsync(assessment);
            await _context.SaveChangesAsync();

            var assessmentDto = new AssessmentCreateDto
            {
                AssessmentId = assessmentId,
                Title = "Updated Title",
                MaxScore = 200,
                Questions = new List<QuestionCreateDto>()
            };

            // Act
            var result = await _controller.PutAssessment(assessmentId, assessmentDto);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            var updatedAssessment = await _context.Assessments.FindAsync(assessmentId);
            Assert.That(updatedAssessment.Title, Is.EqualTo("Updated Title"));
            Assert.That(updatedAssessment.MaxScore, Is.EqualTo(200));
        }

        

        [Test]
        public async Task GetAssessmentsByCourse_WithValidCourseId_ReturnsAssessments()
        {
            // Arrange
            var courseId = Guid.NewGuid();
            var course = new Course
            {
                CourseId = courseId,
                Title = "Test Course",
                Description = "Test Description",
                InstructorId = Guid.NewGuid()
            };
            await _context.Courses.AddAsync(course);

            var assessment = new Assessment
            {
                AssessmentId = Guid.NewGuid(),
                CourseId = courseId,
                Title = "Test Assessment",
                MaxScore = 100,
                Questions = new List<Question>()
            };
            await _context.Assessments.AddAsync(assessment);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetAssessmentsByCourse(courseId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var assessments = okResult.Value as IEnumerable<object>;
            Assert.That(assessments, Is.Not.Null);
            Assert.That(assessments.Count(), Is.EqualTo(1));
        }

        [Test]
        public async Task GetAssessmentsByCourse_WithInvalidCourseId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetAssessmentsByCourse(Guid.NewGuid());

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
            var notFoundResult = result.Result as NotFoundObjectResult;
            var response = notFoundResult.Value as dynamic;
            Assert.That(response.message, Is.EqualTo("Course not found"));
        }
    }
}