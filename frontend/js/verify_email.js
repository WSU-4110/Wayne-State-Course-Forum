console.log("verify_email.js loaded successfully");

// get the email from the url
const params = new URLSearchParams(window.location.search);
const email = params.get("email");

// display the email on the page
const verificationEmail = document.getElementById("verificationEmail");
verificationEmail.textContent = email || "No email provided";

// get the form
const verifyEmailForm = document.getElementById("verifyEmailForm");
const verificationMessage = document.getElementById("verificationMessage");

verifyEmailForm.addEventListener("submit", async function(event){
    event.preventDefault();
    verificationMessage.textContent = "";
    
    // get the code the user entered
    const code = document.getElementById("verificationCode").value.trim();

    // check the email and code are given
    if (!email || !/^\d{6}$/.test(code)){
        verificationMessage.textContent = "Please enter a valid 6-digit verification code";
        return;
    }
    // send info to backend
    try{
        const response = await fetch("https://wayne-state-course-forum.onrender.com/api/auth/verify-email", {
            method: "POST",
            headers:{
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                code: code
            })
        });
        const data = await response.json();

        if (response.ok){
            verificationMessage.textContent = "Email verified successfully! Redirecting to login...";
            window.location.href = "login.html";
        } else{
            verificationMessage.textContent = data.message || "Email verification failed";
        }

    }catch(error){
        console.error("Verification request failed:", error);
        verificationMessage.textContent = "Couldnt connect to the server.";
    }

});

const resendCodeButton = document.getElementById("resendCodeButton");
let cooldownTimer = null;
function startResendCooldown(seconds){
    clearInterval(cooldownTimer);
    let remaining = seconds;

    resendCodeButton.disabled = true;
    resendCodeButton.textContent = `Resend Code(${remaining}s)`;
    cooldownTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0){
            clearInterval(cooldownTimer);
            resendCodeButton.disabled = false;
            resendCodeButton.textContent = "Resend Code";

        } else{
            resendCodeButton.textContent = `Resend Code(${remaining}s)`;
        }
    }, 1000);
}

resendCodeButton.addEventListener("click", async () =>{
    if (!email){
        verificationMessage.textContent = "No email provided";
        return;
    }
    resendCodeButton.disabled = true;
    verificationMessage.textContent = "Requesting a new code..."

    try{
        const response = await fetch(
            "https://wayne-state-course-forum.onrender.com/api/auth/resend-verification",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            }
        );
        const data = await response.json();
        verificationMessage.textContent  = data.message || "Unable to resend verification code.";
        
        if (response.ok){
            startResendCooldown(60);
            
        }else if (response.status === 429){
            startResendCooldown(data.retryAfter || 60);
        }else{
            resendCodeButton.disabled = false;
        }
    }catch(error){
        console.error("Resend verification failed:", error);
        verificationMessage.textContent = "Couldnt connect to server.";
        resendCodeButton.disabled = false;
    }
});