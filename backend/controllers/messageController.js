const db = require('../config/db');

// @route   GET /api/messages/:userId
// @desc    Get chat history with a specific user
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params; // The other user in the chat
    const currentUserId = req.user.id;

    const messagesResult = await db.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY timestamp ASC`,
      [currentUserId, userId]
    );

    res.json(messagesResult.rows);
  } catch (error) {
    console.error('Get messages error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Note: Saving new messages is handled via Socket.io mostly, 
// but we can also expose a REST endpoint if needed.
const saveMessage = async (req, res) => {
  try {
    const { receiver_id, message } = req.body;
    const sender_id = req.user.id;

    const newMsg = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [sender_id, receiver_id, message]
    );

    res.status(201).json(newMsg.rows[0]);
  } catch (error) {
    console.error('Save message error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getMessages, saveMessage };
