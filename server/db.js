// db.js
require('dotenv').config();
const mysql = require('mysql2/promise'); // ✅ use promise-based version

const db = mysql.createPool({ // ✅ use createPool (recommended with promises)
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

module.exports = db;


