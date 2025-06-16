using Azure.Messaging.EventHubs;
using Azure.Messaging.EventHubs.Producer;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;
using finalpracticeproject.DTOs;

namespace Backendapi.Services
{
    public interface IEventHubService
    {
        Task SendAssessmentSubmissionEventAsync(AssessmentSubmissionDto submission, int score, string assessmentTitle);
    }

    public class EventHubService : IEventHubService
    {
        private readonly EventHubProducerClient _producerClient;
        private readonly ILogger<EventHubService> _logger;

        public EventHubService(IConfiguration configuration, ILogger<EventHubService> logger)
        {
            var connectionString = configuration["EventHub:ConnectionString"];
            var eventHubName = configuration["EventHub:Name"];

            if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(eventHubName))
            {
                throw new ArgumentException("Event Hub connection string and name must be configured");
            }

            _producerClient = new EventHubProducerClient(connectionString, eventHubName);
            _logger = logger;
        }

        public async Task SendAssessmentSubmissionEventAsync(AssessmentSubmissionDto submission, int score, string assessmentTitle)
        {
            try
            {
                var eventData = new
                {
                    EventType = "AssessmentSubmission",
                    Timestamp = DateTime.UtcNow,
                    AssessmentId = submission.AssessmentId,
                    UserId = submission.UserId,
                    Score = score,
                    AssessmentTitle = assessmentTitle,
                    TotalQuestions = submission.Answers.Count
                };

                var eventBody = JsonSerializer.Serialize(eventData);
                var eventBytes = Encoding.UTF8.GetBytes(eventBody);

                using var eventBatch = await _producerClient.CreateBatchAsync();
                eventBatch.TryAdd(new EventData(eventBytes));

                await _producerClient.SendAsync(eventBatch);
                _logger.LogInformation($"Successfully sent assessment submission event for AssessmentId: {submission.AssessmentId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending assessment submission event for AssessmentId: {submission.AssessmentId}");
                throw;
            }
        }
    }
} 