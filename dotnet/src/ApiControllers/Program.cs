using System.Data;
using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Nanorm;
using Npgsql;

Console.WriteLine(RuntimeFeature.IsDynamicCodeSupported ? "Running with JIT" : "Running with AOT");


var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddSingleton<SqlConnectionFactory>(s =>
    {
        var config = s.GetRequiredService<IConfiguration>();
        var connectionString = config.GetConnectionString("SqlConnectionString");
        return () => new NpgsqlConnection(connectionString);
    });
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Clear();
    // Wire up the JSON source generator and make sure we remove the reflection fallback.
    // this is a good way to verify that the source generator is working as expected.
    options.SerializerOptions.TypeInfoResolverChain.Add(SomeThingJsonContext.Default);
});
builder.Services.AddControllers();
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

public record SomeThing(int SomeId, string SomeText) : IDataRecordMapper<SomeThing>
{
    public static SomeThing Map(IDataRecord dataRecord) 
        => new(
            dataRecord.GetInt32(dataRecord.GetOrdinal(nameof(SomeId))),
            dataRecord.GetString(dataRecord.GetOrdinal(nameof(SomeText))));
}

[JsonSerializable(typeof(SomeThing))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SomeThingJsonContext : JsonSerializerContext
{
}

public record Stack(string Name);