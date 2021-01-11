import * as vscode from 'vscode';
import { IHasChildren } from './has-children';

export class TreeItemWorkspace extends vscode.TreeItem implements IHasChildren {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly profiles: vscode.TreeItem[]
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = `(${this.profiles.length})`;
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return Promise.resolve(this.profiles);
    }

    contextValue = 'workspace';
}
