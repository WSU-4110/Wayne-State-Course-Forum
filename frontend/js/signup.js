const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", function(event) {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    
    // checks if its a wsu email, but doesnt actually verify
    if (!email.toLowerCase().endsWith("@wayne.edu")) {
        event.preventDefault();
        alert("Please enter a valid Wayne State email address.");
        return;
    }
    // checks if password matches
    if (password !== confirmPassword) {
        event.preventDefault();
        alert("Passwords do not match.");
    }

});