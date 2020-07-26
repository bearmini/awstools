import * as vscode from 'vscode';

export class TreeItemAwsProfile extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly regions: vscode.TreeItem[]
    ) {
        super(label, collapsibleState);
    }

    get tooltip(): string {
        return '';
    }

    get description(): string {
        return `(${this.regions.length})`;
    }

    getChildren(): vscode.TreeItem[] {
        return this.regions;
    }

    contextValue = 'awsProfile';
}
