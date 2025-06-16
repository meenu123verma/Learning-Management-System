using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading.Tasks;

namespace Backendapi.Services
{
    public interface IStorage
    {
        /// <summary>
        /// Uploads a file to storage and returns its URI
        /// </summary>
        /// <param name="file">The file to upload</param>
        /// <returns>The URI of the uploaded file</returns>
        Task<string> UploadFileAsync(IFormFile file);

        /// <summary>
        /// Downloads a file from storage
        /// </summary>
        /// <param name="fileName">The name of the file to download</param>
        /// <returns>A stream containing the file data</returns>
        Task<Stream> DownloadFileAsync(string fileName);

        /// <summary>
        /// Generates a SAS URI for a file
        /// </summary>
        /// <param name="fileName">The name of the file</param>
        /// <returns>A SAS URI that provides temporary access to the file</returns>
        string GetBlobSasUri(string fileName);
    }
} 