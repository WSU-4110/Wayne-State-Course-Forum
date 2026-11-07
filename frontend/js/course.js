// Read the course code from the link, e.g. course.html?course=CSC+4110 -> "CSC 4110"
const params = new URLSearchParams(window.location.search);
const courseCode = (params.get("course") || "").trim().toUpperCase();

// Get references to the post list and form elements
const list = document.getElementById("post-list");
const form = document.getElementById("post-form");

// The page talks to the server only through the facade (courseForumFacade.js)
const forum = new CourseForumFacade();

// Put a list of posts on the page
function showPosts(posts) {
  list.innerHTML = posts.map(p => `
      <li style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; list-style: none;">
          <b>[${p.tag}] ${p.title}</b>
          <p>${p.content}</p>
          <small>${p.author_email} • ${new Date(p.created_at).toLocaleDateString()}</small>
      </li>
  `).join("");
}

// Load the course name and its posts with one call to the facade
async function loadPage() {
  try {
    const { course, posts } = await forum.loadCoursePage(courseCode);
    document.getElementById("course-name").textContent =
      course ? course.course_name : "Course detail not found";
    showPosts(posts);
  } catch (err) {
    console.error("Failed to load course page:", err);
    document.getElementById("course-name").textContent = "Error loading course info";
    list.innerHTML = "<li><p>Unable to load posts at this time.</p></li>";
  }
}

if (courseCode === "") {
  // No course in the link: hide the course parts and show "Course not found"
  document.getElementById("course-info").hidden = true;
  document.getElementById("posts").hidden = true;
  document.getElementById("not-found").hidden = false;
} else {
  // Put the course code on the page and in the browser tab
  document.getElementById("course-code").textContent = courseCode;
  document.getElementById("course-name").textContent = "Loading...";
  document.title = courseCode + " | WSU Course Forum";

  // When the form is sent, save the post through the facade
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("post-title").value;
      const tag = document.getElementById("post-tag").value;
      const content = document.getElementById("post-content").value;

      try {
        const posts = await forum.addPost(courseCode, title, tag, content);
        form.reset();
        showPosts(posts);
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  loadPage();
}
