import * as vscode from 'vscode';

import { getLambdaFunctionTreeItems, getS3Objects } from '../utils';

export class TreeItemAwsLambdaResource extends vscode.TreeItem {
    constructor(
        public readonly workspaceName: string,
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly serviceName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        let children: vscode.TreeItem[] = [];
        children.push(new vscode.TreeItem('Versions'));
        children.push(new vscode.TreeItem('Aliases'));

        return Promise.resolve(children);
    }

}

export class TreeItemAwsUnknownResource extends vscode.TreeItem {
    constructor(
        public readonly workspaceName: string,
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly serviceName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return Promise.resolve([]);
    }

}
