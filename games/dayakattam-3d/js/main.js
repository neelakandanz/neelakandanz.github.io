import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Board } from './Board.js';
import { Dice } from './Dice.js';
import { GameManager } from './GameManager.js';

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.resizeHandler = this.onWindowResize.bind(this);

        this.initScene();
        this.initGameObjects();
        this.initInputs();

        window.addEventListener('resize', this.resizeHandler);

        // Start Loop
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    initScene() {
        // SCENE
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1008); // Dark brown background
        this.scene.fog = new THREE.Fog(0x1a1008, 15, 30);

        // CAMERA
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 15, 10);
        this.camera.lookAt(0, 0, 0);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0'; // Ensure left alignment
        this.renderer.domElement.style.zIndex = '-1';
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

        // CONTROLS
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't go below ground
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;

        // LIGHTS
        const ambientLight = new THREE.AmbientLight(0xffeedd, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        this.scene.add(dirLight);
    }

    initGameObjects() {
        // Board
        this.board = new Board(this.scene);

        // Dice
        this.dice = new Dice(this.scene);
        this.dice.setPosition(6, 0.5, 0); // Place dice on the side

        // Game Manager
        this.gameManager = new GameManager(this.scene, this.board, this.dice);
    }

    initInputs() {
        document.getElementById('roll-btn').addEventListener('click', () => {
            this.gameManager.rollDice();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.gameManager.resetGame();
        });

        document.getElementById('camera-btn').addEventListener('click', () => {
            this.toggleCameraView();
        });

        // Rules Modal
        const rulesModal = document.getElementById('rules-modal');
        document.getElementById('rules-btn').addEventListener('click', () => {
            rulesModal.classList.remove('hidden');
        });
        document.getElementById('close-rules-btn').addEventListener('click', () => {
            rulesModal.classList.add('hidden');
        });
    }

    toggleCameraView() {
        // Simple toggle between top-down and angled
        const currentPos = this.camera.position.clone();
        if (currentPos.y > 14) {
            // Switch to lower angle
            this.camera.position.set(0, 8, 12);
        } else {
            // Switch to top-down-ish
            this.camera.position.set(0, 15, 10);
        }
        this.camera.lookAt(0, 0, 0);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        this.controls.update();

        // Update Game Objects
        const delta = 0.016; // Approx 60fps
        if (this.dice) this.dice.update(delta);
        if (this.gameManager) this.gameManager.update(delta);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize Game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
