import * as vscode from 'vscode';

export class TreeItemWorkspace extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly profiles: vscode.TreeItem[]
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = `(${this.profiles.length})`;
    }

    getChildren(): vscode.TreeItem[] {
        return this.profiles;
    }

    contextValue = 'workspace';
}
