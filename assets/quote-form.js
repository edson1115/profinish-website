// Quote request form (homepage and contact page).
// Photos upload through one-time signed URLs from /api/upload-url; the lead is
// saved and emailed by /api/leads.
(function () {
    var form = document.getElementById('quote-form');
    if (!form) return;

    var SUPABASE_URL = 'https://qzlxhrbuaouaslxsvycd.supabase.co';
    // Public "anon" key. It is safe in the browser; what it can do is limited by
    // the database's row-level security rules.
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bHhocmJ1YW91YXNseHN2eWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTM1ODYsImV4cCI6MjA4OTI2OTU4Nn0.ITe6JRomof5tda44t0fmonUBCJoh3W-F0cY57R2RaWM';
    var MAX_FILES = 3;
    var MAX_BYTES = 10 * 1024 * 1024;

    var fileInput = document.getElementById('images');
    var fileNames = document.getElementById('file-names');
    var submitBtn = document.getElementById('submit-btn');
    var btnText = submitBtn.querySelector('span');
    var formMessage = document.getElementById('form-message');

    function show(msg, ok) {
        formMessage.className = 'text-center mt-4 text-sm font-bold ' + (ok ? 'text-green-400' : 'text-red-400');
        formMessage.textContent = msg;
    }

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            var files = Array.prototype.slice.call(fileInput.files);
            var problem = null;
            if (files.length > MAX_FILES) problem = 'Choose up to ' + MAX_FILES + ' photos.';
            files.forEach(function (f) { if (f.size > MAX_BYTES) problem = f.name + ' is larger than 10 MB.'; });
            if (problem) {
                fileInput.value = '';
                fileNames.textContent = '';
                show(problem, false);
                return;
            }
            formMessage.textContent = '';
            fileNames.textContent = files.length ? 'Selected: ' + files.map(function (f) { return f.name; }).join(', ') : '';
        });
    }

    async function uploadPhotos(files) {
        var res = await fetch('/api/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: files.map(function (f) { return { name: f.name, type: f.type, size: f.size }; }) })
        });
        var info = await res.json();
        if (!info.ok) throw new Error(info.error || 'Upload not available');
        if (!window.supabase) throw new Error('Upload library did not load');
        var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        var urls = [];
        for (var i = 0; i < files.length; i++) {
            var u = info.uploads[i];
            var result = await client.storage.from(info.bucket).uploadToSignedUrl(u.path, u.token, files[i], { contentType: files[i].type });
            if (result.error) throw result.error;
            urls.push(u.publicUrl);
        }
        return urls;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;

        var originalText = btnText.textContent;
        submitBtn.disabled = true;
        btnText.textContent = 'Sending...';
        formMessage.textContent = '';
        var fd = new FormData(form);

        try {
            var imageUrls = [];
            var imageNote = '';
            var files = fileInput ? Array.prototype.slice.call(fileInput.files) : [];
            if (files.length) {
                btnText.textContent = 'Uploading photos...';
                try {
                    imageUrls = await uploadPhotos(files);
                } catch (err) {
                    console.error('Photo upload failed, sending without photos:', err);
                    imageNote = '\n\n[Customer attached photos but the upload failed. Ask them to text the photos.]';
                }
                btnText.textContent = 'Sending...';
            }

            var fleetType = fd.get('fleet_type');
            var res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'leads',
                    website: fd.get('website') || '',
                    data: {
                        customer_name: fd.get('name'),
                        customer_email: fd.get('email'),
                        customer_phone: fd.get('phone'),
                        service_needed: fd.get('service'),
                        vin: fd.get('vin'),
                        license_plate: fd.get('license_plate'),
                        vehicle_info: (fleetType ? '[' + fleetType + '] ' : '') + (fd.get('vehicle_info') || ''),
                        message: (fd.get('message') || '') + imageNote,
                        image_urls: imageUrls
                    }
                })
            });
            var result = await res.json().catch(function () { return {}; });
            if (!result.ok) throw new Error(result.error || 'Request failed');

            form.reset();
            if (fileNames) fileNames.textContent = '';
            show('Request sent. We\'ll reply with your quote shortly. Need it faster? Call (830) 356-3456.', true);
            btnText.textContent = 'Sent';
            if (window.gtag) window.gtag('event', 'generate_lead', { form: 'quote' });
            setTimeout(function () { submitBtn.disabled = false; btnText.textContent = originalText; }, 4000);
        } catch (err) {
            console.error('Form error:', err);
            show(err && err.message && err.message.length < 140 && err.message !== 'Failed to fetch'
                ? err.message
                : 'Your request didn\'t go through. Check your connection and try again, or call (830) 356-3456.', false);
            submitBtn.disabled = false;
            btnText.textContent = originalText;
        }
    });
})();
