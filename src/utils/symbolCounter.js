const vscode = require('vscode');

function countUnopenedClosers(opening, closing, totalLength) {
    let lastpositiveIndex = 0;
    let poscount = 0;
    const negativeIndices = [];
    let count = 0;

    for (let i = totalLength; i >= 0; i--) {
        if (opening.includes(i)) {
            count++;
        }

        if (closing.includes(i)) {
            count--;
        }

        if (count < 0) {
            negativeIndices.push(i);
        }

        if (poscount === 0 && count === 1) {
            lastpositiveIndex = i;
            poscount++;
        }
    }

    return [negativeIndices, lastpositiveIndex];
}

function countUnclosedOpeners(opening, closing, cursor_pos, totalLength) {
    let firstNegativeIndex = cursor_pos + totalLength;
    let negcount = 0;
    const positiveIndices = [];
    let count = 0;

    for (let i = cursor_pos; i < cursor_pos + totalLength; i++) {
        if (opening.includes(i)) {
            count++;
        }

        if (closing.includes(i)) {
            count--;
        }

        if (count > 0) {
            positiveIndices.push(i);
        }

        if (negcount === 0 && count === -1) {
            firstNegativeIndex = i;
            negcount++;
        }
    }

    return [positiveIndices, firstNegativeIndex];
}

module.exports = {
    countUnopenedClosers,
    countUnclosedOpeners
}; 