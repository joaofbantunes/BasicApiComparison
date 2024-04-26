import { Hono } from "hono";
const { Pool } = require("pg");

const env = process.env;

const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  max: 25,
  ssl: env.DB_USE_SSL == "true",
};

const pool = new Pool(dbConfig);

const app = new Hono();
app.get("/", async (c) => {
  const { rows } = await pool.query(
    "SELECT SomeId, SomeText FROM SomeThing LIMIT 1"
  );
  return c.json(
    { someId: rows[0].someid, someText: rows[0].sometext },
    {
      headers: {
        stack: "bun-hono",
      },
    }
  );
});

export default {
  port: 8080,
  fetch: app.fetch,
};
