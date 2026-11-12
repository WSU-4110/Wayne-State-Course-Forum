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

    let currentUserId = null;

    async function loadCurrentUser() {
        try {
            const res = await fetch("https://wayne-state-course-forum.onrender.com/api/auth/me", {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                currentUserId = data.user.user_id ?? data.user.id;
            }
        } catch (err) {
            console.error("Failed to load current user:", err);
        }
    }

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
function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

async function loadPosts() {
    try {
        const res = await fetch(`https://wayne-state-course-forum.onrender.com/api/posts?course=${encodeURIComponent(courseCode)}`); 
        const posts = await res.json();
        list.innerHTML = posts.map(p => {
                const isAuthor = currentUserId && p.user_id === currentUserId;
                const isEdited = p.updated_at && new Date(p.updated_at) > new Date(p.created_at);

                return `
                    <li data-post-id="${p.post_id}" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; list-style: none;">
                        <div class="post-view">
                            <b>[${escapeHtml(p.tag)}] ${escapeHtml(p.title)}</b>
                            <p>${escapeHtml(p.content)}</p>
                            <small>
                                ${escapeHtml(p.author_email)} • ${new Date(p.created_at).toLocaleDateString()}
                                ${isEdited ? " (edited)" : ""}
                            </small>
                            ${isAuthor ? `<button type="button" class="edit-btn">Edit</button>` : ""}
                        </div>

                        <div class="post-edit-form" hidden>
                            <input type="text" class="edit-title" value="${escapeHtml(p.title)}" required />
                            <input type="text" class="edit-tag" value="${escapeHtml(p.tag)}" required />
                            <textarea class="edit-content" required>${escapeHtml(p.content)}</textarea>
                            <button type="button" class="save-edit-btn">Save</button>
                            <button type="button" class="cancel-edit-btn">Cancel</button>
                        </div>
                    </li>
                `;
            }).join("");
        } catch (err) {
            console.error("Failed to load posts:", err);
            list.innerHTML = "<li><p>Unable to load posts at this time.</p></li>";
        }
    }

list.addEventListener("click", async (e) => {
        const postItem = e.target.closest("li[data-post-id]");
        if (!postItem) return;

        const postId = postItem.dataset.postId;
        const viewDiv = postItem.querySelector(".post-view");
        const editDiv = postItem.querySelector(".post-edit-form");

        if (e.target.classList.contains("edit-btn")) {
            viewDiv.hidden = true;
            editDiv.hidden = false;
        }

        if (e.target.classList.contains("cancel-edit-btn")) {
            editDiv.hidden = true;
            viewDiv.hidden = false;
        }

        if (e.target.classList.contains("save-edit-btn")) {
            const title = postItem.querySelector(".edit-title").value.trim();
            const tag = postItem.querySelector(".edit-tag").value.trim();
            const content = postItem.querySelector(".edit-content").value.trim();

            if (!title || !tag || !content) {
                alert("Title, tag, and content cannot be empty.");
                return;
            }

            try {
                const res = await fetch(`https://wayne-state-course-forum.onrender.com/api/posts/${postId}`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, tag, content })
                });

                if (res.ok) {
                    await loadPosts();
                } else {
                    const errData = await res.json();
                    alert("Error: " + (errData.error || "Could not update post"));
                }
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    });

if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("post-title").value;
      const tag = document.getElementById("post-tag").value;
      const content = document.getElementById("post-content").value;

      try {
        const res = await fetch("https://wayne-state-course-forum.onrender.com/api/posts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseCode: courseCode,
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

  async function init() {
        await loadCurrentUser();
        loadPosts();
        loadCourseInfo();
    }

  init();

}

