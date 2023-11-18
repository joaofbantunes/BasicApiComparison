using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

[module:DapperAot]

Console.WriteLine(RuntimeFeature.IsDynamicCodeSupported ? "Running with JIT" : "Running with AOT");

var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddSingleton<SqlConnectionFactory>(s =>
    {
        var config = s.GetRequiredService<IConfiguration>();
        var connectionString = config.GetConnectionString("SqlConnectionString");
        return () => new NpgsqlConnection(connectionString);
    });

builder.Services
    .AddControllers()
    // note that json configuration with controllers is different than with minimal APIs
    .AddJsonOptions(
    static options =>
    {
        options.JsonSerializerOptions.TypeInfoResolverChain.Clear();
        // Wire up the JSON source generator and make sure we remove the reflection fallback.
        // this is a good way to verify that the source generator is working as expected.
        options.JsonSerializerOptions.TypeInfoResolverChain.Add(SomeThingJsonContext.Default);
    });
builder.Services.AddSingleton(new Stack(builder.Configuration.GetValue<string>("Stack") ?? "csharp-controllers"));
var app = builder.Build();
app.MapControllers();
app.Run();

[ApiController]
[Route("")]
public class SomeController : ControllerBase
{
    private readonly SqlConnectionFactory _sqlConnectionFactory;
    private readonly Stack _stack;

    public SomeController(SqlConnectionFactory sqlConnectionFactory, Stack stack)
    {
        _sqlConnectionFactory = sqlConnectionFactory;
        _stack = stack;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await using var connection = _sqlConnectionFactory();
        var item = await connection.QuerySingleAsync<SomeThing>("SELECT SomeId, SomeText FROM SomeThing LIMIT 1");
        HttpContext.Response.Headers["stack"] = _stack.Name;
        return Ok(item);
    }
}

public delegate NpgsqlConnection SqlConnectionFactory();

public record SomeThing(int SomeId, string SomeText);

[JsonSerializable(typeof(SomeThing))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SomeThingJsonContext : JsonSerializerContext
{
}

public record Stack(string Name);