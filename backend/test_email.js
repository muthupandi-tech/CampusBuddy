const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

async function testEmail() {
  console.log("Testing with:", process.env.EMAIL_USER);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("Verify Success!");
  } catch(e) {
    console.error("Verify Error:", e);
  }
}
testEmail();
