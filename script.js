function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        else if (i >= 5 * 4) {
            piece.classList.add(order[1]);
            piece.addEventListener('click', pieceHold);
        }
        if (i < 3 * 4 || i >= 5 * 4) blackSquares[i].append(piece);
    }
}

function pieceHold() {
    if (!isComputerTurn() && !endOfGame()) {
        pieceUnhold();
        this.setAttribute('id', 'pieceClicked');
        if (isThereACapturePossibility()) generateLegalMovesMark(legalCapturesOfPiece(this));
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
    // prettier-ignore
    const legalSquare = this.firstElementChild.classList.contains('legalMove');
    if (!!clickedPiece && legalSquare && !isComputerTurn()) {
        (clickedPiece.classList.contains('piece--queen') && !forcedCapture) ? onlyQueenMovesWithoutCapture++ : onlyQueenMovesWithoutCapture = 0;
        if (forcedCapture) removeCapturedPiece(findSquareOfAPieceToCapture(clickedPiece.parentElement.id, this.id));
        this.appendChild(clickedPiece);
        if (forcedCapture && legalCapturesOfPiece(clickedPiece).length > 0) {
            removeLegalMovesMark();
            generateLegalMovesMark(legalCapturesOfPiece(clickedPiece));
        } else {
            if (promotion(clickedPiece)) crownTheQueen(clickedPiece);
            pieceUnhold();
            endTurn();
        }
    }
}

function findAllLegalMoves() {
    const selector = playWhite ? ".piece--black" : ".piece--white";
    const allComputerPieces = [...document.querySelectorAll(selector)];
    const legalMoves = {};

    if (isThereACapturePossibility()) {
        for (let piece of allComputerPieces) {
            const legalMovesList = legalCapturesOfPiece(piece);
            if (legalMovesList.length > 0) legalMoves[piece.parentElement.id] = legalMovesList;
        }
    } else {
        for (let piece of allComputerPieces) {
            const legalMovesList = legalNormalMovesOfPiece(piece);
            if (legalMovesList.length > 0) legalMoves[piece.parentElement.id] = legalMovesList;
        }
    }
    return legalMoves
}

async function computerMove() {
    const [nameOfSquareOfPieceToMove, nameOfTargetSquare] = pickAMove(findAllLegalMoves());
    const pieceToMove = document.querySelector(`#${nameOfSquareOfPieceToMove}`).firstElementChild;
    const targetSquare = document.querySelector(`#${nameOfTargetSquare}`);

    (pieceToMove.classList.contains('piece--queen') && !forcedCapture) ? onlyQueenMovesWithoutCapture++ : onlyQueenMovesWithoutCapture = 0;

    await sleep(800);

    if (forcedCapture) removeCapturedPiece(findSquareOfAPieceToCapture(pieceToMove.parentElement.id, targetSquare.id));
    targetSquare.appendChild(pieceToMove);
    if (forcedCapture && legalCapturesOfPiece(pieceToMove).length > 0) computerMove();
    else {
        if (promotion(pieceToMove)) crownTheQueen(pieceToMove);
        endTurn();
    }
}

function endTurn() {
    lastMoveBlack = !lastMoveBlack;
    if (endOfGame()) {
        congratsToWinner();
        disableMoves();
    } else {
        changeGameInfo();
        if (isComputerTurn()) computerMove();
    }
}

function isComputerTurn() {
    if ((playWhite && !lastMoveBlack) || !playWhite && lastMoveBlack) return true
    return false
}

function crownTheQueen(piece) {
    piece.classList.add("piece--queen");
    const queenDecoration = document.createElement('div');
    queenDecoration.classList.add("piece--queenDecoration");
    piece.appendChild(queenDecoration);
}

function congratsToWinner() {
    const whoToMove = document.querySelector(".gameInfo__whoToMove");
    if (onlyQueenMovesWithoutCapture >= 30) {
        whoToMove.innerHTML = 'It is a <span>Draw</span>!'
    } else if (lastMoveBlack) {
        whoToMove.innerHTML = '<span>Black</span> won!'
    } else {
        whoToMove.innerHTML = '<span class="white">White</span> won!'
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
    const isQueen = square.firstChild.classList.contains('piece--queen');
    square.firstChild.remove();

    const pieceMini = document.createElement('div');
    if (isQueen) pieceMini.classList.add('miniPiece--queen');
    else lastMoveBlack ? pieceMini.classList.add('miniPiece--black') : pieceMini.classList.add('miniPiece--white');
    pieceMini.classList.add('miniPiece')
    const targetGraveyard = ((!lastMoveBlack && playWhite) || lastMoveBlack && !playWhite) ? '.capturedPieces--top' : '.capturedPieces--bottom';
    document.querySelector(targetGraveyard).appendChild(pieceMini);
}

function promotion(piece) {
    if (piece.classList.contains('piece--queen')) return false;
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
        // const main = 
        document.body.innerHTML = '';
        document.body.appendChild(document.createElement('main'));
        lastMoveBlack = true;
        turn = 1;
        generateFirstQuestion();
    });
    document.body.appendChild(resetButton);
}

function endOfGame() {
    const selector = lastMoveBlack ? ".piece--white" : ".piece--black";
    const stillPieces = (document.querySelectorAll(selector)).length;
    if (stillPieces === 0) return true;
    if (!checkIfThereArePossibleMoves()) return true;
    if (onlyQueenMovesWithoutCapture >= 30) return true;
    return false
}

function checkIfThereArePossibleMoves() {
    const selector = lastMoveBlack ? ".piece--white" : ".piece--black";
    const allColorPieces = [...document.querySelectorAll(selector)];
    const legalNormalMoves = allColorPieces.map(p => legalNormalMovesOfPiece(p).length);
    const legalCaptures = allColorPieces.map(p => legalCapturesOfPiece(p).length);
    const legalMoves = legalNormalMoves.concat(legalCaptures);
    const sumOfLegalMoves = legalMoves.reduce((total, curr) => total + curr);
    if (sumOfLegalMoves === 0) return false
    return true
}

function isThereACapturePossibility() {
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
    let [pieceCol, pieceRow] = pieceSquare;
    pieceRow = +pieceRow;
    const isPieceWhite = piece.classList.contains('piece--white');

    const captureCandidates = [];
    const capturesPossible = [];

    const colorCoeff = isPieceWhite ? 1 : -1;
    const rowOrder = isPieceWhite ? [...rows] : [...rows].reverse();

    if (!piece.classList.contains('piece--queen')) {
        if (pieceCol !== cols[cols.length - 2] && pieceCol !== cols[cols.length - 1]) {
            if (pieceRow !== rowOrder[rowOrder.length - 2] && pieceRow !== rowOrder[rowOrder.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)+2]}${pieceRow+2*colorCoeff}`);
            if (pieceRow !== rowOrder[0] && pieceRow !== rowOrder[1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)+2]}${pieceRow-2*colorCoeff}`);
        }
        if (pieceCol !== cols[0] && pieceCol !== cols[1]) {
            if (pieceRow !== rowOrder[rowOrder.length - 2] && pieceRow !== rowOrder[rowOrder.length - 1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)-2]}${pieceRow+2*colorCoeff}`);
            if (pieceRow !== rowOrder[0] && pieceRow !== rowOrder[1]) captureCandidates.push(`${cols[cols.indexOf(pieceCol)-2]}${pieceRow-2*colorCoeff}`);
        }
        //checks if target square is not occupied and there is a piece to capture
        for (let captureCandidate of captureCandidates) {
            const targetSquare = document.querySelector(`#${captureCandidate}`);
            if (!targetSquare.firstElementChild && !!findSquareOfAPieceToCapture(pieceSquare, captureCandidate)) capturesPossible.push(targetSquare);
        }
    } else {
        for (let colsUp of [true, false]) {
            for (let rowsUp of [true, false]) {
                capturesPossible.push(...diagonalQueenCaptures(pieceSquare, colsUp, rowsUp));
            }
        }
    }
    return capturesPossible
}

function legalNormalMovesOfPiece(piece) {
    let [pieceCol, pieceRow] = piece.parentElement.id;
    pieceRow = +pieceRow;
    const isPieceWhite = piece.classList.contains('piece--white');
    const isPieceQueen = piece.classList.contains('piece--queen');

    let normalMoveCandidates = [];
    let normalMovesPossible = [];

    const colorCoeff = isPieceWhite ? 1 : -1;
    const rowOrder = isPieceWhite ? [...rows] : [...rows].reverse();

    if (!isPieceQueen) {
        if (pieceRow !== rowOrder[rowOrder.length - 1]) {
            if (pieceCol !== cols[0]) normalMoveCandidates.push(`${cols[cols.indexOf(pieceCol)-1]}${pieceRow+colorCoeff}`);
            if (pieceCol !== cols[cols.length - 1]) normalMoveCandidates.push(`${cols[cols.indexOf(pieceCol)+1]}${pieceRow+colorCoeff}`);
        }
        //checks if square is not occupied by another piece
        for (let normalMoveCandidate of normalMoveCandidates) {
            const targetSquare = document.querySelector(`#${normalMoveCandidate}`);
            if (!targetSquare.firstElementChild) normalMovesPossible.push(targetSquare);
        }
    } else {
        for (let colsUp of [true, false]) {
            for (let rowsUp of [true, false]) {
                normalMovesPossible.push(...diagonalQueenMoves(piece.parentElement.id, colsUp, rowsUp));
            }
        }
    }
    return normalMovesPossible
}

function diagonalQueenCaptures(startingSquare, colsIncrease, rowsIncrease) {
    const classToCapture = lastMoveBlack ? 'piece--black' : 'piece--white';
    const classOfQueen = lastMoveBlack ? 'piece--white' : 'piece--black';

    let [startingCol, startingRow] = startingSquare;
    let rowIndex = rows.indexOf(+startingRow);
    let colIndex = cols.indexOf(startingCol);
    const possibleSquares = [];
    const colBoundary = colsIncrease ? cols.length - 1 : 0;
    const rowBoundary = rowsIncrease ? rows.length - 1 : 0;
    const deltaCol = colsIncrease ? 1 : -1;
    const deltaRow = rowsIncrease ? 1 : -1;
    colIndex += deltaCol;
    rowIndex += deltaRow;
    let freeSquareFlag = false;

    while (rowIndex !== rowBoundary + deltaRow && colIndex !== colBoundary + deltaCol) {
        const squareName = `${cols[colIndex]}${rowIndex+1}`;
        const square = document.querySelector(`#${squareName}`);
        if (!!square.firstChild) {
            if (freeSquareFlag) break;
            else if (square.firstChild.classList.contains(classToCapture)) freeSquareFlag = true;
            else if (square.firstChild.classList.contains(classOfQueen)) break;
        }
        if (!square.firstChild && freeSquareFlag) possibleSquares.push(square);

        colIndex += deltaCol;
        rowIndex += deltaRow;
    }
    return possibleSquares
}

function pickAMove(legalMovesDict) {
    const piecesThatCanMove = Object.keys(legalMovesDict);
    const pieceToMove = piecesThatCanMove[Math.floor(Math.random() * piecesThatCanMove.length)];
    const possibleMoves = legalMovesDict[pieceToMove];
    const targetSquare = possibleMoves.length === 1 ? possibleMoves[0].id : possibleMoves[Math.floor(Math.random() * possibleMoves.length)].id;
    //outputs String[originalPieceSquare, targetPieceSquare]
    return [pieceToMove, targetSquare]
}

function diagonalQueenMoves(startingSquare, colsIncrease, rowsIncrease) {
    let [startingCol, startingRow] = startingSquare;
    let rowIndex = rows.indexOf(+startingRow);
    let colIndex = cols.indexOf(startingCol);
    const possibleSquares = [];
    const colBoundary = colsIncrease ? cols.length - 1 : 0;
    const rowBoundary = rowsIncrease ? rows.length - 1 : 0;
    const deltaCol = colsIncrease ? 1 : -1;
    const deltaRow = rowsIncrease ? 1 : -1;
    colIndex += deltaCol;
    rowIndex += deltaRow;
    while (rowIndex !== rowBoundary + deltaRow && colIndex !== colBoundary + deltaCol) {
        const squareName = `${cols[colIndex]}${rowIndex+1}`;
        const square = document.querySelector(`#${squareName}`);
        if (!!square.firstChild) {
            if (square.firstChild.classList.contains('piece')) return possibleSquares;
        } else possibleSquares.push(square);
        colIndex += deltaCol;
        rowIndex += deltaRow;
    }
    return possibleSquares
}

function createDiagonalIterable(originalIndex, targetIndex) {
    return originalIndex < targetIndex ? range(targetIndex - originalIndex, originalIndex + 1) : range(originalIndex - targetIndex, targetIndex).reverse();
}

function findSquareOfAPieceToCapture(originalSquare, targetSquare) {
    const [originalCol, originalRow] = originalSquare;
    const [targetCol, targetRow] = targetSquare;
    // return document.querySelector(`#${cols[(cols.indexOf(originalCol)+cols.indexOf(targetCol))/2]}${(+originalRow+(+(targetRow)))/2}`);
    const rowIterable = createDiagonalIterable(rows.indexOf(+originalRow), rows.indexOf(+targetRow));
    const colIterable = createDiagonalIterable(cols.indexOf(originalCol), cols.indexOf(targetCol));
    const classToCapture = lastMoveBlack ? 'piece--black' : 'piece--white';
    let i = 0;

    while (i < rowIterable.length) {
        const squareName = `${cols[colIterable[i]]}${rows[rowIterable[i]]}`;
        const square = document.querySelector(`#${squareName}`);
        if (!!square.firstElementChild) {
            if (square.firstElementChild.classList.contains(classToCapture)) return square;
        }
        i++;
    }
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

async function generateTitleWindow() {
    const main = document.createElement('main');
    const container = document.createElement('div');
    container.classList.add('container');
    const gameTitle = document.createElement('section');
    gameTitle.classList.add('gameTitle');
    gameTitle.innerText = 'Warcaby';
    const author = document.createElement('section');
    author.classList.add('author');
    author.innerText = 'created by Maciej Konieczny';
    container.appendChild(gameTitle);
    container.appendChild(author);
    main.appendChild(container);
    document.body.appendChild(main);

    await sleep(4000);
    container.remove();
    generateFirstQuestion();
}

function generateFirstQuestion() {
    const main = document.querySelector('main');
    const container = document.createElement("div");
    container.classList.add('container');
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
    container.innerHTML = '';
    container.appendChild(question);
    buttons.appendChild(buttonWhite);
    buttons.appendChild(buttonBlack);
    container.appendChild(buttons);
    main.appendChild(container);
}

function startGame() {
    generateBoard();
    generateGraveyards();
    generateButtons();
    generateGameInfo();
    generateStartPosition();
    if (!playWhite) computerMove();
}

const cols = 'abcdefgh'.split('');
const rows = range(8, 1);
let turn = 1;
let forcedCapture = false;
let lastMoveBlack = true;
let playWhite = true;
let onlyQueenMovesWithoutCapture = 0;
generateTitleWindow();

// TO DO CSS HTML
//responsywność:
//bordery szachowica i miniPiece ustawić lepsze
//author do prawej
//szachownica z lekkim opacity

//html description
//nazwy trochę bardziej BEM
//smooth transition dla ruchów i gladkie przejscie miedzy tytułem, oknem wyboru i szachownica
//obsługa text-stroke żeby się zabezpieczyć
//dopieścić okno wyboru na początku - fajny font na przyciski

//box shadow dla pól szachownicy?
//wygląd bierek - dać w środku okrąg?
//tekstura drewna?

// TO DO LOGIKA JS
//disable po końcu gry też na hover
//tylko najlepsze bicia
//bardziej randomowe ruchy, żeby wybierało ze wszystkich, a nie najpierw pionka potem ruch
//klasa justMoved - mix niebieskiego i koloru bierki dla pionków które właśnie się ruszyły
//czy remis jest gicior

//alert o biciu
//wybór koloru pionków w dowolnym momencie?
//dać też inne rozmiary niż 8x8
//unhold na body
//drag and drop
//2 players vs random ai + okno wyboru + obracanie szachownicy po każdym ruchu
//log ruchów aside & cofanie
//podświetlić też CHOOSE YOUR COLOR kiedy najedzie się na któryś przycisk na oknie startowym

// PRZEJRZYSTOŚĆ KODU
//scalić funkcje ruchów damki i zwykłych pionków do jednej, mniejsze funkcje wszędzie generalnie, szczegolnie move dla obu przypadków, generateboard
//na klasy podzielić funkcje, gdzie w sumie biorę to samo - klasy Game i Piece
//forcedcapture - po co to i dlaczego musi być
//za dużo zmiennej z klikniętą bierką - wyłączyć ją i tylko zmieniać jej zawartość? dodać jako argument?, w ogóle elementy querySelector na zewnątz?
//opisac funkcje
//readme github
//funkcje po kolei umiejscowic w kodzie
//zamiast clicked piece == this?
//wrzucić na hosting
//żeby wyrzucało w jednym typie zmiennej + dodać typy zmiennych?
//mixin sass