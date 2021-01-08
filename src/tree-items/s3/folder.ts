import * as vscode from 'vscode';
import { getS3Objects } from '../../utils';

export class TreeItemS3Folder extends vscode.TreeItem {
    constructor(
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly bucketName: string,
        public readonly label: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = '';
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return getS3Objects(this.profileName, this.regionName, this.bucketName, this.label);
    }

    contextValue = 's3Folder';
}


