// FAQ Page JavaScript - Category Filtering and Accordion

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== Category Filtering =====
    const categoryCards = document.querySelectorAll('.category-card');
    const faqItems = document.querySelectorAll('.faq-item');

    // Category filter functionality
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            categoryCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Get selected category
            const selectedCategory = this.getAttribute('data-category');
            
            // Filter FAQ items based on category
            faqItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (itemCategory === selectedCategory) {
                    // Show items in this category
                    item.style.display = 'block';
                    
                    // Add fade-in animation
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    // Hide items not in this category
                    item.style.display = 'none';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                }
                
                // Close any open FAQ items when switching categories
                item.classList.remove('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) {
                    answer.style.maxHeight = '0px';
                }
            });
        });
    });

    // ===== FAQ Accordion with Smooth Animation =====
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items in same category
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = '0px';
                        }
                    }
                });
                
                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                    answer.style.maxHeight = '0px';
                } else {
                    item.classList.add('active');
                    const contentHeight = answer.scrollHeight;
                    answer.style.maxHeight = contentHeight + 'px';
                    
                    // Smooth scroll to question
                    setTimeout(() => {
                        question.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest'
                        });
                    }, 100);
                }
            });
        }
    });

    // ===== Keyboard Navigation for FAQ Accordion =====
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach((question, index) => {
        // Add tabindex for accessibility
        if (!question.hasAttribute('tabindex')) {
            question.setAttribute('tabindex', '0');
        }
        
        question.addEventListener('keydown', function(e) {
            // Enter or Space to toggle
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
            
            // Arrow Down to next question
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextQuestion = faqQuestions[index + 1];
                if (nextQuestion) {
                    nextQuestion.focus();
                }
            }
            
            // Arrow Up to previous question
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevQuestion = faqQuestions[index - 1];
                if (prevQuestion) {
                    prevQuestion.focus();
                }
            }
        });
    });

    // ===== Smooth Scroll for Anchor Links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // ===== Initial state: Show General category =====
    const initialCategory = document.querySelector('.category-card.active');
    if (initialCategory) {
        const selectedCategory = initialCategory.getAttribute('data-category');
        faqItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            if (itemCategory !== selectedCategory) {
                item.style.display = 'none';
            }
        });
    }

    // ===== Mobile Navigation Toggle =====
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // ===== Update Time =====
    function updateTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
        const timeElement = document.querySelector('.nav-time');
        if (timeElement) {
            timeElement.textContent = `${displayHours}:${displayMinutes} ${ampm}`;
        }
    }
    
    updateTime();
    setInterval(updateTime, 60000);

    // ===== Navbar Scroll Effect =====
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }

    // ===== Scroll Reveal Animation =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    console.log('FAQ page initialized successfully!');
    console.log('Total FAQ items:', faqItems.length);
    console.log('Total categories:', categoryCards.length);
});
