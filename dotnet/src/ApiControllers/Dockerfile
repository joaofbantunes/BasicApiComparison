FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0-jammy AS build
WORKDIR /src
COPY ["dotnet/src/ApiControllers/ApiControllers.csproj", "ApiControllers/"]
RUN dotnet restore "ApiControllers/ApiControllers.csproj"
WORKDIR "/src/ApiControllers"
COPY dotnet/src/ApiControllers/. .

FROM build AS publish
RUN dotnet publish "ApiControllers.csproj" -c Release -o /app/publish /p:PublishAot=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ApiControllers.dll"]
