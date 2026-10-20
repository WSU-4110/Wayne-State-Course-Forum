require('dotenv').config();

// importing express and creating an instance called app
const express = require("express");
const cors = require("cors"); // for middleware
const session = require("express-session");
const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// middleware
app.set("trust proxy", 1); // this just trusts Render

//cors middleware
app.use(cors({
    origin: [ "http://localhost:5500",
    "https://wsu-4110.github.io"],
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
        secure: process.env.NODE_ENV === "production", // for render
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", //dev and deployment
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});