const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

class TeeTimeScraper {
  constructor() {
    this.bookingUrl = 'https://duneswest.quick18.com/teetimes/';
    this.emailConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };
  }

  async bookTeeTime(settings) {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.goto(this.bookingUrl);

      // Wait for the date selector to be available
      await page.waitForSelector('input[type="date"]');
      
      // Set the desired date
      await page.type('input[type="date"]', settings.desiredDate);
      
      // Click search button
      await page.click('button[type="submit"]');
      
      // Wait for tee times to load
      await page.waitForSelector('.tee-time-list');
      
      // Find the earliest available tee time at or after desired time
      const availableTimes = await page.evaluate((desiredTime) => {
        const times = Array.from(document.querySelectorAll('.tee-time-slot'));
        return times
          .filter(slot => {
            const time = slot.querySelector('.time').textContent;
            return time >= desiredTime;
          })
          .map(slot => ({
            time: slot.querySelector('.time').textContent,
            available: !slot.classList.contains('booked')
          }));
      }, settings.desiredTime);

      const earliestTime = availableTimes.find(time => time.available);
      
      if (!earliestTime) {
        throw new Error('No available tee times found');
      }

      // Click the available tee time
      await page.click(`.tee-time-slot:contains("${earliestTime.time}")`);
      
      // Fill in player information
      for (let i = 0; i < settings.numPlayers; i++) {
        await page.type(`input[name="player${i+1}_name"]`, settings.playerNames[i]);
      }
      
      // Submit booking
      await page.click('button[type="submit"]');
      
      // Wait for confirmation
      await page.waitForSelector('.confirmation-number');
      
      const confirmationNumber = await page.evaluate(() => {
        return document.querySelector('.confirmation-number').textContent;
      });

      await this.sendConfirmationEmail(settings.email, {
        time: earliestTime.time,
        date: settings.desiredDate,
        confirmationNumber
      });

      return {
        success: true,
        time: earliestTime.time,
        confirmationNumber
      };

    } catch (error) {
      await this.sendErrorEmail(settings.email, error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await browser.close();
    }
  }

  async sendConfirmationEmail(to, bookingDetails) {
    const transporter = nodemailer.createTransport(this.emailConfig);
    
    const mailOptions = {
      from: this.emailConfig.auth.user,
      to,
      subject: 'Tee Time Booking Confirmation',
      text: `Your tee time has been successfully booked!\n
             Date: ${bookingDetails.date}\n
             Time: ${bookingDetails.time}\n
             Confirmation Number: ${bookingDetails.confirmationNumber}`
    };

    await transporter.sendMail(mailOptions);
  }

  async sendErrorEmail(to, errorMessage) {
    const transporter = nodemailer.createTransport(this.emailConfig);
    
    const mailOptions = {
      from: this.emailConfig.auth.user,
      to,
      subject: 'Tee Time Booking Failed',
      text: `The booking attempt failed with the following error:\n${errorMessage}`
    };

    await transporter.sendMail(mailOptions);
  }
}

module.exports = TeeTimeScraper; 