import * as vscode from 'vscode';

export class TreeItemAwsRegion extends vscode.TreeItem {
    constructor(
        public readonly workspaceName: string,
        public readonly profileName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly resources: vscode.TreeItem[]
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = `(${this.resources.length})`;
    }

    getChildren(): vscode.TreeItem[] {
        return this.resources;
    }

    contextValue = 'awsRegion';
}
