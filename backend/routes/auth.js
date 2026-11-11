const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt'); // for password hashes
const crypto = require('crypto'); // for verification

async function sendVerificationEmail(email, code) {
    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: "WSU Course Forum",
                    email: process.env.EMAIL_SENDER
                },
                to: [{ email: email }],
                subject: "Verify Your WSU Course Forum Account",
                textContent: `Your verification code is ${code}. It expires in 10 minutes.`
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Brevo email failed: ${error}`);
    }

    console.log("Verification email request accepted by Brevo:", email);
}

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

    try{
        // password hashing
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // generate and hash the verification code
        const verificationCode = crypto.randomInt(100000, 1000000).toString();
        const verificationCodeHash = await bcrypt.hash(verificationCode, saltRounds);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        
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
            // insert verification code into database
        await pool.query(
            `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
            VALUES ($1, $2, $3)`,
            [
                newUser.rows[0].user_id,
                verificationCodeHash,
                expiresAt
            ]
        );
        try {
            await sendVerificationEmail(
                newUser.rows[0].email,
                verificationCode
            );
        } catch (error) {
            // Remove the newly created account if sending fails
            await pool.query(
                'DELETE FROM users WHERE user_id = $1',
                [newUser.rows[0].user_id]
            );

            throw error;
        }

        return res.status(201).json({
            message: "Account created. Please verify your email. ",
            email: newUser.rows[0].email
        });
   } catch (error) {
        console.error("Signup error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "An error occurred during signup."
        });
   }
})


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
            `SELECT user_id, email, password_hash, email_verified
            FROM users
            WHERE LOWER(email) = LOWER($1)`,
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

        // check verfication
        if (!user.email_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                requiresVerification: true,
                email: user.email
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

/*------------------ VERIFY EMAIL ROUTE  ------------------*/
router.post("/verify-email", async(req, res) =>{
    const {email, code} = req.body;

    // check that email email and code were provided
    if(
        typeof email !== 'string' ||
        typeof code !== 'string' ||
        !/^\d{6}$/.test(code)
    ){
        return res.status(400).json({
            message: "A valid email and 6 digit code are required"
        });
    }

    try{
        const result = await pool.query(
            `SELECT u.user_id, v.code_hash, v.expires_at, v.attempts
            FROM users u 
            JOIN email_verification_codes v on u.user_id = v.user_id
            WHERE lower(u.email)= lower($1)
                AND u.email_verified = FALSE`,
            [email]
        );

        if (result.rows.length === 0){
            return res.status(400).json({
                message: "No pending verification found for this email"
            });
        }
        const verification = result.rows[0];

        //check if the code expired
        if (new Date() > new Date(verification.expires_at)){
            return res.status(400).json({
                message: "Verification code has expired"
            });
        }

        // 5 attempts only
        if (verification.attempts >= 5) {
            return res.status(429).json({
                message: "Too many attempts. Please request a new code."
            });
        }

        // compare the code the user added
        const isValid = await bcrypt.compare(code, verification.code_hash);
        if (!isValid){
            await pool.query(
                `UPDATE email_verification_codes
                SET attempts = attempts +1
                WHERE user_id = $1`,
                [verification.user_id]
            );
            return res.status(400).json({
                message: "Incorrect verification code"
            });
        }
        // mark the account as verfied
        await pool.query(
            `UPDATE users
            SET email_verified = TRUE
            WHERE user_id = $1`,
            [verification.user_id]
        );

        // delete the code after succesful user
        await pool.query(
            `DELETE FROM email_verification_codes
            WHERE user_id = $1`,
            [verification.user_id]
        );

        
        return res.status(200).json({
            message: "Email verified sucessfully. You can log in now"
        });

    } catch(error){
        console.error("Email verification error: ", error);
        return res.status(500).json({
            message: "An error occured during email verification"
        });
    }
})

/*--------------  RESEND VERIFICATION CODE ROUTE  -------------*/
router.post("/resend-verification", async(req, res) =>{

    const email = req.body.email?.trim().toLowerCase();
    if (!email || !email.endsWith("@wayne.edu")){
        return res.status(400).json({
            message: "Please return a valid WSU email address."
        });
    }
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.email_verified, v.created_at
             FROM users u
             LEFT JOIN email_verification_codes v
               ON u.user_id = v.user_id
             WHERE LOWER(u.email) = $1`,
            [email]
        );

        if (result.rows.length === 0 ||
            result.rows[0].email_verified) {
            return res.json({ 
                message: "If this account requires verification, a new code will be sent." 
            });
        }
        const user = result.rows[0];

        // 60 second cooldown
        if (user.created_at){
            const elapsed = Date.now()-new Date(user.created_at).getTime();
            if (elapsed < 60000){
                return res.status(429).json({
                    message: "Please wait before requesting another code.",
                    retryAfter: Math.ceil((60000 - elapsed) / 1000)
                });
            }
        }
        // generate and hash the verification code
        const saltRounds = 12;
        const verificationCode = crypto.randomInt(100000, 1000000).toString();
        const verificationCodeHash = await bcrypt.hash(verificationCode, saltRounds);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            `INSERT INTO email_verification_codes (user_id, code_hash, expires_at, attempts, created_at)
            VALUES ($1, $2, $3, 0, NOW())
                         ON CONFLICT (user_id)
             DO UPDATE SET
                code_hash = EXCLUDED.code_hash,
                expires_at = EXCLUDED.expires_at,
                attempts = 0,
                created_at = NOW()`,
            [user.user_id, verificationCodeHash, expiresAt],
        );
        
        await sendVerificationEmail(email, verificationCode);

        return res.json({
            message: "A new code will be sent."
        });
    }catch(error){
        console.error("Resend verification error:", error);
        return res.status(500).json({
            message: "Unable to resend verification code."
        });
    }

})
module.exports = router;