import asyncio
import asyncpg
from fastapi import FastAPI, Response
import os
from dotenv import load_dotenv

load_dotenv()

connection_pool = None

app = FastAPI()


@app.on_event("startup")
async def setup_database():
    global connection_pool
    connection_pool = await asyncpg.create_pool(
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASS"],
        database=os.environ["DB_NAME"],
        host=os.environ["DB_HOST"],
        port=os.environ["DB_PORT"],
        min_size=0,  # using 0 as minimum, because otherwise there's an error at startup due to the database not being ready yet
        max_size=25
    )


@app.get("/")
async def root(response: Response):
    async with connection_pool.acquire() as connection:
        row = await connection.fetchrow("SELECT SomeId, SomeText FROM SomeThing LIMIT 1")
    response.headers["stack"] = "python"
    return {"someId": row[0], "someText": row[1]}
