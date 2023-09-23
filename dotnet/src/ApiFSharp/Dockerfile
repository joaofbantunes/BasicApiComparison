FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0-jammy AS build
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
