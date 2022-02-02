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
        squareWithName.classList.add('grid__square--nameRow','grid__square--name');
        squareWithName.innerText = rowName;
        grid.append(squareWithName);
        for (let colName of charRange('a','i')) {
            const square = document.createElement('div');
            const nameOfSquare = `${colName + rowName}`;
            square.classList.add('grid__square',`grid__${nameOfSquare}`);
            whiteSquare ? square.classList.add('grid__square--white') : square.classList.add('grid__square--black');
            whiteSquare = !whiteSquare;
            grid.appendChild(square);
        }
    }
    grid.append(document.createElement('div'));
    for (let colName of charRange('a','i')) {
        const squareWithName = document.createElement('div');
        squareWithName.classList.add('grid__square--nameCol','grid__square--name');
        squareWithName.innerText = colName;
        grid.append(squareWithName);
    }
}

function generatePieces() {
    const blackSquares = document.querySelectorAll(".grid__square--black");
    for (let i = 0; i < blackSquares.length; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');
        if (i < 3 * 4) piece.classList.add('piece--black');
        else if (i >= 5 * 4) piece.classList.add('piece--white');
        blackSquares[i].append(piece)
    }
}

generateBoard();
generatePieces();