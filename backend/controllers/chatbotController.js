const db = require('../config/db');

// @route   POST /api/chatbot
const handleChat = async (req, res) => {
  const { question } = req.body;
  const userId = req.user.id;
  const q = question.toLowerCase();

  try {
    let response = "";

    // 1. Logic for Attendance
    if (q.includes('attendance') || q.includes('absent') || q.includes('present')) {
      const attendance = await db.query(
        `SELECT s.name, a.attended_classes, a.total_classes 
         FROM attendance a
         JOIN subjects s ON a.subject_id = s.id
         JOIN students st ON a.student_id = st.id
         WHERE st.user_id = $1`,
        [userId]
      );

      if (attendance.rows.length > 0) {
        response = "Your attendance summary: " + attendance.rows.map(r => 
          `${r.name}: ${Math.round((r.attended_classes/r.total_classes)*100)}%`
        ).join(', ') + ".";
      } else {
        response = "I couldn't find any attendance records for you yet.";
      }
    }

    // 2. Logic for Timetable
    else if (q.includes('timetable') || q.includes('class') || q.includes('schedule')) {
      const user = await db.query('SELECT department, year FROM users WHERE id = $1', [userId]);
      const { department, year } = user.rows[0];

      const timetable = await db.query(
        'SELECT day, time_slot, subject_id FROM timetable WHERE department = $1 AND year = $2',
        [department, year]
      );

      if (timetable.rows.length > 0) {
        response = `You have classes scheduled for your ${department} (Year ${year}) program. For example, on Monday, you have sessions starting from ${timetable.rows.find(t => t.day === 'Monday')?.time_slot || 'early morning'}.`;
      } else {
        response = "Your timetable hasn't been uploaded for this semester yet.";
      }
    }

    // 3. Logic for Subjects
    else if (q.includes('subject') || q.includes('course') || q.includes('study')) {
      const subjects = await db.query('SELECT name, code FROM subjects');
      response = "Currently, we offer subjects like: " + subjects.rows.slice(0, 5).map(s => `${s.name} (${s.code})`).join(', ') + ". You can find materials in the Academic section.";
    }

    // 4. Default Fallback
    else {
      response = "Hello! I'm your CampusBuddy assistant. I can help you with your attendance, timetable, or subject information. Try asking 'What is my attendance?' or 'Show my schedule'.";
    }

    res.json({ response });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    res.status(500).json({ error: 'Failed to process chat query' });
  }
};

module.exports = { handleChat };
