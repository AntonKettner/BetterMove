const vscode = require('vscode');
const { countUnclosedOpeners, countUnopenedClosers } = require('../utils/symbolCounter');
const { getTrimmedParts } = require('../utils/stringUtils');

/**
 * @typedef {number[]} IndexArray
 */

function registerMoveForward() {
    return vscode.commands.registerCommand('better-move.MoveForward', async () => {
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

        const filteredCommasAfter = allcommasbehind.filter(index => 
            positiveIndicesAfter && Array.isArray(positiveIndicesAfter) ? 
            !positiveIndicesAfter.includes(Number(index)) : true
        );

        const firstArgumentEndIndex = Math.min(
            firstNegativeIndexAfter,
            ...filteredCommasAfter
        );

        if (closingbehind.includes(firstArgumentEndIndex)) {
            vscode.window.showInformationMessage('this is the last argument');
            return;
        }

        // Find second argument boundaries
        const openingbehindbehind = openingbehind.filter(index => index > firstArgumentEndIndex);
        const closingbehindbehind = closingbehind.filter(index => index > firstArgumentEndIndex);
        const allcommasbehindbehind = allcommasbehind.filter(index => index > firstArgumentEndIndex);
        
        const newlength = rightPartfromCursor.length - (firstArgumentEndIndex - cursorPositionWithinCode);
        
        const [negativeIndicesAfterAfter, firstPositiveIndexAfterAfter] = countUnclosedOpeners(
            openingbehindbehind,
            closingbehindbehind,
            firstArgumentEndIndex,
            newlength
        );

        const filteredCommasAfterAfter = allcommasbehindbehind.filter(index => 
            !negativeIndicesAfterAfter.includes(index)
        );

        const secondArgumentEndIndex = Math.min(
            firstPositiveIndexAfterAfter || Infinity,
            ...filteredCommasAfterAfter,
            cursorPositionWithinCode + rightPartfromCursor.length
        );

        // Extract and process arguments
        const firstArgument = code.slice(FirstArgumentStartIndex + 1, firstArgumentEndIndex);
        const secondArgument = code.slice(firstArgumentEndIndex + 1, secondArgumentEndIndex);

        const [leftTrimmedfirst, rightTrimmedfirst, trimmedStringfirst] = getTrimmedParts(firstArgument);
        const [leftTrimmedsecond, rightTrimmedsecond, trimmedStringsecond] = getTrimmedParts(secondArgument);

        // Construct new code
        const newCode = code.slice(0, FirstArgumentStartIndex + 1) + 
                       leftTrimmedfirst +
                       trimmedStringsecond + 
                       rightTrimmedfirst +
                       ',' +
                       leftTrimmedsecond +
                       trimmedStringfirst + 
                       rightTrimmedsecond +
                       code.slice(secondArgumentEndIndex);

        // Update cursor position
        let newSelection;
        if (firstArgument.includes('\n')) {
            const newPosition = new vscode.Position(editor.selection.active.line + 1, editor.selection.active.character);
            newSelection = new vscode.Selection(newPosition, newPosition);
        } else {
            const offset = trimmedStringsecond.length + 2;
            const newCursorPos = position.translate(0, offset);
            newSelection = new vscode.Selection(newCursorPos, newCursorPos);
        }

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
    registerMoveForward
}; 