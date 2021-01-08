import * as vscode from 'vscode';

export class TreeItemNoProfiles extends vscode.TreeItem {
    constructor(
        public readonly parentName: string
    ) {
        super('No profiles added', vscode.TreeItemCollapsibleState.None);
    }

    get tooltip(): string {
        return '';
    }

    get description(): string {
        return '';
    }

    contextValue = 'noProfiles';
}