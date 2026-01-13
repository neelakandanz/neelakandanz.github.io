import * as THREE from 'three';
import { Pawn } from './Pawn.js';

export class GameManager {
    constructor(scene, board, dice) {
        this.scene = scene;
        this.board = board;
        this.dice = dice;

        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameState = 'IDLE'; // IDLE, WAITING_ROLL, MOVING, END
        this.lastDiceValue = 0;
        this.playerCount = 2; // Default

        // UI Elements
        this.uiTurn = document.getElementById('turn-indicator');
        this.uiDiceResult = document.getElementById('dice-result');
        this.btnRoll = document.getElementById('roll-btn');
        this.winnerModal = document.getElementById('winner-modal');
        this.winnerText = document.getElementById('winner-text');
        this.startModal = document.getElementById('start-modal');

        // Initialize Inputs
        this.initInputs();
    }

    initInputs() {
        // Start Screen Inputs
        document.getElementById('btn-2-players').addEventListener('click', () => this.startGame(2));
        document.getElementById('btn-4-players').addEventListener('click', () => this.startGame(4));
    }

    startGame(count) {
        this.playerCount = count;
        this.startModal.classList.add('hidden');
        this.gameState = 'WAITING_ROLL';

        this.players = [];

        // Player 1 (Red) - Bottom
        this.players.push({ id: 1, name: "Red", color: 0xff4444, pawns: [], path: this.generatePath(1) });

        if (count === 4) {
            // Player 2 (Green) - Top
            // Player 3 (Blue) - Left
            // Player 4 (Yellow) - Right
            // Turn Order: Red(Bottom) -> Yellow(Right) -> Green(Top) -> Blue(Left) (CCW)
            this.players.push({ id: 4, name: "Yellow", color: 0xffff44, pawns: [], path: this.generatePath(4) }); // Right
            this.players.push({ id: 2, name: "Green", color: 0x44ff44, pawns: [], path: this.generatePath(2) }); // Top
            this.players.push({ id: 3, name: "Blue", color: 0x4444ff, pawns: [], path: this.generatePath(3) });   // Left
        } else {
            // 2 Player: Red vs Green
            this.players.push({ id: 2, name: "Green", color: 0x44ff44, pawns: [], path: this.generatePath(2) });
        }

        this.initPawns();
        this.updateUI();
    }

    initPawns() {
        // Clear previous pawns (visuals) if needed - TODO for restart logic
        // For now, create new
        this.players.forEach(p => {
            const startTilePos = this.board.getTilePosition(p.path[0].row, p.path[0].col);
            const pawn = new Pawn(this.scene, p.color, startTilePos);
            pawn.pathIndex = 0;
            p.pawns.push(pawn);
        });
    }

    // Define Paths for 7x7 Grid
    // P1 Starts Bottom (6,3), P2 Starts Top (0,3)
    // Simple Loop: Go to edge -> Clockwise circle -> Enter Center
    // This is a simplified "Ludo-like" path for "Simple Dayakattam" prompt
    generatePath(playerId) {
        const path = [];
        // P1: Bottom (6,3)
        // P2: Top (0,3)
        // P3: Left (3,0)
        // P4: Right (3,6)

        // Helper to add lines
        const addLine = (r1, c1, r2, c2) => {
            if (r1 === r2) {
                // Horizontal
                const step = c1 < c2 ? 1 : -1;
                for (let c = c1; c !== c2 + step; c += step) path.push({ r: r1, c: c });
            } else {
                // Vertical
                const step = r1 < r2 ? 1 : -1;
                for (let r = r1; r !== r2 + step; r += step) path.push({ r: r, c: c1 });
            }
        };

        if (playerId === 1) { // Red - Bottom Start
            // 6,3 -> 6,6 -> 0,6 -> 0,0 -> 6,0 -> 6,2 -> Center
            path.push({ r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }); // Right half bottom
            addLine(6, 6, 0, 6); // Up Right Edge
            addLine(0, 5, 0, 0); // Left Top Edge
            addLine(1, 0, 6, 0); // Down Left Edge
            addLine(6, 1, 6, 2); // Right Bottom Edge
            path.push({ r: 5, c: 3 }, { r: 4, c: 3 }, { r: 3, c: 3 }); // Enter Center
        }
        else if (playerId === 2) { // Green - Top Start
            // 0,3 -> 0,0 -> 6,0 -> 6,6 -> 0,6 -> 0,4 -> Center
            path.push({ r: 0, c: 3 }, { r: 0, c: 2 }, { r: 0, c: 1 });
            addLine(0, 0, 6, 0); // Down Left
            addLine(6, 1, 6, 6); // Right Bottom
            addLine(5, 6, 0, 6); // Up Right
            addLine(0, 5, 0, 4); // Left Top
            path.push({ r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 }); // Enter Center
        }
        else if (playerId === 3) { // Blue - Left Start (3,0)
            // 3,0 -> 6,0 -> 6,6 -> 0,6 -> 0,0 -> 2,0 -> Center
            // Go Down -> Right -> Up -> Left -> Down -> Center
            path.push({ r: 3, c: 0 }, { r: 4, c: 0 }, { r: 5, c: 0 });
            addLine(6, 0, 6, 6); // Right Bottom
            addLine(5, 6, 0, 6); // Up Right
            addLine(0, 5, 0, 0); // Left Top
            addLine(1, 0, 2, 0); // Down Left
            path.push({ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 }); // Enter Center (Horizontal)
        }
        else if (playerId === 4) { // Yellow - Right Start (3,6)
            // 3,6 -> 0,6 -> 0,0 -> 6,0 -> 6,6 -> 4,6 -> Center
            // Go Up -> Left -> Down -> Right -> Up -> Center
            path.push({ r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 });
            addLine(0, 6, 0, 0); // Left Top
            addLine(1, 0, 6, 0); // Down Left
            addLine(6, 1, 6, 6); // Right Bottom
            addLine(5, 6, 4, 6); // Up Right
            path.push({ r: 3, c: 5 }, { r: 3, c: 4 }, { r: 3, c: 3 }); // Enter Center
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
