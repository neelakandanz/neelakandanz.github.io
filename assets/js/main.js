// Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Portfolio Loaded');

    // Smooth Scroll for Anchor Links (with header offset)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
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
});
