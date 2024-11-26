const vscode = require('vscode');
const {registerMoveForward} = require('./commands/moveForward');
const {registerMoveBackward} = require('./commands/moveBackward');

function activate(context) {
    // Register commands
    const moveForward = registerMoveForward();
    const moveBackward = registerMoveBackward();

    context.subscriptions.push(moveForward);
    context.subscriptions.push(moveBackward);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}; 