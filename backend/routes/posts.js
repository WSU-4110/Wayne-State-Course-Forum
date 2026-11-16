// backend/routes/post.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // connects to backend/db.js

function parseCourseCode(courseCode) {
  if (!courseCode) return null;
  const clean = courseCode.replace(/\s+/g, "");
  const match = clean.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  return { subject: match[1].toUpperCase(), courseNumber: match[2] };
}


//GET /recent-courses
router.get("/recent-courses", async(req, res) => {
  try {
    const query = `
    SELECT 
      recent.subject,
      recent.course_number,
      recent.course_name,
      recent.title,
      recent.content,
      recent.created_at
    FROM (
      SELECT DISTINCT ON (p.course_id)
        c.subject,
        c.course_number,
           c.course_name,
           p.title,
           p.content,
           p.created_at,
           p.post_id
         FROM posts p
         JOIN courses c ON p.course_id = c.course_id
         ORDER BY p.course_id, p.created_at DESC, p.post_id DESC
       ) AS recent
       ORDER BY recent.created_at DESC, recent.post_id DESC
       LIMIT 3
     `;
     
     const result = await db.query(query);
     res.status(200).json(result.rows);
  }
  catch(error) { 
    console.error("Error fetching courses: ", error); 
    res.status(500).json({
      error: "Failed to retrieve recently active courses"
    });
  }
})

// GET /posts?course=CSC+4110
router.get("/posts", async (req, res) => {
  const courseCode = req.query.course;
  const parsed = parseCourseCode(courseCode);

  if (!parsed) {
    return res.status(400).json({ error: "A valid course query parameter is required." });
  }

  try {
    const query = `
      SELECT
        p.post_id,
        p.user_id,
        p.title,
        p.content,
        p.tag,
        p.created_at,
        p.updated_at,
        u.email AS author_email
      FROM posts p
      JOIN courses c ON p.course_id = c.course_id
      JOIN users u ON p.user_id = u.user_id
      WHERE c.subject = $1 AND c.course_number = $2
      ORDER BY p.created_at DESC;
    `;
    const result = await db.query(query, [parsed.subject, parsed.courseNumber]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST /posts
router.post("/posts", async (req, res) => {
  const { title, content, tag, courseCode } = req.body;
  const userId = req.session.userId;
  const parsed = parseCourseCode(courseCode);

  // Only logged-in users can create posts
if (!userId) {
  return res.status(401).json({
    error: "You must be logged in to create a post."
  });
}

  if (!parsed) {
    return res.status(400).json({ error: "A valid course code is required." });
  }

  if (!title || !content || !tag) {
  return res.status(400).json({
    error: "Title, content, and tag are required."
  });
}

  try {
    const courseLookup = await db.query(
      "SELECT course_id FROM courses WHERE subject = $1 AND course_number = $2",
      [parsed.subject, parsed.courseNumber]
    );

    if (courseLookup.rows.length === 0) {
      return res.status(404).json({ error: "Course not found." });
    }

    const courseId = courseLookup.rows[0].course_id;

    const insertQuery = `
      INSERT INTO posts (title, content, tag, course_id, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await db.query(insertQuery, [title, content, tag, courseId, userId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;

// PATCH /posts/:id
router.patch("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  const { title, content, tag } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: "You must be logged in to edit a post." });
  }

  if (!title?.trim() || !content?.trim() || !tag?.trim()) {
    return res.status(400).json({ error: "Title, content, and tag are required." });
  }

  try {
    const updateQuery = `
      UPDATE posts
      SET title = $1, content = $2, tag = $3, updated_at = CURRENT_TIMESTAMP
      WHERE post_id = $4 AND user_id = $5
      RETURNING *;
    `;

    const result = await db.query(updateQuery, [
      title.trim(),
      content.trim(),
      tag.trim(),
      postId,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found or you do not have permission to edit it." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /api/posts/:id — Delete a post (and cascade-delete its comments)
router.delete('/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    // Verify post exists and belongs to the logged-in user
    const check = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
    res.status(200).json({ message: 'Post deleted', id: postId });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Server error while deleting post' });
  }
});

// GET /api/posts/:id/comments — Fetch all comments for a post
router.get('/:id/comments', async (req, res) => {
  const postId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.user_id, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: 'Server error while loading comments' });
  }
});

// POST /api/posts/:id/comments — Create a new comment on a post
router.post('/:id/comments', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  try {
    const insertResult = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, content, created_at`,
      [postId, userId, content.trim()]
    );

    // Fetch username so the frontend can immediately render the new comment
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const newComment = {
      ...insertResult.rows[0],
      username: userResult.rows[0]?.username || 'Unknown'
    };

    res.status(201).json(newComment);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Post no longer exists' });
    }
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Server error while posting comment' });
  }
});