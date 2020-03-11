const pg = require('pg');
const mysql = require('mysql');
const ServerError = require('../ServerError');
require('dotenv').config();

const { Pool } = pg;
const connection = new Pool({
  host: process.env.PG_LOCAL_HOSTNAME,
  port: process.env.PG_LOCAL_PORT,
  user: process.env.PG_LOCAL_USERNAME,
  password: process.env.PG_LOCAL_PASSWORD,
  database: process.env.PG_LOCAL_DB_NAME,
});

const isProduction = process.env.NODE_ENV === 'production' ? 'RDS' : 'LOCAL';

console.log(process.env[`${isProduction}_HOSTNAME`]);

connection.connect((err) => {
  if (err) console.error('db err', err);
  if (err) throw new ServerError('db connection', 500);
});

module.exports = connection;
