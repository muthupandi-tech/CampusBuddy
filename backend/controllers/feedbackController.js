const db = require('../config/db');

// @route   POST /api/feedback
// @desc    Submit user feedback
const submitFeedback = async (req, res) => {
  const { category, message } = req.body;
  const user_id = req.user.id;

  if (!category || !message) {
    return res.status(400).json({ error: 'Category and message are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO feedback (user_id, category, message) VALUES ($1, $2, $3) RETURNING *',
      [user_id, category, message]
    );

    res.status(201).json({ message: 'Feedback submitted successfully', feedback: result.rows[0] });
  } catch (error) {
    console.error('Feedback submission error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { submitFeedback };
