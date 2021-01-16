import * as path from 'path';
import * as vscode from 'vscode';
import { getS3Objects } from '../../utils';

export class TreeItemS3Folder extends vscode.TreeItem {
    constructor(
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly bucketName: string,
        public readonly prefix: string
    ) {
        super(path.basename(prefix), vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = '';
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return getS3Objects(this.profileName, this.regionName, this.bucketName, this.prefix);
    }

    contextValue = 's3Folder';
}


