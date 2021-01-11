import * as vscode from 'vscode';
import * as AWS from 'aws-sdk';

export class TreeItemLambdaVersion extends vscode.TreeItem {
    constructor(
        public readonly version: string,
        public readonly functionConfig: AWS.Lambda.FunctionConfiguration
    ) {
        super(version, vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = '';
        this.description = '';
    }

    contextValue = 'lambdaVersion';
}



