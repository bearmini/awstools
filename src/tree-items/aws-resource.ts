import * as vscode from 'vscode';

import { getS3Objects } from '../utils';

export class TreeItemAwsResource extends vscode.TreeItem {
    constructor(
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly serviceName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        switch (this.serviceName) {
            case "S3":
                return getS3Objects(this.profileName, this.regionName, this.label);
            default:
                return Promise.reject(`service name ${this.serviceName} is not supported yet`);
        }
    }

    get tooltip(): string {
        return '';
    }

    get description(): string {
        return '';
    }

}
