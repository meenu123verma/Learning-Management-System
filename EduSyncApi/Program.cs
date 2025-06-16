using Backendapi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using System.Reflection;
using Swashbuckle.AspNetCore.SwaggerUI;
using Microsoft.ApplicationInsights.DependencyCollector;
using Microsoft.ApplicationInsights.Extensibility;
using Backendapi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add Application Insights
builder.Services.AddApplicationInsightsTelemetry();
builder.Services.ConfigureTelemetryModule<DependencyTrackingTelemetryModule>((module, o) => { module.EnableSqlCommandTextInstrumentation = true; });

// Load configuration
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);

// Get config values
var apiPort = builder.Configuration["ApiSettings:Port"] ?? "7197";
var frontendUrl = builder.Configuration["ApiSettings:FrontendUrl"] ?? "http://localhost:3000";

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.MaxDepth = 32;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EduSync API",
        Version = "v1",
        Description = "API for EduSync Course Management System",
        Contact = new OpenApiContact
        {
            Name = "EduSync Support",
            Email = "support@edusync.com"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://happy-bay-0948d9b1e.6.azurestaticapps.net",  // Azure frontend
                "http://localhost:3000"  // Local development
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});


//Azure Blob
builder.Services.AddScoped<IStorage, AzureStorageService>();

// Add Event Hub Service
builder.Services.AddSingleton<IEventHubService, EventHubService>();

// Configure DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.EnableSensitiveDataLogging(); // Detailed EF logs
});

// Add Application Insights logging
builder.Logging.AddApplicationInsights(
    configureTelemetryConfiguration: (config) => config.ConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"],
    configureApplicationInsightsLoggerOptions: (options) => { }
);

var app = builder.Build();

// Enable detailed error page in Development
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS early
app.UseCors("AllowFrontend");

// Serve static files
app.UseStaticFiles();

// app.UseHttpsRedirection(); // Optional: only enable if you have HTTPS

// Auth
app.UseAuthentication();
app.UseAuthorization();

// Map API routes
app.MapControllers();

// Logging middleware
app.Use(async (context, next) =>
{
    app.Logger.LogInformation($"Incoming request: {context.Request.Method} {context.Request.Path}");
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        app.Logger.LogError($"Error processing request: {ex.Message}");
        app.Logger.LogError($"Stack trace: {ex.StackTrace}");
        throw;
    }
});

// Configure app URL only in local dev
if (app.Environment.IsDevelopment())
{
    app.Urls.Clear();
    app.Urls.Add($"http://localhost:{apiPort}");
}

// Seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DataSeeder.SeedData(services);
        app.Logger.LogInformation("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// Start app
app.Run();
