using Dapper;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddSingleton<SqlConnectionFactory>(s =>
    {
        var config = s.GetRequiredService<IConfiguration>();
        var connectionString = config.GetConnectionString("SqlConnectionString");
        return () => new NpgsqlConnection(connectionString);
    });

var app = builder.Build();

app.MapGet("/", async (HttpContext context, IConfiguration configuration, SqlConnectionFactory sqlConnectionFactory) =>
{
    // the other stacks are using lower level things than Dapper, but let's keep it realistic,
    // nobody uses ADO 😛
    await using var connection = sqlConnectionFactory();
    var item = await connection.QuerySingleAsync<SomeThing>(
        "SELECT SomeId, SomeText FROM SomeThing LIMIT 1");
    context.Response.Headers.Add("stack", configuration.GetValue<string>("Stack") ?? "csharp");
    return Results.Ok(item);
});

app.Run();

public delegate NpgsqlConnection SqlConnectionFactory();

public record SomeThing(int SomeId, string SomeText);