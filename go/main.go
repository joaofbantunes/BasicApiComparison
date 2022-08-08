package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/joho/godotenv"
)

// TODO: looking at the TechEmpower Benchmarks, there seems to be a prefork thing that might be relevant for perf?

func main() {
	_ = godotenv.Load(".env")

	dbHost := os.Getenv("DB_HOST")
	dbPort, _ := strconv.ParseInt(os.Getenv("DB_PORT"), 10, 32)
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbName := os.Getenv("DB_NAME")

	connectionString := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s",
		dbHost, dbPort, dbUser, dbPass, dbName,
	)

	// TODO: find a better solution to wait for postgres
	time.Sleep(10 * time.Second)

	pool, err := pgxpool.Connect(context.Background(), connectionString)

	if err != nil {
		log.Fatal("Failed to create database connection pool")
	}

	defer pool.Close()

	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc(
		"/",
		func(w http.ResponseWriter, r *http.Request) {
			var someId int
			var someText string
			pool.QueryRow(context.Background(), "SELECT SomeId, SomeText FROM SomeThing LIMIT 1").Scan(&someId, &someText)
			result := struct {
				SomeId   int    `json:"someId"`
				SomeText string `json:"someText"`
			}{
				SomeId:   someId,
				SomeText: someText,
			}
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("stack", "go")
			json.NewEncoder(w).Encode(result)
		}).Methods(http.MethodGet)
	log.Print("Starting go server")
	log.Fatal(http.ListenAndServe(":8080", router))
}
