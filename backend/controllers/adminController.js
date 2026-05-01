const db = require('../config/db');
const transporter = require('../config/mailer');
const bcrypt = require('bcrypt');

// helper to get admin's department
const getAdminDept = async (userId) => {
  const res = await db.query('SELECT admin_department FROM users WHERE id = $1', [userId]);
  return res.rows[0]?.admin_department;
};

// 1. Get all classes with assignment status
exports.getClasses = async (req, res) => {
  try {
    const { department } = req.query;
    let query = `
      SELECT s.*, ca.staff_id, u.name as staff_name, u.email as staff_email
      FROM sections s
      LEFT JOIN class_assignments ca ON s.department = ca.department AND s.year = ca.year AND s.name = ca.section
      LEFT JOIN users u ON ca.staff_id = u.id
    `;
    let params = [];

    if (department && department !== 'all') {
      query += ` WHERE s.department = $1`;
      params.push(department);
    }

    query += ` ORDER BY s.department, s.year, s.name`;

    const classes = await db.query(query, params);
    res.json(classes.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. Get staff list
exports.getStaff = async (req, res) => {
  try {
    const { department } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.department,
             (SELECT COUNT(*) FROM class_assignments WHERE staff_id = u.id) as assigned_classes
      FROM users u
      WHERE role = 'staff'
    `;
    let params = [];

    if (department && department !== 'all') {
      query += ` AND u.department = $1`;
      params.push(department);
    }

    query += ` ORDER BY u.name`;

    const staff = await db.query(query, params);
    res.json(staff.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Assign staff to class
exports.assignClass = async (req, res) => {
  try {
    const { department, year, section, staff_id } = req.body;
    const adminDept = await getAdminDept(req.user.id);

    // 1. Admin can only manage their own department
    if (department !== adminDept) {
      return res.status(403).json({ error: `You can only manage classes for the ${adminDept} department.` });
    }

    // 2. Staff must belong to the class department
    const staffCheck = await db.query('SELECT department FROM users WHERE id = $1', [staff_id]);
    if (staffCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Staff not found' });
    }
    if (staffCheck.rows[0].department !== department) {
        return res.status(403).json({ error: `Staff belongs to ${staffCheck.rows[0].department} and cannot be assigned to a ${department} class.` });
    }

    // Check for duplicate assignment
    const check = await db.query(
      'SELECT id FROM class_assignments WHERE department = $1 AND year = $2 AND section = $3',
      [department, year, section]
    );

    if (check.rows.length > 0) {
      await db.query(
        'UPDATE class_assignments SET staff_id = $1, assigned_at = CURRENT_TIMESTAMP WHERE department = $2 AND year = $3 AND section = $4',
        [staff_id, department, year, section]
      );
    } else {
      await db.query(
        'INSERT INTO class_assignments (department, year, section, staff_id) VALUES ($1, $2, $3, $4)',
        [department, year, section, staff_id]
      );
    }

    await db.query(
      'UPDATE sections SET staff_id = $1 WHERE department = $2 AND year = $3 AND name = $4',
      [staff_id, department, year, section]
    );

    // Email Notification
    const staffRes = await db.query('SELECT name, email FROM users WHERE id = $1', [staff_id]);
    const staff = staffRes.rows[0];

    if (staff && staff.email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: staff.email,
        subject: 'Class Assignment Notification',
        text: `Hello ${staff.name},\n\nYou have been assigned as Class Teacher for ${department} - Year ${year} - Section ${section}.\n\nBest regards,\nCampusBuddy Admin`
      };
      transporter.sendMail(mailOptions).catch(err => console.error('Email failed:', err));
    }

    res.json({ message: 'Class assigned successfully' });
  } catch (error) {
    console.error('Error assigning class:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Unassign class
exports.unassignClass = async (req, res) => {
  try {
    const { department, year, section } = req.body;
    const adminDept = await getAdminDept(req.user.id);

    if (department !== adminDept) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await db.query(
      'DELETE FROM class_assignments WHERE department = $1 AND year = $2 AND section = $3',
      [department, year, section]
    );

    await db.query(
      'UPDATE sections SET staff_id = NULL WHERE department = $1 AND year = $2 AND name = $3',
      [department, year, section]
    );

    res.json({ message: 'Class unassigned successfully' });
  } catch (error) {
    console.error('Error unassigning class:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- New Dynamic Features ---

// 5. Get Departments
exports.getDepartments = async (req, res) => {
  try {
    const depts = await db.query('SELECT * FROM departments ORDER BY name');
    res.json(depts.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 6. Add Department
exports.addDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    await db.query('INSERT INTO departments (name) VALUES ($1)', [name]);
    res.json({ message: 'Department added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add department' });
  }
};

// 7. Add Section
exports.addSection = async (req, res) => {
  try {
    const { department, year, section } = req.body;
    const adminDept = await getAdminDept(req.user.id);

    if (department !== adminDept) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query(
      'INSERT INTO sections (name, department, year) VALUES ($1, $2, $3)',
      [section, department, year]
    );
    res.json({ message: 'Section created successfully' });
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
};

// 8. Delete Section (Secure)
exports.deleteSection = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user.id;

    // 1. Verify Password
    const userRes = await client.query('SELECT password FROM users WHERE id = $1', [userId]);
    const isMatch = await bcrypt.compare(password, userRes.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // 2. Get section details
    const secRes = await client.query('SELECT name, department, year FROM sections WHERE id = $1', [id]);
    if (secRes.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }
    const { name, department, year } = secRes.rows[0];

    // 3. Check if it's the last section in the department-year
    const countRes = await client.query(
      'SELECT COUNT(*) FROM sections WHERE department = $1 AND year = $2',
      [department, year]
    );
    if (parseInt(countRes.rows[0].count) <= 1) {
      return res.status(400).json({ error: `Cannot delete the last section of ${department} Year ${year}. At least one section must exist.` });
    }

    // 4. Delete assignment and section in a transaction
    await client.query('BEGIN');
    
    // Remove assignment first
    await client.query(
      'DELETE FROM class_assignments WHERE department = $1 AND year = $2 AND section = $3',
      [department, year, name]
    );

    // Delete section
    await client.query('DELETE FROM sections WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Server error during deletion' });
  } finally {
    client.release();
  }
};
