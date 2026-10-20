// Read the course code from the link, e.g. course.html?course=CSC+4110 -> "CSC 4110"
const params = new URLSearchParams(window.location.search);
const courseCode = (params.get("course") || "").trim().toUpperCase();

// Get references to the post list and form elements
const list = document.getElementById("post-list");
const form = document.getElementById("post-form");

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

async function loadCourseInfo() {
    try {
        const res = await fetch(`https://wayne-state-course-forum.onrender.com/api/courses/${encodeURIComponent(courseCode)}`);
        if (res.ok) {
            const course = await res.json();
            document.getElementById("course-name").textContent = course.course_name;
        } else {
            document.getElementById("course-name").textContent = "Course detail not found";
        }
    } catch (err) {
        console.error("Failed to load course info:", err);
        document.getElementById("course-name").textContent = "Error loading course info";
    }
}





// Load posts for the course
async function loadPosts() {
    try {
        const res = await fetch(`https://wayne-state-course-forum.onrender.com/api/posts?course=${encodeURIComponent(courseCode)}`); 
        const posts = await res.json();
        list.innerHTML = posts.map(p => `
            <li style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; list-style: none;">
                <b>[${p.tag}] ${p.title}</b>
                <p>${p.content}</p>               
                <small>${p.author_email} • ${new Date(p.created_at).toLocaleDateString()}</small>
            </li>
        `).join("");
    } catch (err) {
    console.error("Failed to load posts:", err);
    list.innerHTML = "<li><p>Unable to load posts at this time.</p></li>";
    }
  }

if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("post-title").value;
      const tag = document.getElementById("post-tag").value;
      const content = document.getElementById("post-content").value;

      try {
        const res = await fetch("https://wayne-state-course-forum.onrender.com/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseCode: courseCode,
            userId: 1, // Fallback demo user ID
            title: title,
            tag: tag,
            content: content
          })
        });

        if (res.ok) {
          form.reset();
          await loadPosts();
        } else {
          const errData = await res.json();
          alert("Error: " + (errData.error || "Could not save post"));
        }
      } catch (err) {
        console.error("Submission failed:", err);
      }
    });
  }

  loadPosts();
}

