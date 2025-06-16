using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Backendapi.Services;

namespace Backendapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileController : ControllerBase
    {
        private readonly IStorage _storage;

        public FileController(IStorage storage)
        {
            _storage = storage;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");
            var uri = await _storage.UploadFileAsync(file);
            return Ok(new { fileUrl = uri });
        }

        [HttpGet("download/{fileName}")]
        public async Task<IActionResult> DownloadFile(string fileName)
        {
            var stream = await _storage.DownloadFileAsync(fileName);
            return File(stream, "application/octet-stream", fileName);
        }

        [HttpGet("sas/{fileName}")]
        public IActionResult GetSasUrl(string fileName)
        {
            var sasUri = _storage.GetBlobSasUri(fileName);
            return Ok(new { sasUrl = sasUri });
        }
    }
}