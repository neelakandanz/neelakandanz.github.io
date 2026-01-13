import * as THREE from 'three';

export class LetterManager {
    constructor(scene) {
        this.scene = scene;
        this.letters = []; // { mesh, value, speed }
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.fallSpeed = 3.0;

        this.tamilLetters = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'];
        this.targetLetter = 'அ';
    }

    reset() {
        this.letters.forEach(l => this.scene.remove(l.mesh));
        this.letters = [];
        this.spawnTimer = 0;
        this.fallSpeed = 3.0;
    }

    setTargetLetter(l) {
        this.targetLetter = l;
    }

    update(delta, catcher) {
        // Spawning
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnLetter();
        }

        // Updating positions
        for (let i = this.letters.length - 1; i >= 0; i--) {
            const l = this.letters[i];
            l.mesh.position.y -= l.speed * delta;
            l.mesh.rotation.z += 1.0 * delta; // spin
            l.mesh.rotation.x += 1.0 * delta;

            // Remove if off screen
            if (l.mesh.position.y < -10) {
                this.scene.remove(l.mesh);
                this.letters.splice(i, 1);
            }
        }
    }

    spawnLetter() {
        // Weighted random to favor target letter slightly? Not requested but good gameplay.
        // For MVP purely random.
        const char = this.tamilLetters[Math.floor(Math.random() * this.tamilLetters.length)];

        const geometry = new THREE.BoxGeometry(1, 1, 0.2);
        const material = this.createLetterMaterial(char);
        const mesh = new THREE.Mesh(geometry, material);

        // Random X position within range
        const limit = 7;
        mesh.position.set((Math.random() * limit * 2) - limit, 10, 0);

        this.scene.add(mesh);

        this.letters.push({
            mesh: mesh,
            value: char,
            speed: this.fallSpeed + (Math.random() * 2)
        });
    }

    createLetterMaterial(char) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 128, 128);

        // Border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, 128, 128);

        // Text
        ctx.font = 'bold 80px Arial'; // Fallback to Arial if no Tamil font loaded, but UTF-8 should work
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#E91E63';
        ctx.fillText(char, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshBasicMaterial({ map: texture });
    }

    checkCollisions(catcher) {
        const catchRad = 1.5; // catcher radius approximation

        for (let i = this.letters.length - 1; i >= 0; i--) {
            const l = this.letters[i];

            // Simple distance check
            // Only check if close in Y first
            if (Math.abs(l.mesh.position.y - catcher.mesh.position.y) < 1.0) {
                // Check X distance
                if (Math.abs(l.mesh.position.x - catcher.mesh.position.x) < catchRad) {
                    // CAUGHT!
                    this.scene.remove(l.mesh);
                    this.letters.splice(i, 1);
                    return { letter: l.value };
                }
            }
        }
        return null;
    }
}
