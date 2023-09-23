using System.Data;
using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
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

var stack = builder.Configuration.GetValue<string>("Stack") ?? "csharp";
var app = builder.Build();


app.MapGet("/", async (HttpContext context, SqlConnectionFactory sqlConnectionFactory) =>
{
    // was using Dapper, but it isn't compatible with AOT, so using Damian Edwards' Nanorm
    await using var connection = sqlConnectionFactory();
    var item = await connection.QuerySingleAsync<SomeThing>("SELECT SomeId, SomeText FROM SomeThing LIMIT 1");
    context.Response.Headers["stack"] = stack;
    return Results.Ok(item);
});

app.Run();

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