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

export {pickAMove}