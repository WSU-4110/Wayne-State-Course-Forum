const path = require("path");
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
const postRoutes = require('./routes/posts');

app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);

// front end files
app.use(express.static(
    path.join(__dirname, "../frontend")
));

app.use(express.static(
    path.join(__dirname, "../frontend/pages")
));

// index home
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend/pages/index.html")
    );
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});