# Installation Guide

How to set up and run the Wayne State Course Forum on your own computer.

## Live version (no install needed)

- Website: https://wsu-4110.github.io/Wayne-State-Course-Forum/frontend/pages/index.html
- Backend API: https://wayne-state-course-forum.onrender.com/

Note: the backend is on Render's free plan, so the first request after a while can take up to a minute while it wakes up.

## System requirements

- Windows, macOS, or Linux
- [Node.js](https://nodejs.org/) version 18 or newer (npm comes with it)
- [Git](https://git-scm.com/)
- A PostgreSQL database. The team uses a hosted one on [Neon](https://neon.tech/). A local PostgreSQL install also works.
- A web browser (Chrome, Firefox, Edge, or Safari)
- A code editor. We use VS Code with the Live Server extension.
- A [Brevo](https://www.brevo.com/) API key, used to send the email verification codes

## 1. Get the code

```bash
git clone https://github.com/WSU-4110/Wayne-State-Course-Forum.git
cd Wayne-State-Course-Forum
```

## 2. Install the backend packages

```bash
cd backend
npm install
```

This installs everything listed in `backend/package.json` (Express, pg, bcrypt, express-session, axios, cheerio, and others).

## 3. Set up the database

Run these SQL files on your PostgreSQL database, in this order. On Neon you can paste them into the SQL Editor.

1. `database/schema.sql` creates the tables (users, courses, posts, comments, email verification codes).
2. `database/email_verification.sql` adds the email verified column to users.
3. `database/profile.sql` adds the profile columns (bio, privacy settings).

## 4. Create the `.env` file

In the `backend` folder, make a file named `.env` with these lines:

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=any_long_random_text
API_KEY=your_brevo_api_key
EMAIL_SENDER=the_email_address_that_sends_codes
PORT=3000
```

- `DATABASE_URL` is the connection string from Neon (or your local PostgreSQL).
- `SESSION_SECRET` is used to keep login sessions safe. Use any long random text.
- `API_KEY` and `EMAIL_SENDER` are for sending verification emails through Brevo.

The `.env` file is in `.gitignore`. Never commit it or post these values in a chat. Ask a teammate privately for the team's values.

## 5. Start the backend

```bash
npm start
```

You should see `Server running on port 3000`. For development, `npm run dev` restarts the server on every save (it uses nodemon).

To check the database connection, run `node testDB.js` from the `backend` folder.

## 6. Open the frontend

The frontend is plain HTML, CSS, and JavaScript, so there is no build step.

1. Open the project folder in VS Code.
2. Right click `frontend/pages/index.html` and pick **Open with Live Server**.
3. It opens at `http://localhost:5500`. This address is already allowed by the backend's CORS settings.

Note: right now the JavaScript files in `frontend/js/` call the live Render backend (`https://wayne-state-course-forum.onrender.com`). To test your local backend instead, change that address to `http://localhost:3000` in the file you are testing, and change it back before you commit.

## Deployment

- Frontend: GitHub Pages serves the `main` branch automatically.
- Backend: Render runs `npm start` in the `backend` folder, with the same environment variables set in the Render dashboard (plus `NODE_ENV=production`).
- Database: Neon (PostgreSQL).

## Common problems

- **"Cannot connect to database"**: check `DATABASE_URL` in `.env`, then run `node testDB.js`.
- **Login does not stay logged in locally**: open the site from `http://localhost:5500` (Live Server), not by double clicking the HTML file.
- **No verification email**: it can take a minute. Check your junk folder, or use the resend option.
