import * as vscode from 'vscode';
import * as AWS from 'aws-sdk';

import { TreeItemS3Folder } from './tree-items/s3/folder';
import { TreeItemS3Object } from './tree-items/s3/object';

export const collapsibleState = (expanded: boolean | undefined): vscode.TreeItemCollapsibleState => {
    return expanded ?
        vscode.TreeItemCollapsibleState.Expanded :
        vscode.TreeItemCollapsibleState.Collapsed;
};

export const getS3Objects = (profileName: string, regionName: string, bucketName: string, prefix?: string): Thenable<vscode.TreeItem[]> => {
    return new Promise((resolve, reject) => {
        const makeLabel = (key?: string, prefix?: string): string => {
            if (!key) {
                return '(no name)';
            }
            if (!prefix) {
                return key;
            }
            return key.replace(prefix, '');
        };

        const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
        const s3Client = new AWS.S3({ credentials: creds, region: regionName });

        const params: AWS.S3.ListObjectsV2Request = {
            Bucket: bucketName,
            Delimiter: '/',
            Prefix: prefix
        };

        const result: vscode.TreeItem[] = [];
        const callApi = () => {
            s3Client.listObjectsV2(params, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                if (!data) {
                    reject('no data recieved');
                }

                if (data.Contents) {
                    for (let c of data.Contents) {
                        const label = makeLabel(c.Key, prefix);
                        result.push(new TreeItemS3Object(label, c);
                    }
                }

                if (data.CommonPrefixes) {
                    for (let c of data.CommonPrefixes) {
                        if (c.Prefix) {
                            result.push(new TreeItemS3Folder(profileName, regionName, bucketName, c.Prefix));
                        }
                    }
                }
                if (data.IsTruncated) {
                    params.ContinuationToken = data.NextContinuationToken;
                    callApi();
                } else {
                    resolve(result);
                }
            });
        };
        callApi();
    });
}
