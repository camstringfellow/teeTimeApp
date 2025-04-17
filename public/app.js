document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const dashboard = document.getElementById('dashboard');
    const loginFormElement = document.getElementById('login');
    const settingsForm = document.getElementById('settings-form');
    const toggleBotBtn = document.getElementById('toggle-bot');
    const botStatus = document.getElementById('bot-status');
    const logoutBtn = document.getElementById('logout-btn');
    const bookingHistory = document.getElementById('booking-history');

    // Check if user is already logged in
    checkAuthStatus();

    // Login form submission
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginFormElement);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password')
                })
            });

            if (response.ok) {
                showDashboard();
                loadSettings();
                loadBookingHistory();
            } else {
                alert('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login.');
        }
    });

    // Settings form submission
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(settingsForm);
        
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    desired_day: formData.get('desired_day'),
                    desired_time: formData.get('desired_time'),
                    num_players: formData.get('num_players'),
                    notification_email: formData.get('notification_email')
                })
            });

            if (response.ok) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings.');
            }
        } catch (error) {
            console.error('Settings error:', error);
            alert('An error occurred while saving settings.');
        }
    });

    // Toggle bot button click
    toggleBotBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/bot/toggle', {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                updateBotStatus(data.isActive);
            }
        } catch (error) {
            console.error('Toggle bot error:', error);
            alert('An error occurred while toggling the bot.');
        }
    });

    // Logout button click
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            if (response.ok) {
                showLoginForm();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    // Helper functions
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            if (response.ok) {
                showDashboard();
                loadSettings();
                loadBookingHistory();
            } else {
                showLoginForm();
            }
        } catch (error) {
            console.error('Auth status error:', error);
            showLoginForm();
        }
    }

    async function loadSettings() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const settings = await response.json();
                populateSettingsForm(settings);
                updateBotStatus(settings.is_active);
            }
        } catch (error) {
            console.error('Load settings error:', error);
        }
    }

    async function loadBookingHistory() {
        try {
            const response = await fetch('/api/bookings/history');
            if (response.ok) {
                const history = await response.json();
                displayBookingHistory(history);
            }
        } catch (error) {
            console.error('Load history error:', error);
        }
    }

    function populateSettingsForm(settings) {
        settingsForm.elements['desired_day'].value = settings.desired_day;
        settingsForm.elements['desired_time'].value = settings.desired_time;
        settingsForm.elements['num_players'].value = settings.num_players;
        settingsForm.elements['notification_email'].value = settings.notification_email;
    }

    function updateBotStatus(isActive) {
        botStatus.textContent = isActive ? 'Active' : 'Inactive';
        toggleBotBtn.textContent = isActive ? 'Stop Bot' : 'Start Bot';
        toggleBotBtn.classList.toggle('bg-red-600', isActive);
        toggleBotBtn.classList.toggle('bg-indigo-600', !isActive);
    }

    function displayBookingHistory(history) {
        bookingHistory.innerHTML = history.map(booking => `
            <div class="border rounded-lg p-4 ${booking.status === 'success' ? 'bg-green-50' : 'bg-red-50'}">
                <div class="flex justify-between items-center">
                    <span class="font-medium">${new Date(booking.booking_date).toLocaleString()}</span>
                    <span class="px-2 py-1 text-sm rounded-full ${booking.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${booking.status}
                    </span>
                </div>
                <div class="mt-2 text-sm text-gray-600">
                    ${booking.details}
                </div>
            </div>
        `).join('');
    }

    function showLoginForm() {
        loginForm.classList.remove('hidden');
        dashboard.classList.add('hidden');
    }

    function showDashboard() {
        loginForm.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }
}); 