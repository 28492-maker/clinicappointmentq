// 1. BASE URL (Points to your Express Server)
const BASE_URL = 'http://localhost:5000/api/auth'; 

const loginForm = document.getElementById('loginForm');

// Error handling if the HTML doesn't have the right ID
if (!loginForm) {
    console.error("❌ Error: Could not find element with id='loginForm'");
}

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get values from input fields
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log("🔑 Attempting login for:", email);

    try {
        // Send login request to Backend
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ Login successful! Role:", data.user.role);

            // 1. Save JWT Token (Security Card)
            localStorage.setItem('token', data.token);
            
            // 2. Save User Object (Name, Email, Role)
            localStorage.setItem('user', JSON.stringify(data.user));

            // 3. ROLE-BASED REDIRECTION (The "Hiding" Logic)
            if (data.user.role === 'doctor') {
                // Sending doctors to their specific dashboard
                window.location.href = 'doctor-dashboard.html'; 
            } else if (data.user.role === 'patient') {
                // Sending patients to their specific dashboard
                window.location.href = 'dashboard.html'; 
            } else if (data.user.role === 'admin') {
                // If you have an admin page
                window.location.href = 'admin.html';
            } else {
                // Fallback for safety
                console.warn("Unknown role detected:", data.user.role);
                window.location.href = 'dashboard.html';
            }
        } else {
            // Show error message from the server (e.g., "Invalid credentials")
            alert(data.message || "Login failed. Check your email/password.");
        }
    } catch (err) {
        console.error("❌ Network/Server Error:", err);
        alert("Cannot connect to server. Ensure 'node server.js' is running on port 5000!");
    }
});