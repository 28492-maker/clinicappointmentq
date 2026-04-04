const DOCTOR_API_URL = 'http://localhost:5000/api/doctors';
const APPOINTMENT_API_URL = 'http://localhost:5000/api/appointments';
// New URL for fetching status
const STATUS_API_URL = 'http://localhost:5000/api/appointments/my'; 

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Patient Dashboard Initializing...");

    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userData);
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.innerText = `Welcome, ${user.name}`;

    // 1. LOAD DOCTORS
    await loadDoctors();

    // 2. NEW: LOAD QUEUE STATUS IMMEDIATELY
    await updateQueueStatus();

    // 3. BOOKING FORM SUBMISSION
    const bookingForm = document.getElementById('bookingForm');
    bookingForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bookingData = {
            doctorId: document.getElementById('doctorSelect').value,
            appointmentDate: document.getElementById('appointmentDate').value,
            appointmentTime: document.getElementById('appointmentTime').value
        };

        try {
            const res = await fetch(APPOINTMENT_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const data = await res.json();
            if (res.ok) {
                alert(`✅ Success! Queue Number: ${data.queueNumber}`);
                // Refresh the numbers after booking
                await updateQueueStatus(); 
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            alert("📡 Server connection failed.");
        }
    });
});

// --- NEW FUNCTION TO SHOW QUEUE NUMBERS ---
async function updateQueueStatus() {
    const token = localStorage.getItem('token');
    // Ensure these IDs match exactly what is in your HTML (e.g., <span id="currentServing">)
    const currentEl = document.getElementById('currentServing');
    const positionEl = document.getElementById('userPosition');

    try {
        console.log("🔄 Updating Queue Status...");
        const res = await fetch(STATUS_API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            
            // Set the text in the blue boxes
            if (currentEl) currentEl.innerText = data.current || "--";
            if (positionEl) positionEl.innerText = data.yourPosition || "--";
            
            console.log("✅ Queue numbers updated:", data);
        }
    } catch (err) {
        console.error("❌ Failed to fetch queue status:", err);
    }
}

async function loadDoctors() {
    const select = document.getElementById('doctorSelect');
    if (!select) return;

    try {
        const res = await fetch(DOCTOR_API_URL);
        const doctors = await res.json();

        select.innerHTML = '<option value="">-- Choose a Doctor --</option>';
        doctors.forEach(doc => {
            const opt = document.createElement('option');
            opt.value = doc._id; 
            opt.textContent = `${doc.name} (${doc.specialization})`;
            select.appendChild(opt);
        });
    } catch (err) {
        select.innerHTML = '<option value="">Error loading doctors</option>';
    }
}