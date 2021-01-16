import * as vscode from 'vscode';

import { IHasChildren } from './has-children';
import { TreeItemLambdaAliases } from './lambda/aliases';
import { TreeItemLambdaVersions } from './lambda/versions';
import { getS3Objects } from '../utils';

export class TreeItemAwsLambdaResource extends vscode.TreeItem implements IHasChildren {
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
        children.push(new TreeItemLambdaVersions(this.workspaceName, this.profileName, this.regionName, this.serviceName, this.label));
        children.push(new TreeItemLambdaAliases(this.workspaceName, this.profileName, this.regionName, this.serviceName, this.label));

        return Promise.resolve(children);
    }

    contextValue = 'awsResource';
}

export class TreeItemAwsS3Resource extends vscode.TreeItem implements IHasChildren {
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
        return getS3Objects(this.profileName, this.regionName, this.label);
    }

    contextValue = 'awsResource';
}

export class TreeItemAwsUnknownResource extends vscode.TreeItem implements IHasChildren {
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

    contextValue = 'awsResource';
}
