import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pallanguzhi } from './logic.js';

// --- Configuration ---
const COLORS = {
    background: 0x1a1510,
    board: 0x8b5a2b,    // SaddleBrown
    pit: 0x5c3a1e,      // Darker wood
    pitHighlight: 0xa07040,
    seed: [0xeebb66, 0xcd853f, 0xdeb887, 0xf4a460], // Varied seed colors
    p1: 0x44aa44,
    p2: 0x4444aa
};

// --- Global State ---
let scene, camera, renderer, controls;
let raycaster, mouse;
let game; // Logic instance
let boardMesh;
let pitMeshes = []; // Array of meshes for hit testing
let seedMeshes = []; // All seed objects: { mesh, currentPitIndex }
let isAnimating = false;

// --- DOM Elements ---
const ui = {
    p1Score: document.getElementById('score-p1'),
    p2Score: document.getElementById('score-p2'),
    turn: document.getElementById('turn-indicator'),
    modal: document.getElementById('modal-overlay'),
    winnerText: document.getElementById('winner-text'),
    resetBtn: document.getElementById('reset-btn'),
    cameraBtn: document.getElementById('camera-btn'),
    playAgainBtn: document.getElementById('play-again-btn')
};

// --- Initialization ---
function init() {
    console.log("Initializing 3D Pallanguzhi...");

    // 1. Setup Three.js
    const container = document.getElementById('game-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background); // Keep dark wood or try 0x333333 for debug
    scene.fog = new THREE.Fog(COLORS.background, 20, 50);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 15, 8); // High angle
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Append to container, ensure simple z-ordering
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0'; // Behind UI
    container.insertBefore(renderer.domElement, container.firstChild);

    // 2. Lights - Boosted for visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Helpers (Remove later)
    // const axesHelper = new THREE.AxesHelper( 5 );
    // scene.add( axesHelper );
    // const gridHelper = new THREE.GridHelper( 20, 20 );
    // scene.add( gridHelper );

    // 3. Game Logic
    game = new Pallanguzhi();

    // 4. Build Board
    buildBoard();

    // 5. Controls & Interaction
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    ui.resetBtn.addEventListener('click', resetGame);
    ui.playAgainBtn.addEventListener('click', resetGame);
    ui.cameraBtn.addEventListener('click', toggleCamera);

    // 6. Initial Sync
    syncVisuals();
    animate();
}

function buildBoard() {
    // Base Board - Wood Texture
    const boardGeo = new THREE.BoxGeometry(16, 1, 6);
    const boardMat = new THREE.MeshStandardMaterial({
        color: COLORS.board,
        roughness: 0.8,
        metalness: 0.1
    });
    boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.y = -0.5;
    boardMesh.receiveShadow = true;
    scene.add(boardMesh);

    // Pits
    // 2 rows of 7.
    // Row 0 (P1): x from -6 to 6, z = 1.5
    // Row 1 (P2): x from 6 to -6 (reverse order for visual loop), z = -1.5
    // Actually, P1 is 0-6. Let's arrange them left-to-right or right-to-left?
    // Tradition: Player sits on one side.
    // P1 (Bottom side): Pit 0 is left-most? or right-most?
    // Counter-clockwise flow.
    // P1 side (z=1.5): 0 -> 1 -> ... -> 6 (Left to Right?)
    // P2 side (z=-1.5): 7 -> 8 -> ... -> 13 (Right to Left?)
    // This creates the circle.

    // Geometry for pit (visual marker + collider)
    const pitGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
    const pitMat = new THREE.MeshStandardMaterial({ color: COLORS.pit });
    const hoverMat = new THREE.MeshStandardMaterial({ color: COLORS.pitHighlight });

    for (let i = 0; i < 14; i++) {
        const mesh = new THREE.Mesh(pitGeo, pitMat.clone());
        let x, z;

        if (i <= 6) {
            // Player 1 (Bottom Row)
            x = -6 + (i * 2);
            z = 1.5;
        } else {
            // Player 2 (Top Row)
            // 7 is opposite 6? Or 7 is opposite 0?
            // Flow: 6 -> 7. So 7 should be "right most" of top row if 6 is right most of bottom.
            // 6 is at x = -6 + 12 = 6.
            // So 7 should be at x = 6. z = -1.5.
            let offset = i - 7;
            x = 6 - (offset * 2);
            z = -1.5;
        }

        mesh.position.set(x, 0.06, z); // Slightly above board
        mesh.userData = { pitIndex: i, originalColor: COLORS.pit };
        mesh.receiveShadow = true;
        scene.add(mesh);
        pitMeshes.push(mesh);
    }
}

function createSeed(pitIndex) {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    // Randomize color slightly
    const color = COLORS.seed[Math.floor(Math.random() * COLORS.seed.length)];
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Place randomly in pit
    const pitPos = pitMeshes[pitIndex].position;
    const r = 0.5 * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    mesh.position.x = pitPos.x + r * Math.cos(theta);
    mesh.position.z = pitPos.z + r * Math.sin(theta);
    mesh.position.y = 0.2 + Math.random() * 0.1;

    scene.add(mesh);

    return { mesh, pitIndex };
}

// Clear and recreate all seeds based on game state
function syncVisuals() {
    // cleanup old seeds
    seedMeshes.forEach(s => scene.remove(s.mesh));
    seedMeshes = [];

    // Create new ones
    game.pits.forEach((count, i) => {
        for (let n = 0; n < count; n++) {
            seedMeshes.push(createSeed(i));
        }
    });

    updateUI();
}

function updateUI() {
    ui.p1Score.innerText = game.scores[0];
    ui.p2Score.innerText = game.scores[1];

    ui.turn.innerText = game.turn === 0 ? "Player 1's Turn" : "Player 2's Turn";
    ui.turn.style.opacity = 1;
    ui.turn.style.color = game.turn === 0 ? '#44aa44' : '#4444aa';

    if (game.gameOver) {
        ui.modal.classList.add('active');
        ui.winnerText.innerText = game.getWinner();
    } else {
        ui.modal.classList.remove('active');
    }
}

// --- Interaction ---
function onClick(event) {
    if (isAnimating || game.gameOver) return;
    if (event.target.tagName === 'BUTTON') return; // Ignore UI clicks

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pitMeshes);

    if (intersects.length > 0) {
        const pitIndex = intersects[0].object.userData.pitIndex;
        attemptMove(pitIndex);
    }
}

function attemptMove(pitIndex) {
    if (!game.isValidMove(pitIndex)) {
        // Optional: Shake effect or visual feedback for invalid move
        return;
    }

    // Play logic
    const result = game.play(pitIndex);
    if (result.valid) {
        processAnimationEvents(result.events);
    }
}

// --- Animation System ---
// Simple coroutine-style sequencer
async function processAnimationEvents(events) {
    isAnimating = true;

    // Pre-calculate seed assignments for efficiency?
    // Actually, we can just grab seeds dynamically from our seedMeshes array.

    let hand = []; // Array of {mesh, pitIndex} currently in hand

    for (const event of events) {
        if (event.type === 'pickup') {
            // Find 'count' seeds from seedMeshes that are in event.pit
            const seedsInPit = seedMeshes.filter(s => s.pitIndex === event.pit);
            // Verify count matches?
            // If internal logic is solid, it should match.
            // Take all of them into hand
            hand = [...seedsInPit];

            // Animate lifting them up
            await tweenGroup(hand, { y: 2 }, 300);

            // Update their logical index? No wait, keep track physically.
        }
        else if (event.type === 'sow') {
            // Drop one seed from hand
            if (hand.length === 0) continue;
            const seed = hand.pop();

            // Move to target pit
            seed.pitIndex = event.pit;
            const targetPos = getPitRandomPos(event.pit);

            // Arc movement
            await tweenTo(seed.mesh, targetPos, 200, true);
        }
        else if (event.type === 'capture') {
            // Find seeds in valid pit
            const capturedSeeds = seedMeshes.filter(s => s.pitIndex === event.pit);

            // Move off screen / to player side
            // P1 Score zone: near camera bottom? P2 top?
            // Let's just shrink them away or fly to score box.
            const targetPos = event.player === 0
                ? new THREE.Vector3(-8, 5, 5) // Left side P1
                : new THREE.Vector3(8, 5, -5); // Right side P2

            await tweenGroup(capturedSeeds, targetPos, 400);

            // Remove from scene physically
            capturedSeeds.forEach(s => {
                scene.remove(s.mesh);
                const idx = seedMeshes.indexOf(s);
                if (idx > -1) seedMeshes.splice(idx, 1);
            });
        }

        // Small delay between steps?
        updateUI();
    }

    isAnimating = false;

    // Check AI
    if (!game.gameOver && ((game.turn === 1) || (false))) {
        // If computer is player 2. Currently local multiplayer.
        // Uncomment to enable AI:
        // setTimeout(doAIMove, 500);
    }
}

function doAIMove() {
    const move = game.getBestMove();
    if (move !== -1) attemptMove(move);
}

function getPitRandomPos(pitIndex) {
    const pitPos = pitMeshes[pitIndex].position;
    const r = 0.5 * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    return new THREE.Vector3(
        pitPos.x + r * Math.cos(theta),
        0.2 + Math.random() * 0.1, // settle height
        pitPos.z + r * Math.sin(theta)
    );
}

// Simple Tween Helpers
function tweenTo(mesh, targetPos, duration, isArc = false) {
    return new Promise(resolve => {
        const startPos = mesh.position.clone();
        const startTime = Date.now();

        function update() {
            const now = Date.now();
            let p = (now - startTime) / duration;
            if (p > 1) p = 1;

            // Ease out cubic
            const ease = 1 - Math.pow(1 - p, 3);

            mesh.position.lerpVectors(startPos, targetPos, ease);

            if (isArc) {
                // Add parabolic height
                // 4 * p * (1-p) is a parabola peaking at p=0.5
                mesh.position.y += Math.sin(p * Math.PI) * 2;
            }

            if (p < 1) requestAnimationFrame(update);
            else resolve();
        }
        update();
    });
}

function tweenGroup(seeds, targetProps, duration) {
    return new Promise(resolve => {
        const startTime = Date.now();
        const startPositions = seeds.map(s => s.mesh.position.clone());

        function update() {
            const now = Date.now();
            let p = (now - startTime) / duration;
            if (p > 1) p = 1;
            const ease = 1 - Math.pow(1 - p, 3);

            seeds.forEach((s, i) => {
                if (targetProps.y !== undefined && targetProps.x === undefined) {
                    // Just height change
                    s.mesh.position.y = startPositions[i].y + (targetProps.y - startPositions[i].y) * ease;
                } else {
                    // Vector target
                    s.mesh.position.lerpVectors(startPositions[i], targetProps, ease);
                }
            });

            if (p < 1) requestAnimationFrame(update);
            else resolve();
        }
        update();
    });
}

function resetGame() {
    game.reset();
    ui.modal.classList.remove('active');
    syncVisuals();
    animate(); // Ensure loop is running
}

// Top-down vs Isometric view
let isTopDown = false;
function toggleCamera() {
    isTopDown = !isTopDown;
    if (isTopDown) {
        tweenCamera(new THREE.Vector3(0, 15, 0), new THREE.Vector3(0, 0, 0));
    } else {
        tweenCamera(new THREE.Vector3(0, 12, 10), new THREE.Vector3(0, 0, 0));
    }
}

function tweenCamera(targetPos, targetLook) {
    // Ideally tween controls.target and camera.position
    // Quick hack: just set for now to keep code small
    camera.position.copy(targetPos);
    camera.lookAt(targetLook);
    controls.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Optional: Hover effect
    if (!isAnimating && !game.gameOver) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pitMeshes);

        // Reset colors
        pitMeshes.forEach(m => m.material.color.setHex(COLORS.pit));

        if (intersects.length > 0) {
            const pit = intersects[0].object;
            const idx = pit.userData.pitIndex;
            if (game.isValidMove(idx)) {
                pit.material.color.setHex(COLORS.pitHighlight);
                document.body.style.cursor = 'pointer';
            } else {
                document.body.style.cursor = 'default';
            }
        } else {
            document.body.style.cursor = 'default';
        }
    }

    renderer.render(scene, camera);
}

// Start
init();
