
console.log("login.js loaded successfully");

// Strategy Pattern: Authentication Strategy
class AuthenticationStrategy {
    async authenticate(email, password) {
        throw new Error("authenticate() must be implemented.");
    }
}

// Concrete Strategy: Email and Password Authentication
class EmailPasswordStrategy extends AuthenticationStrategy {
    async authenticate(email, password) {
        const response = await fetch(
            "https://wayne-state-course-forum.onrender.com/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        return {
            success: response.ok,
            message: data.message || "Login failed."
        };
    }
}

// Context: Uses the selected authentication strategy
class LoginContext {
    constructor(strategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy) {
        this.strategy = strategy;
    }

    async login(email, password) {
        return await this.strategy.authenticate(email, password);
    }
}

// Create the login context with email/password strategy
const loginContext = new LoginContext(
    new EmailPasswordStrategy()
);

// Handle the login form
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const loginMessage = document.getElementById("loginMessage");
    loginMessage.textContent = "";

    // Get the information entered by the student
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check required fields
    if (!email || !password) {
        alert("Email and password are required.");
        return;
    }

    // Authenticate using the Strategy Pattern
    try {
        const result = await loginContext.login(email, password);

        if (result.success) {
            window.location.href = "index.html";
        } else {
            loginMessage.textContent = result.message;
        }

    } catch (error) {
        console.error("Login request failed:", error);
        loginMessage.textContent = "Could not connect to the server.";
    }
});
