import * as THREE from 'three';

export class Dice {
    constructor(scene) {
        this.scene = scene;
        this.rolling = false;
        this.rollDuration = 1.0; // seconds
        this.elapsedTime = 0;
        this.finalValue = 1;

        this.createDice();
    }

    createDice() {
        const size = 1.0;
        const geometry = new THREE.BoxGeometry(size, size, size);

        // Create materials for each face (1-6)
        // Order: Right (1), Left (2), Top (3), Bottom (4), Front (5), Back (6)
        // Note: Standard Dice layout usually has opposite sides summing to 7.
        // Let's use standard Three.js box mapping: +x, -x, +y, -y, +z, -z
        // +x: Right, -x: Left, +y: Top, -y: Bottom, +z: Front, -z: Back
        const materials = [
            this.createFaceMaterial(1, '#ffebcd', '#000'), // Right
            this.createFaceMaterial(6, '#ffebcd', '#000'), // Left
            this.createFaceMaterial(2, '#ffebcd', '#000'), // Top
            this.createFaceMaterial(5, '#ffebcd', '#000'), // Bottom
            this.createFaceMaterial(3, '#ffebcd', '#000'), // Front
            this.createFaceMaterial(4, '#ffebcd', '#000'), // Back
        ];

        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    createFaceMaterial(number, color, dotColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 128, 128);

        // Border
        ctx.strokeStyle = '#d4a01c';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, 128, 128);

        // Dots
        ctx.fillStyle = dotColor;
        const r = 12;
        const c = 64; // center
        const q1 = 32; // quarter 1
        const q3 = 96; // quarter 3

        // Helper to draw dot at x,y
        const dot = (x, y) => {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        };

        if (number === 1) {
            dot(c, c);
        } else if (number === 2) {
            dot(q1, q1); dot(q3, q3);
        } else if (number === 3) {
            dot(q1, q1); dot(c, c); dot(q3, q3);
        } else if (number === 4) {
            dot(q1, q1); dot(q3, q1);
            dot(q1, q3); dot(q3, q3);
        } else if (number === 5) {
            dot(q1, q1); dot(q3, q1);
            dot(c, c);
            dot(q1, q3); dot(q3, q3);
        } else if (number === 6) {
            dot(q1, q1); dot(q3, q1);
            dot(q1, c); dot(q3, c);
            dot(q1, q3); dot(q3, q3);
        }

        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.2, metalness: 0.1 });
    }

    setPosition(x, y, z) {
        if (this.mesh) this.mesh.position.set(x, y, z);
    }

    roll(callback) {
        if (this.rolling) return;

        this.rolling = true;
        this.elapsedTime = 0;
        this.callback = callback;
        this.finalValue = Math.floor(Math.random() * 6) + 1;

        // Determine final rotation based on value
        // Standard Mapping: +x(1), -x(6), +y(2), -y(5), +z(3), -z(4)
        // To show Face X, we need to rotate it to be facing UP (+Y) ? Or Camera?
        // Let's assume Camera looks generally from +Z/+Y. 
        // We want the face to point UP (+Y) for clarity on the board.
        // Current Mappings:
        // 1: +X -> Rotate Z +90 -> New +Y is Old +X (1)
        // 2: +Y -> Rotate 0 -> New +Y is Old +Y (2)
        // 3: +Z -> Rotate X -90 -> New +Y is Old +Z (3)
        // 4: -Z -> Rotate X +90 -> New +Y is Old -Z (4)
        // 5: -Y -> Rotate X 180 -> New +Y is Old -Y (5)
        // 6: -X -> Rotate Z -90 -> New +Y is Old -X (6)

        this.targetRotation = new THREE.Euler();
        const randRot = Math.PI * 2 * 3; // add extra spins

        switch (this.finalValue) {
            case 1: this.targetRotation.set(0, 0, Math.PI / 2); break;
            case 2: this.targetRotation.set(0, 0, 0); break;
            case 3: this.targetRotation.set(-Math.PI / 2, 0, 0); break;
            case 4: this.targetRotation.set(Math.PI / 2, 0, 0); break;
            case 5: this.targetRotation.set(Math.PI, 0, 0); break;
            case 6: this.targetRotation.set(0, 0, -Math.PI / 2); break;
        }

        // Add random spins to target to make it tumble
        this.startRotation = this.mesh.rotation.clone();
        this.spinAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
    }

    update(delta) {
        if (!this.rolling) return;

        this.elapsedTime += delta;
        const progress = Math.min(this.elapsedTime / this.rollDuration, 1.0);

        // Easing: EaseOutQuad
        const ease = 1 - (1 - progress) * (1 - progress);

        if (progress < 1.0) {
            // Spin wildly first
            this.mesh.rotation.x += 10 * delta * (1 - progress);
            this.mesh.rotation.y += 10 * delta * (1 - progress);
            this.mesh.rotation.z += 10 * delta * (1 - progress);
        } else {
            // Snap/Lerp to final orientation very quickly at the end
            // Actually, better approach: 
            // Lerp from current "crazy" state to target is hard because axes are messy.
            // Simplified: Just set to target at end.
            this.mesh.rotation.copy(this.targetRotation);
            this.rolling = false;

            if (this.callback) {
                this.callback(this.finalValue);
                this.callback = null;
            }
        }
    }
}
