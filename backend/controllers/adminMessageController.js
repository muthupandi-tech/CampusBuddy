const db = require('../config/db');
const { createNotification } = require('./notificationController');

// @route   POST /api/admin/messages
// @desc    Create a new admin broadcast message (admin only)
const createAdminMessage = async (req, res) => {
  const { title, message, target_role, department, is_priority, expires_at } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO admin_messages (title, message, target_role, department, is_priority, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, message, target_role || 'all', department || null, is_priority || false, expires_at || null]
    );

    const adminMsg = result.rows[0];

    // Send notifications to targeted users
    let userQuery = '';
    const params = [];

    if (target_role === 'all') {
      userQuery = `SELECT id FROM users WHERE role IN ('student', 'staff')`;
    } else {
      userQuery = `SELECT id FROM users WHERE role = $1`;
      params.push(target_role);
    }

    if (department) {
      userQuery += params.length > 0
        ? ` AND department = $${params.length + 1}`
        : ` AND department = $1`;
      params.push(department);
    }

    const targetUsers = await db.query(userQuery, params);

    // Fire-and-forget notifications
    const prefix = is_priority ? '🔴 PRIORITY: ' : '📢 ';
    for (const u of targetUsers.rows) {
      createNotification(u.id, `${prefix}Admin Notice: ${title}`, 'admin_message').catch(() => {});
    }

    res.status(201).json({ message: 'Admin message sent successfully', adminMessage: adminMsg });
  } catch (error) {
    console.error('Create admin message error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/admin/messages
// @desc    Get ACTIVE admin messages filtered by user role and department
//          Active = is_active AND (priority OR no expiry OR not yet expired)
const getAdminMessages = async (req, res) => {
  const userRole = req.user.role;
  const { department } = req.query;

  try {
    let query = `
      SELECT * FROM admin_messages 
      WHERE (target_role = 'all' OR target_role = $1)
        AND (department IS NULL${department ? ' OR department = $2' : ''})
        AND is_active = true
        AND (is_priority = true OR expires_at IS NULL OR expires_at > NOW())
    `;
    const params = [userRole];
    if (department) params.push(department);

    query += ` ORDER BY is_priority DESC, created_at DESC LIMIT 50`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get admin messages error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/admin/messages/history
// @desc    Get HISTORY admin messages (expired or deactivated) for student/staff
const getAdminMessageHistory = async (req, res) => {
  const userRole = req.user.role;
  const { department } = req.query;

  try {
    let query = `
      SELECT * FROM admin_messages 
      WHERE (target_role = 'all' OR target_role = $1)
        AND (department IS NULL${department ? ' OR department = $2' : ''})
        AND (
          is_active = false 
          OR (is_priority = false AND expires_at IS NOT NULL AND expires_at <= NOW())
        )
    `;
    const params = [userRole];
    if (department) params.push(department);

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get admin message history error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/admin/messages/all
// @desc    Get ALL admin messages (for admin panel view)
const getAllAdminMessages = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM admin_messages ORDER BY is_priority DESC, created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all admin messages error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   PUT /api/admin/messages/:id/deactivate
// @desc    Manually deactivate an admin message (move to history)
const deactivateAdminMessage = async (req, res) => {
  try {
    await db.query(
      'UPDATE admin_messages SET is_active = false WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Message deactivated' });
  } catch (error) {
    console.error('Deactivate admin message error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createAdminMessage, getAdminMessages, getAdminMessageHistory, getAllAdminMessages, deactivateAdminMessage };
