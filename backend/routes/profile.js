const express = require("express");
const router = express.Router();
const pool = require("../db");

const {
    createBasicStudentProfile,
    addPosts,
    addComments,
    addEnrollments
} = require("../profile_decorator");

// get profile info for the logged-in student
router.get("/manage", async (req, res) => {
    if (!req.session.userId) { //check auth
        return res.status(401).json({
            message: "Not logged in."
        });
    }
    try {
        const result = await pool.query( // get info
            `SELECT user_id, major, year, bio,
                    show_posts, show_enrollments
             FROM users
             WHERE user_id = $1`,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Error loading profile settings:", error);

        return res.status(500).json({
            message: "Could not load profile settings."
        });
    }
});

 // update the logged-in student's profile
router.put("/manage", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    const {
        major,
        year,
        bio,
        show_posts,
        show_enrollments
    } = req.body; // get info

    const validYears = [
        "Freshman",
        "Sophomore",
        "Junior",
        "Senior",
        "Graduate"
    ];

    if (
        typeof major !== "string" ||
        !major.trim() ||
        major.trim().length > 100 ||
        !validYears.includes(year) ||
        typeof bio !== "string" ||
        bio.length > 500 ||
        typeof show_posts !== "boolean" ||
        typeof show_enrollments !== "boolean"
    ) {
        return res.status(400).json({
            message: "Invalid profile information."
        });
    }

    try {
        const result = await pool.query( // update database with changes
            `UPDATE users
             SET major = $1,
                 year = $2,
                 bio = $3,
                 show_posts = $4,
                 show_enrollments = $5
             WHERE user_id = $6
             RETURNING user_id, major, year, bio,
                       show_posts, show_enrollments`,
            [
                major.trim(),
                year,
                bio.trim(),
                show_posts,
                show_enrollments,
                req.session.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully!",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating profile:", error);

        return res.status(500).json({
            message: "Could not update profile."
        });
    }
});

// retrieve all courses the logged-in student has added to their profile.
router.get("/manage/enrollments", async (req, res) => {
    if (!req.session.userId) { // check auth
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    try {
        const result = await pool.query( // get enrollments
            `SELECT
                e.enrollment_id,
                e.course_id,
                e.semester,
                e.year,
                e.status,
                c.subject,
                c.course_number,
                c.course_name
            FROM user_enrollments e
            JOIN courses c ON e.course_id = c.course_id
            WHERE e.user_id = $1
            ORDER BY e.year DESC, e.semester`,
            [req.session.userId]
        );

        return res.status(200).json({
            enrollments: result.rows
        });

    } catch (error) {
        console.error("Error loading enrollments:", error);

        return res.status(500).json({
            message: "Could not load enrollments."
        });
    }
});

// allows students to add courses
router.post("/manage/enrollments", async (req, res) => {
    if (!req.session.userId) { // check auth
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    const { course_id, semester, year, status } = req.body;

    // validate enrollment information
    const validSemesters = ["Fall", "Winter", "Spring/Summer"];
    const validStatuses = ["Current", "Past"];

    if (
        !Number.isInteger(course_id) ||
        course_id <= 0 ||
        !validSemesters.includes(semester) ||
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100 ||
        !validStatuses.includes(status)
    ) {
        return res.status(400).json({
            message: "Invalid enrollment information."
        });
    }

    try {
        // make sure the course exists
        const courseResult = await pool.query(
            `SELECT course_id
             FROM courses
             WHERE course_id = $1`,
            [course_id]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                message: "Course not found."
            });
        }

        // check whether the enrollment already exists
        const existingEnrollment = await pool.query(
            `SELECT enrollment_id
             FROM user_enrollments
             WHERE user_id = $1
               AND course_id = $2
               AND semester = $3
               AND year = $4`,
            [req.session.userId, course_id, semester, year]
        );

        if (existingEnrollment.rows.length > 0) {
            return res.status(409).json({
                message: "You already added this course for that semester."
            });
        }

        // save the enrollment
        const result = await pool.query(
            `INSERT INTO user_enrollments
                (user_id, course_id, semester, year, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING enrollment_id, course_id,
                       semester, year, status`,
            [
                req.session.userId,
                course_id,
                semester,
                year,
                status
            ]
        );

        return res.status(201).json({
            message: "Enrollment added successfully!",
            enrollment: result.rows[0]
        });

    } catch (error) {
        console.error("Error adding enrollment:", error);

        return res.status(500).json({
            message: "Could not add enrollment."
        });
    }
});

// remove an enrollement for logged-in student
router.delete("/manage/enrollments/:enrollmentId", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    const enrollmentId = Number(req.params.enrollmentId);

    if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
        return res.status(400).json({
            message: "Invalid enrollment ID."
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM user_enrollments
             WHERE enrollment_id = $1 AND user_id = $2
             RETURNING enrollment_id`,
            [enrollmentId, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Enrollment not found."
            });
        }

        return res.status(200).json({
            message: "Enrollment removed successfully."
        });

    } catch (error) {
        console.error("Error removing enrollment:", error);

        return res.status(500).json({
            message: "Could not remove enrollment."
        });
    }
});

// retrieve any student's profile
router.get ("/:userId", async (req, res) => {

    const userId = req.params.userId;

    try{
        // get the students info
        const result = await pool.query(
            `SELECT user_id, email, major, year, bio,
                show_posts, show_enrollments
            FROM users
            WHERE user_id = $1`,
            [userId]
        );

        // check if the student exists
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found."
            });
        }
        const user = result.rows[0];
        const isOwner = Number(req.session.userId) === Number(userId);

        // create the basic student profile
        let profile = createBasicStudentProfile(user);

        // get their post history
        let posts = [];

        if (isOwner || user.show_posts) {
            const postsResult = await pool.query(
                `SELECT
                    p.*,
                    c.subject,
                    c.course_number
                FROM posts p
                LEFT JOIN courses c
                    ON p.course_id = c.course_id
                WHERE p.user_id = $1
                ORDER BY p.created_at DESC`,
                [userId]
            );

            posts = postsResult.rows;
        }

        // decorate the profile with posts
        profile = addPosts(profile, posts);

        // get their comment history
        let comments = [];

        if (isOwner || user.show_posts) {
            const commentsResult = await pool.query(
                `SELECT
                    comment_id,
                    post_id,
                    content,
                    created_at
                FROM comments
                WHERE user_id = $1
                ORDER BY created_at DESC`,
                [userId]
            );

            comments = commentsResult.rows;
        }

        // decorate the profile with comments
        profile = addComments(profile, comments);

        // get student's enrollments if they choose to diplay it
        if (isOwner || user.show_enrollments) {
            const enrollmentResult = await pool.query(
                `SELECT e.enrollment_id, e.semester, e.year,
                        e.status, c.course_id, c.subject,
                        c.course_number, c.course_name
                 FROM user_enrollments e
                 JOIN courses c ON e.course_id = c.course_id
                 WHERE e.user_id = $1
                 ORDER BY e.year DESC`,
                [userId]
            );

            // decorate with enrollments
            profile = addEnrollments(profile, enrollmentResult.rows);
        }

        // return final profile
        return res.status(200).json({
            profile: profile
        });

    } catch (error){
        console.error("Profile error:", error);

        return res.status(500).json({
            message: "Could not retrieve student profile."
        });
    }
});

module.exports = router;