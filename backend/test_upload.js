const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  const token = jwt.sign({ id: '6eb745d3-804b-451a-8da4-dcf87068c0c4', role: 'staff' }, process.env.JWT_SECRET);
  
  const form = new FormData();
  form.append('title', 'Test Upload');
  form.append('subject_id', '1');
  form.append('file', fs.createReadStream('package.json'), 'package.txt');

  try {
    const res = await axios.post('http://localhost:5000/api/academic/resources', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}

test();
