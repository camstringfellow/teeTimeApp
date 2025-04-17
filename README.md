# Tee Time Booking Bot

An automated bot that books tee times at your preferred golf course as soon as they become available.

## Features

- Automated tee time booking
- Web-based dashboard for control and monitoring
- Email notifications for successful/failed bookings
- Booking history tracking
- Customizable booking preferences
- Secure authentication

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- SQLite3
- Raspberry Pi 4 (for hosting)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/teeTimeApp.git
cd teeTimeApp
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration:
  - `JWT_SECRET`: A secure random string for JWT token signing
  - `SESSION_SECRET`: A secure random string for session management
  - `EMAIL_USER`: Your Gmail address for notifications
  - `EMAIL_PASSWORD`: Your Gmail app password (not your regular password)

4. Initialize the database:
```bash
node init-db.js
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. Access the dashboard:
- Open your browser and navigate to `http://localhost:3000`
- Log in with your credentials

## Usage

1. Set up your booking preferences in the dashboard:
   - Desired day of the week
   - Preferred tee time
   - Number of players
   - Notification email

2. Toggle the bot on/off using the dashboard controls

3. Monitor booking attempts and history in the dashboard

## Running on Raspberry Pi

1. Install Node.js on your Raspberry Pi:
```bash
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Clone and install the application as described above

3. Set up the application to start on boot:
```bash
sudo npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

4. Access the dashboard from any device on your local network:
- Use your Raspberry Pi's local IP address: `http://<raspberry-pi-ip>:3000`

## Security Notes

- Change the default JWT and session secrets
- Use a strong password for your account
- Keep your email credentials secure
- Regularly update the application and its dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
