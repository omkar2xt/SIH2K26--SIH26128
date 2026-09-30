const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma', 'PASHU-RAKSHA_Knowledge_Database.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function inspect() {
  console.log(`--- INSPECTING ${path.basename(dbPath)} ---`);
  
  // 1. Get all tables
  const tables = await query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  
  for (const table of tables) {
    console.log(`\nTABLE: ${table.name}`);
    console.log(`SCHEMA:\n${table.sql}`);
    
    // Get row count
    const countRow = await query(`SELECT COUNT(*) as count FROM "${table.name}"`);
    console.log(`ROW COUNT: ${countRow[0].count}`);
    
    // Sample first 2 rows
    const sample = await query(`SELECT * FROM "${table.name}" LIMIT 2`);
    if (sample.length > 0) {
      console.log('SAMPLE DATA:');
      console.log(JSON.stringify(sample, null, 2));
    }
  }

  db.close();
}

inspect().catch(err => console.error(err));
