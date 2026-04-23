const db = require('../config/db');

// @route   GET /api/analytics/student
const getStudentAnalytics = async (req, res) => {
  try {
    // 1. Get student attendance summary
    const attendanceQuery = await db.query(
      `SELECT s.name, a.attended_classes, a.total_classes 
       FROM attendance a
       JOIN subjects s ON a.subject_id = s.id
       JOIN students st ON a.student_id = st.id
       WHERE st.user_id = $1`,
      [req.user.id]
    );

    // 2. Format for Recharts
    const attendanceStats = attendanceQuery.rows.map(row => ({
      subject: row.name,
      percentage: row.total_classes ? Math.round((row.attended_classes / row.total_classes) * 100) : 0,
      attended: row.attended_classes,
      total: row.total_classes
    }));

    // 3. Overall attendance trend (Dummy data for demo if not enough history)
    const overallTrend = [
      { month: 'Jan', attendance: 75 },
      { month: 'Feb', attendance: 82 },
      { month: 'Mar', attendance: 78 },
      { month: 'Apr', attendance: 85 }
    ];

    res.json({
      attendanceStats,
      overallTrend
    });
  } catch (error) {
    console.error('Student analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET /api/analytics/admin
const getAdminAnalytics = async (req, res) => {
  try {
    // 1. User distribution
    const usersByRole = await db.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    // 2. Department distribution
    const usersByDept = await db.query(
      'SELECT department, COUNT(*) as count FROM users WHERE department IS NOT NULL GROUP BY department'
    );

    // 3. Attendance trends (Average across all subjects)
    const globalAttendance = await db.query(
      `SELECT AVG(CAST(attended_classes AS FLOAT) / NULLIF(total_classes, 0) * 100) as avg_attendance 
       FROM attendance`
    );

    res.json({
      userDistribution: usersByRole.rows,
      departmentDistribution: usersByDept.rows,
      avgAttendance: Math.round(globalAttendance.rows[0].avg_attendance || 0)
    });
  } catch (error) {
    console.error('Admin analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getStudentAnalytics,
  getAdminAnalytics
};
