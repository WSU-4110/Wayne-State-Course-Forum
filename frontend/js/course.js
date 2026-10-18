// Read the course code from the link, e.g. course.html?course=CSC+4110 -> "CSC 4110"
const params = new URLSearchParams(window.location.search);
const courseCode = (params.get("course") || "").trim().toUpperCase();

if (courseCode === "") {
    // No course in the link: hide the course parts and show "Course not found"
    document.getElementById("course-info").hidden = true;
    document.getElementById("posts").hidden = true;
    document.getElementById("not-found").hidden = false;
} else {
    // Put the course code on the page and in the browser tab
    document.getElementById("course-code").textContent = courseCode;
    document.getElementById("course-name").textContent = "Course name coming soon";
    document.title = courseCode + " | WSU Course Forum";
}
