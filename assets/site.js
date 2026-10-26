// Shared ProFinish site behavior: mobile menu, dropdowns, footer year.
(function () {
    var menu = document.getElementById('pf-menu');
    var openBtn = document.getElementById('pf-menu-open');
    var closeBtn = document.getElementById('pf-menu-close');

    function setMenu(open) {
        if (!menu) return;
        if (open) {
            menu.hidden = false;
            document.body.classList.add('pf-menu-open');
            if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
            if (closeBtn) closeBtn.focus();
        } else {
            menu.hidden = true;
            document.body.classList.remove('pf-menu-open');
            if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); openBtn.focus(); }
        }
    }

    if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
    if (menu) {
        menu.addEventListener('click', function (e) {
            if (e.target.closest('a')) setMenu(false);
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (menu && !menu.hidden) setMenu(false);
            document.querySelectorAll('.pf-dd.is-open').forEach(function (dd) { dd.classList.remove('is-open'); });
        }
    });

    // Dropdown buttons also work on click/tap (tablets, keyboard users).
    document.querySelectorAll('.pf-dd').forEach(function (dd) {
        var btn = dd.querySelector('.pf-dd-btn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var open = !dd.classList.contains('is-open');
            document.querySelectorAll('.pf-dd.is-open').forEach(function (o) {
                o.classList.remove('is-open');
                var b = o.querySelector('.pf-dd-btn'); if (b) b.setAttribute('aria-expanded', 'false');
            });
            dd.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.pf-dd')) {
            document.querySelectorAll('.pf-dd.is-open').forEach(function (o) { o.classList.remove('is-open'); });
        }
    });

    document.querySelectorAll('[data-pf-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
