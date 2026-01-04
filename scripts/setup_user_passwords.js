// Script to set up passwords for sample users
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql_db',
    user: process.env.DB_USER || 'kiplombe_user',
    password: process.env.DB_PASSWORD || 'kiplombe_password',
    database: process.env.DB_NAME || 'kiplombe_hmis'
  });

  try {
    // Generate password hash for 'password123'
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('Generated password hash for "password123":', passwordHash);

    // Update users
    const [result] = await connection.execute(
      `UPDATE users 
       SET passwordHash = ? 
       WHERE username IN ('doctor1', 'doctor2', 'nurse1', 'pharmacist1')
       AND (passwordHash IS NULL OR passwordHash = '' OR passwordHash LIKE '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq')`,
      [passwordHash]
    );

    console.log(`Updated ${result.affectedRows} user(s)`);

    // Verify
    const [users] = await connection.execute(
      `SELECT userId, username, email, firstName, lastName,
              CASE WHEN passwordHash IS NOT NULL AND passwordHash != '' THEN 'Has password' ELSE 'No password' END as password_status
       FROM users
       WHERE username IN ('admin', 'doctor1', 'doctor2', 'nurse1', 'pharmacist1')
       ORDER BY username`
    );

    console.log('\nUser password status:');
    console.table(users);

  } catch (error) {
    console.error('Error setting up passwords:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupPasswords();

