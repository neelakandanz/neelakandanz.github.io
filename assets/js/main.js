// Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Portfolio Loaded');

    // ===== HEADER SCROLL EFFECT =====
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ===== LENIS SMOOTH SCROLL =====
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Smooth Scroll for Anchor Links (with header offset)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;

                // Use Lenis for smooth scrolling
                lenis.scrollTo(target, {
                    offset: -headerOffset,
                    duration: 1.5,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });

                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                const navToggle = document.querySelector('.nav-toggle');
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            }
        });
    });

    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Failsafe: Ensure everything is visible after a short delay
    // This handles cases where the observer might miss elements or JS loads late
    setTimeout(() => {
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            if (!el.classList.contains('visible')) {
                el.classList.add('visible');
            }
        });
    }, 1000);

    // ===== ROTATING TEXT ANIMATION =====
    const rotatingText = document.querySelector('.rotating-text');

    if (rotatingText) {
        const words = ['Mobile', 'Web', 'Desktop', 'API'];
        let currentIndex = 0;

        function rotateText() {
            // Fade out
            rotatingText.classList.add('fade-out');
            rotatingText.classList.remove('fade-in');

            setTimeout(() => {
                // Change to next word
                currentIndex = (currentIndex + 1) % words.length;
                rotatingText.textContent = words[currentIndex];

                // Fade in
                rotatingText.classList.remove('fade-out');
                rotatingText.classList.add('fade-in');
            }, 400);
        }

        // Start rotation every 3 seconds
        setInterval(rotateText, 3000);
    }
    // ===== GOOGLE SHEETS FORM LOGIC =====
    const sendBtn = document.getElementById("sendButton");
    const messageInput = document.getElementById("userMessageInput");

    // Only run if elements exist on this page
    if (sendBtn && messageInput) {

        // *** PASTE YOUR GOOGLE APPS SCRIPT URL HERE ***
        const scriptURL = 'https://script.google.com/macros/s/AKfycbxYRWKWjAVwkHRPNCRwfSguQ0JT5mCWobpj5aQx4nYPdR_LVKnLz3_Qd-o-v2OV9mw/exec';

        sendBtn.addEventListener("click", () => {
            const messageText = messageInput.value;
            const originalIcon = sendBtn.innerHTML; // Save the arrow icon

            if (messageText.trim() === "") {
                alert("Please type a message first!");
                return;
            }

            // Visual Feedback: Change arrow to a spinner
            sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            sendBtn.disabled = true;
            sendBtn.style.cursor = "wait";

            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ message: messageText })
            })
                .then(response => {
                    alert("Message sent successfully!");
                    messageInput.value = ""; // Clear input
                    sendBtn.innerHTML = originalIcon; // Restore arrow
                    sendBtn.disabled = false;
                    sendBtn.style.cursor = "pointer";
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    alert("Error sending message.");
                    sendBtn.innerHTML = originalIcon;
                    sendBtn.disabled = false;
                    sendBtn.style.cursor = "pointer";
                });
        });
    }
    // End of Google Sheets Logic
});
