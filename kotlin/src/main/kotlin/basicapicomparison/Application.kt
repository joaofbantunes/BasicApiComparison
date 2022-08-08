package basicapicomparison

import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.vertx.pgclient.PgConnectOptions
import io.vertx.pgclient.PgPool
import io.vertx.sqlclient.PoolOptions
import io.vertx.kotlin.coroutines.await
import kotlinx.serialization.Serializable

fun main() {
    val dbUser = System.getenv("DB_USER") ?: "user"
    val dbPass = System.getenv("DB_PASS") ?: "pass"
    val dbHost = System.getenv("DB_HOST") ?: "localhost"
    val dbPort = (System.getenv("DB_PORT") ?: "5432").toInt()
    val dbName = System.getenv("DB_NAME") ?: "BasicApiComparison"

    val connectOptions =
        PgConnectOptions()
            .setPort(dbPort)
            .setHost(dbHost)
            .setDatabase(dbName)
            .setUser(dbUser)
            .setPassword(dbPass)
            .apply {
                cachePreparedStatements = true
            }

    val poolOptions = PoolOptions()
    val pool = PgPool.pool(connectOptions, poolOptions)

    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        install(ContentNegotiation) {
            json()
        }
        routing {
            get("/") {
                val row = pool.withConnection { connection ->
                    connection
                        .query("SELECT SomeId, SomeText FROM SomeThing LIMIT 1")
                        .execute()
                }
                    .await()
                    .first()

                call.response.headers.append("stack", "kotlin")
                call.respond(SomeThing(row.getInteger(0), row.getString(1)))
            }
        }
    }.start(wait = true)
}

@Serializable
data class SomeThing(val someId: Int, val someText: String)