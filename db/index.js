const mysql = require('mysql');
const ServerError = require('../ServerError');

require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' ? 'RDS' : 'LOCAL';

const connection = mysql.createConnection({
  host: process.env[`${isProduction}_HOSTNAME`],
  port: process.env[`${isProduction}_PORT`],
  user: process.env[`${isProduction}_USERNAME`],
  password: process.env[`${isProduction}_PASSWORD`],
  database: process.env[`${isProduction}_DB_NAME`]
});

console.log(process.env[`${isProduction}_HOSTNAME`]);

connection.connect(err => {
  if (err) console.error('db err', err);
  if (err) throw new ServerError('db connection', 500);
});

module.exports = connection;
