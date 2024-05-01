use std::env;

use axum::{
    http::{HeaderValue, StatusCode},
    Json,
    response::IntoResponse,
    Router, routing::get,
};
use axum::extract::State;
use axum::http::HeaderName;
use deadpool_postgres::{Pool, PoolError};
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use tower_http::set_header::SetResponseHeaderLayer;

#[tokio::main]
async fn main() {
    dotenv().ok();

    serve().await;
}

async fn serve() {
    let pool = create_pool();
    let stack_header_name = HeaderName::from_static("stack");
    let stack_header_value = HeaderValue::from_static("rust-axum");

    let app = Router::new()
        .route("/", get(hello))
        .with_state(pool)
        .layer(SetResponseHeaderLayer::if_not_present(
            stack_header_name,
            stack_header_value,
        ));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn hello(State(state): State<Pool>) -> impl IntoResponse {
    let result = fetch(state).await;
    match result {
        Ok(thing) => (StatusCode::OK, Json(thing)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

async fn fetch(pool: Pool) -> Result<SomeThing, UnexpectedError> {
    let conn = pool.get().await?;
    let query = conn
        .prepare("SELECT SomeId, SomeText FROM SomeThing LIMIT 1")
        .await?;
    let row = conn.query_one(&query, &[]).await?;
    Ok(SomeThing::try_from(&row)?)
}

impl<'a> TryFrom<&'a Row> for SomeThing {
    type Error = tokio_postgres::Error;

    fn try_from(row: &'a Row) -> Result<Self, Self::Error> {
        let some_id = row.try_get("SomeId")?;
        let some_text = row.try_get("SomeText")?;

        Ok(Self { some_id, some_text })
    }
}

fn create_pool() -> Pool {
    // should not be unwrapping everything like this, good enough for trying things out

    let db_user = env::var("DB_USER").unwrap();
    let db_pass = env::var("DB_PASS").unwrap();
    let db_host = env::var("DB_HOST").unwrap();
    let db_port = env::var("DB_PORT").unwrap().parse::<u16>().unwrap();
    let db_name = env::var("DB_NAME").unwrap();

    let pg_config = tokio_postgres::Config::new()
        .user(&db_user)
        .password(&db_pass)
        .host(&db_host)
        .port(db_port)
        .dbname(&db_name)
        .to_owned();

    let mgr_config = deadpool_postgres::ManagerConfig {
        recycling_method: deadpool_postgres::RecyclingMethod::Fast,
    };

    let mgr = deadpool_postgres::Manager::from_config(pg_config, tokio_postgres::NoTls, mgr_config);

    let pool = Pool::builder(mgr)
        .max_size(25)
        .build()
        .unwrap();

    return pool;
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SomeThing {
    some_id: i32,
    some_text: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UnexpectedError {
    message: String
}

impl From<tokio_postgres::Error> for UnexpectedError {
    fn from(err: tokio_postgres::Error) -> Self {
        UnexpectedError { message: err.to_string() }
    }
}

impl From<PoolError> for UnexpectedError {
    fn from(err: PoolError) -> Self {
        UnexpectedError { message: err.to_string() }
    }
}