// ========================================
// ===== PHẦN CÓ THỂ TÙY CHỈNH =====
// ========================================

// 💕 Thông điệp tình yêu - Đổi tên người yêu tại đây!
const LOVER_NAME = "Mia Le"; // Thay "Mia Le" bằng tên người yêu
const MESSAGE = "Will you be my valentine?";
const FULL_MESSAGE = `${LOVER_NAME} ơi,\n${MESSAGE}`;

// Số lượng hạt (tăng nhiều để chữ rõ và đặc hơn)
const PARTICLE_COUNT = 2500;

// Tốc độ nhịp đập (số nhỏ = nhanh hơn)
const HEARTBEAT_SPEED = 0.05;

// ========================================
// ===== CODE CHÍNH - KHÔNG CẦN SỬA =====
// ========================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');

let width, height, centerX, centerY;
let particles = [];
let mouse = { x: 0, y: 0, radius: 80 }; // Giảm radius để tối ưu hiệu suất
let showingMessage = false;
let heartScale = 1;
let heartBeatPhase = 0;
let targetPositions = []; // Vị trí đích cho text
let flowers = []; // Mảng hoa lấp lánh

// Số lượng hoa (giảm để đỡ lag)
const FLOWER_COUNT = 8;

// ===== CLASS HOA LẤP LÁNH =====
class Flower {
    constructor() {
        this.reset();
        // Vị trí ngẫu nhiên ban đầu (cả màn hình)
        this.y = Math.random() * height;
    }

    reset() {
        // Vị trí x ngẫu nhiên
        this.x = Math.random() * width;
        // Bắt đầu từ trên màn hình
        this.y = -20;
        // Kích thước hoa
        this.size = 8 + Math.random() * 12;
        // Số cánh hoa (5 hoặc 6)
        this.petals = Math.random() > 0.5 ? 5 : 6;
        // Màu sắc hoa
        const flowerColors = ['#FFB6C1', '#FFC0CB', '#FF69B4', '#FFD1DC', '#FF1493', '#DB7093'];
        this.color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        // Màu nhụy
        this.centerColor = Math.random() > 0.5 ? '#FFE4E1' : '#FFF8DC';
        // Tốc độ rơi
        this.speedY = 0.3 + Math.random() * 0.7;
        // Tốc độ xoay
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        // Dao động ngang
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.02 + Math.random() * 0.02;
        this.swayAmount = 30 + Math.random() * 20;
        // Hiệu ứng lấp lánh (blink)
        this.blinkOffset = Math.random() * Math.PI * 2;
        this.blinkSpeed = 0.05 + Math.random() * 0.05;
    }

    update() {
        // Di chuyển xuống
        this.y += this.speedY;
        // Dao động ngang như lá rơi
        this.swayOffset += this.swaySpeed;
        // Xoay nhẹ
        this.rotation += this.rotationSpeed;

        // Reset khi ra khỏi màn hình
        if (this.y > height + 30) {
            this.reset();
        }
    }

    draw() {
        const swayX = Math.sin(this.swayOffset) * this.swayAmount;
        const drawX = this.x + swayX;

        // Tính độ sáng lấp lánh
        const blink = 0.5 + Math.sin(Date.now() * this.blinkSpeed + this.blinkOffset) * 0.5;

        ctx.save();
        ctx.translate(drawX, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = 0.6 + blink * 0.4;

        // Vẽ hiệu ứng glow
        ctx.shadowBlur = 15 + blink * 10;
        ctx.shadowColor = this.color;

        // Vẽ các cánh hoa
        for (let i = 0; i < this.petals; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI * 2) / this.petals);

            // Cánh hoa hình ellipse
            ctx.beginPath();
            ctx.ellipse(0, -this.size * 0.4, this.size * 0.35, this.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();

            ctx.restore();
        }

        // Vẽ nhụy hoa ở giữa
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = this.centerColor;
        ctx.fill();

        // Thêm điểm sáng lấp lánh
        if (blink > 0.7) {
            ctx.beginPath();
            ctx.arc(this.size * 0.1, -this.size * 0.1, this.size * 0.08, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Khởi tạo hoa
function initFlowers() {
    flowers = [];
    for (let i = 0; i < FLOWER_COUNT; i++) {
        flowers.push(new Flower());
    }
}

// Resize canvas theo kích thước màn hình
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
}

// Tạo tọa độ hình trái tim (phương trình tham số)
function getHeartPosition(t, scale = 1) {
    // Phương trình trái tim kinh điển
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));

    const heartSize = Math.min(width, height) * 0.018 * scale;
    return {
        x: centerX + x * heartSize,
        y: centerY + y * heartSize - 20
    };
}

// Class Particle - Mỗi hạt sáng trong animation
class Particle {
    constructor(index) {
        this.index = index;

        // Vị trí ngẫu nhiên ban đầu
        this.x = Math.random() * width;
        this.y = Math.random() * height;

        // Vị trí đích trên trái tim
        const t = (index / PARTICLE_COUNT) * Math.PI * 2;
        const pos = getHeartPosition(t);
        this.targetX = pos.x;
        this.targetY = pos.y;
        this.baseTargetX = pos.x;
        this.baseTargetY = pos.y;

        // Thuộc tính vật lý
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.92;
        this.springStrength = 0.03 + Math.random() * 0.02;

        // Thuộc tính hiển thị
        this.size = 2 + Math.random() * 3;
        this.baseSize = this.size;

        // Màu sắc ngẫu nhiên từ palette
        const colors = ['#FFD1DC', '#FFF0F5', '#FFB6C1', '#FF69B4'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 0.6 + Math.random() * 0.4;

        // Offset cho hiệu ứng lấp lánh
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update() {
        // Tính toán lực đàn hồi về vị trí đích
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        this.vx += dx * this.springStrength;
        this.vy += dy * this.springStrength;

        // Hiệu ứng đẩy khi chuột gần (tối ưu hóa)
        if (!showingMessage) {
            const mouseDistX = this.x - mouse.x;
            const mouseDistY = this.y - mouse.y;
            const mouseDistSq = mouseDistX * mouseDistX + mouseDistY * mouseDistY;
            const radiusSq = mouse.radius * mouse.radius;

            if (mouseDistSq < radiusSq) {
                const mouseDist = Math.sqrt(mouseDistSq);
                const force = (mouse.radius - mouseDist) / mouse.radius * 3;
                const angle = Math.atan2(mouseDistY, mouseDistX);
                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;

                // Đổi màu khi bị đẩy
                this.color = '#FFFFFF'; // Trắng lấp lánh
            }
        }

        // Áp dụng ma sát và cập nhật vị trí
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

        // Hiệu ứng lấp lánh
        this.size = this.baseSize + Math.sin(Date.now() * 0.005 + this.twinkleOffset) * 0.5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();

        // Thêm hiệu ứng glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    // Cập nhật vị trí đích (cho nhịp đập hoặc chuyển sang text)
    updateTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
        // Reset màu về palette gốc
        const colors = ['#FFD1DC', '#FFF0F5', '#FFB6C1', '#FF69B4'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
}

// Khởi tạo các hạt
function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(i));
    }
}

// Tạo tọa độ từ text message
function getTextPositions(text) {
    const positions = [];
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const fontSize = Math.min(width * 0.08, 70); // Font vừa phải để cân bằng
    tempCanvas.width = width;
    tempCanvas.height = height;

    tempCtx.font = `bold ${fontSize}px 'Dancing Script', cursive`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = 'white';

    // Vẽ từng dòng
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.5;
    const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
        tempCtx.fillText(line, centerX, startY + index * lineHeight);
    });

    // Lấy pixel data
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Lấy mẫu các điểm ảnh
    const gap = 3; // Khoảng cách cân bằng
    for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
            const i = (y * width + x) * 4;
            if (data[i + 3] > 128) { // Nếu điểm ảnh không trong suốt
                positions.push({ x, y });
            }
        }
    }

    return positions;
}

// Chuyển đổi sang hiển thị message
function showMessage() {
    if (showingMessage) return;
    showingMessage = true;
    hint.style.opacity = '0';

    targetPositions = getTextPositions(FULL_MESSAGE);

    // Gán vị trí mới cho các hạt
    particles.forEach((particle, index) => {
        if (index < targetPositions.length) {
            const pos = targetPositions[index];
            particle.updateTarget(pos.x, pos.y);
        } else {
            // Hạt thừa bay ra ngoài màn hình
            particle.updateTarget(
                Math.random() * width,
                Math.random() < 0.5 ? -50 : height + 50
            );
        }
    });

    // Thêm hiệu ứng pháo hoa nhỏ
    createSparkles();

    // Hiện nút mời đi date sau 2 giây
    setTimeout(() => {
        document.getElementById('dateBtn').classList.add('show');
    }, 2000);
}

// Hiệu ứng pháo hoa khi click
function createSparkles() {
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const sparkle = {
                x: centerX + (Math.random() - 0.5) * 200,
                y: centerY + (Math.random() - 0.5) * 200,
                size: Math.random() * 4 + 2,
                alpha: 1,
                color: ['#FFD700', '#FF69B4', '#FFF'][Math.floor(Math.random() * 3)]
            };

            const animate = () => {
                sparkle.alpha -= 0.02;
                sparkle.size += 0.1;

                if (sparkle.alpha > 0) {
                    ctx.beginPath();
                    ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
                    ctx.fillStyle = sparkle.color;
                    ctx.globalAlpha = sparkle.alpha;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }, i * 50);
    }
}

// Cập nhật nhịp đập trái tim
function updateHeartbeat() {
    if (showingMessage) return;

    heartBeatPhase += HEARTBEAT_SPEED;
    heartScale = 1 + Math.sin(heartBeatPhase) * 0.05;

    // Cập nhật vị trí đích theo nhịp đập
    particles.forEach((particle, index) => {
        const t = (index / PARTICLE_COUNT) * Math.PI * 2;
        const pos = getHeartPosition(t, heartScale);
        particle.baseTargetX = pos.x;
        particle.baseTargetY = pos.y;
        particle.targetX = pos.x;
        particle.targetY = pos.y;
    });
}

// Vòng lặp animation chính
function animate() {
    // Xóa canvas với độ trong suốt để tạo hiệu ứng trail
    ctx.fillStyle = 'rgba(44, 14, 20, 0.15)';
    ctx.fillRect(0, 0, width, height);

    updateHeartbeat();

    // Cập nhật và vẽ hoa lấp lánh (vẽ trước để nằm phía sau)
    flowers.forEach(flower => {
        flower.update();
        flower.draw();
    });

    // Cập nhật và vẽ từng hạt
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    requestAnimationFrame(animate);
}

// Xử lý sự kiện chuột
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener('click', showMessage);

// Xử lý sự kiện touch cho mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
});

canvas.addEventListener('touchend', showMessage);

// Xử lý resize
window.addEventListener('resize', () => {
    resize();
    // Tái tính toán vị trí
    if (!showingMessage) {
        particles.forEach((particle, index) => {
            const t = (index / PARTICLE_COUNT) * Math.PI * 2;
            const pos = getHeartPosition(t);
            particle.baseTargetX = pos.x;
            particle.baseTargetY = pos.y;
            particle.targetX = pos.x;
            particle.targetY = pos.y;
        });
    }
});

// Khởi động!
resize();
initParticles();
initFlowers(); // Khởi tạo hoa lấp lánh
animate();

// Log thông điệp lãng mạn vào console 💕
console.log('%c💕 Made with love for ' + LOVER_NAME + ' 💕',
    'color: #FF69B4; font-size: 20px; font-weight: bold;');

// ========================================
// ===== XỬ LÝ LỜI MỜI ĐI DATE =====
// ========================================

// 1. Nút mở thư mời
const dateBtn = document.getElementById('dateBtn');
const letterSection = document.getElementById('letterSection');

dateBtn.addEventListener('click', () => {
    // Cuộn xuống phần thư mời
    letterSection.scrollIntoView({ behavior: 'smooth' });
    // Ẩn nút đi
    dateBtn.classList.remove('show');
});

// 2. Nút "Có chứ!" - Bắn pháo giấy (Confetti)
const yesBtn = document.getElementById('yesBtn');
const confettiCanvas = document.getElementById('confetti');
const confettiCtx = confettiCanvas.getContext('2d');

let confettiParticles = [];
let confettiAnimationId;

yesBtn.addEventListener('click', () => {
    confettiCanvas.style.display = 'block';
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    // Tạo mưa pháo giấy
    createConfetti();
    animateConfetti();

    // Thông báo đáng yêu
    alert('Yay! Anh sẽ đón em vào 6h tối nhé! Yêu em! 💖');
    yesBtn.innerHTML = "Hẹn gặp em! 😘";
});

function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#FF69B4', '#FFD700'];
    for (let i = 0; i < 300; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((p, index) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rotation * Math.PI / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        confettiCtx.restore();

        // Reset khi rơi xuống đáy
        if (p.y > confettiCanvas.height) {
            p.y = -20;
            p.x = Math.random() * confettiCanvas.width;
        }
    });

    confettiAnimationId = requestAnimationFrame(animateConfetti);

    // Dừng sau 5 giây để tiết kiệm hiệu năng
    setTimeout(() => {
        cancelAnimationFrame(confettiAnimationId);
        confettiCanvas.style.display = 'none';
        confettiParticles = [];
    }, 8000);
}

// 3. Nút "Suy nghĩ..." - Chạy trốn khi hover
const maybeBtn = document.getElementById('maybeBtn');

maybeBtn.addEventListener('mouseover', () => {
    const x = Math.random() * (window.innerWidth - maybeBtn.offsetWidth);
    const y = Math.random() * (window.innerHeight - maybeBtn.offsetHeight);

    maybeBtn.style.position = 'fixed';
    maybeBtn.style.left = `${x}px`;
    maybeBtn.style.top = `${y}px`;
});

// Hỗ trợ cả touch cho điện thoại
maybeBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Ngăn click
    const x = Math.random() * (window.innerWidth - maybeBtn.offsetWidth);
    const y = Math.random() * (window.innerHeight - maybeBtn.offsetHeight);

    maybeBtn.style.position = 'fixed';
    maybeBtn.style.left = `${x}px`;
    maybeBtn.style.top = `${y}px`;
});
