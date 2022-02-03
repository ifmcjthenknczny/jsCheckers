function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

function charRange(startChar, endChar) {
    return String.fromCharCode(...range(endChar.charCodeAt(0) -
        startChar.charCodeAt(0), startChar.charCodeAt(0))).split('')
}

// dać tam też inne rozmiary niż 8x8
function generateBoard() {
    let whiteSquare = false;
    const grid = document.querySelector(".board");
    for (let rowName of range(8, 1).reverse()) {
        whiteSquare = !whiteSquare;
        const squareWithName = document.createElement('div');
        squareWithName.classList.add('grid__square--nameRow', 'grid__square--name');
        squareWithName.innerText = rowName;
        grid.append(squareWithName);
        for (let colName of charRange('a', 'i')) {
            const square = document.createElement('div');
            const nameOfSquare = `${colName + rowName}`;
            square.classList.add('grid__square');
            square.setAttribute('id', nameOfSquare);
            if (whiteSquare) {
                square.classList.add('grid__square--white', 'grid__square--whiteClicked');
                square.addEventListener('click', pieceUnhold);
            } else {
                square.classList.add('grid__square--black', 'grid__square--blackClicked');
                square.addEventListener('click', movePiece);
            }
            whiteSquare = !whiteSquare;
            grid.appendChild(square);
        }
    }
    grid.append(document.createElement('div'));
    for (let colName of charRange('a', 'i')) {
        const squareWithName = document.createElement('div');
        squareWithName.classList.add('grid__square--nameCol', 'grid__square--name');
        squareWithName.innerText = colName;
        grid.append(squareWithName);
    }
}

function generateStartPosition() {
    const blackSquares = document.querySelectorAll(".grid__square--black");
    for (let i = 0; i < blackSquares.length; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');
        if (i < 3 * 4) piece.classList.add('piece--black');
        else if (i >= 5 * 4) piece.classList.add('piece--white');
        piece.addEventListener('click', pieceHold);
        if (i < 3 * 4 || i >= 5 * 4) blackSquares[i].append(piece);
    }
}

// function pieceHeldDown () {
//     const heldPieceSquare = this.closest('div.grid__square');
//     heldPieceSquare.classList.add('grid__square--blackClicked');
//     console.log(this.closest('div.grid__square'));
// }

function pieceHold() {
    pieceUnhold();
    this.setAttribute('id', 'pieceClicked');

    // if ((this.classList.contains("piece--white") && lastMoveBlack) || (this.classList.contains("piece--black") && !lastMoveBlack))
}

function pieceUnhold() {
    if (document.querySelector('#pieceClicked')) document.querySelector('#pieceClicked').removeAttribute('id');
}

function movePiece() {
    const clickedPiece = document.querySelector('#pieceClicked');
    if (clickedPiece && !this.childNodes.length && legalMove()) {
        // if not the same square
        if (clickedPiece.closest('.grid__square') !== this) {
            this.appendChild(clickedPiece);
            lastMoveBlack = !lastMoveBlack;
        }
    }
}

function buttonsInit() {
    const resetButton = document.querySelector(".button--reset");
    resetButton.addEventListener("click", function () {
        const board = document.querySelector(".board");
        board.innerHTML = '';
        lastMoveBlack = true;
        generateBoard();
        generateStartPosition();
    });
    const invertButton = document.querySelector(".button--invert");
    invertButton.addEventListener("click", function () {
        playWhite ? this.textContent = "Play White" : this.textContent = "Play Black";
        playWhite = !playWhite;
    });
}

function legalMove() {
    const clickedPiece = document.querySelector('#pieceClicked');
    if ((clickedPiece.classList.contains('piece--white') && lastMoveBlack) || (clickedPiece.classList.contains('piece--black') && !lastMoveBlack)) return true
    return false
}

let lastMoveBlack = true;
let playWhite = true;
generateBoard();
generateStartPosition();
buttonsInit();

// TO DO wygląd
//fajny font
//smooth transition moves
//box shadow
//tekstura drewna
//responsywne
//wygląd damki - pseudodiv w środku

// TO DO logika
//legalne ruchy
//zbijanie i licznik zbić
//promocja i obsługa damki
//random ai
//obracanie szachownicy
//wybór koloru pionków
//warunki zwycięstwa
//unhold na body