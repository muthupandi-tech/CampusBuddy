const db = require('../config/db');

// 1. Get DM History
exports.getDMHistory = async (req, res) => {
  try {
    const { userId } = req.params; // The other user
    const myId = req.user.id;

    const messages = await db.query(
      `SELECT * FROM direct_messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [myId, userId]
    );

    res.json(messages.rows);
  } catch (error) {
    console.error('Error fetching DM history:', error);
    res.status(500).json({ error: 'Server error fetching chat history' });
  }
};

// 2. Send DM (with block check and file support)
exports.sendDM = async (req, res) => {
  try {
    const { receiverId, message, classroomId } = req.body || {};
    const senderId = req.user.id;

    // A. Student-to-Student Block Check (using existing blocked_users)
    const blockCheck = await db.query(
      'SELECT id FROM blocked_users WHERE user_id = $1 AND blocked_user_id = $2',
      [receiverId, senderId]
    );

    if (blockCheck.rows.length > 0) {
      return res.status(403).json({ error: 'You are blocked by this user' });
    }

    // B. Staff Block Check (classroom_blocks)
    // If the receiver is a staff member of the classroom, check if they blocked the sender
    if (classroomId) {
      const staffCheck = await db.query(
        'SELECT staff_id FROM classrooms WHERE id = $1',
        [classroomId]
      );
      
      if (staffCheck.rows.length > 0 && staffCheck.rows[0].staff_id === receiverId) {
        const classroomBlock = await db.query(
          'SELECT id FROM classroom_blocks WHERE classroom_id = $1 AND blocked_user_id = $2 AND blocked_by = $3',
          [classroomId, senderId, receiverId]
        );
        
        if (classroomBlock.rows.length > 0) {
          return res.status(403).json({ error: 'You are restricted from messaging this staff member' });
        }
      }
    }

    // C. File Upload Handling
    let fileUrl = null;
    if (req.files && req.files.file) {
      const file = req.files.file;
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      fileUrl = `/uploads/dm/${fileName}`;
      
      // Ensure directory exists (createParentPath: true is set in server.js)
      await file.mv(`./uploads/dm/${fileName}`);
    }

    // D. Save Message
    const newMessage = await db.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, message, file_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [senderId, receiverId, message || '', fileUrl]
    );

    res.status(201).json(newMessage.rows[0]);
  } catch (error) {
    console.error('Error sending DM:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
};

// 3. Classroom Block (Staff action)
exports.toggleGroupBlock = async (req, res) => {
  try {
    const { classroomId, studentId } = req.body || {};
    const staffId = req.user.id;

    // Verify staff
    const classCheck = await db.query('SELECT staff_id FROM classrooms WHERE id = $1', [classroomId]);
    if (classCheck.rows.length === 0 || classCheck.rows[0].staff_id !== staffId) {
      return res.status(403).json({ error: 'Only classroom staff can block members' });
    }

    const existing = await db.query(
      'SELECT id FROM classroom_blocks WHERE classroom_id = $1 AND blocked_user_id = $2',
      [classroomId, studentId]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM classroom_blocks WHERE id = $1', [existing.rows[0].id]);
      return res.json({ message: 'User unblocked from classroom chat' });
    } else {
      await db.query(
        'INSERT INTO classroom_blocks (classroom_id, blocked_user_id, blocked_by) VALUES ($1, $2, $3)',
        [classroomId, studentId, staffId]
      );
      return res.json({ message: 'User blocked from classroom chat' });
    }
  } catch (error) {
    console.error('Error toggling classroom block:', error);
    res.status(500).json({ error: 'Server error toggling block' });
  }
};

// 4. Get Classroom Block List
exports.getClassroomBlocks = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const blocks = await db.query('SELECT blocked_user_id FROM classroom_blocks WHERE classroom_id = $1', [classroomId]);
    res.json(blocks.rows.map(r => r.blocked_user_id));
  } catch (error) {
    console.error('Error fetching classroom blocks:', error);
    res.status(500).json({ error: 'Server error fetching blocks' });
  }
};
