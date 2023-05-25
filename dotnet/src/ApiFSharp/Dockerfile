FROM mcr.microsoft.com/dotnet/nightly/aspnet:8.0-preview-jammy-chiseled AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/nightly/sdk:8.0-preview-jammy AS build
WORKDIR /src
COPY ["dotnet/src/ApiFSharp/ApiFSharp.fsproj", "ApiFSharp/"]
RUN dotnet restore "ApiFSharp/ApiFSharp.fsproj"
WORKDIR "/src/ApiFSharp"
COPY dotnet/src/ApiFSharp/. .

FROM build AS publish
RUN dotnet publish "ApiFSharp.fsproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ApiFSharp.dll"]
