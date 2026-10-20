// Check whether the student is logged in

async function checkAuth() {
    const guestLinks = document.getElementById("guestLinks");
    const userAccount = document.getElementById("userAccount");
    const userGreeting = document.getElementById("userGreeting");

    try {
        const response = await fetch("http://localhost:3000/api/auth/me", {
            credentials: "include"
        });

        if (response.ok) {
            // Student is logged in
            const data = await response.json();

            userGreeting.textContent = `Hello ${data.user.email}!`;
            userAccount.hidden = false;
            guestLinks.hidden = true;

        } else if (response.status === 401) {
            // Student is not logged in
            guestLinks.hidden = false;
            userAccount.hidden = true;
        } else {
            console.error("Authentication check returned:", response.status);
        }

    } catch (error) {
        console.error("Authentication check failed:", error);
    }
}

checkAuth();


// Log out the current student
async function logout() {
    try {
        const response = await fetch("http://localhost:3000/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            window.location.href = "index.html";
        } else {
            alert("Could not log out. Please try again.");
        }

    } catch (error) {
        console.error("Logout request failed:", error);
        alert("Could not connect to the server.");
    }
}

// Connect the Log Out button to the logout function
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

