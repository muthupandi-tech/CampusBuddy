const db = require('../config/db');

// --- Subject Controllers ---

// GET /api/subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await db.query('SELECT * FROM subjects ORDER BY code');
    res.json(subjects.rows);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- Staff Subject Integration ---

// POST /api/staff/subjects
exports.assignStaffSubject = async (req, res) => {
  try {
    const { staff_id, subject_id } = req.body;
    await db.query(
      'INSERT INTO staff_subjects (staff_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [staff_id, subject_id]
    );
    res.json({ message: 'Subject assigned to staff' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign subject' });
  }
};

// GET /api/staff/subjects/:staffId
exports.getStaffSubjects = async (req, res) => {
  try {
    const { staffId } = req.params;
    const subjects = await db.query(`
      SELECT s.* 
      FROM subjects s
      JOIN staff_subjects ss ON s.id = ss.subject_id
      WHERE ss.staff_id = $1
      ORDER BY s.code
    `, [staffId]);
    res.json(subjects.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff subjects' });
  }
};

// DELETE /api/staff/subjects
exports.removeStaffSubject = async (req, res) => {
  try {
    const { staff_id, subject_id } = req.body;
    await db.query(
      'DELETE FROM staff_subjects WHERE staff_id = $1 AND subject_id = $2',
      [staff_id, subject_id]
    );
    res.json({ message: 'Subject removed from staff' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove subject' });
  }
};

// --- Staff Qualification Controllers ---

// POST /api/staff/qualifications
exports.addStaffQualification = async (req, res) => {
  try {
    const { staff_id, degree, major, college } = req.body;
    const result = await db.query(
      'INSERT INTO staff_qualifications (staff_id, degree, major, college) VALUES ($1, $2, $3, $4) RETURNING *',
      [staff_id, degree, major, college]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add qualification' });
  }
};

// GET /api/staff/qualifications/:staffId
exports.getStaffQualifications = async (req, res) => {
  try {
    const { staffId } = req.params;
    const quals = await db.query(
      'SELECT * FROM staff_qualifications WHERE staff_id = $1 ORDER BY id',
      [staffId]
    );
    res.json(quals.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch qualifications' });
  }
};

// DELETE /api/staff/qualifications/:id
exports.deleteQualification = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM staff_qualifications WHERE id = $1', [id]);
    res.json({ message: 'Qualification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete qualification' });
  }
};

// --- Dashboard Integrations (Restored) ---

// GET /api/academic/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const results = await db.query(`
      SELECT a.*, u.role as posted_role 
      FROM announcements a
      LEFT JOIN users u ON a.posted_by = u.id
      WHERE a.expires_at IS NULL OR a.expires_at > NOW() 
      ORDER BY a.created_at DESC
    `);
    res.json(results.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/academic/announcements/history
exports.getAnnouncementHistory = async (req, res) => {
  try {
    const results = await db.query(`
      SELECT a.*, u.role as posted_role 
      FROM announcements a
      LEFT JOIN users u ON a.posted_by = u.id
      WHERE a.expires_at IS NOT NULL AND a.expires_at <= NOW() 
      ORDER BY a.created_at DESC
    `);
    res.json(results.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/academic/events
exports.getEvents = async (req, res) => {
  try {
    const results = await db.query('SELECT *, NULL as event_time FROM events WHERE event_date >= NOW() ORDER BY event_date ASC');
    res.json(results.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/academic/events/history
exports.getEventHistory = async (req, res) => {
  try {
    const results = await db.query('SELECT *, NULL as event_time FROM events WHERE event_date < NOW() ORDER BY event_date DESC');
    res.json(results.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/academic/resources/all
exports.getAllResources = async (req, res) => {
  try {
    const results = await db.query('SELECT * FROM resources ORDER BY created_at DESC');
    res.json(results.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
