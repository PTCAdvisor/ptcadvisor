document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const flightsSection = document.getElementById('flights-section');
    const bookingSection = document.getElementById('booking-section');
    const flightList = document.getElementById('flight-list');
    const flightListSection = document.getElementById('flights-section');

    let userSession = null;
    let backendUrl;

    function setBackendUrl() {
        return fetch('https://raw.githubusercontent.com/PTCAdvisor/ptcadvisor/refs/heads/main/backend')
            .then(response => response.text())
            .then(url => {
                backendUrl = url.trim();
                if (userSession) {
                    flightsSection.style.display = 'block';
                    fetchFlights();
                }
            })
            .catch(error => console.error("Error fetching backend URL:", error));
    }

    function displayFlights(flights) {
        flightList.innerHTML = '';
        flights.forEach(flight => {
            const flightCard = document.createElement('div');
            flightCard.classList.add('flight-card');
            flightCard.innerHTML = `
                <h3>${flight.name}</h3>
                <p><strong>Destination:</strong> ${flight.destination}</p>
                <p><strong>Price:</strong> ${flight.price}</p>
                <div class="flight-reviews">
                    <p><strong>Reviews:</strong></p>
                    <div id="reviews-${flight.id}">No reviews yet</div>
                </div>
                <div class="review-form">
                    <input type="number" placeholder="Rating (1-5)" min="1" max="5">
                    <textarea placeholder="Write a review..."></textarea>
                    <button type="button" class="btn" onclick="submitReview(${flight.id})">Submit Review</button>
                </div>
            `;
            flightList.appendChild(flightCard);
            fetchReviews(flight.id);
        });
    }

    function fetchFlights() {
        fetch(`${backendUrl}/flights`)
            .then(response => response.json())
            .then(flights => displayFlights(flights))
            .catch(error => console.error("Error fetching flights:", error));
    }

    function fetchReviews(flightId) {
        fetch(`${backendUrl}/flights/${flightId}/reviews`)
            .then(response => response.json())
            .then(reviews => {
                const reviewsContainer = document.getElementById(`reviews-${flightId}`);
                reviewsContainer.innerHTML = reviews.length > 0 ? reviews.map(review => `<p>${review.rating} stars - ${review.comment}</p>`).join('') : "No reviews yet";
            })
            .catch(error => console.error("Error fetching reviews:", error));
    }

    function submitReview(flightId) {
        const rating = document.querySelector(`#flight-${flightId} input[type="number"]`).value;
        const comment = document.querySelector(`#flight-${flightId} textarea`).value;
        const reviewData = { rating, comment };

        fetch(`${backendUrl}/flights/${flightId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userSession.token}`
            },
            body: JSON.stringify(reviewData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Review submitted successfully") {
                Swal.fire('Success!', 'Your review has been submitted!', 'success');
                fetchReviews(flightId); 
            } else {
                Swal.fire('Error', 'There was an issue submitting your review', 'error');
            }
        })
        .catch(error => {
            console.error("Error submitting review:", error);
            Swal.fire('Error', 'There was an issue submitting your review', 'error');
        });
    }

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        fetch(`${backendUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Registration successful") {
                Swal.fire('Success!', 'You have registered successfully.', 'success');
            } else {
                Swal.fire('Error', data.error, 'error');
            }
        })
        .catch(error => {
            console.error("Error registering:", error);
            Swal.fire('Error', 'There was an issue with registration', 'error');
        });
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch(`${backendUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Login successful!") {
                userSession = { username, token: data.token };
                Swal.fire('Welcome!', `Logged in as ${username}`, 'success');
                flightsSection.style.display = 'block';
                loginForm.reset();
                fetchFlights();
            } else {
                Swal.fire('Error', data.error, 'error');
            }
        })
        .catch(error => {
            console.error("Error logging in:", error);
            Swal.fire('Error', 'There was an issue with login', 'error');
        });
    });

    logoutButton.addEventListener('click', function() {
        userSession = null;
        flightsSection.style.display = 'none';
        Swal.fire('Logged Out', 'You have logged out successfully', 'success');
    });

    setBackendUrl();
});
