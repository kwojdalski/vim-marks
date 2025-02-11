import * as vscode from "vscode";

export interface Mark {
    row: number;
    col: number;
    uri: vscode.Uri;
};

export type MarkMap = Map<string, Mark>;
export type LocalMarks = Map<string, MarkMap>;

