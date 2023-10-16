FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0-jammy AS build
ARG TARGETARCH
WORKDIR /src
COPY ["ApiFSharp.fsproj", "."]
RUN dotnet restore "ApiFSharp.fsproj" -a $TARGETARCH
COPY [".", "."]
RUN dotnet publish "ApiFSharp.fsproj" --no-restore -c Release -o /app /p:PublishAot=false -a $TARGETARCH

FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled AS base
WORKDIR /app
EXPOSE 8080
COPY --from=build /app .
ENTRYPOINT ["dotnet", "ApiFSharp.dll"]
