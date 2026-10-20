
require('dotenv').config();

// importing express and creating an instance called app
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const cors = require('cors'); // for middleware
const session = require('express-session'); // for login sessions

// middleware
app.use(cors({
    origin: "http://localhost:5500",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});