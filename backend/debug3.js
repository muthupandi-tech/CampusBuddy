const db = require('./config/db');

async function testInsert() {
  try {
    const title = 'Test Resource';
    const file_url = '/uploads/test.pdf';
    const subject_id = '1'; 
    // Wait, let's get a real subject id
    const sub = await db.query('SELECT id FROM subjects LIMIT 1');
    const s_id = sub.rows[0].id;

    const user = await db.query("SELECT id FROM users WHERE role='staff' LIMIT 1");
    const u_id = user.rows[0].id;

    console.log("Inserting with subject_id:", s_id, "uploaded_by:", u_id);

    const resourceDb = await db.query(
      `INSERT INTO resources (title, file_url, subject_id, uploaded_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, file_url, s_id, u_id]
    );

    console.log("Success:", resourceDb.rows[0]);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}
testInsert();
