import * as THREE from 'three';

export class Catcher {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.position = new THREE.Vector3(0, -5, 0); // Bottom of screen (approx)
        this.width = 2.5;
        this.targetX = 0;

        this.createMesh();
        this.initControls();
    }

    createMesh() {
        // Simple "Pot" shape
        const geometry = new THREE.CylinderGeometry(1.5, 1.0, 1.5, 16, 1, true); // Open top
        const material = new THREE.MeshToonMaterial({ color: 0xFF9800 }); // Orange pot

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = Math.PI / 4; // visual flair

        // Add a bottom cap
        const bottomGeo = new THREE.CircleGeometry(1.0, 16);
        const bottomMesh = new THREE.Mesh(bottomGeo, material);
        bottomMesh.rotation.x = Math.PI / 2;
        bottomMesh.position.y = -0.75;
        this.mesh.add(bottomMesh);

        this.scene.add(this.mesh);
    }

    initControls() {
        // Touch / Mouse - simple tracking
        window.addEventListener('mousemove', (e) => this.onInput(e.clientX));
        window.addEventListener('touchmove', (e) => this.onInput(e.touches[0].clientX));

        // Keys
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.targetX -= 1;
            if (e.key === 'ArrowRight') this.targetX += 1;
            this.clampX();
        });
    }

    onInput(screenX) {
        // Convert screen X to world X (approximate based on camera depth)
        // Camera is at z=15. Object at z=0. Catcher y=-5.
        // Project screen to world plane at z=0

        // Normalized Device Coordinates (-1 to +1)
        const ndcX = (screenX / window.innerWidth) * 2 - 1;

        // Back-project. Simple approximation for flat plane logic:
        // Visible width at depth 0 with FOV 50, Z=15 is approx:
        // height = 2 * tan(50/2) * 15 ~= 2 * 0.466 * 15 ~= 14
        // width = aspect * height
        const dist = 15;
        const vFOV = THREE.MathUtils.degToRad(50);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * this.camera.aspect;

        this.targetX = ndcX * (width / 2);
        this.clampX();
    }

    clampX() {
        // Keep within reasonable bounds
        const limit = 8; // approx screen edge
        this.targetX = Math.max(-limit, Math.min(limit, this.targetX));
    }

    reset() {
        this.targetX = 0;
        this.mesh.position.x = 0;
    }

    update(delta) {
        // Smooth movement
        this.mesh.position.x += (this.targetX - this.mesh.position.x) * 10 * delta;

        // Wobble effect
        this.mesh.rotation.z = (this.mesh.position.x - this.targetX) * 0.1;
    }

    onResize(camera) {
        this.camera = camera;
    }
}
