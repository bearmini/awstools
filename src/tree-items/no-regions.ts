import * as vscode from 'vscode';

export class TreeItemNoRegions extends vscode.TreeItem {
    constructor(
        public readonly parentName: string
    ) {
        super('No regions added', vscode.TreeItemCollapsibleState.None);
    }

    get tooltip(): string {
        return '';
    }

    get description(): string {
        return '';
    }

    contextValue = 'noRegions';
}