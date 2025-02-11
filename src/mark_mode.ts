import * as vscode from 'vscode';
import { getMarkHandler } from './mark_handler_singleton';
import { outputChannel } from './extension';
// Track active mode and status bar
let currentMode: 'mark' | 'jump' | null = null;
let statusBarItem: vscode.StatusBarItem;

// Function to exit the current mode
function exitMode() {
    currentMode = null;
    statusBarItem.hide();
    // Clear the mode context
    vscode.commands.executeCommand('setContext', 'vim-marks.mode', null);
}

// Create commands for each letter
function createMarkCommands(context: vscode.ExtensionContext) {
    // Create mark commands for a-z and A-Z
    for (let i = 0; i < 26; i++) {
        const lowerChar = String.fromCharCode(97 + i); // a-z
        const upperChar = String.fromCharCode(65 + i); // A-Z

        // Register mark commands
        context.subscriptions.push(
            vscode.commands.registerCommand(`vim-marks.create_mark_${lowerChar}`, async () => {
                await getMarkHandler(context).createMark(context, lowerChar);
                exitMode();
            }),
            vscode.commands.registerCommand(`vim-marks.create_mark_${upperChar}`, async () => {
                await getMarkHandler(context).createMark(context, upperChar);
                exitMode();
            }),
            // Register jump commands
            vscode.commands.registerCommand(`vim-marks.jump_to_mark_${lowerChar}`, async () => {
                await getMarkHandler(context).jumpToChar(lowerChar);
                exitMode();
            }),
            vscode.commands.registerCommand(`vim-marks.jump_to_mark_${upperChar}`, async () => {
                await getMarkHandler(context).jumpToChar(upperChar);
                exitMode();
            })
        );
    }
}

export function activateMarkMode(context: vscode.ExtensionContext) {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    context.subscriptions.push(statusBarItem);

    // Create all mark-related commands
    createMarkCommands(context);

    // Register escape command at the extension level
    const escapeDisposable = vscode.commands.registerCommand('vim-marks.escape', () => {
        if (currentMode) {
            exitMode();
        }
    });
    context.subscriptions.push(escapeDisposable);

    // Register mark mode command
    const markModeDisposable = vscode.commands.registerCommand('vim-marks.mark_mode', async () => {
        if (currentMode) {
            exitMode();
        }
        
        currentMode = 'mark';
        // Set the mode context
        await vscode.commands.executeCommand('setContext', 'vim-marks.mode', 'mark');
        statusBarItem.text = "$(bookmark) Mark Mode: Press a key";
        statusBarItem.show();

        // Handle clicks outside or other focus changes
        const focusDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
            exitMode();
        });
        context.subscriptions.push(focusDisposable);
    });

    // Register jump mode command
    const jumpModeDisposable = vscode.commands.registerCommand('vim-marks.jump_mode', async () => {
        if (currentMode) {
            exitMode();
        }

        currentMode = 'jump';
        // Set the mode context
        await vscode.commands.executeCommand('setContext', 'vim-marks.mode', 'jump');
        statusBarItem.text = "$(arrow-right) Jump Mode: Press a key";
        statusBarItem.show();

        // Handle clicks outside or other focus changes
        const focusDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
            exitMode();
        });
        context.subscriptions.push(focusDisposable);
    });

    context.subscriptions.push(markModeDisposable, jumpModeDisposable);
}