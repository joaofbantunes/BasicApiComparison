FROM golang:1.18 as build

WORKDIR /app
COPY . .

RUN go mod download
RUN CGO_ENABLED=0 go build -o /bin/api

FROM gcr.io/distroless/static-debian11
COPY --from=build /bin /
CMD ["/api"]