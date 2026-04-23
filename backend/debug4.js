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
    form.append('file', fs.createReadStream('./package.json'), { filename: 'test.txt' });

    // Try without headers first (which is what axios should do in browser)
    try {
        const res = await axios.post('http://localhost:5000/api/academic/resources', form, {
            headers: {
                ...form.getHeaders(), // node form-data requires this, but browser FormData doesn't
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Success with node form headers:", res.data);
    } catch(e) {
        console.error("Error with node form headers:", e.response?.data || e.message);
    }

    // Try simulating browser exact behavior (setting multipart/form-data manually without boundary)
    try {
        const res2 = await axios.post('http://localhost:5000/api/academic/resources', form, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Success with bad headers:", res2.data);
    } catch(e) {
        console.error("Error with bad headers:", e.response?.data || e.message);
    }

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
