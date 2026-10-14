const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const goldTxt = document.getElementById('gold-txt');
const distTxt = document.getElementById('dist-txt');
const upDamageBtn = document.getElementById('up-damage');
const upSpeedBtn = document.getElementById('up-speed');
const dmgCostEl = document.getElementById('dmg-cost');
const speedCostEl = document.getElementById('speed-cost');
const prestigeBtn = document.getElementById('prestige-btn');
const prestigeHint = document.getElementById('prestige-hint');
const prestigeMultEl = document.getElementById('prestige-multiplier');

let gold = 0;
let playerSpeed = 3;
let baseDamage = 1;
let prestigeMultiplier = 1.0;
let dmgLevel = 1;
let speedLevel = 1;
let worldX = 0;
let worldY = 0;
let keys = {};
let trees = [];
const maxTreesInWorld = 40;

// НАСТРОЙКИ ВИРТУАЛЬНОГО ДЖОЙСТИКА
let joystick = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
    moveX: 0,
    moveY: 0,
    maxRadius: 40 // Максимальный ход стика
};

function loadGame() {
    gold = parseFloat(localStorage.getItem('wood_gold') || 0);
    playerSpeed = parseFloat(localStorage.getItem('wood_speed') || 3);
    baseDamage = parseInt(localStorage.getItem('wood_damage') || 1);
    prestigeMultiplier = parseFloat(localStorage.getItem('wood_prestige') || 1.0);
    dmgLevel = parseInt(localStorage.getItem('wood_dmgLevel') || 1);
    speedLevel = parseInt(localStorage.getItem('wood_speedLevel') || 1);
    updateUI();
}

function saveGame() {
    localStorage.setItem('wood_gold', gold);
    localStorage.setItem('wood_speed', playerSpeed);
    localStorage.setItem('wood_damage', baseDamage);
    localStorage.setItem('wood_prestige', prestigeMultiplier);
    localStorage.setItem('wood_dmgLevel', dmgLevel);
    localStorage.setItem('wood_speedLevel', speedLevel);
}

// Отслеживание клавиатуры (для ПК)
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// ЛОГИКА ДЖОЙСТИКА ДЛЯ СМАРТФОНОВ И МЫШКИ
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function handleStart(e) {
    const coords = getCanvasCoords(e);
    joystick.active = true;
    joystick.startX = coords.x;
    joystick.startY = coords.y;
    joystick.currentX = coords.x;
    joystick.currentY = coords.y;
}

function handleMove(e) {
    if (!joystick.active) return;
    if (e.touches) e.preventDefault(); // Защита от тряски экрана
    
    const coords = getCanvasCoords(e);
    joystick.currentX = coords.x;
    joystick.currentY = coords.y;

    // Считаем смещение
    let dx = joystick.currentX - joystick.startX;
    let dy = joystick.currentY - joystick.startY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
        let angle = Math.atan2(dy, dx);
        // Ограничиваем ход стика рамками
        let travel = Math.min(distance, joystick.maxRadius);
        joystick.moveX = Math.cos(angle) * (travel / joystick.maxRadius);
        joystick.moveY = Math.sin(angle) * (travel / joystick.maxRadius);
    }
}

function handleEnd() {
    joystick.active = false;
    joystick.moveX = 0;
    joystick.moveY = 0;
}

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);

function getDmgCost() { return Math.floor(10 * Math.pow(1.5, dmgLevel - 1)); }
function getSpeedCost() { return Math.floor(50 * Math.pow(1.8, speedLevel - 1)); }
function updateUI() {
    goldTxt.innerText = Math.floor(gold).toLocaleString() + " 💰";
    let distance = Math.floor(Math.sqrt(worldX * worldX + worldY * worldY));
    distTxt.innerText = distance + " м";
    let dCost = getDmgCost(); let sCost = getSpeedCost();
    dmgCostEl.innerText = `Цена: ${dCost} 💰`; speedCostEl.innerText = `Цена: ${sCost} 💰`;
    upDamageBtn.disabled = gold < dCost; upSpeedBtn.disabled = gold < sCost || speedLevel >= 15;
    prestigeMultEl.innerText = `x${prestigeMultiplier.toFixed(1)}`;
    if (distance >= 500) {
        prestigeBtn.disabled = false;
        let newBonus = 1.0 + (distance / 500);
        prestigeHint.innerText = `Бонус: +${newBonus.toFixed(1)} к урону`;
    } else {
        prestigeBtn.disabled = true; prestigeHint.innerText = "Отойдите на 500м";
    }
}

function generateTree(spawnFar = false) {
    let angle = Math.random() * Math.PI * 2;
    let radius = spawnFar ? (350 + Math.random() * 400) : (Math.random() * 500);
    let tX = worldX + Math.cos(angle) * radius;
    let tY = worldY + Math.sin(angle) * radius;
    let distFromCenter = Math.sqrt(tX * tX + tY * tY);
    let tier = Math.floor(distFromCenter / 200) + 1;
    let maxHp = tier * 5 + Math.floor(Math.pow(tier, 2.2));
    trees.push({ x: tX, y: tY, maxHp: maxHp, hp: maxHp, goldReward: tier * 2 + Math.floor(Math.pow(tier, 1.8)), tier: tier });
}

for(let i=0; i < maxTreesInWorld; i++) generateTree(false);

upDamageBtn.addEventListener('click', () => {
    let cost = getDmgCost();
    if(gold >= cost) { gold -= cost; baseDamage += 1; dmgLevel++; updateUI(); saveGame(); }
});
upSpeedBtn.addEventListener('click', () => {
    let cost = getSpeedCost();
    if(gold >= cost && speedLevel < 15) { gold -= cost; playerSpeed += 0.4; speedLevel++; updateUI(); saveGame(); }
});
prestigeBtn.addEventListener('click', () => {
    let distance = Math.sqrt(worldX * worldX + worldY * worldY);
    if (distance >= 500) {
        prestigeMultiplier += (1.0 + (distance / 500));
        gold = 0; baseDamage = 1; playerSpeed = 3; dmgLevel = 1; speedLevel = 1; worldX = 0; worldY = 0; trees = [];
        for(let i=0; i < maxTreesInWorld; i++) generateTree(false);
        updateUI(); saveGame();
    }
});

function loop() {
    let moveX = 0; let moveY = 0;

    // Движение кнопками ПК
    if (keys['KeyW'] || keys['ArrowUp']) moveY = -playerSpeed;
    if (keys['KeyS'] || keys['ArrowDown']) moveY = playerSpeed;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -playerSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = playerSpeed;

    // Движение джойстиком на смартфоне
    if (joystick.active) {
        moveX = joystick.moveX * playerSpeed;
        moveY = joystick.moveY * playerSpeed;
    }

    worldX += moveX; worldY += moveY;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2; const centerY = canvas.height / 2;

    for (let i = trees.length - 1; i >= 0; i--) {
        let t = trees[i];
        let screenX = t.x - worldX + centerX; let screenY = t.y - worldY + centerY;
        if (Math.abs(screenX - centerX) > 800 || Math.abs(screenY - centerY) > 800) {
            trees.splice(i, 1); generateTree(true); continue;
        }
        let distToPlayer = Math.sqrt((screenX - centerX)**2 + (screenY - centerY)**2);
        if (distToPlayer < 25) {
            t.hp -= (baseDamage * prestigeMultiplier);
            worldX -= moveX * 1.5; worldY -= moveY * 1.5;
            if (t.hp <= 0) { gold += t.goldReward; trees.splice(i, 1); generateTree(true); updateUI(); saveGame(); continue; }
        }
        let leafColor = `rgb(${Math.max(20, 120 - t.tier*10)}, ${Math.max(40, 180 - t.tier*15)}, 50)`;
        if (t.tier > 5) leafColor = '#8b5cf6';
        ctx.fillStyle = '#78350f'; ctx.fillRect(screenX - 4, screenY, 8, 18);
        ctx.beginPath(); ctx.arc(screenX, screenY - 6, 16, 0, Math.PI * 2); ctx.fillStyle = leafColor; ctx.fill(); ctx.closePath();
        if (t.hp < t.maxHp) {
            ctx.fillStyle = '#ef4444'; ctx.fillRect(screenX - 15, screenY - 28, 30, 4);
            ctx.fillStyle = '#22c55e'; ctx.fillRect(screenX - 15, screenY - 28, (t.hp / t.maxHp) * 30, 4);
        }
    }
    
    // Рисуем Дровосека
    ctx.beginPath(); ctx.arc(centerX, centerY, 12, 0, Math.PI * 2); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.closePath();
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(centerX + 6, centerY - 10, 3, 14);
    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(centerX + 4, centerY - 14, 7, 5);

    // Рисуем сетку земли
    let step = 50; let startX = (centerX - worldX) % step; let startY = (centerY - worldY) % step;
    ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
    for(let x = startX; x < canvas.width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for(let y = startY; y < canvas.height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

    // КРАСИВАЯ ОТРИСОВКА ВИРТУАЛЬНОГО ДЖОЙСТИКА НА ЭКРАНЕ
    if (joystick.active) {
        // Внешнее кольцо джойстика
        ctx.beginPath();
        ctx.arc(joystick.startX, joystick.startY, joystick.maxRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // Внутренний подвижный стик
        let stickX = joystick.startX + joystick.moveX * joystick.maxRadius;
        let stickY = joystick.startY + joystick.moveY * joystick.maxRadius;
        
        ctx.beginPath();
        ctx.arc(stickX, stickY, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 204, 0.5)'; // Светящийся неоновый цвет при зажатии
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0; // сброс тени
    }

    if(Math.random() < 0.05) updateUI();
    requestAnimationFrame(loop);
}

loadGame();
while(trees.length < maxTreesInWorld) generateTree(false);
loop();
