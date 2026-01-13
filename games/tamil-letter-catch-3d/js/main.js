import * as THREE from 'three';
import { Catcher } from './Catcher.js';
import { LetterManager } from './LetterManager.js';
import { GameState } from './GameState.js';

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.clock = new THREE.Clock();

        this.initScene();
        this.initGameObjects();
        this.initUI();

        // Resize Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Loop
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    initScene() {
        // SCENE - Transparent to let CSS Gradient show through
        this.scene = new THREE.Scene();

        // CAMERA
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // LIGHTS
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
    }

    initGameObjects() {
        // Catcher (Basket)
        this.catcher = new Catcher(this.scene, this.camera);

        // Letter Manager
        this.letterManager = new LetterManager(this.scene);

        // Game State Logic
        this.gameState = new GameState();
    }

    initUI() {
        this.btnStart = document.getElementById('start-btn');
        this.btnRestart = document.getElementById('restart-btn');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');

        this.btnStart.addEventListener('click', () => this.startGame());
        this.btnRestart.addEventListener('click', () => this.startGame());
    }

    startGame() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        this.gameState.reset();
        this.catcher.reset();
        this.letterManager.reset();
        this.letterManager.setTargetLetter(this.gameState.currentTarget);

        this.isPlaying = true;
    }

    gameOver() {
        this.isPlaying = false;
        document.getElementById('final-score').innerText = this.gameState.score;
        this.gameOverScreen.classList.remove('hidden');
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Update Catcher logic which might depend on screen width projection
        this.catcher.onResize(this.camera);
    }

    animate() {
        const delta = this.clock.getDelta();

        if (this.isPlaying) {
            this.catcher.update(delta);
            this.letterManager.update(delta, this.catcher);

            // Check Collisions / Game Logic
            const caught = this.letterManager.checkCollisions(this.catcher);
            if (caught) {
                if (caught.letter === this.gameState.currentTarget) {
                    // Correct!
                    this.gameState.addScore(10);
                    // New Round logic if needed or just keep going
                } else {
                    // Wrong!
                    this.gameState.addScore(-5);
                }
                // Pick new target periodically or on catch? 
                // Let's verify game logic plan: "Target Letter displayed". 
                // Simple version: Keep target same for a bit, or change on catch.
                this.gameState.nextTarget();
                this.letterManager.setTargetLetter(this.gameState.currentTarget);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
