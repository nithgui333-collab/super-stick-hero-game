const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const introElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");

// Set explicit canvas dimensions
canvas.width = 375;
canvas.height = 375;

// Game Configuration & State
let phase = "waiting"; // waiting, stretching, turning, walking, transitioning, falling
let platforms = [];
let stickLength = 0;
let stickRotation = 0;
let score = 0;
let heroX = 0;
let heroY = 0;

const heroWidth = 12;
const heroHeight = 16;
const platformHeight = 150;

// Initialize / Reset the game
function init() {
    phase = "waiting";
    score = 0;
    scoreElement.innerText = score;
    introElement.style.opacity = 1;
    restartButton.style.display = "none";
    
    // Generate the first two starting platforms
    platforms = [
        { x: 50, w: 40 },
        { x: 160, w: 50 }
    ];
    
    // Position the hero on the edge of the first platform
    heroX = platforms[0].x + platforms[0].w - heroWidth - 2;
    heroY = canvas.height - platformHeight - heroHeight;
    
    stickLength = 0;
    stickRotation = 0;
    
    draw();
}

// Generate the next random platform ahead
function generatePlatform() {
    const minW = 25;
    const maxW = 60;
    const minGap = 50;
    const maxGap = 120;
    
    const lastPlatform = platforms[platforms.length - 1];
    const w = Math.floor(Math.random() * (maxW - minW + 1)) + minW;
    const x = lastPlatform.x + lastPlatform.w + Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
    
    // Push new platform if it is within reasonable bounds
    if (x + w < canvas.width + 200) {
        platforms.push({ x, w });
    }
}

// Event: Mouse down starts stretching the stick upwards
window.addEventListener("mousedown", () => {
    if (phase === "waiting") {
        phase = "stretching";
        introElement.style.opacity = 0;
    }
});

// Event: Mouse up stops stretching and triggers the stick rotation
window.addEventListener("mouseup", () => {
    if (phase === "stretching") {
        phase = "turning";
    }
});

// Event: Restart button click resets the game state
restartButton.addEventListener("click", (e) => {
    e.stopPropagation();
    init();
});

// Core Game Loop handling animations and physics logic
function gameLoop() {
    if (phase === "stretching") {
        stickLength += 3; // Speed of stick growth
    } 
    else if (phase === "turning") {
        stickRotation += 0.05; // Speed of stick falling down
        if (stickRotation >= Math.PI / 2) {
            stickRotation = Math.PI / 2; // Lock stick flat at 90 degrees
            phase = "walking";
        }
    } 
    else if (phase === "walking") {
        heroX += 2.5; // Hero walking/running speed
        
        // Calculate the absolute position where the tip of the stick landed
        const currentStickTarget = platforms[0].x + platforms[0].w + stickLength;
        
        // Trigger check once hero reaches the end of the stick
        if (heroX >= currentStickTarget - heroWidth / 2) {
            heroX = currentStickTarget - heroWidth / 2;
            
            const nextPlatform = platforms[1];
            // Check if the tip of the stick successfully reached the next platform
            const landedOnPlatform = currentStickTarget >= nextPlatform.x && currentStickTarget <= nextPlatform.x + nextPlatform.w;
            
            if (landedOnPlatform) {
                phase = "transitioning";
                score += 1;
                scoreElement.innerText = score;
                generatePlatform();
            } else {
                phase = "falling"; // Move to falling phase if stick is too short or long
            }
        }
    } 
    else if (phase === "transitioning") {
        // Shift camera/scenery backwards to simulate moving forward
        platforms.forEach(p => p.x -= 3);
        heroX -= 3;
        
        // Reset and align the new platform to the starting anchor point (x: 50)
        if (platforms[1].x <= 50) {
            const correction = 50 - platforms[1].x;
            platforms.forEach(p => p.x += correction);
            heroX += correction;
            
            platforms.shift(); // Remove the old platform from the array
            phase = "waiting";
            stickLength = 0;
            stickRotation = 0;
        }
    } 
    else if (phase === "falling") {
        heroY += 5; // Gravity pull on the hero
        if (heroY > canvas.height) {
            restartButton.style.display = "block"; // Show game over / restart button
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Draw graphics on the HTML5 Canvas
function draw() {
    // ប្រើ ctx.clearRect ដើម្បីលុបគំនូរចាស់ចោល ប៉ុន្តែវានៅតែរក្សាភាពថ្លា (Transparent) អាចមើលធ្លុះទៅឃើញរូប BG ក្នុង CSS
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
    /* === លុបកូដគូរភ្នំ Background ពណ៌បៃតងចាស់ចេញទាំងស្រុង === */

    // Draw solid black platforms
    platforms.forEach((platform) => {
        ctx.fillStyle = "#000000";
        ctx.fillRect(platform.x, canvas.height - platformHeight, platform.w, platformHeight);
        
        // Draw the red center target zone on the platform
        ctx.fillStyle = "#ff4757";
        ctx.fillRect(platform.x + platform.w / 2 - 4, canvas.height - platformHeight, 8, 4);
    });

    // Draw the bridge stick
    ctx.save();
    ctx.translate(platforms[0].x + platforms[0].w, canvas.height - platformHeight);
    ctx.rotate(stickRotation - Math.PI / 2); 
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000";
    ctx.moveTo(0, 0);
    ctx.lineTo(stickLength, 0); 
    ctx.stroke();
    ctx.restore();

    // Draw the Hero character
    ctx.fillStyle = "#000000";
    ctx.fillRect(heroX, heroY, heroWidth, heroHeight);
    ctx.fillStyle = "#ff4757"; // Red head bandana/cap
    ctx.fillRect(heroX, heroY, heroWidth, 4); 
}

// Start game initialization and launch the loop
init();
gameLoop();