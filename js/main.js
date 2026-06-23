(function () {
    'use strict';

    // Uses the prefers-reduced-motion media feature to respect the user's OS-level motion preference.
    // https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


    (function mobileNav() {
        var nav = document.querySelector('.nav_disclosure');
        if (!nav) { return; }

        // Uses matchMedia to sync JS behavior to a CSS breakpoint referenced by https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
        var mobile = window.matchMedia('(max-width: 600px)');

        function sync() {
            // Desktop: force open so the inline nav shows.
            // Mobile: start collapsed.
            nav.open = !mobile.matches;
        }
        sync();

        // Close the menu (mobile only) after choosing a destination.
        nav.querySelectorAll('.nav_link').forEach(function (link) {
            link.addEventListener('click', function () {
                if (mobile.matches) { nav.open = false; }
            });
        });

        // Close on click outside the menu (mobile only).
        document.addEventListener('click', function (e) {
            if (mobile.matches && nav.open && !nav.contains(e.target)) {
                nav.open = false;
            }
        });

        // Re-sync when crossing the breakpoint.
        if (mobile.addEventListener) {
            mobile.addEventListener('change', sync);
        } else if (mobile.addListener) {
            mobile.addListener(sync); // older Safari
        }
    })();


    function initCarousel(trackSelector, options) {
        options = options || {};
        var itemsPerView = options.itemsPerView || 1;

        var track = document.querySelector(trackSelector);
        if (!track || track.dataset.carouselInit) { return; }
        track.dataset.carouselInit = '1';

        var container = track.parentElement;
        var prev = container.querySelector('.carousel_arrow_prev');
        var next = container.querySelector('.carousel_arrow_next');
        var firstItem = track.firstElementChild;
        if (!prev || !next || !firstItem) { return; }

        var status = container.querySelector('.carousel_status');

        function step() {
            var styles = getComputedStyle(track);
            var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
            return (firstItem.getBoundingClientRect().width + gap) * itemsPerView;
        }

        function updateStatus() {
            if (!status) { return; }
            var total = track.children.length;
            if (!total) { return; }
            var idx = Math.round(track.scrollLeft / (track.scrollWidth / total)) + 1;
            idx = Math.max(1, Math.min(total, idx));
            var label = status.getAttribute('data-label') || 'Item';
            status.textContent = label + ' ' + idx + ' of ' + total;
        }

        function update() {
            var maxScroll = track.scrollWidth - track.clientWidth;
            prev.disabled = track.scrollLeft <= 1;
            next.disabled = track.scrollLeft >= maxScroll - 1;
            updateStatus();
        }

        prev.addEventListener('click', function () {
            track.scrollBy({ left: -step(), behavior: 'smooth' });
        });
        next.addEventListener('click', function () {
            track.scrollBy({ left: step(), behavior: 'smooth' });
        });

        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    // Home featured-project carousel (3 visible, scrolls one card per click)
    initCarousel('.project_carousel .carousel_track', { itemsPerView: 1 });
    // About photo carousel (one tall photo per view)
    initCarousel('.photo_carousel_track', { itemsPerView: 1 });



    // Adapted the show/hide-by-category approach from a tutorial on filtering lists with JS. learnt via https://www.w3schools.com/howto/howto_js_filter_lists.asp
    (function projectFilter() {
        var radios = document.querySelectorAll('input[name="discipline"]');
        if (!radios.length) { return; }

        var cards = document.querySelectorAll('.project_card[data-discipline]');

        function apply(value) {
            cards.forEach(function (card) {
                var show = value === 'all' || card.dataset.discipline === value;
                card.classList.toggle('is_hidden', !show);
            });
        }

        radios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                if (radio.checked) { apply(radio.value); }
            });
        });
    })();


    // Implements form validation instead of relying on default browser error bubbles.
    // learnt from https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
    (function contactForm() {
        var form = document.querySelector('.contact_form');
        if (!form) { return; }

        var status = form.querySelector('.form_status');
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        form.noValidate = true;

        function fieldError(field, message) {
            var span = field.getAttribute('aria-describedby');
            var box = span ? document.getElementById(span) : null;
            if (box) { box.textContent = message || ''; }
            field.setAttribute('aria-invalid', message ? 'true' : 'false');
        }

        function validate() {
            var ok = true;
            var name = form.elements['name'];
            var email = form.elements['email'];
            var message = form.elements['message'];

            if (!name.value.trim()) { fieldError(name, 'Please enter your name.'); ok = false; }
            else { fieldError(name, ''); }

            if (!email.value.trim()) { fieldError(email, 'Please enter your email.'); ok = false; }
            else if (!emailPattern.test(email.value.trim())) {
                fieldError(email, 'Please enter a valid email address.'); ok = false;
            } else { fieldError(email, ''); }

            if (!message.value.trim()) { fieldError(message, 'Please enter a message.'); ok = false; }
            else { fieldError(message, ''); }

            return ok;
        }

        // Clear an error as the user corrects the field.
        ['name', 'email', 'message'].forEach(function (n) {
            var field = form.elements[n];
            if (field) {
                field.addEventListener('input', function () { fieldError(field, ''); });
            }
        });

        form.addEventListener('submit', function (e) {
            if (!validate()) {
                e.preventDefault();
                if (status) { status.textContent = 'Please fix the highlighted fields and try again.'; }
                var firstInvalid = form.querySelector('[aria-invalid="true"]');
                if (firstInvalid) { firstInvalid.focus(); }
                return;
            }
            // Valid — let the mailto fallback proceed.
            if (status) { status.textContent = 'Thanks! Opening your email client to send the message…'; }
        });

        form.addEventListener('reset', function () {
            ['name', 'email', 'message'].forEach(function (n) {
                var field = form.elements[n];
                if (field) { fieldError(field, ''); }
            });
            if (status) { status.textContent = ''; }
        });
    })();


  
    // Uses window.scrollTo with smooth-scroll behavior, disabled when reduced motion is preferred.
    // learnt from https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo
    (function backToTop() {
        var btn = document.querySelector('.back_to_top');
        if (!btn) { return; }

        function update() {
            btn.classList.toggle('is_visible', window.scrollY > window.innerHeight * 0.6);
        }

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });

        window.addEventListener('scroll', update, { passive: true });
        update();
    })();

})();
