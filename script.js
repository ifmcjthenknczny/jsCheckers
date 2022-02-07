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

function pieceHold() {
    pieceUnhold();
    this.setAttribute('id', 'pieceClicked');
    if (orderOfTurns()) {
        generateLegalMovesMark(legalMoves());
    }
}

function pieceUnhold() {
    if (document.querySelector('#pieceClicked')) document.querySelector('#pieceClicked').removeAttribute('id');
    if (document.querySelectorAll('.legalMoves')) {
        for (element of document.querySelectorAll('.legalMove')) {
            element.remove();
        }
    }
}

function nodeListContains(nodelist, obj) {
    if (-1 < Array.from(nodelist).indexOf(obj)) return true;
    return false;
}

function movePiece() {
    const clickedPiece = document.querySelector('#pieceClicked');
    if (clickedPiece && this.firstElementChild.classList.contains('legalMove') && orderOfTurns()) {
        this.appendChild(clickedPiece);
        lastMoveBlack = !lastMoveBlack;
        pieceUnhold();
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

function orderOfTurns() {
    const clickedPiece = document.querySelector('#pieceClicked');
    if ((clickedPiece.classList.contains('piece--white') && lastMoveBlack) || (clickedPiece.classList.contains('piece--black') && !lastMoveBlack)) return true
    return false
}

function legalMoves() {
    const cols = 'abcdefgh'.split('');
    const rows = range(8, 1);

    const pieceClicked = document.querySelector('#pieceClicked');
    const pieceClickedSquare = pieceClicked.parentElement.id;
    const pieceClickedCol = pieceClickedSquare.split('')[0];
    const pieceClickedRow = parseInt(pieceClickedSquare.split('')[1]);
    const isWhite = pieceClicked.classList.contains('piece--white');

    const normalMoveCandidates = [];
    const captureCandidates = [];
    const legalMovesList = [];

    const colorCoeff = isWhite ? 1 : -1;
    if (!isWhite) rows.reverse();

    // if not last row
    if (pieceClickedRow !== rows[rows.length - 1]) {
        if (pieceClickedCol !== 'a') normalMoveCandidates.push(`${cols[cols.indexOf(pieceClickedCol)-1]}${pieceClickedRow+colorCoeff}`);
        if (pieceClickedCol !== 'h') normalMoveCandidates.push(`${cols[cols.indexOf(pieceClickedCol)+1]}${pieceClickedRow+colorCoeff}`);
    }
    if (pieceClickedCol !== 'g' && pieceClickedCol !== 'h') {
        if (pieceClickedRow !== rows[rows.length - 2] && pieceClickedRow !== rows[rows.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceClickedCol)+2]}${pieceClickedRow+2*colorCoeff}`);
        if (pieceClickedRow !== rows[0] && pieceClickedRow !== rows[1]) captureCandidates.push(`${cols[cols.indexOf(pieceClickedCol)+2]}${pieceClickedRow-2*colorCoeff}`);
    }
    if (pieceClickedCol !== 'a' && pieceClickedCol !== 'b') {
        if (pieceClickedRow !== rows[rows.length - 2] && pieceClickedRow !== rows[rows.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceClickedCol)-2]}${pieceClickedRow+2*colorCoeff}`);
        if (pieceClickedRow !== rows[0] && pieceClickedRow !== rows[1]) captureCandidates.push(`${cols[cols.indexOf(pieceClickedCol)-2]}${pieceClickedRow-2*colorCoeff}`);
    }

    //check if square is occupied by another piece
    for (let normalMoveCandidate of normalMoveCandidates) {
        const targetSquare = document.querySelector(`#${normalMoveCandidate}`);
        if (!targetSquare.firstElementChild) legalMovesList.push(targetSquare);
    }
    //checks if there is a piece to capture and square not occupied
    for (let captureCandidate of captureCandidates) {
        const targetSquare = document.querySelector(`#${captureCandidate}`);
        if (!targetSquare.firstElementChild && pieceToTake(pieceClickedSquare, captureCandidate)) legalMovesList.push(targetSquare);
    }
    // console.log(legalMovesList)
    return legalMovesList
}

function pieceToTake(originalSquare, targetSquare) {
    const cols = 'abcdefgh'.split('');
    const rows = '12345678'.split('');
    const [originalCol, originalRow] = originalSquare;
    const [targetCol, targetRow] = targetSquare;
    const squareBetween = document.querySelector(`#${cols[(cols.indexOf(originalCol)+cols.indexOf(targetCol))/2]}${(parseInt(originalRow)+parseInt(targetRow))/2}`);
    if (squareBetween.firstElementChild) {
        if ((squareBetween.firstElementChild.classList.contains('piece--white') && !lastMoveBlack) || (squareBetween.firstElementChild.classList.contains('piece--black') && lastMoveBlack)) return true;
        return false
    }
}

function generateLegalMovesMark(legalMovesList) {
    for (legalMoveSquare of legalMovesList) {
        const legalMoveMark = document.createElement('div');
        legalMoveMark.classList.add('legalMove');
        legalMoveSquare.appendChild(legalMoveMark);
    }
}

function startGame() {
    generateBoard();
    generateStartPosition();
    buttonsInit();
}

let lastMoveBlack = true;
let playWhite = true;
startGame();


// TO DO wygląd
//html description
//readme
//fajny font
//smooth transition moves
//box shadow
//tekstura drewna
//responsywne
//wygląd damki - pseudodiv w środku
//wygląd bierek

// TO DO logika
//legalne ruchy
//zbijanie i licznik zbić
//promocja i ruchy damki
//random ai
//obracanie szachownicy
//wybór koloru pionków
//warunki zwycięstwa
//unhold na body
//bicia combo jako legalny ruch