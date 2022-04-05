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

function getSquareColAndRow(square) {
    // returns square parameter's column and row 
    let [col, ...row] = square.id;
    row = +row.join("");
    return [col, row];
}

export {range, sleep, fadeIn, getSquareColAndRow}