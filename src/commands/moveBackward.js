const vscode = require('vscode');
const {countUnclosedOpeners, countUnopenedClosers} = require('../utils/symbolCounter');
const {getTrimmedParts} = require('../utils/stringUtils');

/**
 * @typedef {number[]} IndexArray
 */

function registerMoveBackward() {
    return vscode.commands.registerCommand('better-move.MoveBackward', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file to print code');
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const LineScope = vscode.workspace.getConfiguration('bettermove').get('analysis-scope');
        const start = new vscode.Position(Math.max(0, position.line - LineScope), 0);
        const end = new vscode.Position(Math.min(document.lineCount - 1, position.line + LineScope), Number.MAX_VALUE);
        const range = new vscode.Range(start, end);
        const code = document.getText(range);
        const simpleCode = code.replace(/[^\,\[\]\(\)\{\}\n]/g, '_');

        // Get cursor position within code
        const linesBeforeCursor = simpleCode.split('\n').slice(0, position.line - start.line);
        const charsBeforeCursor = linesBeforeCursor.reduce((sum, line) => sum + line.length + 1, 0);
        const cursorPositionWithinCode = charsBeforeCursor + position.character;

        // Split code at cursor
        const leftPartfromCursor = simpleCode.slice(0, cursorPositionWithinCode);
        const rightPartfromCursor = simpleCode.slice(cursorPositionWithinCode);

        // Extract symbol positions
        const {
            openingbefore,
            openingbehind,
            closingbefore,
            closingbehind,
            allcommasbefore,
            allcommasbehind
        } = extractSymbolPositions(leftPartfromCursor, rightPartfromCursor);

        // Find argument boundaries
        const [negativeIndicesbefore, lastPositiveIndexbefore] = countUnopenedClosers(
            openingbefore,
            closingbefore,
            leftPartfromCursor.length
        );

        /** @type {IndexArray} */
        const filteredCommasBefore = allcommasbefore.filter(index => 
            negativeIndicesbefore && Array.isArray(negativeIndicesbefore) ? 
            !negativeIndicesbefore.includes(index) : true
        );

        const FirstArgumentStartIndex = Math.max(
            lastPositiveIndexbefore || 0,
            ...filteredCommasBefore
        );

        const [positiveIndicesAfter, firstNegativeIndexAfter] = countUnclosedOpeners(
            openingbehind,
            closingbehind,
            cursorPositionWithinCode,
            rightPartfromCursor.length
        );

        // Boundary checks
        if (firstNegativeIndexAfter === cursorPositionWithinCode + rightPartfromCursor.length || 
            lastPositiveIndexbefore === 0) {
            vscode.window.showInformationMessage('out of bounds');
            return;
        }

        if (openingbefore.includes(FirstArgumentStartIndex)) {
            vscode.window.showInformationMessage('this is the first argument');
            return;
        }

        // Find previous argument boundaries
        const openingbeforebefore = openingbefore.filter(index => index < FirstArgumentStartIndex);
        const closingbeforebefore = closingbefore.filter(index => index < FirstArgumentStartIndex);
        const allcommasbeforebefore = allcommasbefore.filter(index => index < FirstArgumentStartIndex);

        const [negativeIndicesBeforeBefore, lastPositiveIndexBeforeBefore] = countUnopenedClosers(
            openingbeforebefore,
            closingbeforebefore,
            FirstArgumentStartIndex
        );

        /** @type {IndexArray} */
        const filteredCommasBeforeBefore = allcommasbeforebefore.filter(index => 
            negativeIndicesBeforeBefore && Array.isArray(negativeIndicesBeforeBefore) ? 
            !negativeIndicesBeforeBefore.includes(Number(index)) : true
        );

        const zerothArgumentStartIndex = Math.max(
            lastPositiveIndexBeforeBefore || 0,
            ...filteredCommasBeforeBefore
        );

        // Extract and process arguments
        const firstArgument = code.slice(FirstArgumentStartIndex + 1, firstNegativeIndexAfter);
        const zerothArgument = code.slice(zerothArgumentStartIndex + 1, FirstArgumentStartIndex);

        const [leftTrimmedfirst, rightTrimmedfirst, trimmedStringfirst] = getTrimmedParts(firstArgument);
        const [leftTrimmedzeroth, rightTrimmedzeroth, trimmedStringzeroth] = getTrimmedParts(zerothArgument);

        // Construct new code
        const newCode = code.slice(0, zerothArgumentStartIndex + 1) + 
                       leftTrimmedzeroth +
                       trimmedStringfirst + 
                       rightTrimmedzeroth +
                       ',' +
                       leftTrimmedfirst +
                       trimmedStringzeroth + 
                       rightTrimmedfirst +
                       code.slice(firstNegativeIndexAfter);

        // Update cursor position
        let newCursorPos;
        if (zerothArgument.includes('\n')) {
            newCursorPos = new vscode.Position(editor.selection.active.line - 1, editor.selection.active.character);
        } else {
            const offset = trimmedStringzeroth.length + 2;
            newCursorPos = position.translate(0, -offset);
        }

        const newSelection = new vscode.Selection(newCursorPos, newCursorPos);

        // Apply the edit
        try {
            await editor.edit(editBuilder => {
                editBuilder.replace(range, newCode);
            });
            editor.selection = newSelection;
        } catch (error) {
            console.error('Error applying edit:', error);
        }
    });
}

/**
 * @param {string} leftPart
 * @param {string} rightPart
 * @returns {{
 *   openingbefore: number[],
 *   openingbehind: number[],
 *   closingbefore: number[],
 *   closingbehind: number[],
 *   allcommasbefore: number[],
 *   allcommasbehind: number[]
 * }}
 */
function extractSymbolPositions(leftPart, rightPart) {
    const cursorPos = leftPart.length;
    const positions = {
        openingbefore: [],
        openingbehind: [],
        closingbefore: [],
        closingbehind: [],
        allcommasbefore: [],
        allcommasbehind: []
    };

    // Find all indices for each symbol type
    ['(', '[', '{'].forEach(symbol => {
        let index = leftPart.lastIndexOf(symbol);
        while (index >= 0) {
            positions.openingbefore.push(index);
            index = leftPart.lastIndexOf(symbol, index - 1);
        }

        index = rightPart.indexOf(symbol);
        while (index >= 0) {
            positions.openingbehind.push(cursorPos + index);
            index = rightPart.indexOf(symbol, index + 1);
        }
    });

    [')', ']', '}'].forEach(symbol => {
        let index = leftPart.lastIndexOf(symbol);
        while (index >= 0) {
            positions.closingbefore.push(index);
            index = leftPart.lastIndexOf(symbol, index - 1);
        }

        index = rightPart.indexOf(symbol);
        while (index >= 0) {
            positions.closingbehind.push(cursorPos + index);
            index = rightPart.indexOf(symbol, index + 1);
        }
    });

    // Find comma positions
    let index = leftPart.lastIndexOf(',');
    while (index >= 0) {
        positions.allcommasbefore.push(index);
        index = leftPart.lastIndexOf(',', index - 1);
    }

    index = rightPart.indexOf(',');
    while (index >= 0) {
        positions.allcommasbehind.push(cursorPos + index);
        index = rightPart.indexOf(',', index + 1);
    }

    // Sort arrays
    positions.openingbefore.sort((a, b) => b - a);
    positions.openingbehind.sort((a, b) => a - b);
    positions.closingbefore.sort((a, b) => b - a);
    positions.closingbehind.sort((a, b) => a - b);
    positions.allcommasbefore.sort((a, b) => b - a);
    positions.allcommasbehind.sort((a, b) => a - b);

    return positions;
}

module.exports = {
    registerMoveBackward
}; 