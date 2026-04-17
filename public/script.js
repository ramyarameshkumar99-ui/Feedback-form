document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    const form = document.getElementById('feedbackForm');
    const submitBtn = document.getElementById('submitBtn');
    const loader = document.getElementById('loader');
    const statusMessage = document.getElementById('statusMessage');

    // Star Rating Interaction
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            ratingValue.value = value;
            
            // Highlight selected stars
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= parseInt(value)) {
                    s.classList.add('selected');
                } else {
                    s.classList.remove('selected');
                }
            });
        });
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const rating = ratingValue.value;
        const experience = document.getElementById('experience').value;

        // basic client-side check for rating
        if (rating === "0") {
            showMessage('Please select a rating before submitting.', 'error');
            return;
        }

        // UI State: Loading
        submitBtn.disabled = true;
        loader.style.display = 'inline-block';
        submitBtn.querySelector('span').textContent = 'Submitting...';
        statusMessage.textContent = '';

        try {
            const response = await fetch('/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, rating: parseInt(rating), experience })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Success! Thank you for your feedback.', 'success');
                form.reset();
                stars.forEach(s => s.classList.remove('selected'));
                ratingValue.value = "0";
            } else {
                showMessage(data.error || 'Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showMessage('Network error. Is the server running?', 'error');
        } finally {
            submitBtn.disabled = false;
            loader.style.display = 'none';
            submitBtn.querySelector('span').textContent = 'Send Feedback';
        }
    });

    function showMessage(text, type) {
        statusMessage.textContent = text;
        statusMessage.className = `status-message ${type}`;
        
        // Auto-clear message after 5 seconds
        setTimeout(() => {
            statusMessage.textContent = '';
        }, 5000);
    }
});
