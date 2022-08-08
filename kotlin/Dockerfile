FROM gradle:7-jdk17 AS builder
WORKDIR /home/gradle/src
COPY . /home/gradle/src/
RUN gradle shadowJar --no-daemon

FROM mcr.microsoft.com/openjdk/jdk:17-distroless
EXPOSE 8080
COPY --from=builder /home/gradle/src/build/libs/*.jar /app.jar
ENTRYPOINT ["/usr/jdk/bin/java","-jar","/app.jar"]