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

    // Send response immediately — email is fire-and-forget
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: result.rows[0] });

    // Send feedback email in the background (never affects the response)
    try {
      const userResult = await db.query('SELECT name, email, role FROM users WHERE id = $1', [user_id]);
      const feedbackUser = userResult.rows[0];
      const transporter = require('../config/mailer');

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'campusbuddy.official.edu@gmail.com',
        subject: `CampusBuddy Feedback [${category}] from ${feedbackUser.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #f9fafb; padding: 24px; border-radius: 12px;">
            <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">📬 New Feedback Received</h2>
            <div style="background-color: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
              <p style="margin: 4px 0;"><strong>From:</strong> ${feedbackUser.name} (${feedbackUser.email})</p>
              <p style="margin: 4px 0;"><strong>Role:</strong> <span style="text-transform: capitalize;">${feedbackUser.role}</span></p>
              <p style="margin: 4px 0;"><strong>Category:</strong> ${category}</p>
            </div>
            <div style="background-color: #e0e7ff; padding: 16px; border-radius: 8px; color: #3730a3; white-space: pre-wrap;">
              ${message}
            </div>
            <p style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 11px;">Automated message from CampusBuddy</p>
          </div>
        `,
      });
      console.log('Feedback email sent successfully.');
    } catch (emailErr) {
      console.error('Feedback email failed (non-blocking):', emailErr.message);
    }
  } catch (error) {
    console.error('Feedback submission error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { submitFeedback };
