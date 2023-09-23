use actix_web::{get, App, HttpResponse, HttpServer, Responder, web, Result, ResponseError};
use std::env;
use std::fmt::{Display, Formatter};
use serde::{Deserialize, Serialize};
use tokio_postgres::{NoTls, Row};
use deadpool_postgres::{Config, Pool, PoolConfig, PoolError, Runtime};

const CONNECTION_POOL_SIZE: usize = 100;

#[get("/")]
async fn hello(data: web::Data<Pool>) -> impl Responder {
    let result = fetch(data).await;
    match result {
        Ok(thing) => HttpResponse::Ok()
            .insert_header(("stack", "rust"))
            .json(thing),
        Err(_) => HttpResponse::InternalServerError()
            .insert_header(("stack", "rust"))
            .finish()
    }
}

async fn fetch(data: web::Data<Pool>) -> Result<SomeThing, SomeError> {
    let conn = data.get().await?;
    let query = conn.prepare("SELECT SomeId, SomeText FROM SomeThing LIMIT 1").await?;
    let row = conn.query_one(&query, &[]).await?;
    Ok(SomeThing::try_from(&row)?)
}

impl<'a> TryFrom<&'a Row> for SomeThing {
    type Error = tokio_postgres::Error;

    fn try_from(row: &'a Row) -> Result<Self, Self::Error> {
        let some_id = row.try_get("SomeId")?;
        let some_text = row.try_get("SomeText")?;

        Ok(Self {
            some_id,
            some_text,
        })
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db_user = env::var("DB_USER").unwrap_or("user".to_owned());
    let db_pass = env::var("DB_PASS").unwrap_or("pass".to_owned());
    let db_host = env::var("DB_HOST").unwrap_or("localhost".to_owned());
    let db_port = env::var("DB_PORT").unwrap_or("5432".to_owned()).parse::<u16>().unwrap();
    let db_name = env::var("DB_NAME").unwrap_or("BasicApiComparison".to_owned());

    let mut cfg = Config::new();
    cfg.host = Some(db_host);
    cfg.dbname = Some(db_name);
    cfg.user = Some(db_user);
    cfg.password = Some(db_pass);
    cfg.port = Some(db_port);
    let pc = PoolConfig::new(CONNECTION_POOL_SIZE);
    cfg.pool = pc.into();
    let pool = cfg.create_pool(Some(Runtime::Tokio1), NoTls).unwrap();

    HttpServer::new(move || App::new()
        .app_data(web::Data::new(pool.clone()))
        .service(hello))
        .bind("0.0.0.0:8080")?
        .run()
        .await
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SomeThing {
    some_id: i32,
    some_text: String,
}

#[derive(Debug)]
pub enum SomeError {
    Pg(tokio_postgres::Error),
    Pool(PoolError)
}

impl From<tokio_postgres::Error> for SomeError {
    fn from(err: tokio_postgres::Error) -> Self {
        SomeError::Pg(err)
    }
}

impl From<PoolError> for SomeError {
    fn from(err: PoolError) -> Self {
        SomeError::Pool(err)
    }
}

impl Display for SomeError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Unexpected error ¯\\_(ツ)_/¯")
    }
}

impl ResponseError for SomeError {}