// Forked workers will run this code when found to not be
// the master of the cluster.
const { config } = require('dotenv');
const http = require("http");
const { Pool } = require('pg');

config();

const env = process.env;

const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  max: 25,
  ssl: env.DB_USE_SSL == "true"
};

const pool = new Pool(dbConfig);

module.exports = http
  .createServer(async function (req, res) {
    if (req.url) {
      const {rows} = await pool.query("SELECT SomeId, SomeText FROM SomeThing LIMIT 1");
      res.setHeader("stack", "node-raw");
      return res.end(JSON.stringify({ someId: rows[0].someid, someText: rows[0].sometext }));
    } else {
      res.statusCode = 404;
      return res.end();
    }
  })
  .listen(8080, () => console.log("NodeJS worker listening on port 8080"));