class Card {
    constructor(name, img) {
        this.name = name;
        this.img = img;
        this.isFlipped = false;
        this.element = this.#createCardElement();
    }

    #createCardElement() {
        const cardElement = document.createElement("div");
        cardElement.classList.add("cell");
        cardElement.innerHTML = `
            <div class="card" data-name="${this.name}">
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">
                        <img src="${this.img}" alt="${this.name}">
                    </div>
                </div>
            </div>
        `;
        return cardElement;
    }

    flip() {
        this.isFlipped = true;
        const cardElement = this.element.querySelector(".card");
        cardElement.classList.add("flipped");
    }

    unflip() {
        this.isFlipped = false;
        const cardElement = this.element.querySelector(".card");
        cardElement.classList.remove("flipped");
    }

    toggleFlip() {
        this.isFlipped ? this.unflip() : this.flip();
    }

    matches(otherCard) {
        return this.name === otherCard.name;
    }
}

class Board {
    constructor(cards) {
        this.cards = cards;
        this.fixedGridElement = document.querySelector(".fixed-grid");
        this.gameBoardElement = document.getElementById("game-board");
    }

    calculateColumns() {
        const numCards = this.cards.length;
        let columns = Math.floor(numCards / 2);

        columns = Math.max(2, Math.min(columns, 12));

        if (columns % 2 !== 0) {
            columns = columns === 11 ? 12 : columns - 1;
        }

        return columns;
    }

    setGridColumns() {
        const columns = this.calculateColumns();
        this.fixedGridElement.className = `fixed-grid has-${columns}-cols`;
    }

    render() {
        this.setGridColumns();
        this.gameBoardElement.innerHTML = "";
        this.cards.forEach((card) => {
            card.element
                .querySelector(".card")
                .addEventListener("click", () => this.onCardClicked(card));
            this.gameBoardElement.appendChild(card.element);
        });
    }

    onCardClicked(card) {
        if (this.onCardClick) {
            this.onCardClick(card);
        }
    }

    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    reset() {
        this.shuffleCards();
        this.render();
    }

    flipDownAllCards() {
        this.cards.forEach((card) => {
            if (card.isFlipped) {
                card.toggleFlip();
            }
        });
    }

    resetGame() {
        this.flipDownAllCards();
        this.reset();
    }
}

class MemoryGame {
    constructor(board, flipDuration = 500) {
        this.board = board;
        this.flippedCards = [];
        this.matchedCards = [];
        this.moveCount = 0;
        this.startTime = null;
        this.timerInterval = null;

        if (flipDuration < 350 || isNaN(flipDuration) || flipDuration > 3000) {
            flipDuration = 350;
            alert(
                "La duración de la animación debe estar entre 350 y 3000 ms, se ha establecido a 350 ms"
            );
        }
        this.flipDuration = flipDuration;
        this.board.onCardClick = this.handleCardClick.bind(this);
        this.board.reset();
        this.startTimer();
    }

    handleCardClick(card) {
        if (this.flippedCards.length < 2 && !card.isFlipped) {
            card.toggleFlip();
            this.flippedCards.push(card);
            this.moveCount++;
            document.getElementById("move-count").textContent = `Movimientos: ${this.moveCount}`;
            if (this.flippedCards.length === 2) {
                setTimeout(() => {
                    this.checkForMatch();
                }, this.flipDuration);
            }
        }
    }

    checkForMatch() {
        const [firstCard, secondCard] = this.flippedCards;
        if (firstCard.matches(secondCard)) {
            this.matchedCards.push(firstCard, secondCard);
            if (this.matchedCards.length === this.board.cards.length) {
                setTimeout(() => {
                    clearInterval(this.timerInterval);
                    this.showScoreModal();
                }, this.flipDuration);
            }
        } else {
            this.flippedCards.forEach((card) => card.toggleFlip());
        }
        this.flippedCards = [];
    }

    async startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            document.getElementById("timer").textContent = `Tiempo: ${Math.floor(elapsed / 1000)}s`;
        }, 1000);
    }

    calculateScore() {
        const elapsed = (Date.now() - this.startTime) / 1000; // en segundos
        const baseScore = 10000;
        const score = Math.max(0, baseScore - (this.moveCount * 10 + elapsed * 5));
        return Math.floor(score);
    }

    showScoreModal() {
        const score = this.calculateScore();
        const modal = document.getElementById("win-modal");
        modal.querySelector("#final-score").textContent = `Puntuación: ${score}`;
        modal.querySelector("#final-moves").textContent = `Movimientos: ${this.moveCount}`;
        modal.querySelector("#final-time").textContent = `Tiempo: ${Math.floor((Date.now() - this.startTime) / 1000)}s`;
        modal.classList.add("is-active");
    }

    resetGame() {
        this.matchedCards = [];
        this.flippedCards = [];
        this.moveCount = 0;
        document.getElementById("move-count").textContent = `Movimientos: ${this.moveCount}`;
        clearInterval(this.timerInterval);
        this.board.resetGame();
        this.startTimer();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const cardsData = [
        { name: "Python", img: "./img/Python.svg" },
        { name: "JavaScript", img: "./img/JS.svg" },
        { name: "Java", img: "./img/Java.svg" },
        { name: "CSharp", img: "./img/CSharp.svg" },
        { name: "Go", img: "./img/Go.svg" },
        { name: "Ruby", img: "./img/Ruby.svg" },
    ];

    const cards = cardsData.flatMap((data) => [
        new Card(data.name, data.img),
        new Card(data.name, data.img),
    ]);
    const board = new Board(cards);
    const memoryGame = new MemoryGame(board, 1000);

    document.getElementById("restart-button").addEventListener("click", () => {
        memoryGame.resetGame();
    });

    document.querySelectorAll(".modal-close, .modal-background").forEach((element) => {
        element.addEventListener("click", () => {
            document.getElementById("win-modal").classList.remove("is-active");
        });
    });
});


