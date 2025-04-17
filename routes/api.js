const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const BookingScheduler = require('../scheduler');

const scheduler = new BookingScheduler();

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
    const token = req.session.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Auth routes
router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);
    console.log('Request body:', req.body);

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('User found:', user.username);
        console.log('Stored password hash:', user.password);
        
        try {
            const validPassword = await bcrypt.compare(password, user.password);
            console.log('Password validation result:', validPassword);
            
            if (!validPassword) {
                console.log('Invalid password for user:', username);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            console.log('Password valid for user:', username);
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'your-secret-key');
            req.session.token = token;
            res.json({ message: 'Login successful' });
        } catch (error) {
            console.error('Error during password comparison:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

router.post('/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});

router.get('/auth/status', authenticateToken, (req, res) => {
    res.json({ authenticated: true, user: req.user });
});

// Settings routes
router.get('/settings', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM settings WHERE user_id = ?',
        [req.user.id],
        (err, settings) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(settings || {});
        }
    );
});

router.post('/settings', authenticateToken, (req, res) => {
    const { desired_day, desired_time, num_players, notification_email } = req.body;

    db.run(
        `INSERT OR REPLACE INTO settings 
         (user_id, desired_day, desired_time, num_players, notification_email) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, desired_day, desired_time, num_players, notification_email],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Settings saved successfully' });
        }
    );
});

// Bot control routes
router.post('/bot/toggle', authenticateToken, (req, res) => {
    db.get(
        'SELECT is_active FROM settings WHERE user_id = ?',
        [req.user.id],
        (err, settings) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const newStatus = !settings.is_active;
            
            db.run(
                'UPDATE settings SET is_active = ? WHERE user_id = ?',
                [newStatus, req.user.id],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });

                    if (newStatus) {
                        scheduler.start();
                    } else {
                        scheduler.stop();
                    }

                    res.json({ isActive: newStatus });
                }
            );
        }
    );
});

// Booking history routes
router.get('/bookings/history', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM booking_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [req.user.id],
        (err, history) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(history);
        }
    );
});

module.exports = router; 