# better-move README

This extension remaps Ctrl + Shift + Alt + ArrowLeft/ArrowRight to moving an argument (inside brackets, braces or parentheses) which the cursor is placed on, either one forward or backwards, effectively switching two arguments each time the combination is pressed (or MoveLeft/MoveRight is triggered from the Control Panel (Ctrl + Shift + P))

The cursor follows the argument, so by repeatedly pressing rightArrow/leftArrow the argument can be moved multiple times forward or backwards

It was tested mainly for python, c and JavaScript files, is written with JavaScript and my first Javascript project.

It catches the corresponding errors if the cursor is placed outside of a function or an argument is attempted to be moved outside of the function.

Please report any bugs, I am happy to fix them asap.

## ONLY WORKING ON WINDOWS SO FAR, UPDATE SOON

Ctrl + Shift + Alt + ArrowLeft   ====>  Move argument to the front
Ctrl + Shift + Alt + ArrowRight  ====>  Move argument to the back

Mac:

Cmd + Shift + Alt + ArrowLeft   ====>  Move argument to the front
Cmd + Shift + Alt + ArrowRight  ====>  Move argument to the back

The cursor moves together with the argument

## Requirements

I do not think there are any, please let me know if so.

## Extension Settings

MoveLeft and MoveRight can be reconfigured to other keybindings from the settings

The depth this extension analyzes the code up to (lines above and below the cursor) can also be set in the setting (Default: 10)