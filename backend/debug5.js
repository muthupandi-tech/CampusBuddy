const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const db = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function check() {
  try {
    const user = await db.query("SELECT id FROM users WHERE role='staff' LIMIT 1");
    const token = jwt.sign(
      { id: user.rows[0].id, role: 'staff' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const form = new FormData();
    form.append('title', 'Test');
    form.append('subject_id', '1');
    form.append('file', fs.createReadStream('./package.json'), { filename: 'test.exe' });

    try {
        const res = await axios.post('http://localhost:5000/api/academic/resources', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Success:", res.data);
    } catch(e) {
        console.error("Axios Error Message:", e.message);
        console.error("Error Response Data:", e.response?.data);
        console.error("Error Status:", e.response?.status);
    }

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
