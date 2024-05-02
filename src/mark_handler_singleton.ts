import { MarkHandler } from "./mark_handler";
import * as vscode from "vscode";

let markHandler: MarkHandler | null = null;

export function getMarkHandler(context: vscode.ExtensionContext): MarkHandler {
    if (markHandler === null) {
        markHandler = new MarkHandler();
        context.subscriptions.push(markHandler);
    }
    return markHandler;
}
