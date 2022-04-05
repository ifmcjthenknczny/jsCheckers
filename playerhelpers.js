function highlightPiecesThatCanMove(piecesThatCanMove) {
    // select all squares on which are the pieces of given color that can move
    const squaresOfPiecesThanCanMove = Object.keys(piecesThatCanMove);
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

export {highlightPiecesThatCanMove, unhighlightPiecesThatCanMove, generateLegalMovesMark, removeLegalMovesMark}