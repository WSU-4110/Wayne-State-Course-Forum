ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS show_enrollments BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS show_posts BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS user_enrollments (
    enrollment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL
        REFERENCES courses(course_id) ON DELETE CASCADE,
    semester VARCHAR(20) NOT NULL
        CHECK (semester IN ('Fall', 'Winter', 'Spring/Summer')),
    year INTEGER NOT NULL,
    status VARCHAR(10) NOT NULL
        CHECK (status IN ('Current', 'Past')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id, semester, year)
);

