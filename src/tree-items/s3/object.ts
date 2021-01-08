import * as vscode from 'vscode';

export class TreeItemS3Object extends vscode.TreeItem {
    /* obj is the 'Content' object returned from S3 ListObjectV2 API
     * {
     *   ETag: "\"70ee1738b6b21e2c8a43f3a5ab0eee71\"",
     *   Key: "happyface.jpg",
     *   LastModified: <Date Representation>,
     *   Size: 11,
     *   StorageClass: "STANDARD"
     * },
     */
    constructor(public readonly label: string, public readonly obj: any) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `Size: ${this.obj.Size}`;
        this.description = '';
    }

    getChildren(): Thenable<vscode.TreeItem[]> {
        return Promise.resolve([]);
    }

    contextValue = 's3Object';
}

