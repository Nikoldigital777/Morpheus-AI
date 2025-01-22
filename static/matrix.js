
document.addEventListener('DOMContentLoaded', () => {
    console.log('matrix.js loaded');

    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    let animationId = null;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-/'.split('');
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array.from({ length: columns }, () => canvas.height);

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0F0';
        ctx.font = `${fontSize}px monospace`;

        drops.forEach((y, i) => {
            const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            const x = i * fontSize;
            ctx.fillText(text, x, y);

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i] += fontSize;
        });
    }

    function animate() {
        drawMatrix();
        animationId = requestAnimationFrame(animate);
    }

    // Clear canvas initially and make it black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Start animation only when red pill button is clicked
    const redPillBtn = document.getElementById('red-pill-btn');
    if (redPillBtn) {
        redPillBtn.addEventListener('click', () => {
            if (!animationId) {
                animate();
            }
        });
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drops.length = Math.floor(canvas.width / fontSize);
        drops.fill(canvas.height);
    });
});
