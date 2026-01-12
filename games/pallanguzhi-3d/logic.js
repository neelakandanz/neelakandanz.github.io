export class Pallanguzhi {
    constructor() {
        this.reset();
    }

    reset() {
        // 14 pits, 7 per player. Indices 0-6 (P1), 7-13 (P2).
        // Standard game starts with 5 seeds per pit.
        this.pits = Array(14).fill(5);
        this.scores = [0, 0];
        // Player 0 starts
        this.turn = 0;
        this.gameOver = false;
        this.message = "Player 1's Turn";
    }

    getWinner() {
        if (this.scores[0] > this.scores[1]) return "Player 1 Wins!";
        if (this.scores[1] > this.scores[0]) return "Player 2 Wins!";
        return "It's a Draw!";
    }

    // Returns true if the move is valid
    isValidMove(pitIndex) {
        if (this.gameOver) return false;

        // Check if pit belongs to current player
        const isP1 = pitIndex >= 0 && pitIndex <= 6;
        if (this.turn === 0 && !isP1) return false;
        if (this.turn === 1 && isP1) return false;

        // Check if pit has seeds
        if (this.pits[pitIndex] === 0) return false;

        return true;
    }

    // Execute a move. Returns a generator/list of 'steps' for animation if needed,
    // but for now let's just update state and return the result msg.
    // In a 3D game, we might need intermediate states, so I'll return a log of events.
    play(pitIndex) {
        if (!this.isValidMove(pitIndex)) return { valid: false };

        const events = []; // { type: 'sow'|'capture'|'pickup', pit: index, count: num }

        let hand = this.pits[pitIndex];
        this.pits[pitIndex] = 0;
        events.push({ type: 'pickup', pit: pitIndex, count: hand });

        let currentPit = pitIndex;

        while (true) {
            // Sow seeds
            while (hand > 0) {
                currentPit = (currentPit + 1) % 14;
                this.pits[currentPit]++;
                hand--;
                events.push({ type: 'sow', pit: currentPit });
            }

            // Check next pit
            let nextPit = (currentPit + 1) % 14;

            if (this.pits[nextPit] > 0) {
                // Continue chaining: pick up from next pit
                hand = this.pits[nextPit];
                this.pits[nextPit] = 0;
                currentPit = nextPit;
                events.push({ type: 'pickup', pit: currentPit, count: hand });
                // Loop continues
            } else {
                // Next pit is empty -> Capture the one after it
                let capturePit = (nextPit + 1) % 14;
                let capturedAmount = this.pits[capturePit];

                if (capturedAmount > 0) {
                    this.pits[capturePit] = 0;
                    this.scores[this.turn] += capturedAmount;
                    events.push({ type: 'capture', pit: capturePit, count: capturedAmount, player: this.turn });
                }

                // Turn ends
                this.switchTurn();
                break;
            }
        }

        this.checkGameOver();

        return {
            valid: true,
            events,
            pits: [...this.pits],
            scores: [...this.scores],
            turn: this.turn,
            message: this.gameOver ? this.getWinner() : this.message
        };
    }

    switchTurn() {
        this.turn = 1 - this.turn;
        this.message = `Player ${this.turn + 1}'s Turn`;

        // Check if the current player has any valid moves
        // If not, game might end or turn passes? 
        // In Pallanguzhi, if you can't move, usually game ends or opponent continues until they clear?
        // Let's stick to: if no seeds in own rows, game over instantly is a common shorthand, 
        // OR standard rule: round ends, count residuals.
        // For simplicity: If a player cannot move, the game ends.

        if (!this.canPlayerMove(this.turn)) {
            // Collect remaining seeds for the OTHER player? 
            // Usually if you can't move, the round ends. The seeds in your pits stay yours?
            // Let's just flag game over and collect own seeds provided we implement round-based.
            // For a single round quick game:
            this.collectRemaining();
            this.gameOver = true;
        }
    }

    canPlayerMove(playerIndex) {
        const start = playerIndex === 0 ? 0 : 7;
        const end = playerIndex === 0 ? 6 : 13;
        for (let i = start; i <= end; i++) {
            if (this.pits[i] > 0) return true;
        }
        return false;
    }

    collectRemaining() {
        // Add remaining seeds to respective owners
        for (let i = 0; i <= 6; i++) {
            this.scores[0] += this.pits[i];
            this.pits[i] = 0;
        }
        for (let i = 7; i <= 13; i++) {
            this.scores[1] += this.pits[i];
            this.pits[i] = 0;
        }
    }

    checkGameOver() {
        // Game over logic handled in switchTurn for "no moves"
        // Also if total seeds are exhausted (shouldn't happen with conservation unless removed)
    }

    // Simple AI
    getBestMove() {
        const start = this.turn === 0 ? 0 : 7;
        const end = this.turn === 0 ? 6 : 13;

        let bestMove = -1;
        let maxScore = -1;

        // Greedy search: simulate each move
        for (let i = start; i <= end; i++) {
            if (this.pits[i] === 0) continue;

            // Clone state simplisticly
            // This is actually complex to simulate fully because of the chain rule potentially being long.
            // For a "simple AI", let's just pick:
            // 1. A move that grants a capture immediately?
            // 2. Or just random valid move if no capture found.

            // Let's just pick the pit with the MOST seeds for now (creates chaos/long chains)
            // Or use a heuristic.

            if (this.pits[i] > maxScore) {
                maxScore = this.pits[i];
                bestMove = i;
            }
        }

        // Fallback
        if (bestMove === -1) {
            for (let i = start; i <= end; i++) {
                if (this.pits[i] > 0) return i;
            }
        }

        return bestMove;
    }
}
