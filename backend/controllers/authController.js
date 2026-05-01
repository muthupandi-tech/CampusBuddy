const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const transporter = require('../config/mailer');
const crypto = require('crypto');

// Helper to generate 6 digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


// @route   POST /api/auth/signup
// @desc    Register a new user
const signup = async (req, res) => {
  try {
    const { name, email, phone, password, role, department, year } = req.body;

    // Check if user exists
    const userExists = await db.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with that email or phone already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      `INSERT INTO users (name, email, phone, password, role, department, year) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, department, admin_department, year`,
      [name, email || null, phone || null, hashedPassword, role, department || null, year || null]
    );

    const userId = newUser.rows[0].id;
    if (role === 'student') {
       await db.query('INSERT INTO students (user_id, department, year) VALUES ($1, $2, $3)', [userId, department || null, year || null]);
    } else if (role === 'staff') {
       await db.query('INSERT INTO staff (user_id, department) VALUES ($1, $2)', [userId, department || null]);
    }

    // Mock OTP verification step can be conceptualized here

    // Generate JWT
    const payload = {
      id: newUser.rows[0].id,
      role: newUser.rows[0].role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
const login = async (req, res) => {
  try {
    const { emailPhone, password } = req.body; // Can be email or phone

    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $1',
      [emailPhone]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    delete user.password;

    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with that email already exists' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Clear previous OTPs
    await db.query('DELETE FROM otp_verification WHERE email = $1', [email]);

    // Insert new OTP
    await db.query(
      'INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CampusBuddy - Your Registration OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg mx-auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">CampusBuddy</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for registration is:</p>
          <div style="font-size: 24px; font-weight: bold; background: #e0e7ff; padding: 15px; text-align: center; letter-spacing: 4px; border-radius: 6px; color: #3730a3; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in <strong>5 minutes</strong>. Do not share this with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent to email successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, phone, password, role, department, year } = req.body;

    const otpRecord = await db.query(
      'SELECT * FROM otp_verification WHERE email = $1 AND otp = $2',
      [email, otp]
    );

    if (otpRecord.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or incorrect OTP' });
    }

    const record = otpRecord.rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Check one more time if user somehow exists before inserting
    const userExists = await db.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with that email or phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      `INSERT INTO users (name, email, phone, password, role, department, year) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, department, admin_department, year`,
      [name, email || null, phone || null, hashedPassword, role, department || null, year || null]
    );

    const userId = newUser.rows[0].id;
    if (role === 'student') {
       await db.query('INSERT INTO students (user_id, department, year) VALUES ($1, $2, $3)', [userId, department || null, year || null]);
    } else if (role === 'staff') {
       await db.query('INSERT INTO staff (user_id, department) VALUES ($1, $2)', [userId, department || null]);
    }

    await db.query('DELETE FROM otp_verification WHERE email = $1', [email]);

    const payload = {
      id: newUser.rows[0].id,
      role: newUser.rows[0].role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Return success silently for security
      return res.status(200).json({ message: 'If that email is registered, a password reset link was sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.query('DELETE FROM password_resets WHERE email = $1', [email]);
    await db.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, token, expiresAt]
    );

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CampusBuddy - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg mx-auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">CampusBuddy Password Reset</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in <strong>15 minutes</strong>.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'If that email is registered, a password reset link was sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Server error parsing request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const resetRecord = await db.query('SELECT * FROM password_resets WHERE token = $1', [token]);
    
    if (resetRecord.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const record = resetRecord.rows[0];
    if (new Date() > new Date(record.expires_at)) {
      await db.query('DELETE FROM password_resets WHERE token = $1', [token]);
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, record.email]);
    await db.query('DELETE FROM password_resets WHERE email = $1', [record.email]);

    res.status(200).json({ message: 'Password has been successfully reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};

module.exports = { signup, login, sendOtp, verifyOtp, forgotPassword, resetPassword };
