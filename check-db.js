const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Check users table
db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
        console.error('Error reading users table:', err);
        return;
    }
    console.log('\nUsers in database:');
    console.log(rows);
});

// Check settings table
db.all('SELECT * FROM settings', (err, rows) => {
    if (err) {
        console.error('Error reading settings table:', err);
        return;
    }
    console.log('\nSettings in database:');
    console.log(rows);
});

// Verify tables exist
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error checking tables:', err);
        return;
    }
    console.log('\nTables in database:');
    console.log(tables);
}); 