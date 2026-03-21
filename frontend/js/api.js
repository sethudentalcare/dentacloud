// API Configuration
const API_URL = 'https://dentacloud-gold.vercel.app/api';
// For local development: 'http://localhost:5000/api'

function getToken() {
    return localStorage.getItem('authToken');
}

function setToken(token) {
    localStorage.setItem('authToken', token);
}

function clearToken() {
    localStorage.removeItem('authToken');
}

function getUserRole() {
    return localStorage.getItem('userRole');
}

function setUserRole(role) {
    localStorage.setItem('userRole', role);
}

function getUserName() {
    return localStorage.getItem('userName');
}

function setUserName(name) {
    localStorage.setItem('userName', name);
}

async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}