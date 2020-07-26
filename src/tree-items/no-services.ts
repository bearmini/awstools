import * as vscode from 'vscode';

export class TreeItemNoServices extends vscode.TreeItem {
    constructor(
        public readonly parentName: string
    ) {
        super('No services added', vscode.TreeItemCollapsibleState.None);
    }

    get tooltip(): string {
        return '';
    }

    get description(): string {
        return '';
    }

    contextValue = 'noServices';
}
