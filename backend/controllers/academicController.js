const db = require('../config/db');

// @route   POST /api/academic/resources
const uploadResource = async (req, res) => {
  try {
    const { title, subject_id } = req.body;
    
    if (!req.files || !req.files.file) {
       return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.files.file;
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png'];
    const path = require('path');
    const ext = path.extname(file.name).toLowerCase();
    
    if (!allowed.includes(ext)) {
       return res.status(400).json({ error: 'Invalid file type! Allowed extensions: ' + allowed.join(', ') });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + ext;
    const uploadPath = path.join(__dirname, '../uploads', filename);

    await file.mv(uploadPath);

    const file_url = `/uploads/${filename}`;
    const uploaded_by = req.user.id;

    const resourceDb = await db.query(
      `INSERT INTO resources (title, file_url, subject_id, uploaded_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, file_url, subject_id, uploaded_by]
    );

    res.status(201).json(resourceDb.rows[0]);
  } catch (error) {
    console.error('Resource upload error:', error.message);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// @route   GET /api/academic/resources/:subjectId 
const getResources = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Wait, in a broader MVP fetch, they might want all subjects. If 'all', omit filter
    if (subjectId === 'all') {
      const allRes = await db.query(`SELECT r.*, s.name as subject_name FROM resources r JOIN subjects s ON r.subject_id = s.id ORDER BY r.created_at DESC`);
      return res.json(allRes.rows);
    }
    
    const resources = await db.query(
      'SELECT * FROM resources WHERE subject_id = $1 ORDER BY created_at DESC',
      [subjectId]
    );
    res.json(resources.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   POST /api/academic/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { title, description } = req.body;
    const posted_by = req.user.id;
    
    const announcement = await db.query(
      `INSERT INTO announcements (title, description, posted_by) VALUES ($1, $2, $3) RETURNING *`,
      [title, description, posted_by]
    );
    
    res.status(201).json(announcement.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/academic/announcements
const getAnnouncements = async (req, res) => {
  try {
    const ann = await db.query(
      `SELECT a.*, u.name as posted_by_name, u.role as posted_role 
       FROM announcements a 
       JOIN users u ON a.posted_by = u.id 
       ORDER BY a.created_at DESC`
    );
    res.json(ann.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   POST /api/academic/events
const createEvent = async (req, res) => {
  try {
    const { title, description, event_date, location } = req.body;
    
    const ev = await db.query(
      `INSERT INTO events (title, description, event_date, location) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, description, event_date, location]
    );
    
    res.status(201).json(ev.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/academic/events
const getEvents = async (req, res) => {
  try {
    // Return all events ORDERED BY incoming upcoming events sequentially
    const ev = await db.query(`SELECT * FROM events ORDER BY event_date ASC`);
    res.json(ev.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/academic/timetable
const getTimetable = async (req, res) => {
  try {
    const { dept, year } = req.query;
    let query = `
      SELECT t.*, s.name as subject_name, s.code as subject_code 
      FROM timetable t 
      JOIN subjects s ON t.subject_id = s.id 
    `;
    const params = [];
    
    if (dept && year) {
      query += ` WHERE t.department = $1 AND t.year = $2`;
      params.push(dept, year);
    }
    
    query += ` ORDER BY CASE t.day
                 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 ELSE 6 END, t.time_slot`;
                 
    const tt = await db.query(query, params);
    res.json(tt.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  uploadResource, getResources,
  createAnnouncement, getAnnouncements,
  createEvent, getEvents,
  getTimetable
};
