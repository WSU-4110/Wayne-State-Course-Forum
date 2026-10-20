
const express = require("express"); // import express
const router = express.Router(); // express router for organization

const { validateCourses } = require("../scrapeCourses"); // importing validation functions from scrapeCourses.js
const db = require("../db"); // Neon database connection

////GET request to /validate endpoint to use this function 
router.get("/validate", async (req, res) => {
    const { subject, number } = req.query; // get subject and course number from database

    // make sure inputs given
    if (typeof subject !== "string" ||
        typeof number !== "string") {
        return res.status(400).json({
            error: "Subject and course number are required"
        });
    }

    const subjectAbbr = subject.trim().toUpperCase();
    const courseNumber = number.trim();
    //clean inputs

    //only allow certain subjects THIS IS TEMPORARY JUST FOR SPRINT 1
    const allowedSubjects = ["CSC", "MAT", "BIO", "CHM", "PHY"];

    if (!allowedSubjects.includes(subjectAbbr) ||
        !/^\d{4}$/.test(courseNumber)) {
        return res.status(400).json({
            error: "Invalid subject or course number format"
        });
    }

    //call validation function js waites till finished
    try {
        const isValid = await validateCourses(
            subjectAbbr, // call function with these two parameters
            courseNumber
        );

        res.json({
            subject: subjectAbbr,
            courseNumber: courseNumber,
            valid: isValid // this basically says true and false
        });

    } catch (error) {
        console.error("Course validation failed:", error);

        res.status(500).json({
            error: "Unable to validate course" // happens if there is an error. neon is down. wayne state catalog is down etc;
        });
    }
});

router.get("/:code", async (req, res) => {
    try{
        const courseCode = req.params.code.trim();
        const parts = courseCode.split("/\s+/");
        const subject = parts[0];
        const courseNumber = parts.slice(1).join(" ");

        const query = `
            SELECT course_id, subject, course_number, course_name, credits
            FROM courses
            WHERE UPPER(subject) = UPPER($1) AND UPPER(course_number) = UPPER($2)
            LIMIT 1
        `;
        const result = await db.query(query, [subject, courseNumber]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Failed to fetch course details:", error);
        res.status(500).json({ error: "Failed to fetch course details" });
    }
});
module.exports = router;
