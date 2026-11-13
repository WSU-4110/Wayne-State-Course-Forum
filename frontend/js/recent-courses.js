const recentCourseGrid = document.getElementById("recent-courses-grid");

function shortenPost(text, max = 120) { 
    const clean = (text || "").replace(/\s+/g, " ").trim() // prevents errors and makes text intelligible
    if (clean.length <= max) {
        return clean; 
    }
    return clean.substring(0,max).trimEnd() + "..."; 
}

async function loadRecent() { 
    try { 
        const response = await fetch (
            "https://wayne-state-course-forum.onrender.com/api/recent-courses"
        );
        
        if (!response.ok) { 
            throw new Error("Failed to fetch courses");
        }

        const courses = await response.json();
        recentCourseGrid.replaceChildren(); // replaces the <p> tag

        courses.forEach(course =>{
            //item
            const courseAb = `${course.subject} ${course.course_number}`;
            const card = document.createElement("article");
            card.className = "news-card";
            //heading
            const heading = document.createElement("h3");
            const link = document.createElement("a");
            link.href = `course.html?course=${encodeURIComponent(courseAb)}`;
            link.textContent = `${courseAb} - ${course.course_name}`;
            heading.appendChild(link);

            //post title
            const postT = document.createElement("h4");
            postT.textContent = course.title;

            //content
            const postC = document.createElement("p");
            postC.textContent = shortenPost(course.content);

            //on item card
            card.append(heading,postT,postC);
            recentCourseGrid.appendChild(card);
        });
    }
    catch (error) { 
        console.error("Error loading recent courses: ", error);
        recentCourseGrid.textContent = "Unable to load recent courses.";
    }
}

if (recentCourseGrid) { 
    loadRecent();
}