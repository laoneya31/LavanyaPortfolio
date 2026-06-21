/* ============================================================
   MAIN.JS — Lavanya's Portfolio
   Progressive enhancement only. Every page works without this
   file; the code below just layers convenience on top. Each
   block is guarded so missing elements are simply skipped.
   ============================================================ */

(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


    /* --------------------------------------------------------
       1. MOBILE NAV DISCLOSURE (<details class="nav_disclosure">)
       No-JS baseline: native <details> toggle. JS keeps it in
       sync with the breakpoint and closes it on link / outside
       click. Desktop needs [open] so the nav renders inline.
       -------------------------------------------------------- */
    (function mobileNav() {
        var nav = document.querySelector('.nav_disclosure');
        if (!nav) { return; }

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


    /* --------------------------------------------------------
       2. REUSABLE CAROUSEL
       Shared by the home featured-project carousel and the
       about-page photo carousel. Native scroll-snap is the
       no-JS baseline; this wires the prev/next arrows, dims
       them at the track ends, and (if present) updates a
       "Photo X of Y" live region.
       -------------------------------------------------------- */
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


    /* --------------------------------------------------------
       3. PROJECT DISCIPLINE FILTER (projects.html)
       -------------------------------------------------------- */
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


    /* --------------------------------------------------------
       4. CONTACT FORM VALIDATION (contact.html)
       Browser-native validation is the no-JS baseline; here we
       take over with inline messages + an aria-live status.
       -------------------------------------------------------- */
    (function contactForm() {
        var form = document.querySelector('.contact_form');
        if (!form) { return; }

        var status = form.querySelector('.form_status');
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Take over validation now that JS is available.
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
            // Valid — let the mailto fallback (or real endpoint) proceed.
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


    /* --------------------------------------------------------
       5. COPY-TO-CLIPBOARD (contact.html)
       -------------------------------------------------------- */
    (function copyEmail() {
        var buttons = document.querySelectorAll('.copy_email_btn');
        if (!buttons.length) { return; }

        buttons.forEach(function (btn) {
            var original = btn.textContent;
            var text = btn.getAttribute('data-copy') || '';

            btn.addEventListener('click', function () {
                var done = function () {
                    btn.textContent = 'Copied!';
                    setTimeout(function () { btn.textContent = original; }, 2000);
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(function () {
                        btn.textContent = 'Press Ctrl+C';
                        setTimeout(function () { btn.textContent = original; }, 2000);
                    });
                } else {
                    // Very old browsers: select-and-copy fallback.
                    var temp = document.createElement('textarea');
                    temp.value = text;
                    document.body.appendChild(temp);
                    temp.select();
                    try { document.execCommand('copy'); done(); } catch (err) { /* no-op */ }
                    document.body.removeChild(temp);
                }
            });
        });
    })();


    /* --------------------------------------------------------
       6. SCROLL-REVEAL — ethos grid (about.html)
       Items are visible by default; only animate when motion is
       allowed and IntersectionObserver is supported.
       -------------------------------------------------------- */
    (function scrollReveal() {
        var grid = document.querySelector('.ethos_keywords');
        if (!grid) { return; }

        var items = grid.querySelectorAll('.reveal_item');
        if (!items.length) { return; }

        if (reduceMotion || !('IntersectionObserver' in window)) {
            return; // leave everything visible, no animation
        }

        grid.classList.add('js_reveal');

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var index = Array.prototype.indexOf.call(items, el);
                    el.style.transitionDelay = (index % 3) * 0.08 + 's';
                    el.classList.add('is_revealed');
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.2 });

        items.forEach(function (item) { observer.observe(item); });
    })();


    /* --------------------------------------------------------
       7. READING PROGRESS BAR (project detail pages)
       -------------------------------------------------------- */
    (function readingProgress() {
        var bar = document.querySelector('.reading_progress');
        if (!bar) { return; }

        function update() {
            var doc = document.documentElement;
            var max = doc.scrollHeight - doc.clientHeight;
            var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
            bar.style.width = pct + '%';
        }

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    })();


    /* --------------------------------------------------------
       8. BACK TO TOP (project detail pages)
       -------------------------------------------------------- */
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
