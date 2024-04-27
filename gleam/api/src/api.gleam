import dotenv_gleam
import gleam/bytes_builder
import gleam/dynamic
import gleam/erlang/os
import gleam/erlang/process
import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/int
import gleam/json.{object}
import gleam/option
import gleam/pgo
import gleam/result
import mist.{type Connection, type ResponseData}

pub fn main() {
  // this dotenv_gleam seems strage, as unlike the libraries from other languages, doesn't ignore the quotes used in the file
  dotenv_gleam.config()

  let assert Ok(host) = os.get_env("DB_HOST")
  let assert Ok(port) =
    os.get_env("DB_PORT")
    |> result.try(int.parse)
  let assert Ok(user) = os.get_env("DB_USER")
  let assert Ok(password) = os.get_env("DB_PASS")
  let assert Ok(database) = os.get_env("DB_NAME")

  let db =
    pgo.connect(
      pgo.Config(
        ..pgo.default_config(),
        host: host,
        port: port,
        database: database,
        user: user,
        password: option.Some(password),
        pool_size: 25,
      ),
    )

  let not_found =
    response.new(404)
    |> response.set_body(mist.Bytes(bytes_builder.new()))

  let assert Ok(_) =
    fn(req: Request(Connection)) -> Response(ResponseData) {
      case request.path_segments(req) {
        [] -> handle_query(req, db)
        _ -> not_found
      }
    }
    |> mist.new
    |> mist.port(3000)
    |> mist.start_http

  process.sleep_forever()
}

fn handle_query(
  _req: Request(Connection),
  db: pgo.Connection,
) -> Response(ResponseData) {
  let sql = "SELECT SomeId, SomeText FROM SomeThing LIMIT 1"
  let return_type = dynamic.tuple2(dynamic.int, dynamic.string)
  let result = pgo.execute(sql, db, [], return_type)
  case result {
    Ok(returned) -> {
      case returned.rows {
        [row] -> {
          let #(some_id, some_text) = row
          let json =
            object([
              #("someId", json.int(some_id)),
              #("someText", json.string(some_text)),
            ])
            |> json.to_string
          response.new(200)
          |> response.set_body(mist.Bytes(bytes_builder.from_string(json)))
          |> response.set_header("Content-Type", "application/json")
          |> response.set_header("stack", "gleam-mist")
        }
        _ ->
          response.new(500)
          |> response.set_body(mist.Bytes(bytes_builder.new()))
      }
    }
    Error(_) ->
      response.new(500)
      |> response.set_body(mist.Bytes(bytes_builder.new()))
  }
}
