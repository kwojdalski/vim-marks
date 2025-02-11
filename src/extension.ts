import * as vscode from 'vscode';
import { getMarkHandler } from './mark_handler_singleton';
import { activateMarkMode } from './mark_mode';

export const outputChannel = vscode.window.createOutputChannel("Vim Marks");

export function activate(context: vscode.ExtensionContext): void {
    
    outputChannel.show(true);
    outputChannel.appendLine("Vim Marks extension activated");
      
    // Initialize mark handler
    getMarkHandler(context);
    
    // Activate mark mode handling
    activateMarkMode(context);
    let disposableCreateMark = vscode.commands.registerCommand(
        "vim-marks.create_mark", async () => {
            const char = await vscode.window.showInputBox({
                placeHolder: "Enter a mark character (a-z, A-Z)",
                validateInput: (value) => {
                    if (!value) return "Please enter a character";
                    if (value.length > 1) return "Please enter only one character";
                    const char = value[0];
                    if (!/^[a-zA-Z]$/.test(char)) return "Please enter a letter (a-z, A-Z)";
                    return null;
                }
            });
            if (char) {
                await getMarkHandler(context).createMark(context, char);
            }
            return;
        }
    );
    context.subscriptions.push(disposableCreateMark);

    let disposableJumpToMark = vscode.commands.registerCommand(
        "vim-marks.jump_to_mark", () => {
            getMarkHandler(context).jumpToCharFromUser();
            return;
        }
    );
    context.subscriptions.push(disposableJumpToMark);
    let disposableShowMarks = vscode.commands.registerCommand(
        "vim-marks.show_marks", () => {
            getMarkHandler(context).showMarks();
            return;
        }
    );
    context.subscriptions.push(disposableShowMarks);

    let disposableDeleteMark = vscode.commands.registerCommand(
        "vim-marks.delete_mark", () => {
            getMarkHandler(context).deleteMark();
            return;
        }
    );
    context.subscriptions.push(disposableDeleteMark);

    let disposableDeleteAllMarks = vscode.commands.registerCommand(
        "vim-marks.delete_all_marks", () => {
            getMarkHandler(context).deleteAllMarks();
            return;
        }
    );
    context.subscriptions.push(disposableDeleteAllMarks);

    // Register individual mark deletion commands
    for (let i = 65; i <= 90; i++) {
        const upper = String.fromCharCode(i);
        const lower = String.fromCharCode(i+32);

        let disposableDeleteUpper = vscode.commands.registerCommand(
            "vim-marks.delete_mark_" + upper, () => {
                getMarkHandler(context).deleteMark(upper);
                return;
            }
        );
        context.subscriptions.push(disposableDeleteUpper);

        let disposableDeleteLower = vscode.commands.registerCommand(
            "vim-marks.delete_mark_" + lower, () => {
                getMarkHandler(context).deleteMark(lower);
                return;
            }
        );
        context.subscriptions.push(disposableDeleteLower);
    }
    return;
}

export function deactivate(): void {
    return;
}
