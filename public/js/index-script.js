document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for Contact Form ---
    const contactForm = document.getElementById('contactForm');
    const contactMessageDiv = document.getElementById('contactMessage');

    // --- Elements for Header Search ---
    const headerSearchInput = document.getElementById('headerSearchInput');
    const headerSearchButton = document.getElementById('headerSearchButton');
    const searchResultsDisplay = document.getElementById('searchResultsDisplay');

    const BACKEND_API_URL = 'http://localhost:3000/api'; // Your backend API base URL

    // --- Contact Form Logic ---
    if (contactForm && contactMessageDiv) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries()); // Convert FormData to a plain object

            console.log('Contact form submitted:', data);

            try {
                const response = await fetch(`${BACKEND_API_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();
                if (response.ok) {
                    contactMessageDiv.innerHTML = `Thank you, <strong>${data.name}</strong>! ${result.message}`;
                    contactMessageDiv.style.color = 'green';
                    contactMessageDiv.style.fontWeight = 'bold';
                    contactForm.reset();
                } else {
                    contactMessageDiv.innerHTML = `Error: ${result.message || 'Something went wrong.'}`;
                    contactMessageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Error sending contact form:', error);
                contactMessageDiv.innerHTML = 'Error sending message. Please try again later. (Check backend console/network tab)';
                contactMessageDiv.style.color = 'red';
            }
        });
    }

    // --- Header Search Logic ---
    if (headerSearchInput && headerSearchButton && searchResultsDisplay) {
        const performSearch = async () => {
            const query = headerSearchInput.value.trim();
            if (!query) {
                searchResultsDisplay.style.display = 'none'; // Hide if no query
                searchResultsDisplay.innerHTML = '';
                return;
            }

            searchResultsDisplay.style.display = 'block'; // Show display area

            try {
                // Sending the search query to the vulnerable backend endpoint
                const response = await fetch(`${BACKEND_API_URL}/search-user-vulnerable?username=${encodeURIComponent(query)}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // Display the raw backend response for conceptual demo purposes
                searchResultsDisplay.innerHTML = `Search Result (from Backend's conceptual SQLi endpoint): <strong>${data.message}</strong>`;
                searchResultsDisplay.style.color = '#00BCD4'; // A standout color
            } catch (error) {
                console.error('Error during search:', error);
                searchResultsDisplay.innerHTML = `Error searching: ${error.message}. Check console for details.`;
                searchResultsDisplay.style.color = 'red';
            }
        };

        // Listen for 'Enter' key press on the input field
        headerSearchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                performSearch();
            }
        });

        // Listen for click on the search icon
        headerSearchButton.addEventListener('click', performSearch);

        // Optional: Clear results when input is cleared
        headerSearchInput.addEventListener('input', () => {
            if (headerSearchInput.value.trim() === '') {
                searchResultsDisplay.style.display = 'none';
                searchResultsDisplay.innerHTML = '';
            }
        });
    }
});