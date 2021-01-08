import * as vscode from 'vscode';
import * as AWS from 'aws-sdk';

export class TreeItemLambda extends vscode.TreeItem {
    constructor() {
        super('Lambda', vscode.TreeItemCollapsibleState.Expanded);
        this.tooltip = '';
        this.description = '';
    }

    contextValue = 'lambdaService';
}




