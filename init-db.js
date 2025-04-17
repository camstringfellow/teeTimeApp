const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const readline = require('readline');

const db = new sqlite3.Database('./database.sqlite');

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        desired_time TEXT,
        desired_day TEXT,
        num_players INTEGER,
        is_active BOOLEAN DEFAULT 1,
        notification_preference TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Booking history table
    db.run(`CREATE TABLE IF NOT EXISTS booking_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        booking_date DATETIME,
        status TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to create admin user
async function createAdminUser() {
    return new Promise((resolve) => {
        rl.question('Enter admin username: ', async (username) => {
            rl.question('Enter admin password: ', async (password) => {
                rl.question('Enter admin email: ', async (email) => {
                    try {
                        // Hash the password
                        const hashedPassword = await bcrypt.hash(password, 10);

                        // Insert the admin user
                        db.run(
                            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                            [username, hashedPassword, email],
                            function(err) {
                                if (err) {
                                    console.error('Error creating admin user:', err);
                                    process.exit(1);
                                }

                                // Create default settings for the admin user
                                db.run(
                                    `INSERT INTO settings 
                                     (user_id, desired_time, desired_day, num_players, notification_preference) 
                                     VALUES (?, ?, ?, ?, ?)`,
                                    [this.lastID, '07:00', 'monday', 1, email],
                                    (err) => {
                                        if (err) {
                                            console.error('Error creating default settings:', err);
                                            process.exit(1);
                                        }
                                        console.log('Admin user created successfully!');
                                        resolve();
                                    }
                                );
                            }
                        );
                    } catch (error) {
                        console.error('Error:', error);
                        process.exit(1);
                    }
                });
            });
        });
    });
}

// Main function
async function main() {
    try {
        console.log('Initializing database...');
        await createAdminUser();
        console.log('Database initialization complete!');
        console.log('\nYou can now start the application with:');
        console.log('npm start');
        process.exit(0);
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
}

main(); 