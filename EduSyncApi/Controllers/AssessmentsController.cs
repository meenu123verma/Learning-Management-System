using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using finalpracticeproject.DTOs;
using Backendapi.Data;
using Backendapi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Microsoft.ApplicationInsights;

namespace Backendapi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AssessmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AssessmentsController> _logger;
        private readonly TelemetryClient _telemetryClient;

        public AssessmentsController(AppDbContext context, ILogger<AssessmentsController> logger, TelemetryClient telemetryClient)
        {
            _context = context;
            _logger = logger;
            _telemetryClient = telemetryClient;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Assessment>>> GetAssessments()
        {
            _telemetryClient.TrackEvent("GetAllAssessments");
            try
            {
                var assessments = await _context.Assessments
                    .Include(a => a.Questions)
                        .ThenInclude(q => q.Options)
                    .ToListAsync();

                _telemetryClient.TrackMetric("AssessmentsRetrieved", assessments.Count);
                return assessments;
            }
            catch (Exception ex)
            {
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Assessment>> GetAssessment(Guid id)
        {
            _telemetryClient.TrackEvent("GetAssessmentById", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
            try
            {
                var assessment = await _context.Assessments
                    .Include(a => a.Questions)
                        .ThenInclude(q => q.Options)
                    .FirstOrDefaultAsync(a => a.AssessmentId == id);

                if (assessment == null)
                {
                    _telemetryClient.TrackEvent("AssessmentNotFound", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
                    return NotFound();
                }

                return assessment;
            }
            catch (Exception ex)
            {
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAssessment(Guid id, AssessmentCreateDto assessmentDto)
        {
            _telemetryClient.TrackEvent("UpdateAssessment", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
            if (id != assessmentDto.AssessmentId)
            {
                _telemetryClient.TrackEvent("AssessmentIdMismatch", new Dictionary<string, string>
                {
                    { "RequestedId", id.ToString() },
                    { "DtoId", assessmentDto.AssessmentId.ToString() }
                });
                return BadRequest();
            }

            var assessment = await _context.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(a => a.AssessmentId == id);

            if (assessment == null)
            {
                _telemetryClient.TrackEvent("AssessmentNotFoundForUpdate", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
                return NotFound();
            }

            assessment.Title = assessmentDto.Title;
            assessment.MaxScore = assessmentDto.MaxScore;
            assessment.CourseId = assessmentDto.CourseId;

            _context.Options.RemoveRange(assessment.Questions.SelectMany(q => q.Options));
            _context.Questions.RemoveRange(assessment.Questions);

            foreach (var questionDto in assessmentDto.Questions)
            {
                var question = new Question
                {
                    QuestionId = questionDto.QuestionId,
                    AssessmentId = assessment.AssessmentId,
                    QuestionText = questionDto.QuestionText
                };

                foreach (var optionDto in questionDto.Options)
                {
                    question.Options.Add(new Option
                    {
                        OptionId = optionDto.OptionId,
                        Text = optionDto.Text,
                        IsCorrect = optionDto.IsCorrect
                    });
                }

                assessment.Questions.Add(question);
            }

            try
            {
                await _context.SaveChangesAsync();
                _telemetryClient.TrackEvent("AssessmentUpdated", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _telemetryClient.TrackException(ex);
                if (!AssessmentExists(id))
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

        [HttpPost]
        public async Task<ActionResult<Assessment>> PostAssessment(AssessmentCreateDto assessmentDto)
        {
            _telemetryClient.TrackEvent("CreateAssessment", new Dictionary<string, string> { { "Title", assessmentDto.Title } });
            try
            {
                var assessment = new Assessment
                {
                    AssessmentId = assessmentDto.AssessmentId,
                    CourseId = assessmentDto.CourseId,
                    Title = assessmentDto.Title,
                    MaxScore = assessmentDto.MaxScore
                };

                foreach (var questionDto in assessmentDto.Questions)
                {
                    var question = new Question
                    {
                        QuestionId = questionDto.QuestionId,
                        AssessmentId = assessment.AssessmentId,
                        QuestionText = questionDto.QuestionText
                    };

                    foreach (var optionDto in questionDto.Options)
                    {
                        question.Options.Add(new Option
                        {
                            OptionId = optionDto.OptionId,
                            Text = optionDto.Text,
                            IsCorrect = optionDto.IsCorrect
                        });
                    }

                    assessment.Questions.Add(question);
                }

                _context.Assessments.Add(assessment);
                await _context.SaveChangesAsync();

                _telemetryClient.TrackEvent("AssessmentCreated", new Dictionary<string, string>
                {
                    { "AssessmentId", assessment.AssessmentId.ToString() },
                    { "Title", assessment.Title },
                    { "CourseId", assessment.CourseId.ToString() }
                });

                return CreatedAtAction("GetAssessment", new { id = assessment.AssessmentId }, new
                {
                    assessment.AssessmentId,
                    assessment.CourseId,
                    assessment.Title,
                    assessment.MaxScore,
                    Questions = assessment.Questions.Select(q => new
                    {
                        q.QuestionId,
                        q.QuestionText,
                        Options = q.Options.Select(o => new
                        {
                            o.OptionId,
                            o.Text,
                            o.IsCorrect
                        })
                    })
                });
            }
            catch (Exception ex)
            {
                _telemetryClient.TrackException(ex);
                throw;
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssessment(Guid id)
        {
            _telemetryClient.TrackEvent("DeleteAssessment", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
            try
            {
                _logger.LogInformation($"Attempting to delete assessment with ID: {id}");

                // Start a transaction
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Get the assessment with all related entities
                    var assessment = await _context.Assessments
                        .Include(a => a.Questions)
                            .ThenInclude(q => q.Options)
                        .Include(a => a.Results)
                            .ThenInclude(r => r.StudentAnswers)
                        .FirstOrDefaultAsync(a => a.AssessmentId == id);

                    if (assessment == null)
                    {
                        _logger.LogWarning($"Assessment with ID {id} not found");
                        _telemetryClient.TrackEvent("AssessmentNotFoundForDeletion", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
                        return NotFound(new { message = "Assessment not found" });
                    }

                    _logger.LogInformation($"Found assessment with {assessment.Questions.Count} questions and {assessment.Results.Count} results");

                    // First, get all option IDs from this assessment
                    var optionIds = assessment.Questions.SelectMany(q => q.Options).Select(o => o.OptionId).ToList();

                    // Find and delete all student answers that reference these options
                    var studentAnswers = await _context.StudentAnswers
                        .Where(sa => optionIds.Contains(sa.SelectedOptionId))
                        .ToListAsync();

                    if (studentAnswers.Any())
                    {
                        _logger.LogInformation($"Removing {studentAnswers.Count} student answers that reference options from this assessment");
                        _context.StudentAnswers.RemoveRange(studentAnswers);
                        await _context.SaveChangesAsync();
                    }

                    // Now delete all related entities in the correct order
                    foreach (var result in assessment.Results)
                    {
                        if (result.StudentAnswers.Any())
                        {
                            _logger.LogInformation($"Removing {result.StudentAnswers.Count} student answers for result {result.ResultId}");
                            _context.StudentAnswers.RemoveRange(result.StudentAnswers);
                        }
                    }

                    _logger.LogInformation($"Removing {assessment.Results.Count} results");
                    _context.Results.RemoveRange(assessment.Results);
                    await _context.SaveChangesAsync();

                    foreach (var question in assessment.Questions)
                    {
                        if (question.Options.Any())
                        {
                            _logger.LogInformation($"Removing {question.Options.Count} options for question {question.QuestionId}");
                            _context.Options.RemoveRange(question.Options);
                        }
                    }

                    _logger.LogInformation($"Removing {assessment.Questions.Count} questions");
                    _context.Questions.RemoveRange(assessment.Questions);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Removing assessment");
                    _context.Assessments.Remove(assessment);
                    await _context.SaveChangesAsync();

                    // Commit the transaction
                    await transaction.CommitAsync();

                    _logger.LogInformation($"Successfully deleted assessment with ID: {id}");
                    _telemetryClient.TrackEvent("AssessmentDeleted", new Dictionary<string, string> { { "AssessmentId", id.ToString() } });
                    return NoContent();
                }
                catch (Exception ex)
                {
                    // Rollback the transaction on error
                    await transaction.RollbackAsync();
                    throw; // Re-throw to be caught by outer catch block
                }
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, $"Database error while deleting assessment {id}: {dbEx.Message}");
                if (dbEx.InnerException != null)
                {
                    _logger.LogError($"Inner exception: {dbEx.InnerException.Message}");
                    _logger.LogError($"Stack trace: {dbEx.InnerException.StackTrace}");
                }
                return StatusCode(500, new
                {
                    message = "Database error while deleting assessment",
                    error = dbEx.Message,
                    innerError = dbEx.InnerException?.Message,
                    stackTrace = dbEx.InnerException?.StackTrace
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting assessment with ID: {id}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                _telemetryClient.TrackException(ex);
                return StatusCode(500, new
                {
                    message = "Error deleting assessment",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        private bool AssessmentExists(Guid id)
        {
            return _context.Assessments.Any(e => e.AssessmentId == id);
        }

        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssessmentsByCourse(Guid courseId)
        {
            try
            {
                _logger.LogInformation($"Fetching assessments for course {courseId}");

                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == courseId);
                if (!courseExists)
                {
                    _logger.LogWarning($"Course {courseId} not found");
                    return NotFound(new { message = "Course not found" });
                }

                var assessments = await _context.Assessments
                    .Include(a => a.Questions)
                    .Where(a => a.CourseId == courseId)
                    .Select(a => new
                    {
                        a.AssessmentId,
                        a.Title,
                        a.MaxScore,
                        QuestionCount = a.Questions.Count
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {assessments.Count} assessments for course {courseId}");
                return Ok(assessments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching assessments for course {courseId}");
                return StatusCode(500, new
                {
                    message = "An error occurred while fetching assessments",
                    details = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("{assessmentId}/result/{studentId}")]
        public async Task<ActionResult<object>> GetAssessmentResult(Guid assessmentId, Guid studentId)
        {
            // First get the assessment with questions and options
            var assessment = await _context.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

            if (assessment == null)
            {
                return NotFound(new { message = "Assessment not found" });
            }

            // Get the result for this assessment and student
            var result = await _context.Results
                .Include(r => r.StudentAnswers)
                .FirstOrDefaultAsync(r => r.AssessmentId == assessmentId && r.UserId == studentId);

            if (result == null)
            {
                return NotFound(new { message = "No result found for this student and assessment" });
            }

            var answers = assessment.Questions.Select(q =>
            {
                var studentAnswer = result.StudentAnswers.FirstOrDefault(sa => sa.QuestionId == q.QuestionId);
                var selectedOption = q.Options.FirstOrDefault(o => o.OptionId == studentAnswer?.SelectedOptionId);
                var correctOption = q.Options.FirstOrDefault(o => o.IsCorrect);

                return new
                {
                    QuestionId = q.QuestionId,
                    QuestionText = q.QuestionText,
                    SelectedOptionId = studentAnswer?.SelectedOptionId,
                    SelectedOptionText = selectedOption?.Text,
                    CorrectOptionId = correctOption?.OptionId,
                    CorrectOptionText = correctOption?.Text,
                    IsCorrect = selectedOption?.IsCorrect ?? false,
                    AssessmentId = assessment.AssessmentId,
                    StudentId = studentId,
                    AllOptions = q.Options.Select(o => new
                    {
                        o.OptionId,
                        o.Text,
                        o.IsCorrect
                    })
                };
            }).ToList();

            int totalQuestions = answers.Count;
            int correctAnswers = answers.Count(a => a.IsCorrect);

            return Ok(new
            {
                AssessmentId = assessment.AssessmentId,
                AssessmentTitle = assessment.Title,
                StudentId = studentId,
                TotalQuestions = totalQuestions,
                CorrectAnswers = correctAnswers,
                Score = $"{correctAnswers}/{totalQuestions}",
                AttemptDate = result.AttemptDate,
                Answers = answers
            });
        }
    }
}

