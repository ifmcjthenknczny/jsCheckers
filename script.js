function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

function generateBoard() {
    let whiteSquare = false;
    const grid = document.querySelector(".board");
    for (let rowName of range(8, 1).reverse()) {
        whiteSquare = !whiteSquare;
        const squareWithName = document.createElement('div');
        squareWithName.classList.add('grid__square--nameRow', 'grid__square--name');
        squareWithName.innerText = rowName;
        grid.append(squareWithName);
        for (let colName of cols) {
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
    for (let colName of cols) {
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
        if (isThereACapturePossibilty()) generateLegalMovesMark(legalCapturesOfPiece(this));
        else generateLegalMovesMark(legalNormalMovesOfPiece(this));
    }
}

function pieceUnhold() {
    if (document.querySelector('#pieceClicked')) document.querySelector('#pieceClicked').removeAttribute('id');
    removeLegalMovesMark();
}

function removeLegalMovesMark() {
    if (document.querySelectorAll('.legalMove'))
        for (element of document.querySelectorAll('.legalMove')) element.remove();
}

function nodeListContains(nodelist, obj) {
    if (-1 < Array.from(nodelist).indexOf(obj)) return true;
    return false;
}

function movePiece() {
    const clickedPiece = document.querySelector('#pieceClicked');
    if (clickedPiece && this.firstElementChild.classList.contains('legalMove') && orderOfTurns()) {

        // console.log(forcedCapture);
        // console.log(`I am here. ${this}`);
        if (forcedCapture) {
            // console.log(findSquareBetween(clickedPiece.parentElement.id, this.id));
            removeCapturedPiece(findSquareBetween(clickedPiece.parentElement.id, this.id));
        }
        this.appendChild(clickedPiece);
        // if (forcedCapture && isThereACapturePossibilty()) {
        if (forcedCapture && legalCapturesOfPiece(clickedPiece).length > 0) {
            removeLegalMovesMark();
            if (orderOfTurns()) {
                if (isThereACapturePossibilty()) generateLegalMovesMark(legalCapturesOfPiece(clickedPiece));
                else generateLegalMovesMark(legalNormalMovesOfPiece(clickedPiece));
                movePiece();
            }
        }

        lastMoveBlack = !lastMoveBlack;
        pieceUnhold();
        const whoToMove = document.querySelector('.gameInfo__whoToMove span');
        whoToMove.classList.toggle('white');

        if (lastMoveBlack) {
            document.querySelector('.gameInfo__turnCounter span').innerText = ++turn;
            whoToMove.innerText = 'White';
        } else {
            whoToMove.innerText = 'Black';
        }
    }
}

function removeCapturedPiece(square) {
    square.firstChild.remove();

    const pieceMini = document.createElement('div');
    lastMoveBlack ? pieceMini.classList.add('piece__mini--black') : pieceMini.classList.add('piece__mini--white');
    pieceMini.classList.add('piece__mini')
    const graveyardName = !lastMoveBlack ? '.capturedPiecesTop' : '.capturedPiecesBottom';
    document.querySelector(graveyardName).appendChild(pieceMini);
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

function endOfGame() {
    const stillWhitePieces = document.querySelectorAll('piece--white');
    const stillBlackPieces = document.querySelectorAll('piece--black');

}

function orderOfTurns() {
    const clickedPiece = document.querySelector('#pieceClicked');
    if ((clickedPiece.classList.contains('piece--white') && lastMoveBlack) || (clickedPiece.classList.contains('piece--black') && !lastMoveBlack)) return true
    return false
}

function isThereACapturePossibilty() {
    let allColorPieces;
    if (lastMoveBlack) allColorPieces = document.querySelectorAll('.piece--white');
    else allColorPieces = document.querySelectorAll('.piece--black');

    for (let piece of allColorPieces) {
        if (legalCapturesOfPiece(piece).length > 0) {
            forcedCapture = true;
            return true
        }
    }
    forcedCapture = false;
    return false
}

function legalCapturesOfPiece(piece) {
    const pieceSquare = piece.parentElement.id;
    const pieceCol = pieceSquare.split('')[0];
    const pieceRow = parseInt(pieceSquare.split('')[1]);
    const isPieceWhite = piece.classList.contains('piece--white');

    const captureCandidates = [];
    const capturesPossible = [];

    const colorCoeff = isPieceWhite ? 1 : -1;
    if (!isPieceWhite) rows.reverse();

    // captures
    if (pieceCol !== 'g' && pieceCol !== 'h') {
        if (pieceRow !== rows[rows.length - 2] && pieceRow !== rows[rows.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)+2]}${pieceRow+2*colorCoeff}`);
        if (pieceRow !== rows[0] && pieceRow !== rows[1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)+2]}${pieceRow-2*colorCoeff}`);
    }
    if (pieceCol !== 'a' && pieceCol !== 'b') {
        if (pieceRow !== rows[rows.length - 2] && pieceRow !== rows[rows.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)-2]}${pieceRow+2*colorCoeff}`);
        if (pieceRow !== rows[0] && pieceRow !== rows[1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)-2]}${pieceRow-2*colorCoeff}`);
    }

    //checks if there is a piece to capture and square not occupied
    for (let captureCandidate of captureCandidates) {
        const targetSquare = document.querySelector(`#${captureCandidate}`);
        if (!targetSquare.firstElementChild && isThereAPieceToCapture(pieceSquare, captureCandidate)) capturesPossible.push(targetSquare);
    }
    if (!isPieceWhite) rows.reverse();

    return capturesPossible
}

function legalNormalMovesOfPiece(piece) {
    const pieceSquare = piece.parentElement.id;
    const pieceCol = pieceSquare.split('')[0];
    const pieceRow = parseInt(pieceSquare.split('')[1]);
    const isPieceWhite = piece.classList.contains('piece--white');

    const normalMoveCandidates = [];
    const normalMovesPossible = [];

    const colorCoeff = isPieceWhite ? 1 : -1;
    if (!isPieceWhite) rows.reverse();

    // normal move - if not last row
    if (pieceRow !== rows[rows.length - 1]) {
        if (pieceCol !== 'a') normalMoveCandidates.push(`${cols[cols.indexOf(pieceCol)-1]}${pieceRow+colorCoeff}`);
        if (pieceCol !== 'h') normalMoveCandidates.push(`${cols[cols.indexOf(pieceCol)+1]}${pieceRow+colorCoeff}`);
    }

    //check if square is occupied by another piece
    for (let normalMoveCandidate of normalMoveCandidates) {
        const targetSquare = document.querySelector(`#${normalMoveCandidate}`);
        if (!targetSquare.firstElementChild) normalMovesPossible.push(targetSquare);
    }

    if (!isPieceWhite) rows.reverse();

    return normalMovesPossible
}

function isThereAPieceToCapture(originalSquare, targetSquare) {
    const squareBetween = findSquareBetween(originalSquare, targetSquare);
    if (squareBetween.firstElementChild) {
        if ((squareBetween.firstElementChild.classList.contains('piece--white') && !lastMoveBlack) || (squareBetween.firstElementChild.classList.contains('piece--black') && lastMoveBlack)) return true;
    }
    return false
}

function findSquareBetween(originalSquare, targetSquare) {
    const [originalCol, originalRow] = originalSquare;
    const [targetCol, targetRow] = targetSquare;

    return document.querySelector(`#${cols[(cols.indexOf(originalCol)+cols.indexOf(targetCol))/2]}${(parseInt(originalRow)+parseInt(targetRow))/2}`);
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

const cols = 'abcdefgh'.split('');
const rows = range(8, 1);
let turn = 1;
let forcedCapture = false;
let lastMoveBlack = true;
let playWhite = true;
startGame();
// let clickedPiece;

// TO DO CSS HTML
//html description
//nazwy trochę bardziej BEM
//fajny font przyciski
//smooth transition moves
//box shadow dla pól szachownicy
//tekstura drewna
//responsywne dla mobiki
//wygląd damki - pseudodiv w środku
//wygląd bierek - dać w środku okrąg
//obsługa text-stroke żeby się zabezpieczyć

// TO DO LOGIKA JS
//promocja i ruchy damki
//warunki zwycięstwa/porażki zaimplementować wraz z fanfarami
//random ai

//naprawić eroory
//alert o biciu

//obracanie szachownicy
//wybór koloru pionków

//dać też inne rozmiary niż 8x8
//unhold na body

// PRZEJRZYSTOŚĆ KODU
//za dużo zmiennej z klikniętą bierką - wyłączyć ją i tylko zmieniać jej zawartość
//w ogóle elementy querySelector na zewnątz funkcji
//rozdzielić generateboard na mniejsze funkcje
//opisac funkcje
//dodac typy zmiennych
//mniejsze funkcje wszędzie generalnie
//piece unhold na mniejsze funkcje
//forcedcapture - po co to
//readme github