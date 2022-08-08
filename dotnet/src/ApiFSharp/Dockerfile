FROM mcr.microsoft.com/dotnet/aspnet:7.0-alpine AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0-alpine AS build
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
