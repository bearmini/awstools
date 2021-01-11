import * as vscode from 'vscode';

import { getLambdaAliasesTreeItems } from '../../utils';

export class TreeItemLambdaAliases extends vscode.TreeItem {
    constructor(
        public readonly workspaceName: string,
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly serviceName: string,
        public readonly functionName: string,
    ) {
        super('Aliases', vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = '';
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return getLambdaAliasesTreeItems(this.profileName, this.regionName, this.functionName);
    }

    contextValue = 'lambdaService';
}




