function getTrimmedParts(originalString) {
    const trimmedString = originalString.trim();
    const startIndex = originalString.indexOf(trimmedString);
    const endIndex = startIndex + trimmedString.length;
    const leftTrimmed = originalString.substring(0, startIndex);
    const rightTrimmed = originalString.substring(endIndex);

    return [leftTrimmed, rightTrimmed, trimmedString];
}

function findAllIndices(str, char, startPos = 0) {
    const indices = [];
    let index = str.indexOf(char, startPos);
    
    while (index >= 0) {
        indices.push(index);
        index = str.indexOf(char, index + 1);
    }
    
    return indices;
}

module.exports = {
    getTrimmedParts,
    findAllIndices
}; 