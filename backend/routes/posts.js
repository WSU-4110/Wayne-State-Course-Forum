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
        p.title,
        p.content,
        p.tag,
        p.created_at,
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
  const { title, content, tag, courseCode, userId } = req.body;
  const parsed = parseCourseCode(courseCode);

  if (!parsed) {
    return res.status(400).json({ error: "A valid course code is required." });
  }

  if (!title || !content || !tag || !userId) {
    return res.status(400).json({ error: "title, content, tag, and userId are required." });
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