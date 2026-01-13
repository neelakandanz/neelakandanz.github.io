export class GameState {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.targets = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ']; // Starting set
        this.currentTarget = this.targets[0];
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.updateUI();
        this.nextTarget();
    }

    addScore(val) {
        this.score += val;
        if (this.score < 0) this.score = 0;

        // Level up every 50 points
        if (Math.floor(this.score / 50) + 1 > this.level) {
            this.level++;
            // Could trigger speed up in LetterManager if we passed it in, 
            // but effectively we can just let Main handle speed based on level or store it here.
        }

        this.updateUI();
    }

    nextTarget() {
        this.currentTarget = this.targets[Math.floor(Math.random() * this.targets.length)];
        const el = document.getElementById('target-letter');
        if (el) el.innerText = this.currentTarget;
    }

    updateUI() {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        if (scoreEl) scoreEl.innerText = this.score;
        if (levelEl) levelEl.innerText = this.level;
    }
}
