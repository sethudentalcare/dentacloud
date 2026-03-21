// Check authentication on page load
checkAuth();

// Update user name in header
document.addEventListener('DOMContentLoaded', () => {
    const userName = getUserName();
    const userNameElement = document.getElementById('userName');
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }

    // Load dashboard data if on dashboard page
    if (document.getElementById('totalPatients')) {
        loadDashboardData();
    }
});

async function loadDashboardData() {
    try {
        const response = await apiCall('/patients?limit=5');

        if (response.success) {
            document.getElementById('totalPatients').textContent = response.total || 0;

            if (response.patients && response.patients.length > 0) {
                const rows = response.patients.map(patient => `
                    <tr>
                        <td>${patient.patient_id}</td>
                        <td>${patient.first_name} ${patient.last_name}</td>
                        <td>${patient.phone}</td>
                        <td>${patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                `).join('');
                document.getElementById('recentPatientsTable').innerHTML = rows;
            }
        }
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

async function handlePatientSubmit(event) {
    event.preventDefault();
    
    const formData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        date_of_birth: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        address_line1: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postal_code: document.getElementById('postal').value,
        emergency_contact_name: document.getElementById('emergencyName').value,
        emergency_contact_phone: document.getElementById('emergencyPhone').value
    };

    try {
        const response = await apiCall('/patients', 'POST', formData);

        if (response.success) {
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('patientForm').reset();
            setTimeout(() => window.location.href = 'patient-search.html', 2000);
        } else {
            document.getElementById('errorMessage').textContent = response.error;
            document.getElementById('errorMessage').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('errorMessage').textContent = error.message;
        document.getElementById('errorMessage').style.display = 'block';
    }
}

async function handleSearch() {
    const query = document.getElementById('searchInput').value;
    const type = document.getElementById('searchType').value;

    if (query.length < 2) {
        document.getElementById('resultsTable').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">Enter at least 2 characters...</td>
            </tr>
        `;
        return;
    }

    try {
        const response = await apiCall(`/patients/search?type=${type}&query=${query}`);
        
        if (response.results && response.results.length > 0) {
            const rows = response.results.map(patient => `
                <tr>
                    <td>${patient.patient_id}</td>
                    <td>${patient.first_name} ${patient.last_name}</td>
                    <td>${patient.phone}</td>
                    <td>${patient.email || '-'}</td>
                    <td>
                        <a href="#" onclick="viewPatient(${patient.id})" class="btn-small">View</a>
                        <a href="#" onclick="editPatient(${patient.id})" class="btn-small">Edit</a>
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('resultsTable').innerHTML = rows;
        } else {
            document.getElementById('resultsTable').innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">No patients found</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('resultsTable').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">Search error. Try again.</td>
            </tr>
        `;
    }
}

function viewPatient(id) {
    alert('View patient: ' + id);
    // TODO: Implement view patient details
}

function editPatient(id) {
    alert('Edit patient: ' + id);
    // TODO: Implement edit patient
}