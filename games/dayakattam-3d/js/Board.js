import * as THREE from 'three';

export class Board {
    constructor(scene) {
        this.scene = scene;
        this.tiles = []; // Array of { index, mesh, position, type }
        this.boardGroup = new THREE.Group();
        this.scene.add(this.boardGroup);

        this.gridSize = 7;
        this.tileSize = 1.5;
        this.padding = 0.1;

        this.createBoard();
        this.createDecorations();
    }

    createBoard() {
        // Materials
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x5c4033, // Dark Wood
            roughness: 0.8
        });
        const tileMaterial = new THREE.MeshStandardMaterial({
            color: 0xd2b48c, // Tan/Paper
            roughness: 0.5
        });
        const safeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700, // Gold/Safe
            roughness: 0.3,
            metalness: 0.4
        });
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b0000, // Red Center
            roughness: 0.5
        });

        // Board Base
        const totalWidth = (this.gridSize * (this.tileSize + this.padding)) + 1;
        const baseGeometry = new THREE.BoxGeometry(totalWidth, 0.5, totalWidth);
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = -0.25;
        baseMesh.receiveShadow = true;
        this.boardGroup.add(baseMesh);

        // Create Grid of Tiles
        const startOffset = - ((this.gridSize - 1) * (this.tileSize + this.padding)) / 2;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {

                // Determine Tile Type
                let mat = tileMaterial;
                let type = 'normal';

                // Safe Zones (Cross shape often has safe spots)
                // Center
                if (row === 3 && col === 3) {
                    mat = centerMaterial;
                    type = 'center';
                }
                // Middle of edges (Safe spots in Dayakattam usually)
                else if ((row === 0 && col === 3) ||
                    (row === 3 && col === 0) ||
                    (row === 6 && col === 3) ||
                    (row === 3 && col === 6)) {
                    mat = safeMaterial;
                    type = 'safe';
                }
                // Corners (Sometimes safe, usually start points)
                else if ((row === 0 && col === 0) ||
                    (row === 0 && col === 6) ||
                    (row === 6 && col === 0) ||
                    (row === 6 && col === 6)) {
                    // Keep normal or maybe mark as start
                    type = 'corner';
                }

                // Create Tile Mesh
                const geometry = new THREE.BoxGeometry(this.tileSize, 0.2, this.tileSize);
                const tile = new THREE.Mesh(geometry, mat);

                const x = startOffset + col * (this.tileSize + this.padding);
                const z = startOffset + row * (this.tileSize + this.padding);

                tile.position.set(x, 0.1, z);
                tile.receiveShadow = true;
                tile.castShadow = true;

                // Store tile data
                tile.userData = { row, col, type };
                this.tiles.push(tile);
                this.boardGroup.add(tile);
            }
        }
    }

    createDecorations() {
        // Optional: Add simple board border or indicators
    }

    // Helper to get world position of a specific grid coordinate
    getTilePosition(row, col) {
        const tile = this.tiles.find(t => t.userData.row === row && t.userData.col === col);
        if (tile) {
            return tile.position.clone().add(new THREE.Vector3(0, 0.2, 0)); // Return top center of tile
        }
        return new THREE.Vector3(0, 0, 0);
    }

    // Helper to get tile object
    getTile(row, col) {
        return this.tiles.find(t => t.userData.row === row && t.userData.col === col);
    }
}
