import * as vscode from 'vscode';

import { getLambdaVersionTreeItems } from '../../utils';

export class TreeItemLambdaVersions extends vscode.TreeItem {
    constructor(
        public readonly workspaceName: string,
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly serviceName: string,
        public readonly functionName: string,
    ) {
        super('Versions', vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = '';
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return getLambdaVersionTreeItems(this.profileName, this.regionName, this.functionName);
    }

    contextValue = 'lambdaService';
}




