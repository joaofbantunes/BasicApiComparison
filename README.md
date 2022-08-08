# Basic API comparison

Just a bunch of basic APIs, exposing a single GET endpoint returning some database information, developed in different languages, just to look at the getting started experience.

Also took the opportunity to do some (very naive) performance tests.

APIs were developed with
- C#, ASP.NET Core, Npgsql, Dapper
- F#, ASP.NET Core, Npgsql, Dapper
- Python, FastAPI, asyncpg
- JavaScript, Node.js, no web framework, pg
- JavaScript, Node.js, Express, pg
- Go, gorilla/mux, pgx
- Kotlin, Ktor, Vert.x PostgreSQL Client

## Notes

- First things first: don't take the performance tests too seriously! Not only is the whole setup naive, it's highly unlikely the APIs are as optimized as they should
- If you're really interested in how these and a lot of other stacks compare to each other in terms of performance, visit [TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks)
- Even though naive, I did get some inspiration from TechEmpower to implement some of these APIs, to be sure I didn't end up using the slowest libraries and approaches (e.g. my first attempt with Python it was massively slow, after some adjustments, now it's just slow 😅)

## k6 run results

The k6 test was very simple. Hammer the API during 15 seconds with 15 virtual users.


| Stack        | Requests Per Second |
| ------------ | ------------------- |
| csharp       | 8139                |
| csharp-r2r   | 8159                |
| fsharp       | 8027                |
| python       | 4195                |
| node-raw     | 7883                |
| node-express | 5867                |
| go           | 11037               |
| kotlin       | 6723                |

⚠️ Again, don't take this too seriously! For actually well done performance tests, check out [TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks). I just felt like playing around with stuff without much care.
