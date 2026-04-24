require('dotenv').config();
const transporter = require('./config/mailer');

console.log('Attempting to send test feedback email...');
console.log('FROM:', process.env.EMAIL_USER);
console.log('TO: campusbuddy.official.edu@gmail.com');

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'campusbuddy.official.edu@gmail.com',
  subject: 'CampusBuddy Feedback Test',
  html: '<h2>This is a test feedback email.</h2><p>If you see this, the mailer is working.</p>',
})
.then(() => {
  console.log('✅ Email sent successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Email failed:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});
