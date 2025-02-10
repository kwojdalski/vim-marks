import { Mark, LocalMarks, MarkMap } from "./interfaces";
import { MarkUpdater } from "./mark_updater";
import * as vscode from "vscode";
import { outputChannel } from "./extension";

const CHAR_CODE_UPPER_A: number = "A".charCodeAt(0);
const CHAR_CODE_UPPER_Z: number = "Z".charCodeAt(0);
const CHAR_CODE_LOWER_A: number = "a".charCodeAt(0);
const CHAR_CODE_LOWER_Z: number = "z".charCodeAt(0);
const STORAGE_KEY = 'vim-marks-data';

export class MarkHandler implements vscode.Disposable {
    private textDocumentChangeListener: vscode.Disposable | null = null;
    private fileRenameListener: vscode.Disposable | null = null;
    private fileDeletionListener: vscode.Disposable | null = null;
    private globalMarks: MarkMap;
    private localMarks: LocalMarks;
    private context: vscode.ExtensionContext;
    private lowerCaseForGlobal: boolean;
    
    public constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.lowerCaseForGlobal = vscode.workspace.getConfiguration('vim-marks')
            .get('upper_case_for_local_marks') as boolean;
        
        
        // Load saved marks
        const savedData = this.context.globalState.get<{
            globalMarks: [string, Mark][],
            localMarks: [string, [string, Mark][]][],
        }>(STORAGE_KEY);

        this.globalMarks = new Map<string, Mark>();
        this.localMarks = new Map<string, Map<string, Mark>>();

        if (savedData) {
            outputChannel.appendLine(`Restoring saved marks - Global: ${savedData.globalMarks.length}, Local files: ${savedData.localMarks.length}`);
            // Restore global marks
            this.globalMarks = new Map(savedData.globalMarks.map(([key, mark]) => [
                key,
                { ...mark, uri: vscode.Uri.file(mark.uri.fsPath) }
            ]));
            outputChannel.appendLine('Global marks:');
            this.globalMarks.forEach((mark, key) => {
                outputChannel.appendLine(`  ${key}: ${mark.uri.fsPath}:${mark.row + 1}:${mark.col + 1}`);
                this.registerGlobalMark(key, mark);
            });
            
            // Restore local marks
            savedData.localMarks.forEach(([fsPath, marks]) => {
                const markMap = new Map(marks.map(([key, mark]) => [
                    key,
                    { ...mark, uri: vscode.Uri.parse(mark.uri.fsPath) }
                ]));
                this.localMarks.set(fsPath, markMap);
                
                outputChannel.appendLine(`Local marks for ${fsPath}:`);
                markMap.forEach((mark, key) => {
                    outputChannel.appendLine(`  ${key}: ${mark.row + 1}:${mark.col + 1}`);
                });
            });
        } else {
            outputChannel.appendLine('No saved marks found');
        }

        // Set up listeners
        this.setupListeners();
    }

    private setupListeners(): void {
        outputChannel.appendLine('Setting up mark listeners');
        
        this.textDocumentChangeListener = vscode.workspace.onDidChangeTextDocument((change) => {
            // outputChannel.appendLine(`Document changed: ${change.document.uri.fsPath}`);
            MarkUpdater.updateLocalMarksTextDocumentChange(this.localMarks, change);
            MarkUpdater.updateGlobalMarksTextDocumentChange(this.globalMarks, change);
            this.saveMarks();
        });

        this.fileRenameListener = vscode.workspace.onDidRenameFiles((rename) => {
            outputChannel.appendLine(`Files renamed: ${rename.files.map(f => f.oldUri.fsPath + ' -> ' + f.newUri.fsPath).join(', ')}`);
            MarkUpdater.updateLocalMarksRename(this.localMarks, rename);
            MarkUpdater.updateGlobalMarksRename(this.globalMarks, rename);
            this.saveMarks();
        });

        this.fileDeletionListener = vscode.workspace.onDidDeleteFiles((deletion) => {
            // outputChannel.appendLine(`Files deleted: ${deletion.files.map(f => f.fsPath).join(', ')}`);
            MarkUpdater.updateLocalMarksFileDeletion(this.localMarks, deletion);
            MarkUpdater.updateGlobalMarksFileDeletion(this.globalMarks, deletion);
            this.saveMarks();
        });
    }

    private async saveMarks(): Promise<void> {
        const dataToSave = {
            globalMarks: Array.from(this.globalMarks.entries()),
            localMarks: Array.from(this.localMarks.entries()).map(([fsPath, marks]) => [
                fsPath,
                Array.from(marks.entries())
            ]),
        };
        try {
            // const storageLocation = this.context.globalStoragePath;
            // outputChannel.appendLine(`Saving marks`);
            await this.context.globalState.update(STORAGE_KEY, dataToSave);
        } catch (error) {
        }
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
        outputChannel.appendLine(`Jumping to position - line: ${mark.row}, column: ${mark.col} in ${mark.uri.fsPath}`);
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
        context: vscode.ExtensionContext,
        mark_id: string | undefined = undefined
    ): Promise<void> {
        outputChannel.appendLine(`Creating mark${mark_id ? ` '${mark_id}'` : ''}`);
        const mark = this.makeMark();
        if (mark === null) { 
            outputChannel.appendLine('Failed to create mark - no active editor');
            return; 
        }
        if (mark_id === undefined) { mark_id = await this.readCharsFromUser(); }
        if (mark_id === undefined) { return; }
        const isLocal = this.markIdIsLocal(mark_id);
        if (isLocal === null) { return; }
        if (isLocal) { this.registerLocalMark(mark_id, mark); }
        else { this.registerGlobalMark(mark_id, mark); }
        try {
            await this.saveMarks();
            outputChannel.appendLine(`Mark '${mark_id}' created at line ${mark.row}, column ${mark.col} in ${mark.uri.fsPath}`);
        } catch (error) {
            outputChannel.appendLine(`Error saving mark: ${error}`);
        }
        return;
    }

    public async jumpToChar(char: string): Promise<void> {
        outputChannel.appendLine(`Jumping to mark '${char}'`);
        const isLocal = this.markIdIsLocal(char);
        if (isLocal === null) { 
            outputChannel.appendLine(`Invalid mark character: ${char}`);
            return; 
        }
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
        const char = await this.readCharsFromUser();
        if (char === undefined) { return; }
        this.jumpToChar(char);
        return;
    }
    public async showMarks(): Promise<void> {
        let marksList = 'Global marks:\n';
        
        // Show global marks
        this.globalMarks.forEach((mark, key) => {
            marksList += `  ${key}: ${mark.uri.fsPath}:${mark.row + 1}:${mark.col + 1}\n`;
        });
        
        // Show local marks for current file
        const currentPath = vscode.window.activeTextEditor?.document.uri.fsPath;
        if (currentPath && this.localMarks.has(currentPath)) {
            marksList += '\nLocal marks (current file):\n';
            this.localMarks.get(currentPath)!.forEach((mark, key) => {
                marksList += `  ${key}: ${mark.row + 1}:${mark.col + 1}\n`;
            });
        }

        // Show the marks in a dropdown list and handle selection
        const markEntries = marksList.split('\n')
            .filter(line => line.trim() !== '')
            // Only include lines that start with spaces followed by a mark character and colon
            .filter(line => /^\s+[a-zA-Z]:\s/.test(line));

        const selected = await vscode.window.showQuickPick(
            markEntries,
            {
                placeHolder: 'Select a mark to jump to',
                canPickMany: false
            }
        );

        if (selected) {
            // Extract the mark character from the selected line
            const match = selected.match(/^\s*([a-zA-Z]):/);
            if (match) {
                const markChar = match[1];
                await this.jumpToChar(markChar);
            }
        }
    }
};