// simple functions
function range(size, startAt = 0) {
    //creates array of incrementing numbers or letters in alphabetic order of given size and starting from given number or letter (0 if not stated), works only for numbers and chars
    if (typeof startAt === "string" && startAt.length === 1) return String.fromCharCode(...range(size, startAt.charCodeAt(0))).split(
        ""
    );
    else if (typeof startAt === "number") return [...Array(size).keys()].map((i) => i + startAt);
    else return;
}

function sleep(ms) {
    // freezes code execution for given time in milliseconds, used in async functions with await keyword
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// piece and legal moves service
function pieceHold() {
    // things to do, when player clicks a piece
    if (isComputerTurn() || endOfGame() || chainedCapturePiece || pieceHoldBlock)
        return;
    // player can hold a piece if it is his turn, game is on and there no piece to chain capture and not currently moving piece
    // if none of these is a case, first make sure to unclick any other pieces and unhighlight pieces that can move
    unhighlightPiecesThatCanMove();
    pieceUnhold();
    if (
        (legalNormalMovesOfPiece(this).length > 0 &&
            !isThereACapturePossibility()) ||
        legalCapturesOfPiece(this).length > 0
    ) {
        // if there are normal moves for piece and no other piece can capture OR if there are captures possible and this piece can capture another piece, approve that this piece is clicked by adding id
        this.setAttribute("id", "piece-clicked");
        // generate markings on squares where this piece can move
        if (isThereACapturePossibility())
            generateLegalMovesMark(legalCapturesOfPiece(this));
        else generateLegalMovesMark(legalNormalMovesOfPiece(this));
        // if this piece can't move - show which pieces can
    } else highlightPiecesThatCanMove();
}

function pieceUnhold() {
    // activate only if no piece is in between multiple captures
    if (chainedCapturePiece !== null) return;
    // if there is piece held right now, remove its id and all legal moves marks and unhighligh pieces that can move
    if (!!document.querySelector("#piece-clicked"))
        document.querySelector("#piece-clicked").removeAttribute("id");
    removeLegalMovesMark();
    unhighlightPiecesThatCanMove();
}

function highlightPiecesThatCanMove() {
    // select all squares on which are the pieces of given color that can move
    const squaresOfPiecesThanCanMove = Object.keys(findAllLegalMoves(playWhite));
    // and give every one of them class piece--can-move
    for (let squareId of squaresOfPiecesThanCanMove) {
        const piece = document.querySelector(`#${squareId}`).firstChild;
        piece.classList.add("piece--can-move");
        if (!!piece.firstChild) piece.firstChild.classList.add("piece--can-move");
    }
}

function unhighlightPiecesThatCanMove() {
    // select all pieces with class piece--can-move and remove this class
    const piecesToRemoveClass = [
        ...document.querySelectorAll(".piece--can-move"),
    ];
    for (let piece of piecesToRemoveClass)
        piece.classList.remove("piece--can-move");
}

function generateLegalMovesMark(legalMovesSquares) {
    // select all squares of parameter array and to each append div-child with class legal-move
    for (let legalMoveSquare of legalMovesSquares) {
        const legalMoveMark = document.createElement("div");
        legalMoveMark.classList.add("legal-move");
        legalMoveSquare.appendChild(legalMoveMark);
    }
}

function removeLegalMovesMark() {
    // select all elements with class legal-move and remove them from DOM
    const legalMovesMarks = document.querySelectorAll(".legal-move");
    if (legalMovesMarks.length > 0)
        for (let mark of legalMovesMarks) mark.remove();
}

// turns
async function makeAMove() {
    // selects clicked piece and checks if the square is legal to move - if there is no piece clicked or the square is not legal to move or itsComputerTurn - ends function, if not - prevents any other moves
    const clickedPiece = document.querySelector("#piece-clicked");
    const legalSquare =
        this.firstElementChild &&
        this.firstElementChild.classList.contains("legal-move");
    if (
        clickedPiece === null ||
        (!!clickedPiece && !legalSquare) ||
        isComputerTurn()
    )
        return;
    pieceHoldBlock = true;
    // set queen-connected variables and if the piece is about to capture, remove the captured piece and legal move marks on squares, move piece and wait for transition to finish
    setQueenVariables(clickedPiece, this);
    if (forcedCapture)
        removeCapturedPiece(
            findSquareOfAPieceToCapture(clickedPiece.parentElement, this)
        );
    removeLegalMovesMark();
    movePiece(clickedPiece.parentElement, this, moveAnimationDurationMs);
    await sleep(moveAnimationDurationMs);
    // checks if piece can capture again, then sets variable to this piece (and that turns off clicking other pieces of player) and continue turn, else check for promotion, unhold piece and ends turn
    pieceHoldBlock = false;
    if (forcedCapture && legalCapturesOfPiece(clickedPiece).length > 0)
        chainedCapturePiece = clickedPiece;
    else {
        if (promotion(clickedPiece)) crownTheQueen(clickedPiece);
        pieceUnhold();
        endTurn();
    }
}

async function computerMove() {
    // declares variables which values are about to be determined. if it is not between multiple, chained captures - pick a piece and move from all computer pieces, else randomly pick a capture of only this piece which is inbetween captures
    let pieceToMove, targetSquare;
    if (!chainedCapturePiece) {
        [pieceToMove, targetSquare] = pickAMove(
            findAllLegalMoves(!playWhite)
        );
    } else {
        pieceToMove = chainedCapturePiece;
        const legalCaptures = legalCapturesOfPiece(pieceToMove);
        targetSquare =
            legalCaptures[Math.floor(Math.random() * legalCaptures.length)];
    }
    // set queen-connected variables, remove piece if it was a capture, animate piece move and wait for animation to finish
    setQueenVariables(pieceToMove, targetSquare);
    if (forcedCapture)
        removeCapturedPiece(
            findSquareOfAPieceToCapture(pieceToMove.parentElement, targetSquare)
        );
    movePiece(pieceToMove.parentElement, targetSquare, moveAnimationDurationMs);
    await sleep(moveAnimationDurationMs);
    // piece can capture again then set chainedCapturePiece to this piece, so it will move again and call computerMove again, else check fro promotion and endTurn
    if (forcedCapture && legalCapturesOfPiece(pieceToMove).length > 0) {
        chainedCapturePiece = pieceToMove;
        computerMove();
    } else {
        if (promotion(pieceToMove)) crownTheQueen(pieceToMove);
        endTurn();
    }
}

function setQueenVariables(pieceToMove, targetSquare) {
    // checks if clicked piece is a queen and is about to capture - and sets onlyQueenMovesWithoutCapture accordingly, as well as setting the direction in which queen can't capture in next chained move
    const isQueen = pieceToMove.classList.contains("piece--queen");
    isQueen && !forcedCapture ?
        onlyQueenMovesWithoutCapture++
        :
        (onlyQueenMovesWithoutCapture = 0);
    queenCaptureForbiddenDirection =
        isQueen && forcedCapture ?
        findQueenCaptureForbiddenDirection(
            pieceToMove.parentElement,
            targetSquare
        ) : [null, null];
}

function endTurn() {
    // change the move turn to other piece color, reset move-connected variables
    whiteMove = !whiteMove;
    chainedCapturePiece = null;
    queenCaptureForbiddenDirection = [null, null];
    // if it is end of game, do what you gotta do when game ends
    if (endOfGame()) congratsToWinner();
    // if not, change top bar and if it computer's turn, make a move
    else {
        changeGameInfo();
        if (isComputerTurn()) computerMove();
    }
}

function isComputerTurn() {
    //checks if it is computer's turn - true if it is indeed
    if ((playWhite && !whiteMove) || (!playWhite && whiteMove)) return true;
    return false;
}

function changeGameInfo() {
    // changes class of text, for white's move is whiter, for black's is blacker
    const whoToMove = document.querySelector(".game-info__who-to-move span");
    whoToMove.classList.toggle("white");
    // change text, if white are to move, change turn counter as well
    if (whiteMove) {
        document.querySelector(".game-info__turn-counter span").innerText = ++turn;
        whoToMove.innerText = "White";
    } else whoToMove.innerText = "Black";
}

// animations
async function fadeIn(elementSelector, time) {
    // sets element to invisible, and increments its opacity to 1 in steps dictated by deltaOpacity
    let opacity = 0;
    const element = document.querySelector(elementSelector);
    element.style.opacity = opacity;
    const deltaOpacity = 0.04;
    while (opacity <= 1) {
        await sleep(time * deltaOpacity);
        opacity = opacity + deltaOpacity;
        element.style.opacity = opacity;
    }
}

async function movePiece(startSquare, targetSquare, transitionTimeMs) {
    // block flipping the board, because everything crashes
    flipBoardBlock = true;
    // selects piece, squares id and starting and target indexes
    const pieceToMove = startSquare.firstChild;
    const [startCol, startRow] = getSquareColAndRow(startSquare);
    const [targetCol, targetRow] = getSquareColAndRow(targetSquare);
    const [startColIndex, targetColIndex] = [startCol, targetCol].map((x) =>
        cols.indexOf(x)
    );
    const [startRowIndex, targetRowIndex] = [startRow, targetRow].map(
        x => x - 1
    );
    // calculates current square width (with border from two sides), includes positive/negative coefficient because of position of board and calculates transiton in both axis
    const squareWidth = +window
        .getComputedStyle(document.querySelector(".grid__square"))
        .width.split("px")[0] +
        2 *
        +window
        .getComputedStyle(document.querySelector(".grid__square"))
        .border.split("px")[0];
    const boardPositionCoeff = whitesOnBottom ? 1 : -1;
    const transX =
        (targetColIndex - startColIndex) * squareWidth * boardPositionCoeff;
    const transY =
        (startRowIndex - targetRowIndex) * squareWidth * boardPositionCoeff;
    // if another, chained capture will be possible, generate legal move before the actual transition
    if (!isComputerTurn() && forcedCapture) {
        const dummyPiece = pieceToMove.cloneNode(true);
        targetSquare.appendChild(dummyPiece);
        if (legalCapturesOfPiece(dummyPiece).length > 0)
            generateLegalMovesMark(legalCapturesOfPiece(dummyPiece));
        dummyPiece.remove();
    }
    // sets size of piece before changing its position to fixed, set transition and transform properties
    const {
        width
    } = pieceToMove.getBoundingClientRect();
    const size =
        width - 2 * +window.getComputedStyle(pieceToMove).border.split("px")[0];
    pieceToMove.style.width = `${size}px`;
    pieceToMove.style.height = `${size}px`;
    pieceToMove.style.transition = `transform ${transitionTimeMs}ms`;
    pieceToMove.style.position = "fixed";
    // translate now fixed-position piece on calculated distance in px and wait until animation finishes
    pieceToMove.style.transform = `translate(${transX}px, ${transY}px)`;
    await sleep(transitionTimeMs);
    // then append piece to the target square, remove all given style and unblock flipping the board
    targetSquare.appendChild(pieceToMove);
    pieceToMove.style.transform = "";
    pieceToMove.style.position = "";
    pieceToMove.style.width = "";
    pieceToMove.style.height = "";
    flipBoardBlock = false;
}

// move rules-related functions
function findAllLegalMoves(forWhite) {
    // selects all pieces of given color
    const selector = forWhite ? ".piece--white" : ".piece--black";
    const allColorPieces = [...document.querySelectorAll(selector)];
    const legalMoves = {};
    // if there is any capture possible, then add to legalMoves object key (square id of piece that can move) and value (its possible moves)
    if (isThereACapturePossibility()) {
        for (let piece of allColorPieces) {
            const legalMovesList = legalCapturesOfPiece(piece);
            if (legalMovesList.length > 0)
                legalMoves[piece.parentElement.id] = legalMovesList;
        }
        // if there are no captures possibles then do the same, but with ordinary moves, every case return
    } else {
        for (let piece of allColorPieces) {
            const legalMovesList = legalNormalMovesOfPiece(piece);
            if (legalMovesList.length > 0)
                legalMoves[piece.parentElement.id] = legalMovesList;
        }
    }
    return legalMoves;
}

function findQueenCaptureForbiddenDirection(startSquare, targetSquare) {
    // returns forbidden direction for queen to capture (she can't come back very next chained capture) in form of true-false array
    // true is for increasing, false for decreasing value of rows/cols
    let [startCol, startRow] = getSquareColAndRow(startSquare);
    let [targetCol, targetRow] = getSquareColAndRow(targetSquare);
    return [targetCol < startCol, targetRow < startRow];
}

function crownTheQueen(piece) {
    // adds class piece--queen for piece parameter and div child with class of piece--queen-decoration
    piece.classList.add("piece--queen");
    const queenDecoration = document.createElement("div");
    queenDecoration.classList.add("piece--queen-decoration");
    piece.appendChild(queenDecoration);
}

function removeCapturedPiece(square) {
    // checks the color of piece on given square parameter and if it is queen, then removes it
    const isQueen = square.firstChild.classList.contains("piece--queen");
    const isPieceWhite = square.firstChild.classList.contains("piece--white");
    square.firstChild.remove();

    // creates mini piece with given classes and adds it to appropriate graveyard zone
    const pieceMini = document.createElement("div");
    if (isQueen) pieceMini.classList.add("mini-piece--queen");
    else
        isPieceWhite ?
        pieceMini.classList.add("mini-piece--white") :
        pieceMini.classList.add("mini-piece--black");
    pieceMini.classList.add("mini-piece");
    const targetGraveyard =
        (isPieceWhite && whitesOnBottom) || (!isPieceWhite && !whitesOnBottom) ?
        ".captured-pieces--top" :
        ".captured-pieces--bottom";
    document.querySelector(targetGraveyard).appendChild(pieceMini);
}

function promotion(piece) {
    // checks if piece is already a queen (if yes, return false) and its color and grabs its square row
    if (piece.classList.contains("piece--queen")) return false;
    const isWhite = piece.classList.contains("piece--white") ? true : false;
    let [, clickedPieceRow] = getSquareColAndRow(piece.parentElement);
    // checks if row number of piece's square is last for white or first for black - if yes, returns true, else returns false
    if (
        (isWhite && clickedPieceRow === rows[rows.length - 1]) ||
        (!isWhite && clickedPieceRow === rows[0])
    )
        return true;
    return false;
}

function isThereACapturePossibility() {
    // selects all pieces that are about to move and checks if any of them can capture another piece, returns true/false
    const selector = whiteMove ? ".piece--white" : ".piece--black";
    const allColorPieces = document.querySelectorAll(selector);
    for (let piece of allColorPieces) {
        if (legalCapturesOfPiece(piece).length > 0) {
            forcedCapture = true;
            return true;
        }
    }
    forcedCapture = false;
    return false;
}

function legalCapturesOfPiece(piece) {
    // gets id of piece's square, color, color it can capture and if it is a queen, change row in case of it is 2-digits
    let [startCol, startRow] = getSquareColAndRow(piece.parentElement);
    const startIndex = rows.indexOf(startRow);
    const isWhite = piece.classList.contains("piece--white") ? true : false;
    const classOfPiece = isWhite ? "piece--white" : "piece--black";
    const classToCapture = isWhite ? "piece--black" : "piece--white";
    const isQueen = piece.classList.contains("piece--queen") ? true : false;
    const possibleSquares = [];
    // checks possibilities in every direction
    for (let rowsIncrease of [true, false]) {
        for (let colsIncrease of [true, false]) {
            if (
                isQueen &&
                queenCaptureForbiddenDirection[0] === colsIncrease &&
                queenCaptureForbiddenDirection[1] === rowsIncrease
            )
                continue;
            // sets boundaries and increment or decrement for iterable variable
            const colBoundary = colsIncrease ? cols.length - 1 : 0;
            const rowBoundary = rowsIncrease ? rows.length - 1 : 0;
            const deltaCol = colsIncrease ? 1 : -1;
            const deltaRow = rowsIncrease ? 1 : -1;
            // starts not on the square on which given piece is, but one square in diagonal away
            let colIndex = cols.indexOf(startCol) + deltaCol;
            let rowIndex = startIndex + deltaRow;
            // initializes variable that changes to true if it founds piece of color to capture
            let thereIsPieceToCapture = false;
            while (
                rowIndex !== rowBoundary + deltaRow &&
                colIndex !== colBoundary + deltaCol
            ) {
                // loops over diagonal in specified direction by colsIncrease and rowsIncrease until board boundary
                // breaks the loop if it finds piece of the same color
                // if it finds first piece of opposite color, thereIsPieceToCapture is changed to true
                // when thereIsPieceToCapture is true, every free square is added to array which is later returned
                // breaks the loop if it finds another piece, returns after looping over all directions
                const squareName = `${cols[colIndex]}${rowIndex + 1}`;
                const square = document.querySelector(`#${squareName}`);
                const isSquareTaken = !!square.firstChild && square.firstChild.classList.contains("piece");
                if (isSquareTaken) {
                    if (thereIsPieceToCapture) break;
                    else if (square.firstChild.classList.contains(classToCapture))
                        thereIsPieceToCapture = true;
                    else if (square.firstChild.classList.contains(classOfPiece)) break;
                } else if (!isSquareTaken && thereIsPieceToCapture)
                    possibleSquares.push(square);
                colIndex += deltaCol;
                rowIndex += deltaRow;
                // breaks the loops if it is normal piece and its capture movement range has been reached
                if (!isQueen && Math.abs(rowIndex - startIndex) > 2) break;
            }
        }
    }
    return possibleSquares;
}

function legalNormalMovesOfPiece(piece) {
    // gets id of piece's square, color and whether it is a queen
    let [startCol, startRow] = getSquareColAndRow(piece.parentElement);
    const isQueen = piece.classList.contains("piece--queen") ? true : false;
    const isWhite = piece.classList.contains("piece--white") ? true : false;
    // normal move directions depend on the color of piece and if it is queen - true is case of increasing, false is decreasing
    const rowsIncreasePossible = isQueen ? [true, false] :
        isWhite ? [true] : [false];
    const colsIncreasePossible = [true, false];
    const possibleSquares = [];
    for (let rowsIncrease of rowsIncreasePossible) {
        for (let colsIncrease of colsIncreasePossible) {
            // sets up consts depending on the direction, starting not on the square on which given piece is, but one square in diagonal away
            const colBoundary = colsIncrease ? cols.length - 1 : 0;
            const rowBoundary = rowsIncrease ? rows.length - 1 : 0;
            const deltaCol = colsIncrease ? 1 : -1;
            const deltaRow = rowsIncrease ? 1 : -1;
            let rowIndex = rows.indexOf(startRow) + deltaRow;
            let colIndex = cols.indexOf(startCol) + deltaCol;
            while (
                rowIndex !== rowBoundary + deltaRow &&
                colIndex !== colBoundary + deltaCol
            ) {
                // loops over diagonal in specified direction by colsIncrease and rowsIncrease until board boundary
                // breaks the loop if it finds piece, if not then add to return array
                const squareName = `${cols[colIndex]}${rowIndex + 1}`;
                const square = document.querySelector(`#${squareName}`);
                const isSquareTaken = !!square.firstChild && square.firstChild.classList.contains("piece");
                if (isSquareTaken) break;
                else possibleSquares.push(square);
                if (!isQueen) break; // breaks the loop if it is normal piece and can move only one square forward
                colIndex += deltaCol;
                rowIndex += deltaRow;
            }
        }
    }
    return possibleSquares;
}

function createDiagonalIterable(startIndex, targetIndex) {
    // creates range to iterate over for either rows or cols, from the given square in given direction
    return startIndex < targetIndex ?
        range(targetIndex - startIndex, startIndex + 1) :
        range(startIndex - targetIndex, targetIndex).reverse();
}

function findSquareOfAPieceToCapture(startSquare, targetSquare) {
    // loops over diagonal to find piece to remove
    let [startCol, startRow] = getSquareColAndRow(startSquare);
    let [targetCol, targetRow] = getSquareColAndRow(targetSquare);
    const rowIterable = createDiagonalIterable(
        rows.indexOf(startRow),
        rows.indexOf(targetRow)
    );
    const colIterable = createDiagonalIterable(
        cols.indexOf(startCol),
        cols.indexOf(targetCol)
    );
    const classToCapture = whiteMove ? "piece--black" : "piece--white";
    let i = 0;
    // because it is diagonal, both Array.length are equal
    while (i < rowIterable.length) {
        // looks if square has a child if a given class of piece to capture - if it finds it, then returns this sqaure
        const squareName = `${cols[colIterable[i]]}${rows[rowIterable[i]]}`;
        const square = document.querySelector(`#${squareName}`);
        if (
            !!square.firstElementChild &&
            square.firstElementChild.classList.contains(classToCapture)
        )
            return square;
        i++;
    }
}

function getSquareColAndRow(square) {
    let [col, ...row] = square.id;
    row = +row.join("");
    return [col, row];
}

// cheats
function queenCheat() {
    // cheat to make all your pieces queens, possible to turn on only one time
    const selector = playWhite ? ".piece--white" : ".piece--black";
    if (
        [...document.querySelectorAll(selector)].filter((p) =>
            p.classList.contains("piece--queen")
        ).length === [...document.querySelectorAll(selector)].length
    )
        return;
    const allPieces = [...document.querySelectorAll(selector)].filter(
        (p) => !p.classList.contains("piece--queen")
    );
    removeLegalMovesMark();
    unhighlightPiecesThatCanMove();
    pieceUnhold();
    allPieces.map((p) => crownTheQueen(p));
    alert(`Life is too hard for you, eh?`);
}

function removeRandomComputerPiece() {
    // removes random computer piece from the board
    const selector = !playWhite ? ".piece--white" : ".piece--black";
    const pieces = document.querySelectorAll(selector);
    pieces[Math.floor(Math.random() * pieces.length)].remove();
    if (endOfGame()) congratsToWinner();
}

function addPlayerPieceRandomly() {
    // adds to the board piece of player's color on random free square
    removeLegalMovesMark();
    unhighlightPiecesThatCanMove();
    pieceUnhold();
    const freeBlackSquares = [
        ...document.querySelectorAll(".grid__square--black"),
    ].filter(
        (sq) =>
        !(
            sq.firstElementChild && sq.firstElementChild.classList.contains("piece")
        )
    );
    if (freeBlackSquares.length === 0) return;
    const squareToAddPieceOn =
        freeBlackSquares[Math.floor(Math.random() * freeBlackSquares.length)];
    const piece = document.createElement("div");
    piece.classList.add(
        "piece",
        "piece-hover",
        playWhite ? "piece--white" : "piece--black"
    );
    piece.addEventListener("click", pieceHold);
    squareToAddPieceOn.append(piece);
    if (endOfGame()) congratsToWinner();
}

function leavesOnePlayerPiece() {
    // selects all player pieces on the board, 
    removeLegalMovesMark();
    unhighlightPiecesThatCanMove();
    pieceUnhold();
    const selector = playWhite ? '.piece--white' : '.piece--black';
    const playerPieces = [...document.querySelectorAll(selector)];
    playerPieces.splice(Math.floor(Math.random() * playerPieces.length), 1);
    for (let piece of playerPieces) piece.remove();
    if (endOfGame()) congratsToWinner();
}

// end game
function determineWinner() {
    // determines who wins by if it has any moves or any pieces left, else it is draw - null
    let winnerWhite = null;
    if (
        !document.querySelector(".piece--black") ||
        (!!document.querySelector(".piece--black") &&
            Object.keys(findAllLegalMoves(false)).length === 0 &&
            !whiteMove)
    )
        winnerWhite = true;
    else if (
        !document.querySelector(".piece--white") ||
        (!!document.querySelector(".piece--white") &&
            Object.keys(findAllLegalMoves(true)).length === 0 &&
            whiteMove)
    )
        winnerWhite = false;
    return winnerWhite;
}

function setEndOfGameClasses(winnerWhite, forWhite) {
    // do not change if it is draw or the player for which it is set has no pieces left, set piece selector and class modifier depending and on if it is for winner
    if (winnerWhite === null) return;
    const pieceSelector = forWhite ? '.piece--white' : '.piece--black';
    const resultClassModifier = ((forWhite && winnerWhite) || (!forWhite && !winnerWhite)) ? 'won' : 'lost';
    const pieces = [...document.querySelectorAll(pieceSelector)];
    if (pieces.length === 0) return;
    // picks all player pieces and gives appropriate classes for them and queens and strips from hover effects
    for (let piece of pieces) {
        piece.classList.remove("piece-hover");
        piece.classList.add(`piece--${resultClassModifier}`);
    }
    const queens = pieces.filter((piece) =>
        piece.classList.contains("piece--queen")
    );
    for (let queen of queens) {
        const crown = queen.firstChild;
        crown.classList.remove("piece--queen-decoration");
        crown.classList.add("piece--queen-decoration-won");
    }
}

function congratsToWinner() {
    // determines the winner, selects top left corner game info and changes text, set classes for pieces left depending on who won
    const winnerWhite = determineWinner();
    const whoToMove = document.querySelector(".game-info__who-to-move");
    switch (winnerWhite) {
        case true:
            whoToMove.innerHTML = '<span class="white">White</span> won!';
            break;
        case false:
            whoToMove.innerHTML = "<span>Black</span> won!";
            break;
        case null:
            whoToMove.innerHTML = "It is a <span>Draw</span>!";
    }
    for (let forWhite of [true, false]) setEndOfGameClasses(winnerWhite, forWhite);
}

function endOfGame() {
    // checks if requirements for game ending occured - is player about to move have any pieces, if has any possible moves or there were 30 moves of queens without any capture in a row, if nothing of these, return false
    const selector = whiteMove ? ".piece--white" : ".piece--black";
    const stillPieces = document.querySelectorAll(selector).length;
    if (stillPieces === 0) return true;
    if (Object.keys(findAllLegalMoves(whiteMove)).length === 0) return true;
    if (onlyQueenMovesWithoutCapture >= 30) return true;
    return false;
}

// computer AI
function pickAMove(legalMovesDict) {
    // gets all pieces that can move from parameter and randomly chooses one
    const piecesThatCanMove = Object.keys(legalMovesDict);
    const nameOfSquareOfPieceToMove = piecesThatCanMove[Math.floor(Math.random() * piecesThatCanMove.length)];
    const pieceToMove = document.querySelector(`#${nameOfSquareOfPieceToMove}`).firstElementChild;
    // gets possible moves of randomly chosen piece, if there is only one chooses that, else randomly chooses one from them
    const possibleMoves = legalMovesDict[nameOfSquareOfPieceToMove];
    const targetSquare =
        possibleMoves.length === 1 ?
        possibleMoves[0] :
        possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    return [pieceToMove, targetSquare]; // returns chosen piece and target square
}

// generate game components
function generateBoard(size) {
    // start from creating black square, creates sections for DOM, adds appropriate class
    let whiteSquare = false;
    const main = document.querySelector("main");
    const grid = document.createElement("section");
    grid.classList.add("board");
    // divides grid for given board size
    grid.style.gridTemplateColumns = `0.2fr repeat(${size}, 1fr`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr) 0.2fr`;
    // sets order of rows and cols depending on board orientation
    const rowOrder = whitesOnBottom ? [...rows].reverse() : [...rows];
    const colOrder = whitesOnBottom ? [...cols] : [...cols].reverse();
    // for every new row, change color of first sqaure, create square with name and append it as first
    for (let rowName of rowOrder) {
        whiteSquare = !whiteSquare;
        const squareWithName = document.createElement("div");
        squareWithName.classList.add(
            "grid__square--name-row",
            "grid__square--name"
        );
        squareWithName.innerText = rowName;
        grid.append(squareWithName);
        // loop over cols and create board squares with id, classname and classname if its white or black and approprriate event
        for (let colName of colOrder) {
            const square = document.createElement("div");
            const nameOfSquare = `${colName + rowName}`;
            square.classList.add("grid__square");
            square.setAttribute("id", nameOfSquare);
            if (whiteSquare) {
                square.classList.add("grid__square--white");
                square.addEventListener("click", pieceUnhold);
            } else {
                square.classList.add("grid__square--black");
                square.addEventListener("click", makeAMove);
            }
            // append square and change color of squares between cols
            grid.appendChild(square);
            whiteSquare = !whiteSquare;
        }
    }
    // create empty element at the corner and all column name squares under the board
    grid.append(document.createElement("div"));
    for (let colName of colOrder) {
        const squareWithName = document.createElement("div");
        squareWithName.classList.add(
            "grid__square--name-col",
            "grid__square--name"
        );
        squareWithName.innerText = colName;
        grid.append(squareWithName);
    }
    // append grid to main and main to DOM
    main.appendChild(grid);
    document.body.insertBefore(
        main,
        document.querySelector(".captured-pieces--bottom")
    );
    return grid;
}

function generateStartingPosition(board) {
    // selects all black squares and chooses order of putting pieces from up to down, gets size of board
    const rowNames = [...board.children]
        .filter((x) => x.classList.contains("grid__square--name-row"))
        .map((x) => x.innerText);
    const size =
        rowNames[0] === "1" ? +rowNames[rowNames.length - 1] : +rowNames[0];
    const blackSquares = document.querySelectorAll(".grid__square--black");
    const order = ["piece--black", "piece--white"];
    if (!whitesOnBottom) order.reverse();
    // loops over the board and add pieces along with their classes and events - pieceHold for player color and pieceUnhold for computer color - to the board
    for (let i = 0; i < blackSquares.length; i++) {
        if (i < ((size / 2 - 1) * size) / 2) {
            const piece = document.createElement("div");
            piece.classList.add("piece", order[0]);
            piece.addEventListener("click", pieceUnhold);
            blackSquares[i].append(piece);
        } else if (i >= ((size / 2 + 1) * size) / 2) {
            const piece = document.createElement("div");
            piece.classList.add("piece", order[1]);
            piece.addEventListener("click", pieceHold);
            piece.classList.add("piece-hover");
            blackSquares[i].append(piece);
        }
    }
}

function generateButtons() {
    // generates button container with two buttons below the board, along with the actions they provide
    const buttonContainer = document.createElement("section");
    buttonContainer.classList.add("button-container", "button-container--game");

    const resetButton = document.createElement("button");
    resetButton.classList.add("button", "button--reset", "button--game");
    resetButton.innerText = "restart";
    resetButton.addEventListener("click", () => {
        document.body.innerHTML = "";
        document.body.appendChild(document.createElement("main"));
        resetGlobalVariables();
        generateColorChoiceWindow();
    });

    const flipButton = document.createElement("button");
    flipButton.classList.add("button", "button--flip", "button--game");
    flipButton.innerText = "flip board";
    flipButton.addEventListener("click", flipBoard);

    buttonContainer.appendChild(resetButton);
    buttonContainer.appendChild(flipButton);
    document.body.appendChild(buttonContainer);
}

function resetGlobalVariables() {
    // resets all global variables to initial level
    whiteMove = true;
    turn = 1;
    forcedCapture = false;
    onlyQueenMovesWithoutCapture = 0;
    chainedCapturePiece = null;
    queenCaptureForbiddenDirection = [null, null];
    flipBoardBlock = false;
    cheat = "";
    boardSize = 8;
}

function generateGraveyards() {
    // generates two sections for captured pieces
    const graveyardTop = document.createElement("section");
    const graveyardBottom = document.createElement("section");
    for (let graveyard of [graveyardTop, graveyardBottom])
        graveyard.classList.add("captured-pieces");
    graveyardTop.classList.add("captured-pieces--top");
    graveyardBottom.classList.add("captured-pieces--bottom");
    document.body.appendChild(graveyardTop);
    document.body.appendChild(graveyardBottom);
}

function generateGameInfo() {
    // generates top bar, above the board, with current information about the game
    const gameInfo = document.createElement("section");
    gameInfo.className = "game-info";
    const whoToMove = document.createElement("section");
    whoToMove.className = "game-info__who-to-move";
    const turnCounter = document.createElement("section");
    turnCounter.className = "game-info__turn-counter";
    whoToMove.innerHTML = '<span class="white">White</span> to move';
    turnCounter.innerHTML = "Turn: <span>1</span>";
    gameInfo.appendChild(whoToMove);
    gameInfo.appendChild(turnCounter);
    document.body.prepend(gameInfo);
}

async function generateTitleWindow() {
    // generates first, title window, waits some time and preoceeds do question window
    const main = document.createElement("main");
    const container = document.createElement("div");
    container.classList.add("container");
    const gameTitle = document.createElement("section");
    gameTitle.classList.add("game-title");
    gameTitle.innerText = "Warcaby";
    const author = document.createElement("section");
    author.classList.add("author");
    author.innerText = "created by Maciej Konieczny";
    container.appendChild(gameTitle);
    container.appendChild(author);
    main.appendChild(container);
    document.body.appendChild(main);
    fadeIn(".container", 300);
    await sleep(3500);
    container.remove();
    generateColorChoiceWindow();
}

function generateColorChoiceWindow() {
    // generates window with choice of piece color to the DOM
    const main = document.querySelector("main");
    main.innerHTML = "";
    const container = document.createElement("div");
    container.classList.add("container");
    const question = document.createElement("section");
    question.classList.add("question");
    question.innerText = "choose your color";
    const buttons = document.createElement("section");
    buttons.classList.add("button-container", "button-container--question");
    const buttonWhite = document.createElement("button");
    buttonWhite.classList.add("button--white", "button", "button--color");
    buttonWhite.innerText = "white";
    const buttonBlack = document.createElement("button");
    buttonBlack.classList.add("button--black", "button", "button--color");
    buttonBlack.innerText = "black";
    //events of buttons
    buttonWhite.addEventListener("click", () => {
        playWhite = true;
        whitesOnBottom = true;
        main.innerHTML = "";
        startGame();
    });
    buttonBlack.addEventListener("click", () => {
        playWhite = false;
        whitesOnBottom = false;
        main.innerHTML = "";
        startGame();
    });
    // event highlighting the question while hovering the button
    for (let event of ["mouseover", "mouseout", "activate", "deactivate"]) {
        buttonWhite.addEventListener(event, () => {
            const question = document.querySelector(".question");
            question.classList.toggle("question--hover-white");
        });
        buttonBlack.addEventListener(event, () => {
            const question = document.querySelector(".question");
            question.classList.toggle("question--hover-black");
        });
    }
    container.innerHTML = "";
    container.appendChild(question);
    buttons.appendChild(buttonWhite);
    buttons.appendChild(buttonBlack);
    container.appendChild(buttons);
    main.appendChild(container);
    fadeIn(".container", 800);
}

function flipBoard() {
    // only run this function if not blocked
    if (flipBoardBlock) return;
    // select all board squares and their children, if square contains something - push it to array, else push false
    const boardElements = [...document.querySelector(".board").children];
    const boardState = [];
    for (let element of boardElements) {
        if (!element.classList.contains("grid__square")) continue;
        if (!!element.firstChild) boardState.push(element.firstChild.cloneNode(true));
        else boardState.push(false);
    }
    // remove whole board from DOM, reverse array to which all elements where pushed, change orientation of board variable and generate board once again, this time upside down
    document.querySelector(".board").remove();
    boardState.reverse();
    whitesOnBottom = !whitesOnBottom;
    generateBoard(boardSize);
    // get only squares of the board and push elements to corresponding squares, giving pieces events as well
    const newBoard = [...document.querySelector(".board").children].filter(
        (child) => child.classList.contains("grid__square")
    );
    for (let i = 0; i < boardState.length; i++) {
        if (!boardState[i]) continue;
        const clickFunction =
            (playWhite && boardState[i].classList.contains("piece--white")) ||
            (!playWhite && boardState[i].classList.contains("piece--black")) ?
            pieceHold :
            pieceUnhold;
        boardState[i].addEventListener("click", clickFunction);
        newBoard[i].appendChild(boardState[i]);
    }
    // we have to also reverse graveyards
    flipGraveyards();
}

function flipGraveyards() {
    // create two variables with state of top and bottom, remove pieces in graveyard from dom, reverse arrays of state, then add everything upside down
    const graveyardTopState = [
        ...document.querySelector(".captured-pieces--top").cloneNode(true).children,
    ];
    const graveyardBottomState = [
        ...document.querySelector(".captured-pieces--bottom").cloneNode(true)
        .children,
    ];
    for (let minipiece of document.querySelectorAll(".mini-piece"))
        minipiece.remove();
    const newGraveyardTop = document.querySelector(".captured-pieces--top");
    const newGraveyardBottom = document.querySelector(".captured-pieces--bottom");
    for (let minipiece of graveyardTopState)
        newGraveyardBottom.appendChild(minipiece);
    for (let minipiece of graveyardBottomState)
        newGraveyardTop.appendChild(minipiece);
}

function cheatsOn() {
    // turns on cheats and tracks string entered by player, resets string if key is not char or it did started 
    document.body.addEventListener("keydown", function(e) {
        if (flipBoardBlock) return;
        if (e.key.length !== 1) cheat = "";
        else cheat += e.key.toUpperCase();
        if (cheat in cheatMap) {
            cheatMap[cheat]();
            cheat = '';
        }
    })
}

async function startGame() {
    // animation, generate board, pieces and everything around it and if computer plays white - wait a second and make him move
    fadeIn("body", 200);
    cheatsOn();
    generateGraveyards();
    generateBoard(boardSize);
    generateButtons();
    generateGameInfo();
    generateStartingPosition(document.querySelector(".board"));
    if (!playWhite) {
        await sleep(1000);
        computerMove();
    }
}

// globals
let boardSize = 8;
let cheat = "";
const cheatMap = {
    "AEZAKMI": queenCheat,
    "NUTTERTOOLS": removeRandomComputerPiece,
    "ASPIRINE": addPlayerPieceRandomly,
    "LEAVEMEALONE": leavesOnePlayerPiece
};
const cols = range(boardSize, "a");
const rows = range(boardSize, 1);
let turn = 1;
let forcedCapture = false;
let whiteMove = true;
let playWhite = true;
let whitesOnBottom = true;
let onlyQueenMovesWithoutCapture = 0;
let chainedCapturePiece = null;
let queenCaptureForbiddenDirection = [null, null];
let flipBoardBlock = false;
let pieceHoldBlock = false;
const moveAnimationDurationMs = 600;
generateTitleWindow(); // starts the application