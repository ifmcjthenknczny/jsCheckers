function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

function generateBoard() {
    let whiteSquare = false;
    const main = document.querySelector('main');
    const grid = document.createElement('section');
    grid.classList.add('board');
    const rowOrder = playWhite ? [...rows].reverse() : [...rows];
    const colOrder = playWhite ? [...cols] : [...cols].reverse();

    for (let rowName of rowOrder) {
        whiteSquare = !whiteSquare;
        const squareWithName = document.createElement('div');
        squareWithName.classList.add('grid__square--nameRow', 'grid__square--name');
        squareWithName.innerText = rowName;
        grid.append(squareWithName);
        for (let colName of colOrder) {
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
    for (let colName of colOrder) {
        const squareWithName = document.createElement('div');
        squareWithName.classList.add('grid__square--nameCol', 'grid__square--name');
        squareWithName.innerText = colName;
        grid.append(squareWithName);
    }
    main.appendChild(grid);
    document.body.appendChild(main);
}

function generateStartPosition() {
    const blackSquares = document.querySelectorAll(".grid__square--black");
    const order = ['piece--black', 'piece--white'];
    if (!playWhite) order.reverse();
    for (let i = 0; i < blackSquares.length; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');
        if (i < 3 * 4) piece.classList.add(order[0]);
        else if (i >= 5 * 4) piece.classList.add(order[1]);
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
        for (let legalMoveMark of document.querySelectorAll('.legalMove')) legalMoveMark.remove();
}

function movePiece() {
    const clickedPiece = document.querySelector('#pieceClicked');
    const legalSquare = this.firstElementChild.classList.contains('legalMove');
    // prettier-ignore
    if (!!clickedPiece && legalSquare && orderOfTurns()) {

        if (forcedCapture) {
            removeCapturedPiece(findSquareBetween(clickedPiece.parentElement.id, this.id));
        }
        this.appendChild(clickedPiece);
        if (forcedCapture && legalCapturesOfPiece(clickedPiece).length > 0) {
            removeLegalMovesMark();
            if (orderOfTurns()) {
                if (isThereACapturePossibilty()) generateLegalMovesMark(legalCapturesOfPiece(clickedPiece));
                else generateLegalMovesMark(legalNormalMovesOfPiece(clickedPiece));
                movePiece();
            }
        }
        if (promotion(clickedPiece)) {
            clickedPiece.classList.add("piece--queen");
            const queenDecoration = document.createElement('div');
            queenDecoration.classList.add("piece--queenDecoration");
            clickedPiece.appendChild(queenDecoration);
        }
        lastMoveBlack = !lastMoveBlack;
        pieceUnhold();

        if (endOfGame()) {
            congratsToWinner();
            disableMoves();
        } else {
            changeGameInfo();
        }
    }
}

function congratsToWinner() {
    const whoToMove = document.querySelector(".gameInfo__whoToMove");
    if (lastMoveBlack) {
        whoToMove.innerHTML = '<span>Black</span> won!'
    } else {
        whoToMove.innerHTML = '<span class="white">White</span> won!'
    }
}

function disableMoves() {
    for (let piece of document.querySelector('.piece')) {
        const newPiece = piece.cloneNode(true);
        piece.parentNode.replaceChild(newPiece, piece);
    }
}

function changeGameInfo() {
    const whoToMove = document.querySelector('.gameInfo__whoToMove span');
    whoToMove.classList.toggle('white');

    if (lastMoveBlack) {
        document.querySelector('.gameInfo__turnCounter span').innerText = ++turn;
        whoToMove.innerText = 'White';
    } else {
        whoToMove.innerText = 'Black';
    }
}

function removeCapturedPiece(square) {
    const isQueen = (square.firstChild.firstChild !== null);
    square.firstChild.remove();

    const pieceMini = document.createElement('div');
    lastMoveBlack ? pieceMini.classList.add('miniPiece--black') : pieceMini.classList.add('miniPiece--white');
    pieceMini.classList.add('miniPiece')
    if (isQueen) {
        const queenDecoration = document.createElement('div');
        queenDecoration.classList.add('miniPiece--queen');
        pieceMini.appendChild(queenDecoration);
    }
    const graveyardName = !lastMoveBlack ? '.capturedPieces--top' : '.capturedPieces--bottom';
    document.querySelector(graveyardName).appendChild(pieceMini);
}

function promotion(piece) {
    const [, clickedPieceRow] = piece.parentElement.id;
    if ((lastMoveBlack && clickedPieceRow === '8') || (!lastMoveBlack && clickedPieceRow === '1')) {
        return true
    }
    return false
}

function generateButtons() {
    const resetButton = document.createElement('button');
    resetButton.classList.add('button', 'button--reset');
    resetButton.innerText = 'restart';
    resetButton.addEventListener("click", () => {
        document.body.innerHTML = '';
        lastMoveBlack = true;
        turn = 1;
        generateFirstChoice()
    });
    document.body.appendChild(resetButton);
}

function endOfGame() {
    const selector = lastMoveBlack ? ".piece--white" : ".piece--black";
    const stillPieces = (document.querySelectorAll(selector)).length;
    if (stillPieces === 0) return true;
    if (!checkIfThereArePossibleMoves()) return true;
    return false
}

function checkIfThereArePossibleMoves() {
    const selector = lastMoveBlack ? ".piece--white" : ".piece--black";
    const allColorPieces = [];
    for (let piece of document.querySelectorAll(selector)) allColorPieces.push(piece);
    const legalNormalMoves = allColorPieces.map(p => legalNormalMovesOfPiece(p).length);
    const legalCaptures = allColorPieces.map(p => legalCapturesOfPiece(p).length);
    const legalMoves = legalNormalMoves.concat(legalCaptures);
    const sumOfLegalMoves = legalMoves.reduce((total, curr) => total + curr);
    if (sumOfLegalMoves === 0) return false
    return true
}

function orderOfTurns() {
    const clickedPiece = document.querySelector('#pieceClicked');
    if ((clickedPiece.classList.contains('piece--white') && lastMoveBlack) || (clickedPiece.classList.contains('piece--black') && !lastMoveBlack)) return true
    return false
}

function isThereACapturePossibilty() {
    const selector = lastMoveBlack ? '.piece--white' : '.piece--black';
    const allColorPieces = document.querySelectorAll(selector);

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
    const rowOrder = isPieceWhite ? [...rows] : [...rows].reverse();

    if (pieceCol !== cols[cols.length - 2] && pieceCol !== cols[cols.length - 1]) {
        if (pieceRow !== rowOrder[rowOrder.length - 2] && pieceRow !== rowOrder[rowOrder.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)+2]}${pieceRow+2*colorCoeff}`);
        if (pieceRow !== rowOrder[0] && pieceRow !== rowOrder[1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)+2]}${pieceRow-2*colorCoeff}`);
    }
    if (pieceCol !== cols[0] && pieceCol !== cols[1]) {
        if (pieceRow !== rowOrder[rowOrder.length - 2] && pieceRow !== rowOrder[rowOrder.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)-2]}${pieceRow+2*colorCoeff}`);
        if (pieceRow !== rowOrder[0] && pieceRow !== rowOrder[1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)-2]}${pieceRow-2*colorCoeff}`);
    }

    //checks if target square is not occupierd and there is a piece to capture
    for (let captureCandidate of captureCandidates) {
        const targetSquare = document.querySelector(`#${captureCandidate}`);
        if (!targetSquare.firstElementChild && isThereAPieceToCapture(pieceSquare, captureCandidate)) capturesPossible.push(targetSquare);
    }

    return capturesPossible
}

function legalNormalMovesOfPiece(piece) {
    let [pieceCol, pieceRow] = piece.parentElement.id;
    pieceRow = +pieceRow;
    const isPieceWhite = piece.classList.contains('piece--white');

    const normalMoveCandidates = [];
    const normalMovesPossible = [];

    const colorCoeff = isPieceWhite ? 1 : -1;
    const rowOrder = isPieceWhite ? [...rows] : [...rows].reverse();

    if (pieceRow !== rowOrder[rowOrder.length - 1]) {
        if (pieceCol !== cols[0]) normalMoveCandidates.push(`${cols[cols.indexOf(pieceCol)-1]}${pieceRow+colorCoeff}`);
        if (pieceCol !== cols[cols.length - 1]) normalMoveCandidates.push(`${cols[cols.indexOf(pieceCol)+1]}${pieceRow+colorCoeff}`);
    }

    //checks if square is not occupied by another piece
    for (let normalMoveCandidate of normalMoveCandidates) {
        const targetSquare = document.querySelector(`#${normalMoveCandidate}`);
        if (!targetSquare.firstElementChild) normalMovesPossible.push(targetSquare);
    }

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
    for (let legalMoveSquare of legalMovesList) {
        const legalMoveMark = document.createElement('div');
        legalMoveMark.classList.add('legalMove');
        legalMoveSquare.appendChild(legalMoveMark);
    }
}

function generateGraveyards() {
    const graveyardTop = document.createElement('section');
    const graveyardBottom = document.createElement('section');
    for (let graveyard of [graveyardTop, graveyardBottom]) graveyard.classList.add('capturedPieces');
    graveyardTop.classList.add('capturedPieces--top');
    graveyardBottom.classList.add('capturedPieces--bottom');
    const main = document.querySelector('main');
    document.body.insertBefore(graveyardTop, main);
    document.body.insertBefore(graveyardBottom, main.nextSibling);
}

function generateGameInfo() {
    const gameInfo = document.createElement('section');
    gameInfo.className = 'gameInfo';
    const whoToMove = document.createElement('section');
    whoToMove.className = 'gameInfo__whoToMove';
    const turnCounter = document.createElement('section');
    turnCounter.className = 'gameInfo__turnCounter';

    whoToMove.innerHTML = '<span class="white">White</span> to move';
    turnCounter.innerHTML = 'Turn: <span>1</span>';
    gameInfo.appendChild(whoToMove);
    gameInfo.appendChild(turnCounter);
    document.body.prepend(gameInfo);
}

function generateFirstChoice() {
    const main = document.createElement('main');
    const question = document.createElement('section');
    question.classList.add("question");
    question.innerText = 'choose your color';
    const buttons = document.createElement('section');
    buttons.classList.add('buttonContainer');
    const buttonWhite = document.createElement('button');
    buttonWhite.classList.add('button--white', 'button', 'button--color');
    buttonWhite.innerText = 'white';
    const buttonBlack = document.createElement('button');
    buttonBlack.classList.add('button--black', 'button', 'button--color');
    buttonBlack.innerText = 'black';
    buttonWhite.addEventListener('click', () => {
        playWhite = true;
        main.innerHTML = '';
        startGame();
    })
    buttonBlack.addEventListener('click', () => {
        playWhite = false;
        main.innerHTML = '';
        startGame();
    })
    main.appendChild(question);
    buttons.appendChild(buttonWhite);
    buttons.appendChild(buttonBlack);
    main.appendChild(buttons);
    document.body.appendChild(main);
}

function startGame() {
    generateBoard();
    generateStartPosition();
    generateGraveyards();
    generateButtons();
    generateGameInfo();
}

const cols = 'abcdefgh'.split('');
const rows = range(8, 1);
let turn = 1;
let forcedCapture = false;
let lastMoveBlack = true;
let playWhite = true;
// let vsComputer = false;
generateFirstChoice();

// TO DO CSS HTML
//html description
//nazwy trochę bardziej BEM
//fajny font przyciski
//smooth transition moves
//box shadow dla pól szachownicy
//tekstura drewna
//responsywne dla mobili
//wygląd bierek - dać w środku okrąg
//obsługa text-stroke żeby się zabezpieczyć
//mała damka
//wyśrodkować gameinfo
//dopieścić okno wyboru na początku
//gladkie przejscie miedzy oknem wyboru i szachownica

// TO DO LOGIKA JS
//ruchy damki: funkcja sprawdzająca czy na przekątnej można bić, dodać funkcję sprawdzającą ruchy dla damki
//warunki remisu i komunikat - po 15 ruchów damkami bez zmniejszania liczby pionów na planszy

/* Damki mogą poruszać się w jednym ruchu o dowolną liczbę pól do przodu lub do tyłu po przekątnej, zatrzymując się na wolnych polach.
Bicie damką jest możliwe z dowolnej odległości po linii przekątnej i następuje przez przeskoczenie pionu (lub damki) przeciwnika, za którym musi znajdować się co najmniej jedno wolne pole -- damka przeskakuje na dowolne z tych pól i może kontynuować bicie (na tej samej lub prostopadłej linii). */

//2 players vs random ai (po damce) + okno wyboru + obracanie szachownicy po każdym ruchu

//naprawić eroory w konsoli
//alert o biciu

//wybór koloru pionków w dowolnym momencie?
//dać też inne rozmiary niż 8x8
//unhold na body
//drag and drop
//log ruchów & cofanie


// PRZEJRZYSTOŚĆ KODU
//za dużo zmiennej z klikniętą bierką - wyłączyć ją i tylko zmieniać jej zawartość
//w ogóle elementy querySelector na zewnątz funkcji
//opisac funkcje
//dodac typy zmiennych
//mniejsze funkcje wszędzie generalnie, szczegolnie move, generateboard, pieceunhold
//forcedcapture - po co to
//readme github
//funkcje po kolei umiejscowic w kodzie
//zamiast clicked piece == this?
//wrzucić na hosting