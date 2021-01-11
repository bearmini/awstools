import * as vscode from 'vscode';
import * as AWS from 'aws-sdk';

export class TreeItemLambdaAlias extends vscode.TreeItem {
    constructor(
        public readonly name: string,
        public readonly aliasConfig: AWS.Lambda.AliasConfiguration
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = '';
        this.description = '';
    }

    contextValue = 'lambdaAlias';
}



