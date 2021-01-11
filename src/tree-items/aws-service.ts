import * as path from 'path';
import * as vscode from 'vscode';
import { IHasChildren } from './has-children';

export class TreeItemAwsService extends vscode.TreeItem implements IHasChildren {
    public readonly iconPath = this.getIconPaths(this.getIconFilename());

    constructor(
        public readonly workspaceName: string,
        public readonly profileName: string,
        public readonly regionName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly resources: vscode.TreeItem[],
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = `(${this.resources.length})`;
    }

    private getIconFilename(): string {
        switch (this.label) {
            case 'EC2':
                return 'Amazon-EC2@4x.png';
            case 'Lambda':
                return 'AWS-Lambda@4x.png';
            case 'S3':
                return 'Amazon-Simple-Storage-Service-S3@4x.png';
            case 'VPC':
                return 'Amazon-VPC@4x.png';
            default:
                return '';
        }
    }


    private getIconPaths(filename: string): { light: string, dark: string } {
        return {
            light: this.getIconPath('light', filename),
            dark: this.getIconPath('dark', filename),
        };
    }

    private getIconPath(lightOrDark: string, filename: string): string {
        return path.join(__filename, '..', '..', '..', 'resources', lightOrDark, filename);
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return Promise.resolve(this.resources);
    }

    contextValue = 'awsService';
}
