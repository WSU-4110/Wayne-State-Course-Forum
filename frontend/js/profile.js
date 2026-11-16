

const API_URL = "https://wayne-state-course-forum.onrender.com";

// load the students profile
async function loadProfile(userId) {
    const response = await fetch(
    `${API_URL}/api/profile/${encodeURIComponent(userId)}`, // gets the id from url
    {
        credentials: "include"
    }
    );

    if (!response.ok) {
        throw new Error("Could not retrieve profile.");
    }
    const data = await response.json();
    return data.profile;
}

// display the students basic info
function displayBasicInfo(profile) {
    document.getElementById("profileEmail").textContent = profile.email;
    document.getElementById("major").textContent = profile.major || "Not provided";
    document.getElementById("year").textContent = profile.year || "Not provided";
    document.getElementById("studentBio").textContent = profile.bio || "This student has not added a bio yet.";
}

// display their post history
function displayPosts(posts) {
    const postList = document.getElementById("postList");
    postList.innerHTML = "";

    if (!posts || posts.length === 0) {
        postList.textContent =
            "This student has not made any posts yet.";
        return;
    }

    posts.forEach(post => {
        const postItem = document.createElement("li");
        postItem.classList.add("profile-post");

        // post title
        const title = document.createElement("h3");
        title.textContent = post.title;

        // post content
        const content = document.createElement("p");
        content.textContent = post.content;

        // additional post information
        const metadata = document.createElement("div");
        metadata.classList.add("post-metadata");

        // course
        const course = document.createElement("span");
        course.textContent = post.subject && post.course_number
            ? `${post.subject} ${post.course_number}`
            : "General Discussion";

        // date
        const date = document.createElement("span");
        date.textContent = post.created_at
            ? new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            })
            : "Date unavailable";

        // category
        const category = document.createElement("span");
        category.textContent = post.tag || "Uncategorized";

        // add metadata to its container
        metadata.appendChild(course);
        metadata.appendChild(date);
        metadata.appendChild(category);

        // add everything to the post
        postItem.appendChild(title);
        postItem.appendChild(content);
        postItem.appendChild(metadata);

        postList.appendChild(postItem);
    });
}

// display a list of courses
/* takes a list of courses and displayes then in a specific container*/
function displayCourses(courses, container) {
    container.innerHTML = "";

    // make sure course exists
    if (courses.length === 0) {
        container.textContent = "No courses to display.";
        return;
    }

    courses.forEach(enrollment => {
        const course = document.createElement("li");
        course.classList.add("profile-course");

        const name = document.createElement("strong");
        name.textContent =
            `${enrollment.subject} ${enrollment.course_number}`;

        const details = document.createElement("p");
        details.textContent =
            `${enrollment.course_name} — ${enrollment.semester} ${enrollment.year}`;

        course.appendChild(name);
        course.appendChild(details);

        container.appendChild(course);
    });
}


// display current and past enrollments
function displayEnrollments(enrollments) {
    const currentList = document.getElementById("currentEnrollmentList");
    const pastList = document.getElementById("pastEnrollmentList");
    const toggleButton = document.getElementById("togglePastEnrollments");

    currentList.innerHTML = "";
    pastList.innerHTML = "";
    pastList.hidden = true;

    // make sure that student wants them shown
    if (!enrollments) {
        currentList.textContent =
            "Enrollments are not publicly available.";

        toggleButton.closest(".past-enrollments").hidden = true;
        return;
    }

    // seperate them
    const currentCourses = enrollments.filter(
        enrollment => enrollment.status === "Current"
    );

    const pastCourses = enrollments.filter(
        enrollment => enrollment.status === "Past"
    );

    displayCourses(currentCourses, currentList);
    displayCourses(pastCourses, pastList);

    toggleButton.hidden = pastCourses.length === 0;
}

// handle the past enrollment toggle
function setupEnrollmentToggle() {
    const pastList = document.getElementById("pastEnrollmentList");
    const toggleButton = document.getElementById("togglePastEnrollments");

    toggleButton.addEventListener("click", () => {
        pastList.hidden = !pastList.hidden;

        toggleButton.textContent = pastList.hidden
            ? "Show Past Enrollments"
            : "Hide Past Enrollments";

        toggleButton.setAttribute(
            "aria-expanded",
            String(!pastList.hidden)
        );
    });
}

// checks if the logged-in student is the one viewing the profile
async function checkProfileOwner(profileUserId) {
    const manageButton = document.getElementById("manageProfileBtn");

    // hide the button by default
    manageButton.hidden = true;

    try {
        const response = await fetch(
            `${API_URL}/api/auth/me`,
            { credentials: "include" }
        );
        if (!response.ok) {
            return;
        }
        const data = await response.json();

        // only show the button if the logged-in user owns this profile
        if (data.user &&
            Number(data.user.user_id) === Number(profileUserId)) {
            manageButton.hidden = false;
        }
    } catch (error) {
        console.error("Error checking profile ownership:", error);
    }
}

// initialize the profile page
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");

    if (!userId) {
        document.getElementById("profileEmail").textContent =
            "Student not specified";
        return;
    }

    setupEnrollmentToggle();

    try {
        const profile = await loadProfile(userId);

        displayBasicInfo(profile);
        displayPosts(profile.posts);
        displayEnrollments(profile.enrollments);
        await checkProfileOwner(userId);

    } catch (error) {
        console.error("Error loading profile:", error);

        document.getElementById("profileEmail").textContent =
            "Unable to load student";
    }
});
