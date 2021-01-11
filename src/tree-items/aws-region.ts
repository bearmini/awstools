import * as path from 'path';
import * as vscode from 'vscode';
import { IHasChildren } from './has-children';

export class TreeItemAwsRegion extends vscode.TreeItem implements IHasChildren {
    public readonly iconPath = this.getIconPaths(this.getIconFilename());

    constructor(
        public readonly workspaceName: string,
        public readonly profileName: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private readonly resources: vscode.TreeItem[]
    ) {
        super(label, collapsibleState);
        this.tooltip = '';
        this.description = `(${this.resources.length})`;
    }

    private getIconFilename(): string {
        switch (this.label) {
            case 'us-east-1':
            case 'us-east-2':
            case 'us-west-1':
            case 'us-west-2':
                return 'US.png';
            case 'af-south-1':
                return 'ZA.png';
            case 'ap-east-1':
                return 'HK.png';
            case 'ap-south-1':
                return 'IN.png';
            case 'ap-northeast-1':
                return 'JP.png';
            case 'ap-northeast-2':
                return 'KR.png';
            case 'ap-southeast-1':
                return 'SG.png';
            case 'ap-southeast-2':
                return 'AU.png';
            case 'eu-central-1':
                return 'DE.png';
            case 'eu-west-1':
                return 'IE.png';
            case 'eu-west-2':
                return 'GB.png';
            case 'eu-west-3':
                return 'FR.png';
            case 'eu-south-1':
                return 'IT.png';
            case 'eu-north-1':
                return 'SE.png';
            case 'me-south-1':
                return 'BH.png';
            case 'sa-east-1':
                return 'BR.png';
            default:
                return '';
        }
    }


    private getIconPaths(filename: string): { light: string, dark: string } {
        return {
            light: this.getIconPath(filename),
            dark: this.getIconPath(filename),
        };
    }

    private getIconPath(filename: string): string {
        return path.join(__filename, '..', '..', '..', 'resources', 'flags48x48', filename);
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return Promise.resolve(this.resources);
    }

    contextValue = 'awsRegion';
}
