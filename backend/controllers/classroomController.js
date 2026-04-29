const db = require('../config/db');
const { createNotification } = require('./notificationController');

// 1. Create Classroom (Staff only)
exports.createClassroom = async (req, res) => {
  try {
    const { name, subject, department, year } = req.body || {};
    const staff_id = req.user.id;

    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only staff can create classrooms' });
    }

    const newClassroom = await db.query(
      `INSERT INTO classrooms (name, subject, staff_id, department, year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, subject, staff_id, department, year]
    );

    // Add staff as a member automatically
    await db.query(
      `INSERT INTO classroom_members (classroom_id, user_id, role, status)
       VALUES ($1, $2, $3, $4)`,
      [newClassroom.rows[0].id, staff_id, 'staff', 'approved']
    );

    res.status(201).json(newClassroom.rows[0]);
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ error: 'Server error creating classroom' });
  }
};

// 2. Fetch Classrooms (filtered optionally by dept/year, or get all joined classrooms)
exports.getClassrooms = async (req, res) => {
  try {
    const { filter } = req.query; // 'my' or 'all'
    const userId = req.user.id;

    if (filter === 'my') {
      // Get classrooms where user is an approved member
      const myClassrooms = await db.query(
        `SELECT c.*, cm.role as member_role 
         FROM classrooms c
         JOIN classroom_members cm ON c.id = cm.classroom_id
         WHERE cm.user_id = $1 AND cm.status = 'approved'
         ORDER BY c.created_at DESC`,
        [userId]
      );
      return res.json(myClassrooms.rows);
    } else {
      // Get all classrooms, but indicate if user has joined/pending
      // Staff/admin might want to see all
      const allClassrooms = await db.query(
        `SELECT c.*, u.name as staff_name, 
         (SELECT status FROM classroom_members WHERE classroom_id = c.id AND user_id = $1 LIMIT 1) as my_status
         FROM classrooms c
         JOIN users u ON c.staff_id = u.id
         ORDER BY c.created_at DESC`,
        [userId]
      );
      return res.json(allClassrooms.rows);
    }
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ error: 'Server error fetching classrooms' });
  }
};

// 3. Get Classroom Details
exports.getClassroomDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if member
    const memberCheck = await db.query(
      'SELECT status, role FROM classroom_members WHERE classroom_id = $1 AND user_id = $2',
      [id, userId]
    );

    const isMember = memberCheck.rows.length > 0 && memberCheck.rows[0].status === 'approved';
    const isStaff = memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'staff';

    const classroom = await db.query(
      `SELECT c.*, u.name as staff_name 
       FROM classrooms c JOIN users u ON c.staff_id = u.id WHERE c.id = $1`,
      [id]
    );

    if (classroom.rows.length === 0) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    res.json({
      ...classroom.rows[0],
      isMember,
      isStaff,
      myStatus: memberCheck.rows.length > 0 ? memberCheck.rows[0].status : null
    });
  } catch (error) {
    console.error('Error fetching classroom details:', error);
    res.status(500).json({ error: 'Server error fetching classroom details' });
  }
};

// 4. Request Join
exports.requestJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingRequest = await db.query(
      'SELECT * FROM classroom_members WHERE classroom_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Request already exists or you are already a member' });
    }

    await db.query(
      `INSERT INTO classroom_members (classroom_id, user_id, role, status)
       VALUES ($1, $2, $3, $4)`,
      [id, userId, 'student', 'pending']
    );

    // Notify staff
    const classroom = await db.query('SELECT staff_id, name FROM classrooms WHERE id = $1', [id]);
    if (classroom.rows.length > 0) {
      await createNotification(
        classroom.rows[0].staff_id, 
        `${req.user.name} requested to join ${classroom.rows[0].name}`, 
        'classroom'
      );
    }

    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Error requesting join:', error);
    res.status(500).json({ error: 'Server error requesting to join' });
  }
};

// 5. Get Members
exports.getMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const members = await db.query(
      `SELECT cm.id as membership_id, cm.role, cm.status, u.id, u.name, u.avatar_url, u.email
       FROM classroom_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.classroom_id = $1`,
      [id]
    );

    res.json(members.rows);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Server error fetching members' });
  }
};

// 6. Approve / Reject Request
exports.handleRequest = async (req, res) => {
  try {
    const { id } = req.params; // classroom id
    const { userId, status } = req.body || {}; // status: 'approved' or 'rejected'
    const staffId = req.user.id;

    // Verify staff
    const classCheck = await db.query('SELECT staff_id, name FROM classrooms WHERE id = $1', [id]);
    if (classCheck.rows.length === 0 || classCheck.rows[0].staff_id !== staffId) {
      return res.status(403).json({ error: 'Only classroom staff can manage requests' });
    }

    if (status === 'rejected') {
      await db.query('DELETE FROM classroom_members WHERE classroom_id = $1 AND user_id = $2', [id, userId]);
      await createNotification(userId, `Your request to join ${classCheck.rows[0].name} was rejected.`, 'classroom');
      return res.json({ message: 'Request rejected' });
    } else {
      await db.query(
        'UPDATE classroom_members SET status = $1 WHERE classroom_id = $2 AND user_id = $3',
        [status, id, userId]
      );
      await createNotification(userId, `Your request to join ${classCheck.rows[0].name} was approved!`, 'classroom');
      return res.json({ message: 'Request approved' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Server error handling request' });
  }
};

// 7. Remove Member
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const staffId = req.user.id;

    const classCheck = await db.query('SELECT staff_id FROM classrooms WHERE id = $1', [id]);
    if (classCheck.rows.length === 0 || classCheck.rows[0].staff_id !== staffId) {
      return res.status(403).json({ error: 'Only classroom staff can remove members' });
    }

    if (userId === staffId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    await db.query('DELETE FROM classroom_members WHERE classroom_id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Server error removing member' });
  }
};

// 8. Add Resource
exports.addResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body || {};
    const staffId = req.user.id;

    const classCheck = await db.query('SELECT staff_id FROM classrooms WHERE id = $1', [id]);
    if (classCheck.rows.length === 0 || classCheck.rows[0].staff_id !== staffId) {
      return res.status(403).json({ error: 'Only classroom staff can add resources' });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `/uploads/resources/${fileName}`;

    file.mv(`./uploads/resources/${fileName}`, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'File upload failed' });
      }

      const resource = await db.query(
        'INSERT INTO classroom_resources (classroom_id, title, file_url) VALUES ($1, $2, $3) RETURNING *',
        [id, title || file.name, filePath]
      );

      res.json(resource.rows[0]);
    });
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ error: 'Server error adding resource' });
  }
};

// 9. Get Resources
exports.getResources = async (req, res) => {
  try {
    const { id } = req.params;
    const resources = await db.query('SELECT * FROM classroom_resources WHERE classroom_id = $1 ORDER BY created_at DESC', [id]);
    res.json(resources.rows);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Server error fetching resources' });
  }
};

// 10. Get Chat Messages
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get blocked users to filter out messages
    const blockedCheck = await db.query(
      'SELECT blocked_user_id FROM blocked_users WHERE user_id = $1',
      [userId]
    );
    const blockedIds = blockedCheck.rows.map(row => row.blocked_user_id);

    const messages = await db.query(
      `SELECT m.*, u.name as sender_name, u.avatar_url 
       FROM classroom_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.classroom_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    // Filter out blocked
    const filteredMessages = messages.rows.filter(m => !blockedIds.includes(m.sender_id));

    res.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};

// 11. Block / Unblock User
exports.toggleBlockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.body || {};
    const userId = req.user.id;

    if (userId === blockedUserId) {
       return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const existing = await db.query('SELECT id FROM blocked_users WHERE user_id = $1 AND blocked_user_id = $2', [userId, blockedUserId]);
    if (existing.rows.length > 0) {
      await db.query('DELETE FROM blocked_users WHERE id = $1', [existing.rows[0].id]);
      return res.json({ message: 'User unblocked' });
    } else {
      await db.query('INSERT INTO blocked_users (user_id, blocked_user_id) VALUES ($1, $2)', [userId, blockedUserId]);
      return res.json({ message: 'User blocked' });
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Server error blocking user' });
  }
};

// 12. Get Blocked Users
exports.getBlockedUsers = async (req, res) => {
   try {
     const userId = req.user.id;
     const blocked = await db.query('SELECT blocked_user_id FROM blocked_users WHERE user_id = $1', [userId]);
     res.json(blocked.rows.map(r => r.blocked_user_id));
   } catch(error) {
      console.error('Error getting blocked users:', error);
      res.status(500).json({ error: 'Server error fetching blocked users' });
   }
}
