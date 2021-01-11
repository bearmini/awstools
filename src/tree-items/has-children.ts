import * as vscode from 'vscode';

export interface IHasChildren {
    getChildren(): Thenable<vscode.TreeItem[]>;
}