import * as vscode from 'vscode';

export class TreeItemNoResources extends vscode.TreeItem {
    constructor(
    ) {
        super('No resources added', vscode.TreeItemCollapsibleState.None);
    }

    get tooltip(): string {
        return '';
    }

    get description(): string {
        return '';
    }

    contextValue = 'noResources';
}
