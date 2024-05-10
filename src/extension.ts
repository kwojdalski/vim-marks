import * as vscode from 'vscode';
import { getMarkHandler } from './mark_handler_singleton';

export function activate(context: vscode.ExtensionContext): void {

	let disposableCreateMark = vscode.commands.registerCommand(
        "vim-marks.create_mark", () => {
            getMarkHandler(context).createMark(context);
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

    for (let i = 65; i <= 90; i++) {

        const upper = String.fromCharCode(i);
        const lower = String.fromCharCode(i+32);
        console.log(upper, lower)

        let disposableCreateUpper = vscode.commands.registerCommand(
            "vim-marks.create_mark_" + upper, () => {
                getMarkHandler(context).createMark(context, upper);
                return;
            }
        );
        context.subscriptions.push(disposableCreateUpper);

        let disposableCreateLower = vscode.commands.registerCommand(
            "vim-marks.create_mark_" + lower, () => {
                getMarkHandler(context).createMark(context, lower);
                return;
            }
        );
        context.subscriptions.push(disposableCreateLower);

        let disposableJumpToUpper = vscode.commands.registerCommand(
            "vim-marks.jump_to_mark_" + upper, () => {
                getMarkHandler(context).jumpToChar(upper);
                return;
            }
        );
        context.subscriptions.push(disposableJumpToUpper);

        let disposableJumpToLower = vscode.commands.registerCommand(
            "vim-marks.jump_to_mark_" + lower, () => {
                getMarkHandler(context).jumpToChar(lower);
                return;
            }
        );
        context.subscriptions.push(disposableJumpToLower);
    }
    return;
}

export function deactivate(): void {
    return;
}
