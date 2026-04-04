// 1. SECURITY GUARD: Run this immediately before anything else
(function() {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // If no token exists, or the user is NOT a doctor/admin, boot them out
    if (!token || (userData.role !== 'doctor' && userData.role !== 'admin')) {
        alert("⛔ Access Denied: Doctors Only!");
        window.location.href = 'index.html'; 
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // Display the specific doctor's name
    const docHeader = document.querySelector('h2');
    if (docHeader) docHeader.innerText = `👨‍⚕️ Dr. ${userData.name}'s Control Panel`;

    // 2. Initial load of the queue
    loadDoctorQueue();

    // 3. Handle the "Next Patient" Button Click
    const nextBtn = document.getElementById('btnNextPatient');
    nextBtn?.addEventListener('click', async (e) => {
        // Get the ID we stored in the dataset
        const apptId = e.target.dataset.apptId;
        
        if (!apptId) {
            alert("No more patients in the queue!");
            return;
        }

        const token = localStorage.getItem('token');
        
        try {
            const res = await fetch(`http://localhost:5000/api/appointments/${apptId}/complete`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                alert("✅ Patient served successfully!");
                loadDoctorQueue(); // Refresh the list to show the next person
            } else {
                const errData = await res.json();
                alert(`❌ Error: ${errData.message}`);
            }
        } catch (err) {
            console.error("Failed to update appointment:", err);
            alert("📡 Server connection failed.");
        }
    });
});

async function loadDoctorQueue() {
    const token = localStorage.getItem('token');
    
    // Elements from your styled HTML
    const nextPatientNum = document.getElementById('nextPatientNumber');
    const nextPatientName = document.getElementById('nextPatientName');
    const listUl = document.getElementById('doctorQueueList');
    const nextBtn = document.getElementById('btnNextPatient');

    try {
        const res = await fetch('http://localhost:5000/api/doctor/queue', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Could not fetch queue");

        const queue = await res.json();
        
        // Clear the current list
        listUl.innerHTML = "";

        if (queue.length === 0) {
            nextPatientNum.innerText = "--";
            nextPatientName.innerText = "No patients waiting!";
            nextBtn.dataset.apptId = ""; // Clear the ID
            return;
        }

        // 1. Update the Big "Next in Line" Card
        const current = queue[0];
        nextPatientNum.innerText = `#${current.queueNumber}`;
        nextPatientName.innerText = current.patientId.name;
        
        // Store the appointment ID on the button so we can "Complete" it later
        nextBtn.dataset.apptId = current._id;

        // 2. Show the rest of the queue in the list below
        const upcoming = queue.slice(1);
        if (upcoming.length === 0) {
            listUl.innerHTML = '<li style="border-left: 5px solid #ccc;">No other upcoming patients.</li>';
        } else {
            upcoming.forEach(appt => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span><strong>#${appt.queueNumber}</strong> - ${appt.patientId.name}</span>
                    <span style="font-size: 0.8rem; color: #666;">Status: Waiting</span>
                `;
                listUl.appendChild(li);
            });
        }

    } catch (err) {
        console.error("Queue fetch failed:", err);
        if (nextPatientName) nextPatientName.innerText = "Error loading queue.";
    }
}