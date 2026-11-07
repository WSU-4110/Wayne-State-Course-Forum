// Facade pattern for the course page (story: View Course Forum).
// course.js only talks to CourseForumFacade. The facade knows the server
// links, the fetch settings, and the order the calls run in.
const API_BASE = "https://wayne-state-course-forum.onrender.com/api";
// Subsystem 1: course info from /api/courses
class CourseService {
  
async getCourse(courseCode) {
    
const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseCode)}`);
    
if (!res.ok) {
      
return null; // course is not in the database
    
}
    
return res.json();
  
}
}
// Subsystem 2: posts from /api/posts
class PostService {
  
async getPosts(courseCode) {
    
const res = await fetch(`${API_BASE}/posts?course=${encodeURIComponent(courseCode)}`);
    
if (!res.ok) {
      
throw new Error("Could not load posts");
    
}
    
return res.json();
  
}
  
async createPost(courseCode, title, tag, content) {
    
const res = await fetch(`${API_BASE}/posts`, {
      
method: "POST",
      
credentials: "include", // sends the login cookie
      
headers: { "Content-Type": "application/json" },
      
body: JSON.stringify({ courseCode, title, tag, content })
    
});
    
if (!res.ok) {
      
const errData = await res.json();
      
throw new Error(errData.error || "Could not save post");
    
}
    
return res.json();
  
}
}
// The Facade: one simple door into the two services above
class CourseForumFacade {
  
constructor() {
    
this.courseService = new CourseService();
    
this.postService = new PostService();
  
}
  
// Everything the page needs when it opens: course info + posts
  
async loadCoursePage(courseCode) {
    
const course = await this.courseService.getCourse(courseCode);
    
const posts = await this.postService.getPosts(courseCode);
    
return { course, posts };
  
}
  
// Save a new post, then return the updated list of posts
  
async addPost(courseCode, title, tag, content) {
    
await this.postService.createPost(courseCode, title, tag, content);
    
return this.postService.getPosts(courseCode);
  
}
}
