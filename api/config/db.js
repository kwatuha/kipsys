// Database connection configuration
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kiplombe_hmis',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Test the connection pool
pool.getConnection()
  .then(connection => {
    console.log('MySQL connection pool created successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('Warning: Initial database connection test failed:', err.message);
    console.error('The application will continue to run. Database connections will be retried when needed.');
  });

module.exports = pool;

