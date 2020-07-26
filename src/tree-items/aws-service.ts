import * as vscode from 'vscode';

export class TreeItemAwsService extends vscode.TreeItem {
    constructor(
        public readonly profileName: string,
        public readonly regionName: string,
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

    contextValue = 'awsService';
}
