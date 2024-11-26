const vscode = require('vscode');
const { findAllIndices } = require('./stringUtils');

function extractSymbolPositions(text, cursorPosition) {
    const positions = {
        commas: { before: [], behind: [] },
        opening: { 
            before: { paren: [], brack: [], brace: [] },
            behind: { paren: [], brack: [], brace: [] }
        },
        closing: {
            before: { paren: [], brack: [], brace: [] },
            behind: { paren: [], brack: [], brace: [] }
        }
    };

    const symbols = {
        opening: ['(', '[', '{'],
        closing: [')', ']', '}']
    };

    // Extract positions for each symbol type
    symbols.opening.forEach((symbol, index) => {
        const beforeIndices = findAllIndices(text.slice(0, cursorPosition), symbol);
        const behindIndices = findAllIndices(text.slice(cursorPosition), symbol)
            .map(i => i + cursorPosition);

        const type = ['paren', 'brack', 'brace'][index];
        positions.opening.before[type] = beforeIndices;
        positions.opening.behind[type] = behindIndices;
    });

    symbols.closing.forEach((symbol, index) => {
        const beforeIndices = findAllIndices(text.slice(0, cursorPosition), symbol);
        const behindIndices = findAllIndices(text.slice(cursorPosition), symbol)
            .map(i => i + cursorPosition);

        const type = ['paren', 'brack', 'brace'][index];
        positions.closing.before[type] = beforeIndices;
        positions.closing.behind[type] = behindIndices;
    });

    // Extract comma positions
    positions.commas.before = findAllIndices(text.slice(0, cursorPosition), ',');
    positions.commas.behind = findAllIndices(text.slice(cursorPosition), ',')
        .map(i => i + cursorPosition);

    return positions;
}

module.exports = {
    extractSymbolPositions
}; 