open System.Data
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.Extensions.Configuration
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.DependencyInjection
open Giraffe
open Microsoft.AspNetCore.Http
open Dapper
open Npgsql

type SomeThing = { SomeId: int; SomeText: string }

let getHandler (next: HttpFunc) (ctx: HttpContext) =
    task {
        use connection = ctx.GetService<IDbConnection>()
        let! output = connection.QuerySingleAsync<SomeThing> "SELECT SomeId, SomeText FROM SomeThing LIMIT 1"
        ctx.SetHttpHeader("stack", "fsharp")
        return! negotiate output next ctx
    }

let webApp =
    choose [ route "/" >=> getHandler ]

let configureApp (app: IApplicationBuilder) =
    app.UseGiraffe webApp

let configureServices (services: IServiceCollection) =
    services
        .AddTransient<IDbConnection>(fun serviceProvider ->
            let settings = serviceProvider.GetService<IConfiguration>()
            upcast new NpgsqlConnection(settings.GetConnectionString "SqlConnectionString"))
        .AddGiraffe() |> ignore

[<EntryPoint>]
let main _ =
    Host.CreateDefaultBuilder()
        .ConfigureWebHostDefaults(
            fun webHostBuilder ->
                webHostBuilder
                    .Configure(configureApp)
                    .ConfigureServices(configureServices)
                    |> ignore)
        .Build()
        .Run()
    0
