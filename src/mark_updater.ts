import * as vscode from 'vscode';
import { Mark, LocalMarks, MarkMap } from "./interfaces";
import { outputChannel } from "./extension";


export class MarkUpdater {
    public static updateLocalMarksTextDocumentChange(
        localMarks: LocalMarks,
        changeEvent: vscode.TextDocumentChangeEvent
    ): void {
        const path = changeEvent.document.uri.fsPath;
        if (localMarks.has(path)) {
            MarkUpdater.updateMarksTextDocumentChange(
                localMarks.get(path)!, changeEvent
            );
        }
        return;
    }

    public static updateGlobalMarksTextDocumentChange(
        globalMarks: MarkMap,
        changeEvent: vscode.TextDocumentChangeEvent
    ): void {
        MarkUpdater.updateMarksTextDocumentChange(globalMarks, changeEvent);
        return;
    }

    private static updateMarksTextDocumentChange(
        map: MarkMap, changeEvent: vscode.TextDocumentChangeEvent
    ): void {
        map.forEach((mark, _) => {
            if (mark.uri.fsPath !== changeEvent.document.uri.fsPath) {
                return;
            }
            for (const change of changeEvent.contentChanges) {
                MarkUpdater.updateMarkTextDocumentChange(mark, change);
            }
        });
        return;
    }

    private static updateMarkTextDocumentChange(
        mark: Mark,
        changeEvent: vscode.TextDocumentContentChangeEvent,
    ): void {
        outputChannel.appendLine(`Updating mark at ${mark.uri.fsPath}:${mark.row}:${mark.col}`);
        const rel = MarkUpdater.getMarkRelativity(mark, changeEvent.range);
        // if (mark.uri.fsPath !== changeEvent.range.start.line) {
        //     return;
        // }
        if (rel === 0) {
            MarkUpdater.updateMarkWithChangeAtLine(mark, changeEvent);
        } else if (rel === 1) {
            MarkUpdater.updateMarkWithChangeBeforeLine(mark, changeEvent);
        }
        outputChannel.appendLine(`Mark updated to ${mark.row}:${mark.col}`);
        return;
    }

    public static updateGlobalMarksFileDeletion(
        globalMarks: MarkMap,
        deletionEvent: vscode.FileDeleteEvent
    ): void {
        let toDelete: string[] = [];
        for (const path of deletionEvent.files) {
            globalMarks.forEach((mark, key) => {
                if (path.fsPath === mark.uri.fsPath) {
                    toDelete.push(key);
                }
            });
        }
        for (const key of toDelete) {
            globalMarks.delete(key);
        }
        return;
    }

    public static updateLocalMarksFileDeletion(
        localMarks: LocalMarks,
        deletionEvent: vscode.FileDeleteEvent
    ): void {
        for (const file of deletionEvent.files) {
            if (localMarks.has(file.fsPath)) {
                localMarks.delete(file.fsPath);
            }
        }
        return;
    }

    public static updateGlobalMarksRename(
        markMap: MarkMap,
        renameEvent: vscode.FileRenameEvent
    ): void {
        for (const file of renameEvent.files) {
            markMap.forEach((mark, _) => {
                if (file.oldUri.fsPath == mark.uri.fsPath) {
                    mark.uri = file.newUri;
                }
            });
        }
    }

    public static updateLocalMarksRename(
        localMarks: LocalMarks,
        renameEvent: vscode.FileRenameEvent,
    ): void {
        for (const file of renameEvent.files) {
            const oldPath = file.oldUri.fsPath;
            const newPath = file.newUri.fsPath;
            if (localMarks.has(oldPath)) {
                localMarks.set(newPath, localMarks.get(oldPath)!);
                localMarks.delete(oldPath);
                localMarks.get(newPath)!.forEach((mark, _) => {
                    mark.uri = file.newUri;
                });
            }
        }
    }

    private static getMarkRelativity(mark: Mark, range: vscode.Range): number {
        if (mark.row > range.end.line) {return 1;}
        if (mark.row < range.start.line) {return -1;}
        if (mark.row === range.end.line) {
            if (mark.col < range.start.character) {return -1;}
            if (mark.col >= range.end.character) {return 1;}
        }
        return 0;
    }

    private static updateMarkWithChangeAtLine(
            mark: Mark,
            changeEvent: vscode.TextDocumentContentChangeEvent,
    ): void {
        const range = changeEvent.range;
        const lines = changeEvent.text.split("\n");
        const multiline = lines.length > 1;
        if (multiline) {
            mark.row = range.start.line + lines.length - 1;
            mark.col = range.end.character + lines[lines.length - 1].length;
        } else {
            mark.row = range.start.line;
            mark.col = range.start.character + lines[lines.length - 1].length;
        }
        return;
    }

    private static updateMarkWithChangeBeforeLine(
            mark: Mark,
            event: vscode.TextDocumentContentChangeEvent,
    ): void {
        const range = event.range;
        const lines = event.text.split("\n");
        const multiline = lines.length > 1;
        if (range.end.line === mark.row) {
            const lastLine = lines[lines.length - 1];
            if (multiline) {
                mark.col += lastLine.length - range.end.character;
            } else {
                mark.col += lastLine.length - (range.end.character - range.start.character);
            }
        }
        mark.row += lines.length - (range.end.line - range.start.line) - 1;
        return;
    }
}
