const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt'); // for password hashes

/*-------------------- SIGNUP ROUTE  --------------------*/
router.post('/signup', async (req, res) => {

    const { email, password, year, major } = req.body;

    // check if required info was received
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    // validate WSU email
    if (
        typeof email !== 'string' ||
        !email.toLowerCase().endsWith('@wayne.edu') ||
        email.split('@').length !== 2 ||
        email.startsWith('@')
    ) {
        return res.status(400).json({
            message: "A valid Wayne State email is required."
        });
    }

    // validate password again here incase front end is bypassed
    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long."
        });
    }
    // validate years
    const validYears = [
        "Freshman",
        "Sophomore",
        "Junior",
        "Senior",
        "Graduate"
    ];
    if (!validYears.includes(year)) {
        return res.status(400).json({
            message: "Please select a valid year."
        });
    }

    // validate major
    if (typeof major !== "string" || !major.trim() || major.trim().length > 100) {
        return res.status(400).json({
            message: "Please enter a valid major (100 characters maximum)."
        });
    }   

    // check if the email alread exists in database
    try {
        const existingUser = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

    } catch (error) {
        console.error("Database error:", error);

        return res.status(500).json({
            message: "An error occurred while checking the email."
    });

    }
    // password hashing
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // insert new user into database
    const newUser = await pool.query(
        `INSERT INTO users (email, password_hash, year, major)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, email, year, major`,
        [
            email.toLowerCase(), 
            passwordHash,
            year,
            major.trim()
        ]
    );

    // automattically log the new user in & save the session
    req.session.userId = newUser.rows[0].user_id;
    req.session.save((err) => {
        if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({
                message: "Account created, but automatic login failed."
            });
        }   

        // session saved successfully
        return res.status(201).json({
            message: "Account successfully created",
            user: newUser.rows[0]
        });
    });
});


/*-------------------- LOGIN ROUTE  --------------------*/
router.post('/login', async(req, res) =>{
    const { email, password } = req.body;

    // check if required info was received
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    try {
        // look in users table for info
        const result = await pool.query(
            'SELECT user_id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        //no matching users
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        const user = result.rows[0];

        //check password        
        const passwordMatched = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatched){
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // create the login session and store the ID. browser will get a session cookie
        req.session.userId = user.user_id;

        // save the session
        req.session.save((error) => {
            if (error) {
                console.error("Session error:", error);
                return res.status(500).json({
                    message: "Unable to create login session."
                });
            }

            return res.status(200).json({
                message: "Login successful!",
                user: {
                    user_id: user.user_id,
                    email: user.email
            }
        });
    });

    } catch (error) {
        console.error("Login database error:", error);

        return res.status(500).json({
            message: "An error occurred while checking the email in login."
        });
    }
});

/*--------------------  CHECK LOGIN STATUS ROUTE  --------------------*/
/*--------- this route is to keep user signed in across pages --------*/
router.get("/me", async (req, res) => {
    //checking for user id to see if logged out
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    try {
        // grab user information
        const result = await pool.query(
            `SELECT user_id, email, year, major
             FROM users
             WHERE user_id = $1`,
            [req.session.userId]
        );

        // checks if user doesnt exit
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "User not found."
            });
        }

        // return the user info for front end
        return res.status(200).json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Session check error:", error);
        return res.status(500).json({
            message: "Could not check login status."
        });
    }
});

/*--------------------  LOGOUT ROUTE  --------------------*/
router.post("/logout", (req, res) => {

    // ends the session for the user logging out
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({
                message: "Could not log out."
            });
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({
            message: "Logged out successfully."
        });
    });
});

module.exports = router;