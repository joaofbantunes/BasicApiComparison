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

const express = require('express')
const app = express()
const port = 8080

app.get('/', async (req, res) => {
    const {rows} = await pool.query("SELECT SomeId, SomeText FROM SomeThing LIMIT 1");
    res.setHeader("stack", "node-express");
    return res.json({ someId: rows[0].someid, someText: rows[0].sometext });
})

app.listen(port, () => {
    console.log(`NodeJS worker listening on port ${port}`)
})