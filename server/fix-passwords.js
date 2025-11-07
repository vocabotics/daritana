const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  database: 'daritana_dev',
  port: 5432,
});

async function fixPasswords() {
  try {
    // Generate proper hash for password123
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash for password123:', hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash validation test:', isValid);
    
    // Update all users with the new hash
    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE email IN ('admin@daritana.com', 'lead@daritana.com', 'designer@daritana.com', 'client@example.com', 'contractor@build.com', 'staff@daritana.com')",
      [hash]
    );
    
    console.log('Updated', result.rowCount, 'users with new password hash');
    
    // Verify the update
    const users = await pool.query("SELECT email FROM users WHERE password_hash = $1", [hash]);
    console.log('Users with updated password:');
    users.rows.forEach(u => console.log('  -', u.email));
    
    await pool.end();
    console.log('\n✅ Password fix complete! All users now use password: password123');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPasswords();