// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */


function countUnopenedClosers(opening, closing, totalLength) {
	let lastpositiveIndex = 0;
	// const counts = new Array(totalLength).fill(0);
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

		// counts[i] = count;
    }

    return [negativeIndices, lastpositiveIndex];
}

function countUnclosedOpeners(opening, closing, cursor_pos, totalLength) {
	let firstNegativeIndex = cursor_pos + totalLength;
	// const counts = new Array(totalLength).fill(0);
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
		// counts[i] = count;
    }


    return [positiveIndices, firstNegativeIndex];
}

function getTrimmedParts(originalString) {
    const trimmedString = originalString.trim();
    const startIndex = originalString.indexOf(trimmedString);
    const endIndex = startIndex + trimmedString.length;
    const leftTrimmed = originalString.substring(0, startIndex);
    const rightTrimmed = originalString.substring(endIndex);

    return [leftTrimmed, rightTrimmed, trimmedString];
}


function activate(context) {

	// -----------------------------------------------------Move Right Command-----------------------------------------------------
	let MoveForward = vscode.commands.registerCommand('better-move.MoveForward', async () => {

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			console.log('editor', editor);
			const document   = editor.document;
			const position   = editor.selection.active;                                                                             // get the position of the cursor
			let   LineScope  = vscode.workspace.getConfiguration('bettermove').get('analysis-scope');                               // get the scope of the analysis	
			const start      = new vscode.Position(Math.max(0, position.line - LineScope), 0);                                      // 10 lines above, or the beginning of the file
			const end        = new vscode.Position(Math.min(document.lineCount - 1, position.line + LineScope), Number.MAX_VALUE);  // 10 lines below, or the end of the file
			const range      = new vscode.Range(start, end);                                                                        // selects the text in the editor
			const code       = document.getText(range);                                                                             // gets the selected text
			const simpleCode = code.replace(/[^\,\[\]\(\)\{\}\n]/g, '_');
			
			// Parse the code to identify the current argument
			const linesBeforeCursor        = simpleCode.split('\n').slice(0, position.line - start.line);
			const charsBeforeCursor        = linesBeforeCursor.reduce((sum, line) => sum + line.length + 1, 0);  // +1 accounts for newline characters
			const cursorPositionWithinCode = charsBeforeCursor + position.character;
			const leftPartfromCursor       = simpleCode.slice(0, cursorPositionWithinCode);
			const rightPartfromCursor      = simpleCode.slice(cursorPositionWithinCode);

			// Count commas before and after the cursor
			const allcommasbehind       = [];
			const allcommasbefore       = [];
			const allopeningparenbehind = [];
			const allopeningparenbefore = [];
			const allopeningbrackbehind = [];
			const allopeningbrackbefore = [];
			const allopeningbracebehind = [];
			const allopeningbracebefore = [];
			const allclosingparenbehind = [];
			const allclosingparenbefore = [];
			const allclosingbrackbehind = [];
			const allclosingbrackbefore = [];
			const allclosingbracebehind = [];
			const allclosingbracebefore = [];
			
			// get the indices of all commas before and after the cursor
			let indexOfNextComma = rightPartfromCursor.indexOf(',');
			let indexOfCommaBefore = leftPartfromCursor.lastIndexOf(',');
			let indexOfNextOpeningParen = rightPartfromCursor.indexOf('(');
			let indexOfOpeningParenBefore = leftPartfromCursor.lastIndexOf('(');
			let indexOfNextOpeningBrack = rightPartfromCursor.indexOf('[');
			let indexOfOpeningBrackBefore = leftPartfromCursor.lastIndexOf('[');
			let indexOfNextOpeningBrace = rightPartfromCursor.indexOf('{');
			let indexOfOpeningBraceBefore = leftPartfromCursor.lastIndexOf('{');
			let indexOfNextClosingParen = rightPartfromCursor.indexOf(')');
			let indexOfClosingParenBefore = leftPartfromCursor.lastIndexOf(')');
			let indexOfNextClosingBrack = rightPartfromCursor.indexOf(']');
			let indexOfClosingBrackBefore = leftPartfromCursor.lastIndexOf(']');
			let indexOfNextClosingBrace = rightPartfromCursor.indexOf('}');
			let indexOfClosingBraceBefore = leftPartfromCursor.lastIndexOf('}');
			
			while (indexOfNextComma >= 0) {
				allcommasbehind.push(cursorPositionWithinCode + indexOfNextComma);
				indexOfNextComma = rightPartfromCursor.indexOf(',', indexOfNextComma + 1);
			}
			
			while (indexOfCommaBefore > 0) {
				allcommasbefore.push(indexOfCommaBefore);
				indexOfCommaBefore = leftPartfromCursor.lastIndexOf(',', indexOfCommaBefore - 1);
			}
			
			while (indexOfNextOpeningParen >= 0) {
				allopeningparenbehind.push(cursorPositionWithinCode + indexOfNextOpeningParen);
				indexOfNextOpeningParen = rightPartfromCursor.indexOf('(', indexOfNextOpeningParen + 1);
			}
			
			while (indexOfOpeningParenBefore > 0) {
				allopeningparenbefore.push(indexOfOpeningParenBefore);
				indexOfOpeningParenBefore = leftPartfromCursor.lastIndexOf('(', indexOfOpeningParenBefore - 1);
			}
			
			while (indexOfNextOpeningBrack >= 0) {
				allopeningbrackbehind.push(cursorPositionWithinCode + indexOfNextOpeningBrack);
				indexOfNextOpeningBrack = rightPartfromCursor.indexOf('[', indexOfNextOpeningBrack + 1);
			}
			
			while (indexOfOpeningBrackBefore > 0) {
				allopeningbrackbefore.push(indexOfOpeningBrackBefore);
				indexOfOpeningBrackBefore = leftPartfromCursor.lastIndexOf('[', indexOfOpeningBrackBefore - 1);
			}
			
			while (indexOfNextOpeningBrace >= 0) {
				allopeningbracebehind.push(cursorPositionWithinCode + indexOfNextOpeningBrace);
				indexOfNextOpeningBrace = rightPartfromCursor.indexOf('{', indexOfNextOpeningBrace + 1);
			}
			
			while (indexOfOpeningBraceBefore > 0) {
				allopeningbracebefore.push(indexOfOpeningBraceBefore);
				indexOfOpeningBraceBefore = leftPartfromCursor.lastIndexOf('{', indexOfOpeningBraceBefore - 1);
			}

			while (indexOfNextClosingParen > 0) {
				allclosingparenbehind.push(cursorPositionWithinCode + indexOfNextClosingParen);
				indexOfNextClosingParen = rightPartfromCursor.indexOf(')', indexOfNextClosingParen + 1);
			}
			
			while (indexOfClosingParenBefore > 0) {
				allclosingparenbefore.push(indexOfClosingParenBefore);
				indexOfClosingParenBefore = leftPartfromCursor.lastIndexOf(')', indexOfClosingParenBefore - 1);
			}

			while (indexOfNextClosingBrack >= 0) {
				allclosingbrackbehind.push(cursorPositionWithinCode + indexOfNextClosingBrack);
				indexOfNextClosingBrack = rightPartfromCursor.indexOf(']', indexOfNextClosingBrack + 1);
			}

			while (indexOfClosingBrackBefore > 0) {
				allclosingbrackbefore.push(indexOfClosingBrackBefore);
				indexOfClosingBrackBefore = leftPartfromCursor.lastIndexOf(']', indexOfClosingBrackBefore - 1);
			}

			while (indexOfNextClosingBrace >= 0) {
				allclosingbracebehind.push(cursorPositionWithinCode + indexOfNextClosingBrace);
				indexOfNextClosingBrace = rightPartfromCursor.indexOf('}', indexOfNextClosingBrace + 1);
			}

			while (indexOfClosingBraceBefore > 0) {
				allclosingbracebefore.push(indexOfClosingBraceBefore);
				indexOfClosingBraceBefore = leftPartfromCursor.lastIndexOf('}', indexOfClosingBraceBefore - 1);
			}

			// add commas and opening parentheses to a seperate list
			const commaopeningbefore = allcommasbefore.concat(allopeningparenbefore, allopeningbrackbefore, allopeningbracebefore);
			const commaclosingbehind = allcommasbehind.concat(allclosingparenbehind, allclosingbrackbehind, allclosingbracebehind);
			
			// sort the lists (before from high to low, behind from low to high)
			commaopeningbefore.sort((a, b) => b - a);
			commaclosingbehind.sort((a, b) => a - b);

			// opening and closing before and after
			const openingbefore = allopeningparenbefore.concat(allopeningbrackbefore, allopeningbracebefore);
			const openingbehind = allopeningparenbehind.concat(allopeningbrackbehind, allopeningbracebehind);
			const closingbefore = allclosingparenbefore.concat(allclosingbrackbefore, allclosingbracebefore);
			const closingbehind = allclosingparenbehind.concat(allclosingbrackbehind, allclosingbracebehind);

			// sort the lists (before from high to low, behind from low to high)
			openingbefore.sort((a, b) => b - a);
			openingbehind.sort((a, b) => a - b);
			closingbefore.sort((a, b) => b - a);
			closingbehind.sort((a, b) => a - b);

			const [negativeIndicesbefore, lastPositiveIndexbefore] = countUnopenedClosers(openingbefore, closingbefore, leftPartfromCursor.length);
			
			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const filteredCommasBefore = allcommasbefore.filter(index => !negativeIndicesbefore.includes(index));
			
			// Get the maximum value between lastNegativeIndex and the remaining values in filteredCommasBefore
			let FirstArgumentStartIndex = Math.max(lastPositiveIndexbefore, ...filteredCommasBefore);
			
			// Count unclosed symbols after the cursor
			const [positiveIndicesAfter, firstNegativeIndexAfter, arraytwo] = countUnclosedOpeners(openingbehind, closingbehind, cursorPositionWithinCode, rightPartfromCursor.length);

			// catch the error that the cursor is not enclosed in brackets, braces or parentheses
			if (firstNegativeIndexAfter === cursorPositionWithinCode + rightPartfromCursor.length || lastPositiveIndexbefore === 0) {
				vscode.window.showInformationMessage('out of bounds');
				return;
			}

			const filteredCommasAfter = allcommasbehind.filter(index => !positiveIndicesAfter.includes(index));

			// Get the minimum value between firstPositiveIndexAfter
			const firstArgumentEndIndex = Math.min(firstNegativeIndexAfter, ...filteredCommasAfter);

			// if firstArgumentEndIndex is an element of closingbehind an error has occured
			if (closingbehind.includes(firstArgumentEndIndex)) {
				vscode.window.showInformationMessage('this is the last argument');
				return;
			}


			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const openingbehindbehind = openingbehind.filter(index => index > firstArgumentEndIndex);
			
			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const closingbehindbehind = closingbehind.filter(index => index > firstArgumentEndIndex);

			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const allcommasbehindbehind = allcommasbehind.filter(index => index > firstArgumentEndIndex);
			
			// Count unclosed symbols after the cursor
			const newlength = rightPartfromCursor.length - (firstArgumentEndIndex - cursorPositionWithinCode)
			
			// Count unclosed symbols after the cursor
			const [negativeIndicesAfterAfter, firstPositiveIndexAfterAfter, arraythree] = countUnclosedOpeners(openingbehindbehind, closingbehindbehind, cursorPositionWithinCode, newlength);

			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const filteredCommasAfterAfter = allcommasbehindbehind.filter(index => !negativeIndicesAfterAfter.includes(index));

			// Get the minimum value between firstPositiveIndexAfter
			const secondArgumentEndIndex = Math.min(firstPositiveIndexAfterAfter, ...filteredCommasAfterAfter);

			console.log('second argument end index', secondArgumentEndIndex);
			console.log('length of right part from cursor', rightPartfromCursor.length);
			console.log('length of left part from cursor', leftPartfromCursor.length);

			// Extracting arguments
			const firstArgument = code.slice(FirstArgumentStartIndex + 1, firstArgumentEndIndex);
			const secondArgument = code.slice(firstArgumentEndIndex + 1, secondArgumentEndIndex); // Adjusted to remove the comma

			// trimm the arguments
			const [leftTrimmedfirst, rightTrimmedfirst, trimmedStringfirst] = getTrimmedParts(firstArgument);
			const [leftTrimmedsecond, rightTrimmedsecond, trimmedStringsecond] = getTrimmedParts(secondArgument);

			// Constructing the new code with swapped arguments
			const newCode = code.slice(0, FirstArgumentStartIndex + 1) + 
							leftTrimmedfirst +
							trimmedStringsecond + 
							rightTrimmedfirst +
							',' +
							leftTrimmedsecond +
							trimmedStringfirst + 
							rightTrimmedsecond +
							code.slice(secondArgumentEndIndex);
			
			const secondArgumentLength = leftTrimmedsecond.length + trimmedStringsecond.length + rightTrimmedsecond.length;
			
			const offset = trimmedStringsecond.length + 2;

			console.log('trimmed string first', trimmedStringfirst);
			console.log('trimmed string second', trimmedStringsecond);

			// if firstargument does not contain a /n then this:
			let newSelection;

			if (firstArgument.includes('\n')) {

				const newPosition = new vscode.Position(editor.selection.active.line + 1, editor.selection.active.character);

				newSelection = new vscode.Selection(newPosition, newPosition);

			} else {
				let newCursorPos = position.translate(0, offset);

				newSelection = new vscode.Selection(newCursorPos, newCursorPos);
			}


			// Replace the old code with the new code with swapped arguments
			try {
				await editor.edit(editBuilder => {
					editBuilder.replace(range, newCode);
				});
				editor.selection = newSelection;
			} catch (error) {
				console.error('Error applying edit:', error);
			}

		} else {
			vscode.window.showInformationMessage('Open a file to print code');
		}

	});


	// -----------------------------------------------------Move Left Command-----------------------------------------------------
	let MoveBackward = vscode.commands.registerCommand('better-move.MoveBackward', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document   = editor.document;
			const position   = editor.selection.active;                                                                             // get the position of the cursor
			let   LineScope  = vscode.workspace.getConfiguration('bettermove').get('analysis-scope');                               // get the scope of the analysis
			// console.log('LineScope', LineScope);
			const start      = new vscode.Position(Math.max(0, position.line - LineScope), 0);                                      // LineScope lines above, or the beginning of the file
			const end        = new vscode.Position(Math.min(document.lineCount - 1, position.line + LineScope), Number.MAX_VALUE);  // LineScope lines below, or the end of the file
			const range      = new vscode.Range(start, end);                                                                        // selects the text in the editor
			const code       = document.getText(range);                                                                             // gets the selected text
			const simpleCode = code.replace(/[^\,\[\]\(\)\{\}\n]/g, '_');
			
			// Parse the code to identify the current argument
			const linesBeforeCursor        = simpleCode.split('\n').slice(0, position.line - start.line);
			const charsBeforeCursor        = linesBeforeCursor.reduce((sum, line) => sum + line.length + 1, 0);  // +1 accounts for newline characters
			const cursorPositionWithinCode = charsBeforeCursor + position.character;
			const leftPartfromCursor       = simpleCode.slice(0, cursorPositionWithinCode);
			const rightPartfromCursor      = simpleCode.slice(cursorPositionWithinCode);

			// Count commas before and after the cursor
			const allcommasbehind       = [];
			const allcommasbefore       = [];
			const allopeningparenbehind = [];
			const allopeningparenbefore = [];
			const allopeningbrackbehind = [];
			const allopeningbrackbefore = [];
			const allopeningbracebehind = [];
			const allopeningbracebefore = [];
			const allclosingparenbehind = [];
			const allclosingparenbefore = [];
			const allclosingbrackbehind = [];
			const allclosingbrackbefore = [];
			const allclosingbracebehind = [];
			const allclosingbracebefore = [];

			// get the indices of all commas before and after the cursor
			let indexOfNextComma = rightPartfromCursor.indexOf(',');
			let indexOfCommaBefore = leftPartfromCursor.lastIndexOf(',');
			let indexOfNextOpeningParen = rightPartfromCursor.indexOf('(');
			let indexOfOpeningParenBefore = leftPartfromCursor.lastIndexOf('(');
			let indexOfNextOpeningBrack = rightPartfromCursor.indexOf('[');
			let indexOfOpeningBrackBefore = leftPartfromCursor.lastIndexOf('[');
			let indexOfNextOpeningBrace = rightPartfromCursor.indexOf('{');
			let indexOfOpeningBraceBefore = leftPartfromCursor.lastIndexOf('{');
			let indexOfNextClosingParen = rightPartfromCursor.indexOf(')');
			let indexOfClosingParenBefore = leftPartfromCursor.lastIndexOf(')');
			let indexOfNextClosingBrack = rightPartfromCursor.indexOf(']');
			let indexOfClosingBrackBefore = leftPartfromCursor.lastIndexOf(']');
			let indexOfNextClosingBrace = rightPartfromCursor.indexOf('}');
			let indexOfClosingBraceBefore = leftPartfromCursor.lastIndexOf('}');

			console.log('index of comma before', indexOfCommaBefore);

			console.log('right part from cursor:', rightPartfromCursor);
			console.log('left part from cursor:', leftPartfromCursor);


			// get the indices of all commas, opening parentheses, opening brackets and opening braces before and after the cursor
			while (indexOfNextComma >= 0) {
				allcommasbehind.push(cursorPositionWithinCode + indexOfNextComma);
				indexOfNextComma = rightPartfromCursor.indexOf(',', indexOfNextComma + 1);
			}

			while (indexOfCommaBefore > 0) {
				allcommasbefore.push(indexOfCommaBefore);
				indexOfCommaBefore = leftPartfromCursor.lastIndexOf(',', indexOfCommaBefore - 1);
			}

			while (indexOfNextOpeningParen >= 0) {
				allopeningparenbehind.push(cursorPositionWithinCode + indexOfNextOpeningParen);
				indexOfNextOpeningParen = rightPartfromCursor.indexOf('(', indexOfNextOpeningParen + 1);
			}

			while (indexOfOpeningParenBefore > 0) {
				allopeningparenbefore.push(indexOfOpeningParenBefore);
				indexOfOpeningParenBefore = leftPartfromCursor.lastIndexOf('(', indexOfOpeningParenBefore - 1);
			}

			while (indexOfNextOpeningBrack >= 0) {
				allopeningbrackbehind.push(cursorPositionWithinCode + indexOfNextOpeningBrack);
				indexOfNextOpeningBrack = rightPartfromCursor.indexOf('[', indexOfNextOpeningBrack + 1);
			}

			while (indexOfOpeningBrackBefore > 0) {
				allopeningbrackbefore.push(indexOfOpeningBrackBefore);
				indexOfOpeningBrackBefore = leftPartfromCursor.lastIndexOf('[', indexOfOpeningBrackBefore - 1);
			}

			while (indexOfNextOpeningBrace >= 0) {
				allopeningbracebehind.push(cursorPositionWithinCode + indexOfNextOpeningBrace);
				indexOfNextOpeningBrace = rightPartfromCursor.indexOf('{', indexOfNextOpeningBrace + 1);
			}

			while (indexOfOpeningBraceBefore > 0) {
				allopeningbracebefore.push(indexOfOpeningBraceBefore);
				indexOfOpeningBraceBefore = leftPartfromCursor.lastIndexOf('{', indexOfOpeningBraceBefore - 1);
			}

			while (indexOfNextClosingParen >= 0) {
				allclosingparenbehind.push(cursorPositionWithinCode + indexOfNextClosingParen);
				indexOfNextClosingParen = rightPartfromCursor.indexOf(')', indexOfNextClosingParen + 1);
			}

			while (indexOfClosingParenBefore > 0) {
				allclosingparenbefore.push(indexOfClosingParenBefore);
				indexOfClosingParenBefore = leftPartfromCursor.lastIndexOf(')', indexOfClosingParenBefore - 1);
			}

			while (indexOfNextClosingBrack > 0) {
				allclosingbrackbehind.push(cursorPositionWithinCode + indexOfNextClosingBrack);
				indexOfNextClosingBrack = rightPartfromCursor.indexOf(']', indexOfNextClosingBrack + 1);
			}

			while (indexOfClosingBrackBefore >= 0) {
				allclosingbrackbefore.push(indexOfClosingBrackBefore);
				indexOfClosingBrackBefore = leftPartfromCursor.lastIndexOf(']', indexOfClosingBrackBefore - 1);
			}

			while (indexOfNextClosingBrace > 0) {
				allclosingbracebehind.push(cursorPositionWithinCode + indexOfNextClosingBrace);
				indexOfNextClosingBrace = rightPartfromCursor.indexOf('}', indexOfNextClosingBrace + 1);
			}

			while (indexOfClosingBraceBefore >= 0) {
				allclosingbracebefore.push(indexOfClosingBraceBefore);
				indexOfClosingBraceBefore = leftPartfromCursor.lastIndexOf('}', indexOfClosingBraceBefore - 1);
			}

			// add commas and opening parentheses to a seperate list
			const commaopeningbefore = allcommasbefore.concat(allopeningparenbefore, allopeningbrackbefore, allopeningbracebefore);
			const commaclosingbehind = allcommasbehind.concat(allclosingparenbehind, allclosingbrackbehind, allclosingbracebehind);
			
			// sort the lists (before from high to low, behind from low to high)
			commaopeningbefore.sort((a, b) => b - a);
			commaclosingbehind.sort((a, b) => a - b);

			// opening and closing before and after
			const openingbefore = allopeningparenbefore.concat(allopeningbrackbefore, allopeningbracebefore);
			const openingbehind = allopeningparenbehind.concat(allopeningbrackbehind, allopeningbracebehind);
			const closingbefore = allclosingparenbefore.concat(allclosingbrackbefore, allclosingbracebefore);
			const closingbehind = allclosingparenbehind.concat(allclosingbrackbehind, allclosingbracebehind);

			// sort the lists (before from high to low, behind from low to high)
			openingbefore.sort((a, b) => b - a);
			openingbehind.sort((a, b) => a - b);
			closingbefore.sort((a, b) => b - a);
			closingbehind.sort((a, b) => a - b);

			const [negativeIndicesbefore, lastPositiveIndexbefore] = countUnopenedClosers(openingbefore, closingbefore, leftPartfromCursor.length);

			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const filteredCommasBefore = allcommasbefore.filter(index => !negativeIndicesbefore.includes(index));
			
			// Get the maximum value between lastNegativeIndex and the remaining values in filteredCommasBefore
			let FirstArgumentStartIndex = Math.max(lastPositiveIndexbefore, ...filteredCommasBefore);

			// Count unclosed symbols after the cursor
			const [positiveIndicesAfter, firstNegativeIndexAfter, arraytwo] = countUnclosedOpeners(openingbehind, closingbehind, cursorPositionWithinCode, rightPartfromCursor.length);

			// catch the error that the cursor is not enclosed in brackets, braces or parentheses
			if (firstNegativeIndexAfter === cursorPositionWithinCode + rightPartfromCursor.length || lastPositiveIndexbefore === 0) {
				vscode.window.showInformationMessage('out of bounds');
				return;
			}

			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const filteredCommasAfter = allcommasbehind.filter(index => !positiveIndicesAfter.includes(index));

			// Get the minimum value between firstPositiveIndexAfter
			const firstArgumentEndIndex = Math.min(firstNegativeIndexAfter, ...filteredCommasAfter);

			// if firstArgumentEndIndex is an element of closingbehind an error has occured
			if (openingbefore.includes(FirstArgumentStartIndex)) {
				vscode.window.showInformationMessage('this is the first argument, not shiftable to the left');
				return;
			}

			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const openingbeforebefore = openingbefore.filter(index => index < FirstArgumentStartIndex);
			
			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const closingbeforebefore = closingbefore.filter(index => index < FirstArgumentStartIndex);

			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const allcommasbeforebefore = allcommasbefore.filter(index => index < FirstArgumentStartIndex);
			
			// Count unclosed symbols after the cursor
			const newlength = leftPartfromCursor.length - (cursorPositionWithinCode - FirstArgumentStartIndex)
			
			// Count unclosed symbols after the cursor
			const [negativeIndicesBeforeBefore, LastPositiveIndexBeforeBefore] = countUnopenedClosers(openingbeforebefore, closingbeforebefore, newlength);

			// Remove all entries in allcommasbefore that are also present in positiveIndices
			const filteredCommasBeforeBefore = allcommasbeforebefore.filter(index => !negativeIndicesBeforeBefore.includes(index));

			// Get the minimum value between firstPositiveIndexAfter
			const zerothArgumentStartIndex = Math.max(LastPositiveIndexBeforeBefore, ...filteredCommasBeforeBefore);

			// Extracting arguments
			const firstArgument = code.slice(FirstArgumentStartIndex + 1, firstArgumentEndIndex);
			const zerothArgument = code.slice(zerothArgumentStartIndex + 1, FirstArgumentStartIndex); // Adjusted to remove the comma

			// trimm the arguments
			const [leftTrimmedfirst, rightTrimmedfirst, trimmedStringfirst] = getTrimmedParts(firstArgument);
			const [leftTrimmedzeroth, rightTrimmedzeroth, trimmedStringzeroth] = getTrimmedParts(zerothArgument);

			// Constructing the new code with swapped arguments
			const newCode = code.slice(0, zerothArgumentStartIndex + 1) + 
							leftTrimmedzeroth +
							trimmedStringfirst + 
							rightTrimmedzeroth +
							',' +
							leftTrimmedfirst +
							trimmedStringzeroth + 
							rightTrimmedfirst +
							code.slice(firstArgumentEndIndex);

			
							
			// if the zeroth argument contains a newline character simply shift the cursor up:
			let newCursorPos;

			if (zerothArgument.includes('\n')) {
				newCursorPos = new vscode.Position(editor.selection.active.line - 1, editor.selection.active.character);
			} else {
				let offset = trimmedStringzeroth.length + 2;
				console.log('offset', offset);

				console.log('heyho', leftPartfromCursor[zerothArgumentStartIndex])

				// if the first char left of the zeroth argument start index is an opening bracket, brace or paren, shift the cursor one to the right
				if (leftPartfromCursor[zerothArgumentStartIndex] === '(' || leftPartfromCursor[zerothArgumentStartIndex] === '[' || leftPartfromCursor[zerothArgumentStartIndex] === '{') {
					if (code.slice(cursorPositionWithinCode)[0] === ' '){
						offset = offset - 1;
					}
				}

				newCursorPos = position.translate(0, -1 * offset);
			}

			// define the new cursor position
			let newSelection = new vscode.Selection(newCursorPos, newCursorPos);
			
			// Replace the old code with the new code with swapped arguments
			try {
				await editor.edit(editBuilder => {
					editBuilder.replace(range, newCode);
				});
				editor.selection = newSelection;
				
			} catch (error) {
				console.error('Error applying edit:', error);
			}

		} else {
			vscode.window.showInformationMessage('Open a file to print code');
		}

	});


	context.subscriptions.push(MoveBackward);
	context.subscriptions.push(MoveForward);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
