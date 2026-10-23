
console.log("signup.js loaded successfully");
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const signupMessage = document.getElementById("signupMessage");
    signupMessage.textContent = "";

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const year = document.getElementById("year").value;
    const major = document.getElementById("major").value.trim();
    
    // checks if its a wsu email, but doesnt actually verify
    if (!email.toLowerCase().endsWith("@wayne.edu")) {
        signupMessage.textContent ="Please enter a valid Wayne State email address.";
        return;
    }
    // checks if password matches
    if (password !== confirmPassword) {
        signupMessage.textContent = "Passwords do not match.";
        return;
    }

    // send signup information to backend
    try {
        const response = await fetch("https://wayne-state-course-forum.onrender.com/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email: email,
                password: password,
                year: year,
                major: major
            })
        });

        // get backend response
        const data = await response.json();
        if (response.ok) {
            window.location.href = "index.html";
        } else {
            signupMessage.textContent = data.message || "Could not create account.";
        }

    } catch (error) {
        console.error("Signup request failed:", error);
        signupMessage.textContent = "Could not connect to the server.";
    }    
});
