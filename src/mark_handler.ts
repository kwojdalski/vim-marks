import { Mark, LocalMarks, MarkMap } from "./interfaces";
import { MarkUpdater } from "./mark_updater";
import * as vscode from "vscode";

const CHAR_CODE_UPPER_A: number = "A".charCodeAt(0);
const CHAR_CODE_UPPER_Z: number = "Z".charCodeAt(0);
const CHAR_CODE_LOWER_A: number = "a".charCodeAt(0);
const CHAR_CODE_LOWER_Z: number = "z".charCodeAt(0);

export class MarkHandler implements vscode.Disposable {
    private textDocumentChangeListener: vscode.Disposable | null = null;
    private fileRenameListener: vscode.Disposable | null = null;
    private fileDeletionListener: vscode.Disposable | null = null;
    private globalMarks: MarkMap;
    private localMarks: LocalMarks;
    private lowerCaseForGlobal: boolean =
        vscode.workspace.getConfiguration('custom-marks')
        .get('upper_case_for_local_marks') as boolean;

    public constructor() {
        this.globalMarks = new Map<string, Mark>();
        this.localMarks = new Map<string, Map<string, Mark>>();
        this.textDocumentChangeListener =
            vscode.workspace.onDidChangeTextDocument((change) => {
                MarkUpdater.updateLocalMarksTextDocumentChange(this.localMarks, change);
                MarkUpdater.updateGlobalMarksTextDocumentChange(this.globalMarks, change);
                return;
            }
        );
        this.fileRenameListener =
            vscode.workspace.onDidRenameFiles((rename) => {
                MarkUpdater.updateLocalMarksRename(this.localMarks, rename);
                MarkUpdater.updateGlobalMarksRename(this.globalMarks, rename);
                return;
            }
        );
        this.fileDeletionListener =
            vscode.workspace.onDidDeleteFiles((deletion) => {
                MarkUpdater.updateLocalMarksFileDeletion(this.localMarks, deletion);
                MarkUpdater.updateGlobalMarksFileDeletion(this.globalMarks, deletion);
                return;
            }
        );
        return;
    }

    public dispose(): void {
        if (this.textDocumentChangeListener != null) {
            this.textDocumentChangeListener.dispose();
            this.textDocumentChangeListener = null;
        }
        if (this.fileDeletionListener != null) {
            this.fileDeletionListener.dispose();
            this.fileDeletionListener = null;
        }
        if (this.fileRenameListener != null) {
            this.fileRenameListener.dispose();
            this.fileRenameListener = null;
        }
        return;
    }

    private makeMark(): Mark | null {
        const editor = vscode.window.activeTextEditor;
        if (editor != undefined && editor.document.uri.path.length > 0) {
            return {
                row: editor.selection.active.line,
                col: editor.selection.active.character,
                uri: editor.document.uri,
            };
        }
        return null;
    }

    private async jumpToMark(mark: Mark): Promise<void> {
        let editor = await vscode.window.showTextDocument(mark.uri);
        if (editor.document.uri.path === mark.uri.path) {
            const jumpPosition = new vscode.Position(mark.row, mark.col);
            const selection = new vscode.Selection(jumpPosition, jumpPosition);
            editor.selection = selection;
            editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
        }
        return;
    }

    private registerLocalMark(char: string, mark: Mark): void {
        if (!this.localMarks.has(mark.uri.fsPath)) {
            this.localMarks.set(mark.uri.fsPath, new Map<string, Mark>);
        }
        this.localMarks.get(mark.uri.fsPath)!.set(char.toLocaleLowerCase(), mark);
        return;
    }

    private registerGlobalMark(char: string, mark: Mark): void {
        this.globalMarks.set(char.toLocaleLowerCase(), mark);
        return;
    }

    private isLowerCaseLetter(ch: string): boolean {
        const code = ch.charCodeAt(0);
        return code >= CHAR_CODE_LOWER_A && code <= CHAR_CODE_LOWER_Z;
    }

    private isUpperCaseLetter(ch: string): boolean {
        const code = ch.charCodeAt(0);
        return code >= CHAR_CODE_UPPER_A && code <= CHAR_CODE_UPPER_Z;
    }

    private async readCharsFromUser(): Promise<string | undefined> {
        const char = await vscode.window.showInputBox({
            placeHolder: "Single character, uppercase or lowercase."
        });
        if (char === undefined || char.length === 0) { return undefined; }
        return char[0];
    }

    private markIdIsLocal(char: string): boolean | null {
        const lowerCase = this.isLowerCaseLetter(char);
        const upperCase = this.isUpperCaseLetter(char);
        const isChar: boolean = lowerCase || upperCase;
        if (!isChar) { return null; }
        return lowerCase ? !this.lowerCaseForGlobal : this.lowerCaseForGlobal;
    }

    public async createMark(
        context: vscode.ExtensionContext, mark_id: string | undefined = undefined
    ): Promise<void> {
        const mark = this.makeMark();
        if (mark === null) { return; }
        if (mark_id === undefined) { mark_id = await this.readCharsFromUser(); }
        if (mark_id === undefined ) { return; }
        const isLocal = this.markIdIsLocal(mark_id);
        if (isLocal === null) { return; }
        if (isLocal) { this.registerLocalMark(mark_id, mark); }
        else { this.registerGlobalMark(mark_id, mark); }
        return;
    }

    public async jumpToChar(char: string): Promise<void> {
        const isLocal = this.markIdIsLocal(char);
        if (isLocal === null) { return; }
        if (isLocal) {
            const fsPath = vscode.window.activeTextEditor?.document.uri.fsPath;
            if (fsPath === undefined) { return; }
            const mark = this.localMarks.get(fsPath)?.get(char.toLocaleLowerCase());
            if (mark === undefined) { return; }
            this.jumpToMark(mark);
        }
        else {
            const mark = this.globalMarks.get(char.toLocaleLowerCase());
            if (mark === undefined) { return; }
            this.jumpToMark(mark);
        }
        return;
    }

    public async jumpToCharFromUser(): Promise<void> {
        const char = await this.readCharsFromUser()
        if (char === undefined) { return; }
        this.jumpToChar(char);
        return;
    }
};
