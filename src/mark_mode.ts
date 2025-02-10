import * as vscode from 'vscode';
import { getMarkHandler } from './mark_handler_singleton';

let markMode = false;
let jumpMode = false;

export function activateMarkMode(context: vscode.ExtensionContext) {
    const markModeDisposable = vscode.commands.registerCommand('vim-marks.mark_mode', async () => {
        markMode = true;
        
        // Create a one-time listener for the next key press
        const disposable = vscode.commands.registerCommand('type', async (args) => {
            const char = args.text;
            if (markMode) {
                await getMarkHandler(context).createMark(context, char);
                markMode = false;
            }
            disposable.dispose();
        });
        
        // Reset mark mode if user performs another action
        setTimeout(() => {
            markMode = false;
            disposable.dispose();
        }, 1000);
    });

    const jumpModeDisposable = vscode.commands.registerCommand('vim-marks.jump_mode', async () => {
        jumpMode = true;
        
        // Create a one-time listener for the next key press
        const disposable = vscode.commands.registerCommand('type', async (args) => {
            const char = args.text;
            if (jumpMode) {
                await getMarkHandler(context).jumpToChar(char);
                jumpMode = false;
            }
            disposable.dispose();
        });
        
        // Reset jump mode if user performs another action
        setTimeout(() => {
            jumpMode = false;
            disposable.dispose();
        }, 1000);
    });

    context.subscriptions.push(markModeDisposable);
    context.subscriptions.push(jumpModeDisposable);
}