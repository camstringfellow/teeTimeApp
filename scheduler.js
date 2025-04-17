const TeeTimeScraper = require('./scraper');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

class BookingScheduler {
  constructor() {
    this.scraper = new TeeTimeScraper();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextBooking();
  }

  stop() {
    this.isRunning = false;
  }

  async scheduleNextBooking() {
    if (!this.isRunning) return;

    try {
      // Get active settings from database
      const settings = await this.getActiveSettings();
      
      if (!settings) {
        console.log('No active booking settings found');
        setTimeout(() => this.scheduleNextBooking(), 60000); // Check every minute
        return;
      }

      // Calculate next booking time
      const nextBookingTime = this.calculateNextBookingTime(settings);
      const now = new Date();
      const delay = nextBookingTime - now;

      if (delay > 0) {
        console.log(`Next booking attempt scheduled for ${nextBookingTime}`);
        setTimeout(() => this.attemptBooking(settings), delay);
      } else {
        // If we missed the window, schedule for next day
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const nextDayDelay = tomorrow - now;
        setTimeout(() => this.scheduleNextBooking(), nextDayDelay);
      }

    } catch (error) {
      console.error('Error in scheduler:', error);
      setTimeout(() => this.scheduleNextBooking(), 60000); // Retry after error
    }
  }

  async getActiveSettings() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT s.*, u.email 
         FROM settings s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.is_active = 1`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  calculateNextBookingTime(settings) {
    const now = new Date();
    const targetDay = this.getNextTargetDay(settings.desired_day);
    const targetTime = settings.desired_time.split(':');
    
    const nextBooking = new Date(targetDay);
    nextBooking.setHours(parseInt(targetTime[0]), parseInt(targetTime[1]), 0, 0);
    
    // If the booking time has passed for today, schedule for next week
    if (nextBooking < now) {
      nextBooking.setDate(nextBooking.getDate() + 7);
    }
    
    return nextBooking;
  }

  getNextTargetDay(desiredDay) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.indexOf(desiredDay.toLowerCase());
    const now = new Date();
    const currentDayIndex = now.getDay();
    
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + daysToAdd);
    return nextDay;
  }

  async attemptBooking(settings) {
    try {
      console.log('Attempting to book tee time...');
      const result = await this.scraper.bookTeeTime(settings);
      
      // Log booking attempt
      await this.logBookingAttempt(settings.user_id, result);
      
      if (result.success) {
        console.log('Booking successful!');
        // Schedule next booking for next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setTimeout(() => this.scheduleNextBooking(), nextWeek - new Date());
      } else {
        console.log('Booking failed, retrying in 5 minutes...');
        setTimeout(() => this.attemptBooking(settings), 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error in booking attempt:', error);
      setTimeout(() => this.attemptBooking(settings), 5 * 60 * 1000);
    }
  }

  async logBookingAttempt(userId, result) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO booking_history (user_id, booking_date, status, details)
         VALUES (?, ?, ?, ?)`,
        [userId, new Date().toISOString(), result.success ? 'success' : 'failed', JSON.stringify(result)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = BookingScheduler; 