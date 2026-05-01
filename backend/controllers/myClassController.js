const db = require('../config/db');

// 1. Get Section Info
exports.getMyClassInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.query(
      `SELECT u.section_id, s.name as section_name, s.department, s.year, s.staff_id as class_teacher_id, st.name as class_teacher_name
       FROM users u
       LEFT JOIN sections s ON u.section_id = s.id
       LEFT JOIN users st ON s.staff_id = st.id
       WHERE u.id = $1`,
      [userId]
    );

    // Return 200 with null section data if not assigned (no 404 in console)
    if (!user.rows[0] || !user.rows[0].section_id) {
      return res.json({ section_id: null, section_name: null, department: null, year: null, class_teacher_name: null });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error('Error fetching class info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// 2. Get Timetable
exports.getTimetable = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRes = await db.query('SELECT section_id FROM users WHERE id = $1', [userId]);
    const sectionId = userRes.rows[0].section_id;

    if (!sectionId) {
      return res.status(404).json({ error: 'No section assigned' });
    }

    const timetable = await db.query(
      `SELECT t.*, s.name as subject_name, s.code as subject_code
       FROM timetable t
       JOIN subjects s ON t.subject_id = s.id
       WHERE t.section_id = $1
       ORDER BY t.day, t.time_slot`,
      [sectionId]
    );

    res.json(timetable.rows);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Get Classmates
exports.getClassmates = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRes = await db.query('SELECT section_id FROM users WHERE id = $1', [userId]);
    const sectionId = userRes.rows[0].section_id;

    if (!sectionId) {
      return res.status(404).json({ error: 'No section assigned' });
    }

    const classmates = await db.query(
      'SELECT id, name, email, avatar_url, role FROM users WHERE section_id = $1 AND role = \'student\' ORDER BY name',
      [sectionId]
    );

    res.json(classmates.rows);
  } catch (error) {
    console.error('Error fetching classmates:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Get Internal Marks
exports.getMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const marks = await db.query(
      `SELECT m.*, 
              s.name as subject_name, 
              s.code as subject_code,
              (COALESCE(m.internal1, 0) + COALESCE(m.internal2, 0) + COALESCE(m.assignment, 0)) as total
       FROM internal_marks m
       JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = $1
       ORDER BY s.code`,
      [userId]
    );

    res.json(marks.rows);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5. Get Section Chat History
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRes = await db.query('SELECT section_id FROM users WHERE id = $1', [userId]);
    const sectionId = userRes.rows[0].section_id;

    if (!sectionId) {
      return res.status(404).json({ error: 'No section assigned' });
    }

    const messages = await db.query(
      `SELECT m.*, u.name as sender_name, u.avatar_url, u.role as sender_role
       FROM section_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.section_id = $1
       ORDER BY m.created_at ASC`,
      [sectionId]
    );

    res.json(messages.rows);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- Staff Features ---

// 6. Get Assigned Sections for Staff
exports.getStaffSections = async (req, res) => {
  try {
    const staffId = req.user.id;
    const sections = await db.query(
      'SELECT * FROM sections WHERE staff_id = $1',
      [staffId]
    );
    res.json(sections.rows);
  } catch (error) {
    console.error('Error fetching staff sections:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 7. Get Students of a Section (for marks entry)
exports.getSectionStudents = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const students = await db.query(
      'SELECT id, name, email FROM users WHERE section_id = $1 AND role = \'student\' ORDER BY name',
      [sectionId]
    );
    res.json(students.rows);
  } catch (error) {
    console.error('Error fetching section students:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 8. Upsert Internal Marks
exports.upsertMarks = async (req, res) => {
  try {
    const { student_id, subject_id, internal1, internal2, assignment } = req.body;
    
    // Check if marks exist
    const existing = await db.query(
      'SELECT id FROM internal_marks WHERE student_id = $1 AND subject_id = $2',
      [student_id, subject_id]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE internal_marks 
         SET internal1 = $1, internal2 = $2, assignment = $3, updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $4 AND subject_id = $5`,
        [internal1 || 0, internal2 || 0, assignment || 0, student_id, subject_id]
      );
    } else {
      await db.query(
        `INSERT INTO internal_marks (student_id, subject_id, internal1, internal2, assignment)
         VALUES ($1, $2, $3, $4, $5)`,
        [student_id, subject_id, internal1 || 0, internal2 || 0, assignment || 0]
      );
    }

    res.json({ message: 'Marks updated successfully' });
  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 9. Assign Timetable Slot to Section
exports.assignTimetable = async (req, res) => {
  try {
    const { section_id, day, time_slot, subject_id } = req.body;
    
    // Check for overlap
    const overlap = await db.query(
      'SELECT id FROM timetable WHERE section_id = $1 AND day = $2 AND time_slot = $3',
      [section_id, day, time_slot]
    );

    if (overlap.rows.length > 0) {
      await db.query(
        'UPDATE timetable SET subject_id = $1 WHERE id = $2',
        [subject_id, overlap.rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO timetable (section_id, day, time_slot, subject_id) VALUES ($1, $2, $3, $4)',
        [section_id, day, time_slot, subject_id]
      );
    }

    res.json({ message: 'Timetable updated' });
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 10. Get Marks Matrix for a Section (pivot: all students × all subjects)
exports.getSectionMarksMatrix = async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Get all students in the section
    const studentsRes = await db.query(
      `SELECT id, name, email 
       FROM users 
       WHERE section_id = $1 AND role = 'student' 
       ORDER BY name`,
      [sectionId]
    );
    const students = studentsRes.rows;

    if (students.length === 0) {
      return res.json({ students: [], subjects: [], marks: {} });
    }

    // Get all subjects that have marks for this section
    const subjectsRes = await db.query(
      `SELECT DISTINCT s.id, s.code, s.name
       FROM subjects s
       JOIN internal_marks im ON s.id = im.subject_id
       WHERE im.student_id = ANY($1::uuid[])
       ORDER BY s.code`,
      [students.map(s => s.id)]
    );
    const subjects = subjectsRes.rows;

    // Get all marks for all students in this section
    const marksRes = await db.query(
      `SELECT im.student_id, im.subject_id, 
              im.internal1, im.internal2, im.assignment,
              (COALESCE(im.internal1, 0) + COALESCE(im.internal2, 0) + COALESCE(im.assignment, 0)) as total
       FROM internal_marks im
       WHERE im.student_id = ANY($1::uuid[])`,
      [students.map(s => s.id)]
    );

    // Build a map: { studentId: { subjectId: { internal1, internal2, assignment, total } } }
    const marksMap = {};
    for (const row of marksRes.rows) {
      if (!marksMap[row.student_id]) marksMap[row.student_id] = {};
      marksMap[row.student_id][row.subject_id] = {
        internal1: row.internal1 || 0,
        internal2: row.internal2 || 0,
        assignment: row.assignment || 0,
        total: row.total || 0
      };
    }

    res.json({ students, subjects, marks: marksMap });
  } catch (error) {
    console.error('Error fetching marks matrix:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

