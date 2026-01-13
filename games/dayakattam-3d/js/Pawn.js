import * as THREE from 'three';

export class Pawn {
    constructor(scene, color, startPos) {
        this.scene = scene;
        this.color = color;
        this.currentTile = null; // Store current logical position (row, col)

        this.isMoving = false;
        this.targetPosition = null;
        this.moveSpeed = 4.0;
        this.jumpHeight = 1.0;

        this.createPawn(startPos);
    }

    createPawn(startPos) {
        const geometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.3,
            metalness: 0.2
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        if (startPos) {
            this.mesh.position.copy(startPos);
        }

        this.scene.add(this.mesh);
    }

    moveTo(targetPos, callback) {
        this.startPosition = this.mesh.position.clone();
        this.targetPosition = targetPos.clone();
        this.moveProgress = 0;
        this.isMoving = true;
        this.moveCallback = callback;

        // Calculate distance to adjust speed/height if needed? 
        // For now constant speed is fine for single step hops.
    }

    update(delta) {
        if (!this.isMoving) return;

        this.moveProgress += delta * this.moveSpeed;

        if (this.moveProgress >= 1.0) {
            this.moveProgress = 1.0;
            this.mesh.position.copy(this.targetPosition);
            this.isMoving = false;

            if (this.moveCallback) {
                const cb = this.moveCallback;
                this.moveCallback = null;
                cb();
            }
        } else {
            // Parabola for jumping: y = 4 * h * x * (1 - x)
            // Linear interpolation for X and Z
            const p = this.moveProgress;

            this.mesh.position.x = THREE.MathUtils.lerp(this.startPosition.x, this.targetPosition.x, p);
            this.mesh.position.z = THREE.MathUtils.lerp(this.startPosition.z, this.targetPosition.z, p);

            // Arc for Y
            const baseHeight = THREE.MathUtils.lerp(this.startPosition.y, this.targetPosition.y, p);
            const arc = 4 * this.jumpHeight * p * (1 - p);
            this.mesh.position.y = baseHeight + arc;
        }
    }
}
