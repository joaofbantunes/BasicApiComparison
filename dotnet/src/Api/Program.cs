using Dapper;
using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
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
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Clear();
    // Wire up the JSON source generator and make sure we remove the reflection fallback.
    // this is a good way to verify that the source generator is working as expected.
    options.SerializerOptions.TypeInfoResolverChain.Add(SomeThingJsonContext.Default);
});

builder.Services.AddSingleton(new Stack(builder.Configuration.GetValue<string>("Stack") ?? "csharp"));

var app = builder.Build();

app.MapGet("/", async (HttpContext context, SqlConnectionFactory sqlConnectionFactory, Stack stack) =>
{
    await using var connection = sqlConnectionFactory();
    var item = await connection.QuerySingleAsync<SomeThing>("SELECT SomeId, SomeText FROM SomeThing LIMIT 1");
    context.Response.Headers["stack"] = stack.Name;
    return Results.Ok(item);
});

app.Run();

public delegate NpgsqlConnection SqlConnectionFactory();

public record SomeThing(int SomeId, string SomeText);

public record Stack(string Name);

[JsonSerializable(typeof(SomeThing))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SomeThingJsonContext : JsonSerializerContext
{
}