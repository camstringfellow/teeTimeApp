const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const sessionSecret = crypto.randomBytes(16).toString('hex');

// Read existing .env file if it exists
let envContent = '';
try {
    envContent = fs.readFileSync('.env', 'utf8');
} catch (err) {
    // File doesn't exist, that's okay
}

// Update or add secrets
const lines = envContent.split('\n');
const newLines = [];

// Update JWT_SECRET
let jwtUpdated = false;
for (const line of lines) {
    if (line.startsWith('JWT_SECRET=')) {
        newLines.push(`JWT_SECRET=${jwtSecret}`);
        jwtUpdated = true;
    } else if (line.startsWith('SESSION_SECRET=')) {
        newLines.push(`SESSION_SECRET=${sessionSecret}`);
    } else if (line.trim()) {
        newLines.push(line);
    }
}

// Add secrets if they don't exist
if (!jwtUpdated) {
    newLines.push(`JWT_SECRET=${jwtSecret}`);
    newLines.push(`SESSION_SECRET=${sessionSecret}`);
}

// Write back to .env file
fs.writeFileSync('.env', newLines.join('\n'));

console.log('Secure secrets have been generated and added to your .env file:');
console.log(`JWT_SECRET: ${jwtSecret}`);
console.log(`SESSION_SECRET: ${sessionSecret}`);
console.log('\nPlease keep these secrets secure and never share them!'); 