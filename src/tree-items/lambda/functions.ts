import * as vscode from 'vscode';
import { getLambdaFunctionTreeItems } from '../../utils';

export class TreeItemLambdaFunctions extends vscode.TreeItem {
    constructor(public readonly profileName: string, public readonly regionName: string) {
        super('Lambda', vscode.TreeItemCollapsibleState.Expanded);
        this.tooltip = '';
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return getLambdaFunctionTreeItems(this.profileName, this.regionName);
    }

    contextValue = 'lambdaService';
}




