const API_URL = "https://wayne-state-course-forum.onrender.com";

// load the logged-in student's profile settings
async function loadProfileSettings() {
    try {
        const response = await fetch(`${API_URL}/api/profile/manage`, {
            credentials: "include"
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load profile settings.");
        }

        const data = await response.json();
        const user = data.user;

        // student info
        document.getElementById("major").value = user.major || "";
        document.getElementById("year").value = user.year || "Freshman";
        document.getElementById("bio").value = user.bio || "";

        // privacy settings
        document.getElementById("showPosts").checked = user.show_posts;
        document.getElementById("showEnrollments").checked =
            user.show_enrollments;

    } catch (error) {
        console.error("Error loading profile settings:", error);

        document.getElementById("saveMessage").textContent =
            "Unable to load profile information.";
    }
}

// save changes to the student's profile
async function saveProfileSettings(event) {
    event.preventDefault();

    const saveMessage = document.getElementById("saveMessage");

    // get the information from the form
    const major = document.getElementById("major").value;
    const year = document.getElementById("year").value;
    const bio = document.getElementById("bio").value;

    // get privacy settings
    const show_posts = document.getElementById("showPosts").checked;
    const show_enrollments =
        document.getElementById("showEnrollments").checked;

    try {
        const response = await fetch(`${API_URL}/api/profile/manage`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                major,
                year,
                bio,
                show_posts,
                show_enrollments
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            saveMessage.textContent =
                data.message || "Could not save profile changes.";
            return;
        }

        saveMessage.textContent = "Profile updated successfully!";

    } catch (error) {
        console.error("Error saving profile:", error);
        saveMessage.textContent = "Could not connect to the server.";
    }
}

// display the student's existing enrollments
async function loadEnrollments() {
    const enrollmentList = document.getElementById("enrollmentList");

    try {
        const response = await fetch(
            `${API_URL}/api/profile/manage/enrollments`,
            {
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error("Could not load enrollments.");
        }

        const data = await response.json();

        enrollmentList.replaceChildren();

        if (data.enrollments.length === 0) {
            enrollmentList.textContent =
                "You haven't added any courses yet.";
            return;
        }

        data.enrollments.forEach(enrollment => {
            const item = document.createElement("div");
            item.className = "enrollment-item";

            const courseInfo = document.createElement("span");
            courseInfo.textContent =
                `${enrollment.subject} ${enrollment.course_number} — ${enrollment.course_name} — ${enrollment.semester} ${enrollment.year} (${enrollment.status})`;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "Remove";
            removeBtn.className = "remove-enrollment-btn";

            removeBtn.addEventListener("click", () => {
                removeEnrollment(enrollment.enrollment_id);
            });

            item.appendChild(courseInfo);
            item.appendChild(removeBtn);
            enrollmentList.appendChild(item);
        });

    } catch (error) {
        console.error("Error loading enrollments:", error);
        enrollmentList.textContent =
            "Unable to load your enrollments.";
    }
}

// saves the enrollment they added
async function saveEnrollment(event) {
    event.preventDefault();

    const enrollmentMessage =
        document.getElementById("enrollmentMessage");

    const validationMessage =
        document.getElementById("courseValidationMessage");

    const subject = document.getElementById("courseSubject")
        .value.trim().toUpperCase();

    const number = document.getElementById("courseNumber")
        .value.trim();

    const semester = document.getElementById("semester").value;
    const year = Number(document.getElementById("enrollmentYear").value);
    const status = document.getElementById("enrollmentStatus").value;

    enrollmentMessage.textContent = "";
    validationMessage.textContent = "";

    try {
        // validate course using the scraper
        const validationResponse = await fetch(
            `${API_URL}/api/courses/validate?subject=${encodeURIComponent(subject)}&number=${encodeURIComponent(number)}`
        );

        if (!validationResponse.ok) {
            throw new Error("Unable to validate course.");
        }

        const validation = await validationResponse.json();

        if (!validation.valid) {
            validationMessage.textContent =
                "This course was not found in the WSU catalog.";
            return;
        }

        // retrieve the courses id
        const courseCode = `${subject} ${number}`;

        const courseResponse = await fetch(
            `${API_URL}/api/courses/${encodeURIComponent(courseCode)}`
        );

        if (!courseResponse.ok) {
            throw new Error("Unable to retrieve course information.");
        }

        const course = await courseResponse.json();

        // save the enrollement
        const response = await fetch(
            `${API_URL}/api/profile/manage/enrollments`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    course_id: course.course_id,
                    semester,
                    year,
                    status
                })
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            enrollmentMessage.textContent =
                data.message || "Could not add enrollment.";
            return;
        }

        // 4. Refresh the student's enrollments
        document.getElementById("enrollmentForm").reset();
        document.getElementById("enrollmentForm").hidden = true;
        document.getElementById("addEnrollmentBtn").hidden = false;

        await loadEnrollments();

    } catch (error) {
        console.error("Error adding enrollment:", error);

        enrollmentMessage.textContent =
            error.message || "Could not connect to the server.";
    }
}

// removes the enrollment they added
async function removeEnrollment(enrollmentId) {
    if (!confirm("Remove this course enrollment?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/profile/manage/enrollments/${enrollmentId}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );
        if (!response.ok) {
            throw new Error("Could not remove enrollment.");
        }
        await loadEnrollments();

    } catch (error) {
        console.error("Error removing enrollment:", error);
        alert("Unable to remove enrollment.");
    }
}


const profileForm = document.getElementById("manageProfileForm");

if (profileForm) {
    profileForm.addEventListener("submit", saveProfileSettings);
}

const addEnrollmentBtn = document.getElementById("addEnrollmentBtn");
const cancelEnrollmentBtn = document.getElementById("cancelEnrollmentBtn");
const enrollmentForm = document.getElementById("enrollmentForm");

enrollmentForm.addEventListener("submit", saveEnrollment);

// show the enrollment form
addEnrollmentBtn.addEventListener("click", () => {
    enrollmentForm.hidden = false;
    addEnrollmentBtn.hidden = true;
});

// hide the enrollment form
cancelEnrollmentBtn.addEventListener("click", () => {
    enrollmentForm.hidden = true;
    addEnrollmentBtn.hidden = false;
});


document.addEventListener("DOMContentLoaded", () => {
    loadProfileSettings();
    loadEnrollments();
});