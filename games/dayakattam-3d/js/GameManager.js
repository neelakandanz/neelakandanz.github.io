import * as THREE from 'three';
import { Pawn } from './Pawn.js';

export class GameManager {
    constructor(scene, board, dice) {
        this.scene = scene;
        this.board = board;
        this.dice = dice;

        // Game State
        this.players = [
            { id: 1, name: "Player 1", color: 0xff0000, pawns: [], path: this.generatePath(1) },
            { id: 2, name: "Player 2", color: 0x00ff00, pawns: [], path: this.generatePath(2) }
        ];
        this.currentPlayerIndex = 0;
        this.gameState = 'WAITING_ROLL'; // WAITING_ROLL, MOVING, END
        this.lastDiceValue = 0;

        // UI Elements
        this.uiTurn = document.getElementById('turn-indicator');
        this.uiDiceResult = document.getElementById('dice-result');
        this.btnRoll = document.getElementById('roll-btn');
        this.winnerModal = document.getElementById('winner-modal');
        this.winnerText = document.getElementById('winner-text');

        this.initGame();
    }

    initGame() {
        console.log("Initializing Game...");

        // Clear existing pawns if any
        this.players.forEach(p => {
            // In a real restart, remove meshes. For now assume fresh start.
            const startTilePos = this.board.getTilePosition(p.path[0].row, p.path[0].col);
            const pawn = new Pawn(this.scene, p.color, startTilePos);

            // Track logical position index properties
            pawn.pathIndex = 0;
            p.pawns.push(pawn);
        });

        this.updateUI();
    }

    // Define Paths for 7x7 Grid
    // P1 Starts Bottom (6,3), P2 Starts Top (0,3)
    // Simple Loop: Go to edge -> Clockwise circle -> Enter Center
    // This is a simplified "Ludo-like" path for "Simple Dayakattam" prompt
    generatePath(playerId) {
        const path = [];

        if (playerId === 1) {
            // Player 1 Path (Simplified)
            // Start 6,3 -> 6,6 -> 0,6 -> 0,0 -> 6,0 -> 6,2 -> Center 3,3 (Simplified spiral)
            // Actually, let's just do a perimeter run then center to keep it robust.

            // 1. Right Half Bottom Edge
            path.push({ r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 });
            // 2. Right Edge Up
            for (let r = 5; r >= 0; r--) path.push({ r: r, c: 6 });
            // 3. Top Edge Left
            for (let c = 5; c >= 0; c--) path.push({ r: 0, c: c });
            // 4. Left Edge Down
            for (let r = 1; r <= 6; r++) path.push({ r: r, c: 0 });
            // 5. Bottom Edge Right
            for (let c = 1; c <= 2; c++) path.push({ r: 6, c: c });
            // 6. Enter Center (Victory)
            path.push({ r: 5, c: 3 }, { r: 4, c: 3 }, { r: 3, c: 3 });

        } else {
            // Player 2 Path (Mirror of P1)
            // Start 0,3 -> 0,0 -> 6,0 -> 6,6 -> 0,6 -> 0,4 -> Center

            // 1. Top Edge Left
            path.push({ r: 0, c: 3 }, { r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 });
            // 2. Left Edge Down
            for (let r = 1; r <= 6; r++) path.push({ r: r, c: 0 });
            // 3. Bottom Edge Right
            for (let c = 1; c <= 6; c++) path.push({ r: 6, c: c });
            // 4. Right Edge Up
            for (let r = 5; r >= 0; r--) path.push({ r: r, c: 6 });
            // 5. Top Edge Left
            for (let c = 5; c >= 4; c--) path.push({ r: 0, c: c });
            // 6. Enter Center
            path.push({ r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 });
        }
        return path;
    }

    rollDice() {
        if (this.gameState !== 'WAITING_ROLL') return;

        this.btnRoll.disabled = true;
        this.uiDiceResult.classList.add('rolling');
        this.uiDiceResult.innerText = "...";

        this.dice.roll((value) => {
            this.lastDiceValue = value;
            this.uiDiceResult.innerText = value;
            this.uiDiceResult.classList.remove('rolling');

            this.onDiceRolled();
        });
    }

    onDiceRolled() {
        console.log(`Rolled ${this.lastDiceValue}`);

        // Check if move is possible
        const player = this.players[this.currentPlayerIndex];
        const pawn = player.pawns[0]; // Single pawn for now

        const currentPathIndex = pawn.pathIndex;
        const targetPathIndex = currentPathIndex + this.lastDiceValue;

        if (targetPathIndex < player.path.length) {
            // Valid Move
            this.gameState = 'MOVING';
            this.movePawnStepByStep(pawn, targetPathIndex);
        } else {
            // Invalid Move (Overshoot), skip turn
            console.log("Cannot move, skipping turn.");
            setTimeout(() => this.nextTurn(), 1000);
        }
    }

    movePawnStepByStep(pawn, targetIndex) {
        // Recursive animation for hopping 1 by 1
        if (pawn.pathIndex < targetIndex) {
            pawn.pathIndex++;
            const nextCoord = this.players[this.currentPlayerIndex].path[pawn.pathIndex];
            const worldPos = this.board.getTilePosition(nextCoord.r, nextCoord.c);

            pawn.moveTo(worldPos, () => {
                // Determine if we need to hop again
                if (pawn.pathIndex < targetIndex) {
                    this.movePawnStepByStep(pawn, targetIndex);
                } else {
                    // Finished moving
                    this.onMoveFinished();
                }
            });
        }
    }

    onMoveFinished() {
        const player = this.players[this.currentPlayerIndex];
        const pawn = player.pawns[0];

        // Check Win
        if (pawn.pathIndex === player.path.length - 1) {
            this.gameState = 'END';
            this.winnerText.innerText = `${player.name} Wins!`;
            this.winnerModal.classList.remove('hidden');
        } else {
            // Check for bonus turn? (Usually 1, 5, 6, 12 gives bonus in Dayakattam but user said "Simple")
            // Let's stick to simple turn switching.
            this.nextTurn();
        }
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.gameState = 'WAITING_ROLL';
        this.btnRoll.disabled = false;
        this.updateUI();
    }

    updateUI() {
        const pName = this.players[this.currentPlayerIndex].name;
        this.uiTurn.innerText = `${pName}'s Turn`;
        this.uiTurn.style.color = (this.currentPlayerIndex === 0) ? '#ff4444' : '#44ff44';
    }

    resetGame() {
        console.log("Resetting game...");
        // Reload page for simplicity or reset state
        window.location.reload();
    }

    update(delta) {
        // Update Pawns
        this.players.forEach(p => {
            p.pawns.forEach(pawn => pawn.update(delta));
        });
    }
}
