
const express = require('express');
const router = express.Router();
const db = require('../db'); 

const { 
    createBasicProfile,
    addPosts,
    addComments,
    addEnrollments,
} = require ("../profile");

// retrieve a students profile
router.get("/userId", async(requestAnimationFrame, res) => {
    try {
        const userId = requestAnimationFrame.params.userId;
        
        // retrieve info
        const userResult = await pool.query(
            "SELECT user_id, email, major, year FROM users WHERE user_id = $1",
            [userId]
        );

        if (userResult.rows.length === 0){
            return res.status(404).json({
                error: "User not found"
            });
        }

        let profile = createBasicProfile(userResult.rows[0]);

        // retrieve and add posts
  
        const postsResult = await pool.query(
            "SELECT * FROM posts WHERE user_id = $1",
            [userId]
        );
        profile = addPosts(profile, postsResult.rows);
        
        // retrieve and add comments
        const commentsResult = await pool.query(
            "SELECT * FROM comments WHERE user_id = $1",
            [userId]
        );

        profile = withComments(profile, commentsResult.rows);

        res.json(profile);

        } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to retrieve profile"
        });
    }
});