import * as vscode from 'vscode';
import { IHasChildren } from './has-children';

export class TreeItemAwsProfile extends vscode.TreeItem implements IHasChildren {
    constructor(
        public readonly workspaceName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly regions: vscode.TreeItem[]
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = `(${this.regions.length})`;
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return Promise.resolve(this.regions);
    }

    contextValue = 'awsProfile';
}
