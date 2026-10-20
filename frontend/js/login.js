
console.log("login.js loaded successfully");

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const loginMessage = document.getElementById("loginMessage");
    loginMessage.textContent = "";

    // get the info entered by the student
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // check required fields
    if (!email || !password) {
        alert("Email and password are required.");
        return;
    }

    // send login information to backend
    try {
        const response = await fetch("https://wayne-state-course-forum.onrender.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        // read backend response 
        const data = await response.json();
        if (response.ok){
            window.location.href = "index.html";
        } else {
            loginMessage.textContent = data.message || "Login failed.";
        }


    } catch (error) {
        console.error("Login request failed:", error);
        loginMessage.textContent = "Could not connect to the server.";
    }
});
