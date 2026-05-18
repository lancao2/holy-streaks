const fs = require('fs');
const { Client } = require('pg');

// Pure zero-dependency .env parser
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    console.error("Error: Database URL not found in .env file.");
    return;
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");
    
    const res = await client.query('SELECT id, email, "firstName", "lastName", username, "birthDate", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10;');
    console.log("\nLast 10 Registered Users:");
    console.table(res.rows);
  } catch (err) {
    console.error("Database Query Error:", err);
  } finally {
    await client.end();
  }
}

main();
