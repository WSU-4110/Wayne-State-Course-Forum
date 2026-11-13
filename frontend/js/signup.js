
console.log("signup.js loaded successfully");

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const signupMessage = document.getElementById("signupMessage");
    signupMessage.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const year = document.getElementById("year").value;
    const major = document.getElementById("major").value.trim();

    if (!email.toLowerCase().endsWith("@wayne.edu")) {
        signupMessage.textContent = "Please enter a valid Wayne State email address.";
        return;
    }

    if (password !== confirmPassword) {
        signupMessage.textContent = "Passwords do not match.";
        return;
    }

    try {
        const response = await fetch("https://wayne-state-course-forum.onrender.com/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password,
                year,
                major
            })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = `verify_email.html?email=${encodeURIComponent(email)}`;
        } else {
            signupMessage.textContent = data.message || "Could not create account.";
        }

    } catch (error) {
        console.error("Signup request failed:", error);
        signupMessage.textContent = "Could not connect to the server.";
    }
});
