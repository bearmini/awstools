import * as vscode from 'vscode';

export class TreeItemAwsRegion extends vscode.TreeItem {
    constructor(
        public readonly profileName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly resources: vscode.TreeItem[]
    ) {
        super(label, collapsibleState);
    }

    get tooltip(): string {
        return '';
    }

    get description(): string {
        return `(${this.resources.length})`;
    }

    getChildren(): vscode.TreeItem[] {
        return this.resources;
    }

    contextValue = 'awsRegion';
}
