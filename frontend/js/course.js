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

// Load posts for the course
async function loadPosts() {
    try {
        const res = await fetch(`"https://wayne-state-course-forum.onrender.com"/api/posts?course=${encodeURIComponent(courseCode)}`, {
        const posts = await res.json();
        list.innerHTML = posts.map(p => `
            <li style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; list-style: none;">
                <b>[${p.tag}] ${p.title}</b>
                <p>${p.content}</p>
                <small>${p.author_email} • ${new Date(p.created_at).toLocaleDateString()}</small>
            </li>
        `).join("");
  }

form.onsubmit = async (e) => {
    e.preventDefault();
    await fetch("https://wayne-state-course-forum.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseCode,
        userId: 1,
        title: form["post-title"].value,
        tag: form["post-tag"].value,
        content: form["post-content"].value
      })
    });
    form.reset();
    loadPosts();
  };

  loadPosts();
}

