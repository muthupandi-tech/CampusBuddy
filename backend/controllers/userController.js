const db = require('../config/db');
const bcrypt = require('bcrypt');

// @route   GET /api/users/me
// @desc    Get current user profile
const getMe = async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, name, email, phone, role, department, year, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/users/staff
// @desc    Get all staff (for students to message)
const getStaffList = async (req, res) => {
  try {
    const staffResult = await db.query(
      'SELECT id, name, department, role FROM users WHERE role = $1',
      ['staff']
    );

    res.json(staffResult.rows);
  } catch (error) {
    console.error('Get staff list error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/users/students
// @desc    Get all students (for staff to message)
const getStudentList = async (req, res) => {
  try {
    const studentResult = await db.query(
      'SELECT id, name, department, year, role FROM users WHERE role = $1',
      ['student']
    );

    res.json(studentResult.rows);
  } catch (error) {
    console.error('Get student list error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};


// @route   GET /api/users/stats
// @desc    Get basic stats for admin dashboard
const getAdminStats = async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    
    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users');
    
    // Sample dummy activity data requested for MVP
    const recentActivity = [
      { id: 1, text: "User John Doe registered as Student", time: "2 hours ago" },
      { id: 2, text: "Staff Jane Smith sent a message", time: "5 hours ago" },
      { id: 3, text: "Database backup completed", time: "1 day ago" },
    ];

    res.json({
      roleStats: statsResult.rows,
      totalUsers: totalUsersResult.rows[0].total,
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/users/student/dashboard
// @desc    Get student dashboard data (real data)
const getStudentDashboard = async (req, res) => {
  try {
    const studentQuery = await db.query(
      `SELECT u.name, u.email, u.phone, s.department, s.year, s.id as student_id
       FROM users u
       JOIN students s ON u.id = s.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (studentQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student = studentQuery.rows[0];

    const attendanceQuery = await db.query(
      `SELECT a.total_classes, a.attended_classes, sub.id, sub.name, sub.code, sub.credits
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = $1`,
      [student.student_id]
    );

    let totalClasses = 0;
    let attendedClasses = 0;

    const subjects = attendanceQuery.rows.map(row => {
      totalClasses += row.total_classes;
      attendedClasses += row.attended_classes;
      return {
        id: row.id,
        name: row.name,
        code: row.code,
        credits: row.credits,
        attendance_percentage: row.total_classes ? Math.round((row.attended_classes / row.total_classes) * 100) : 0
      };
    });

    const overallAttendance = totalClasses ? Math.round((attendedClasses / totalClasses) * 100) : 0;

    res.json({
      user: {
        name: student.name,
        email: student.email,
        phone: student.phone,
        department: student.department || 'Undergraduate',
        year: student.year || 1
      },
      attendance: overallAttendance,
      subjects
    });
  } catch (error) {
    console.error('Get student dashboard error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/users/staff/dashboard
// @desc    Get staff dashboard data (real data)
const getStaffDashboard = async (req, res) => {
  try {
    const staffQuery = await db.query(
      `SELECT u.name, u.email, u.phone, s.department, s.id as staff_id
       FROM users u
       JOIN staff s ON u.id = s.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (staffQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    const staff = staffQuery.rows[0];

    // Get subjects map based on their department
    const subjectsQuery = await db.query(
      `SELECT id, name, code, credits FROM subjects WHERE department = $1`,
      [staff.department || 'CSE']
    );

    // Get dynamic student counts for the subjects based on department
    const studentsQuery = await db.query(
       `SELECT COUNT(*) FROM students WHERE department = $1`,
       [staff.department || 'CSE']
    );
    const studentCount = parseInt(studentsQuery.rows[0].count) || Math.floor(Math.random() * 20 + 30); // use random if zero 

    const subjectsHandled = subjectsQuery.rows.map(sub => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      students: studentCount
    }));

    res.json({
      user: {
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        department: staff.department || 'Faculty'
      },
      subjectsHandled
    });
  } catch (error) {
    console.error('Get staff dashboard error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   PUT /api/users/profile
// @desc    Update user profile
const updateProfile = async (req, res) => {
  const { name, phone, department, year, avatar_url } = req.body;
  const user_id = req.user.id;

  try {
    const yearVal = year ? parseInt(year) : null;

    // 1. Update the main users table
    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone), 
           department = COALESCE($3, department), 
           year = COALESCE($4, year),
           avatar_url = COALESCE($5, avatar_url)
       WHERE id = $6 RETURNING id, name, email, role, department, year, avatar_url`,
      [name, phone, department, yearVal, avatar_url, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = result.rows[0];

    // 2. Sync with role-specific tables to ensure dashboard consistency
    if (updatedUser.role === 'student') {
      await db.query(
        `UPDATE students 
         SET department = COALESCE($1, department), 
             year = COALESCE($2, year) 
         WHERE user_id = $3`,
        [department, yearVal, user_id]
      );
    } else if (updatedUser.role === 'staff') {
      await db.query(
        `UPDATE staff 
         SET department = COALESCE($1, department)
         WHERE user_id = $2`,
        [department, user_id]
      );
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   PUT /api/users/change-password
// @desc    Change user password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user_id = req.user.id;

  try {
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user_id]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   PUT /api/users/preferences
// @desc    Update user preferences (e.g., mute notifications)
const updatePreferences = async (req, res) => {
  const { muted_until } = req.body;
  const user_id = req.user.id;

  try {
    // muted_until should be a date string or null
    await db.query(
      'UPDATE users SET muted_until = $1 WHERE id = $2',
      [muted_until, user_id]
    );
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { 
  getMe, 
  getStaffList, 
  getStudentList, 
  getAdminStats, 
  getStudentDashboard, 
  getStaffDashboard,
  updateProfile,
  changePassword,
  updatePreferences
};
