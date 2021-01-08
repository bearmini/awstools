import * as vscode from 'vscode';
import * as AWS from 'aws-sdk';

export class TreeItemLambdaFunction extends vscode.TreeItem {
    constructor(
        public readonly functionName: string,
        public readonly functionConfig: AWS.Lambda.FunctionConfiguration
    ) {
        super(functionName, vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = '';
        this.description = '';
    }

    contextValue = 'lambdaFunction';
}



