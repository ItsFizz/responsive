// Smooth entrance animations on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.purpose-card, .value-card, .team-card, .process-step');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });


        // Purpose Card Modals
        const purposeCards = document.querySelectorAll('.purpose-card[data-modal]');
        const modals = document.querySelectorAll('.purpose-modal');
        const modalCloses = document.querySelectorAll('.modal-close');
        const modalOverlays = document.querySelectorAll('.modal-overlay');

        // Open modal when card is clicked
        purposeCards.forEach(card => {
            card.addEventListener('click', () => {
                const modalId = card.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent body scroll
                }
            });
        });

        // Close modal when close button is clicked
        modalCloses.forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.purpose-modal').classList.remove('active');
                document.body.style.overflow = ''; // Restore body scroll
            });
        });

        // Close modal when overlay is clicked
        modalOverlays.forEach(overlay => {
            overlay.addEventListener('click', () => {
                overlay.closest('.purpose-modal').classList.remove('active');
                document.body.style.overflow = ''; // Restore body scroll
            });
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modals.forEach(modal => {
                    if (modal.classList.contains('active')) {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
            }
        });

        // Prevent modal content clicks from closing modal
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
