(function () {
    const canvas = document.getElementById('scene');
    const ctx = canvas.getContext('2d', { alpha: true });
    let W, H, DPR;

    const particles = [];
    const smoke = [];
    let last = performance.now();

    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = Math.floor(canvas.clientWidth * DPR);
        H = Math.floor(canvas.clientHeight * DPR);
        canvas.width = W;
        canvas.height = H;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    function drawVolcanoBase(alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(0, 0);

        // ground
        ctx.fillStyle = 'rgba(6,6,8,0.85)';
        ctx.fillRect(0, H / 2, canvas.clientWidth, canvas.clientHeight / 2);

        const cx = canvas.clientWidth * 0.55;
        const cy = H / 2 + 18;
        ctx.beginPath();
        ctx.moveTo(cx - 160, cy + 90);
        ctx.quadraticCurveTo(cx - 40, cy - 30, cx, cy - 140);
        ctx.quadraticCurveTo(cx + 40, cy - 30, cx + 160, cy + 90);
        ctx.lineTo(cx + 160, canvas.clientHeight);
        ctx.lineTo(cx - 160, canvas.clientHeight);
        ctx.closePath();

        ctx.fillStyle = '#0b0b0f';
        ctx.fill();

        const ridge = ctx.createLinearGradient(cx - 160, cy - 140, cx + 160, cy + 140);
        ridge.addColorStop(0, 'rgba(255,90,26,0.04)');
        ridge.addColorStop(1, 'rgba(255,184,107,0.02)');
        ctx.fillStyle = ridge;
        ctx.fill();

        ctx.restore();
    }

    let lavaOffset = 0;
    function drawLava() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const cx = width * 0.55;
        const baseY = height / 2 + 20;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - 40, baseY - 80);
        ctx.bezierCurveTo(cx - 20, baseY - 30, cx - 20, baseY + 20, cx - 10, baseY + 80);
        ctx.lineTo(cx + 60, height);
        ctx.lineTo(cx - 120, height);
        ctx.closePath();

        const g = ctx.createLinearGradient(0, baseY - 120 + lavaOffset, 0, height);
        g.addColorStop(0, 'rgba(255,200,120,0.12)');
        g.addColorStop(0.2, 'rgba(255,120,60,0.18)');
        g.addColorStop(0.5, 'rgba(255,80,22,0.95)');
        g.addColorStop(0.85, 'rgba(255,145,60,0.25)');
        g.addColorStop(1, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx - 18, baseY - 70);
        ctx.bezierCurveTo(cx - 8, baseY - 40, cx - 8, baseY - 5, cx + 6, baseY + 60);
        ctx.lineTo(cx + 30, height);
        ctx.lineTo(cx - 90, height);
        ctx.closePath();
        const core = ctx.createLinearGradient(0, baseY - 100 + lavaOffset, 0, height);
        core.addColorStop(0, 'rgba(255,200,120,0.18)');
        core.addColorStop(0.3, 'rgba(255,120,40,0.6)');
        core.addColorStop(0.6, 'rgba(255,40,0,0.9)');
        core.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = core;
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(255,90,26,0.8)';
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();

        lavaOffset += 0.8;
        if (lavaOffset > 200) lavaOffset = 0;
    }

    function spawnParticle() {
        const width = canvas.clientWidth;
        const cx = width * 0.55;
        const xNoise = (Math.random() - 0.5) * 70;
        const p = {
            x: cx + xNoise,
            y: canvas.clientHeight * 0.45 + (Math.random() * 40 - 20),
            vx: (Math.random() - 0.5) * 0.6,
            vy: - (0.6 + Math.random() * 1.6),
            r: 2 + Math.random() * 3,
            life: 120 + Math.random() * 120,
            age: 0,
            hue: 20 + Math.random() * 20
        };
        particles.push(p);
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += dt;
            p.x += p.vx * dt * 0.6;
            p.y += p.vy * dt * 0.6;
            p.vy += 0.003 * dt;
            if (p.age > p.life) particles.splice(i, 1);
        }
        const target = Math.min(80, Math.floor((canvas.clientWidth / 400) * 40));
        if (particles.length < target && Math.random() < 0.9) spawnParticle();
    }

    function drawParticles() {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of particles) {
            const t = p.age / p.life;
            const alpha = Math.max(0, 1 - t);
            const size = p.r * (1 + 0.6 * t);
            ctx.beginPath();
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
            grad.addColorStop(0, `rgba(255,${120 + Math.floor(p.hue)}, ${20}, ${0.95 * alpha})`);
            grad.addColorStop(0.3, `rgba(255,120,30, ${0.35 * alpha})`);
            grad.addColorStop(1, `rgba(255,120,30, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
        }
        ctx.restore();
    }

    function spawnSmoke() {
        const width = canvas.clientWidth;
        const cx = width * 0.55;
        const s = {
            x: cx + (Math.random() - 0.5) * 110,
            y: canvas.clientHeight * 0.42 + 10 + Math.random() * 10,
            vx: (Math.random() - 0.5) * 0.12,
            vy: -0.07 - Math.random() * 0.12,
            r: 40 + Math.random() * 70,
            life: 4000 + Math.random() * 4000,
            age: 0,
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.002
        };
        smoke.push(s);
    }

    function updateSmoke(dt) {
        for (let i = smoke.length - 1; i >= 0; i--) {
            const s = smoke[i];
            s.age += dt;
            s.x += s.vx * dt * 0.12;
            s.y += s.vy * dt * 0.12;
            s.rot += s.rotV * dt * 0.1;
            if (s.age > s.life) smoke.splice(i, 1);
        }
        if (smoke.length < 6 && Math.random() < 0.016) spawnSmoke();
    }

    function drawSmoke() {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        for (const s of smoke) {
            const t = s.age / s.life;
            const alpha = (1 - t) * 0.28;
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            ctx.beginPath();
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s.r);
            grad.addColorStop(0, `rgba(220,220,220, ${alpha * 0.28})`);
            grad.addColorStop(0.3, `rgba(180,180,180, ${alpha * 0.14})`);
            grad.addColorStop(1, `rgba(0,0,0, 0)`);
            ctx.fillStyle = grad;
            ctx.filter = 'blur(16px)';
            ctx.fillRect(-s.r, -s.r * 0.6, s.r * 2, s.r * 1.2);
            ctx.restore();
        }
        ctx.restore();
    }

    function frame(now) {
        const dt = Math.min(60, now - last);
        last = now;

        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight);
        bg.addColorStop(0, 'rgba(15,12,20,1)');
        bg.addColorStop(1, 'rgba(6,6,8,1)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

        updateSmoke(dt);
        drawSmoke();

        drawVolcanoBase(1.0);
        drawLava();

        updateParticles(dt);
        drawParticles();

        const horizon = ctx.createLinearGradient(0, canvas.clientHeight * 0.54, 0, canvas.clientHeight);
        horizon.addColorStop(0, 'rgba(255,70,20,0.02)');
        horizon.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = horizon;
        ctx.fillRect(0, canvas.clientHeight * 0.52, canvas.clientWidth, canvas.clientHeight * 0.5);

        window.requestAnimationFrame(frame);
    }

    for (let i = 0; i < 18; i++) spawnSmoke();
    for (let i = 0; i < 26; i++) spawnParticle();

    window.requestAnimationFrame(frame);

    document.getElementById('year').textContent = new Date().getFullYear();

    const navlinks = document.querySelectorAll('.navlink');
    const sections = Array.from(navlinks).map(a => document.querySelector(a.getAttribute('href')));
    function onScroll() {
        const y = window.scrollY + window.innerHeight * 0.25;
        let activeIndex = 0;
        sections.forEach((sec, i) => {
            if (sec && sec.offsetTop <= y) activeIndex = i;
        });
        navlinks.forEach((a, i) => a.classList.toggle('active', i === activeIndex));
    }
    window.addEventListener('scroll', onScroll);
    onScroll();

})();

// ---------- FORMULAIRE CONTACT (corrigé sans redirection) ----------
const form = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');

if (form) {
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // empêche toute redirection

        formMessage.textContent = '';
        formMessage.style.color = '';

        const formData = new FormData(form);
        const object = {};
        formData.forEach((value, key) => {
            object[key] = value;
        });
        const json = JSON.stringify(object);

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';

        fetch(form.action, {
            method: form.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: json
        })
            .then(async response => {
                const data = await response.json();
                if (data.success) {
                    formMessage.textContent = '✅ Message envoyé avec succès !';
                    formMessage.style.color = 'lightgreen';
                    form.reset();
                } else {
                    formMessage.textContent = `❌ Erreur : ${data.message || 'Veuillez réessayer.'}`;
                    formMessage.style.color = 'salmon';
                }
            })
            .catch(error => {
                console.error('Erreur lors de l\'envoi:', error);
                formMessage.textContent = '❌ Une erreur est survenue. Veuillez vérifier votre réseau.';
                formMessage.style.color = 'salmon';
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.textContent = 'Envoyer le message';
            });
    });
}
