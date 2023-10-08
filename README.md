# Basic API comparison

Just a bunch of basic APIs, exposing a single GET endpoint returning some database information, developed in different languages, just to look at the getting started experience.

Also took the opportunity to do some (very naive) performance tests.

APIs were developed with
- C#, ASP.NET Core, Npgsql, Nanorm
- F#, ASP.NET Core, Npgsql, Dapper
- Python, FastAPI, asyncpg
- JavaScript, Node.js, no web framework, pg
- JavaScript, Node.js, Express, pg
- Go, gorilla/mux, pgx
- Kotlin, Ktor, Vert.x PostgreSQL Client
- Rust, Actix, Tokio Postgres, Deadpool Postgres

## Notes

- First things first: don't take the performance tests seriously! Not only is the whole setup naive, it's highly unlikely the APIs are as optimized as they should
- If you're really interested in how these and a lot of other stacks compare to each other in terms of performance, visit [TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks)
- Even though naive, I did get some inspiration from TechEmpower to implement some of these APIs, to be sure I didn't end up using the slowest libraries and approaches (e.g. my first attempt with Python it was massively slow, after some adjustments, now it's just slow 😅)

## k6 run results

The k6 test was very simple. Hammer the API during 5 seconds with 10 virtual users. The RPS numbers below are the best I've seen when running on my laptop (again, not a good approach, it was just for fun).


| Stack              | Requests Per Second |
| -------------------| ------------------- |
| csharp             | 11721               |
| csharp-aot         | 10945               |
| csharp-r2r         | 12115               |
| csharp-controllers | 10984               |
| fsharp             | 11823               |
| python             | 7323                |
| node-raw           | 12058               |
| node-express       | 9609                |
| go                 | 15990               |
| kotlin             | 10199               |
| rust               | 10773               |

⚠️ Again, don't take this seriously! For actually well done performance tests (although with some not super realistic implementations), check out [TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks). I just felt like playing around with stuff without much care.
