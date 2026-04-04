document.addEventListener('DOMContentLoaded', () => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // 1. Redirect if not logged in
    if (!token || !userData) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userData);

    // 2. Display the user's name
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerText = `Welcome, ${user.name}`;
    }

    console.log("Current User Email in Dashboard:", user.email);

    // 3. Show the correct view based on role
    const adminView = document.getElementById('adminView');
    const patientView = document.getElementById('patientView');

    if (user.role === 'admin' || user.role === 'doctor') {
        if (adminView) adminView.classList.remove('hidden');
    } else {
        if (patientView) patientView.classList.remove('hidden');
        // --- NEW: Load doctors if the user is a patient ---
        loadDoctorsIntoDropdown();
    }

    // 4. Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // 5. --- NEW FUNCTION: FETCH DOCTORS ---
    async function loadDoctorsIntoDropdown() {
        const doctorSelect = document.getElementById('doctorSelect'); // CHECK: Your <select> must have this ID
        
        if (!doctorSelect) {
            console.log("DEBUG: doctorSelect element not found on this page.");
            return;
        }

        try {
            console.log("🔄 Fetching doctors from server...");
            const response = await fetch('http://localhost:5000/api/doctors');
            const doctors = await response.json();

            console.log("✅ Doctors received:", doctors);

            // Clear the dropdown and add default option
            doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';

            if (doctors.length === 0) {
                doctorSelect.innerHTML += '<option disabled>No doctors found in database</option>';
                return;
            }

            // Fill dropdown with doctors from DB
            doctors.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc._id;
                option.textContent = `${doc.name} (${doc.specialization})`;
                doctorSelect.appendChild(option);
            });

        } catch (error) {
            console.error("❌ Error loading doctors:", error);
        }
    }
});