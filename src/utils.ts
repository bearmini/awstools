import * as fs from 'fs';

import * as vscode from 'vscode';
import * as AWS from 'aws-sdk';

import { TreeItemLambdaAlias } from './tree-items/lambda/alias';
import { TreeItemLambdaFunction } from './tree-items/lambda/function';
import { TreeItemLambdaVersion } from './tree-items/lambda/version';
import { TreeItemS3Folder } from './tree-items/s3/folder';
import { TreeItemS3Object } from './tree-items/s3/object';

export const collapsibleState = (expanded: boolean | undefined): vscode.TreeItemCollapsibleState => {
    return expanded ?
        vscode.TreeItemCollapsibleState.Expanded :
        vscode.TreeItemCollapsibleState.Collapsed;
};

export const getEC2Instances = (profileName: string, regionName: string): Thenable<AWS.EC2.Instance[]> => {
    return new Promise((resolve, reject) => {
        const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
        const ec2Client = new AWS.EC2({ credentials: creds, region: regionName });

        const params: AWS.EC2.DescribeInstancesRequest = {

        };
        const result: AWS.EC2.Instance[] = [];
        const callApi = () => {
            ec2Client.describeInstances(params, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                if (!data) {
                    reject('no data received');
                }

                console.log('describeInstances() result ==', data);

                if (data.Reservations) {
                    for (let r of data.Reservations) {
                        if (r.Instances) {
                            for (let i of r.Instances) {
                                result.push(i);
                            }
                        }
                    }
                }

                if (data.NextToken) {
                    params.NextToken = data.NextToken;
                    callApi();
                } else {
                    resolve(result);
                }
            });
        };
        callApi();
    });
};

export const getEC2SecurityGroups = (profileName: string, regionName: string): Thenable<AWS.EC2.SecurityGroup[]> => {
    return new Promise((resolve, reject) => {
        const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
        const ec2Client = new AWS.EC2({ credentials: creds, region: regionName });

        const params: AWS.EC2.DescribeSecurityGroupsRequest = {
        };

        const result: AWS.EC2.SecurityGroup[] = [];
        const callApi = () => {
            ec2Client.describeSecurityGroups(params, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                if (!data) {
                    reject('no data received');
                }

                console.log('describeSecurityGroups() result ==', data);

                if (data.SecurityGroups) {
                    for (let sg of data.SecurityGroups) {
                        result.push(sg);
                    }
                }

                if (data.NextToken) {
                    params.NextToken = data.NextToken;
                    callApi();
                } else {
                    resolve(result);
                }
            });
        };
        callApi();
    });
};

export const getLambdaFunctions = (profileName: string, regionName: string): Thenable<AWS.Lambda.FunctionConfiguration[]> => {
    return new Promise((resolve, reject) => {
        const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
        const lambdaClient = new AWS.Lambda({ credentials: creds, region: regionName });

        const params: AWS.Lambda.ListFunctionsRequest = {
        };

        const result: AWS.Lambda.FunctionConfiguration[] = [];
        const callApi = () => {
            lambdaClient.listFunctions(params, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                if (!data) {
                    reject('no data recieved');
                    return;
                }

                console.log('listFunctions() result ==', data);

                if (data.Functions) {
                    for (let f of data.Functions) {
                        result.push(f);
                    }
                }

                if (data.NextMarker) {
                    params.Marker = data.NextMarker;
                    callApi();
                } else {
                    resolve(result);
                    return;
                }
            });
        };
        callApi();
    });
};

export const getLambdaFunctionTreeItems = (profileName: string, regionName: string): Thenable<vscode.TreeItem[]> => {
    return new Promise(async (resolve, reject) => {
        const result: vscode.TreeItem[] = [];
        const functions = await getLambdaFunctions(profileName, regionName);
        for (let f of functions) {
            if (f.FunctionName) {
                result.push(new TreeItemLambdaFunction(f.FunctionName, f));
            }
        }
        return resolve(result);
    });
};

export const getLambdaVersions = (profileName: string, regionName: string, functionName: string): Thenable<AWS.Lambda.FunctionConfiguration[]> => {
    return new Promise((resolve, reject) => {
        const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
        const lambdaClient = new AWS.Lambda({ credentials: creds, region: regionName });

        const params: AWS.Lambda.ListVersionsByFunctionRequest = {
            FunctionName: functionName,
        };

        const result: AWS.Lambda.FunctionConfiguration[] = [];
        const callApi = () => {
            lambdaClient.listVersionsByFunction(params, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                if (!data) {
                    reject('no data recieved');
                    return;
                }

                console.log('getLambdaVersions(): listVersionsByFunction() result ==', data);

                if (data.Versions) {
                    for (let v of data.Versions) {
                        result.push(v);
                    }
                }

                if (data.NextMarker) {
                    params.Marker = data.NextMarker;
                    callApi();
                } else {
                    resolve(result);
                    return;
                }
            });
        };
        callApi();
    });
};

export const getLambdaVersionTreeItems = (profileName: string, regionName: string, functionName: string): Thenable<vscode.TreeItem[]> => {
    return new Promise(async (resolve, reject) => {
        const result: vscode.TreeItem[] = [];
        const functions = await getLambdaVersions(profileName, regionName, functionName);
        for (let f of functions) {
            if (f.FunctionName) {
                result.push(new TreeItemLambdaVersion(f.Version || '', f));
            }
        }
        return resolve(result);
    });
};

export const getLambdaAliases = (profileName: string, regionName: string, functionName: string): Thenable<AWS.Lambda.AliasConfiguration[]> => {
    return new Promise((resolve, reject) => {
        const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
        const lambdaClient = new AWS.Lambda({ credentials: creds, region: regionName });

        const params: AWS.Lambda.ListAliasesRequest = {
            FunctionName: functionName,
        };

        const result: AWS.Lambda.AliasConfiguration[] = [];
        const callApi = () => {
            lambdaClient.listAliases(params, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                if (!data) {
                    reject('no data recieved');
                    return;
                }

                console.log('getLambdaAliases(): listAliases() result ==', data);

                if (data.Aliases) {
                    for (let a of data.Aliases) {
                        result.push(a);
                    }
                }

                if (data.NextMarker) {
                    params.Marker = data.NextMarker;
                    callApi();
                } else {
                    resolve(result);
                    return;
                }
            });
        };
        callApi();
    });
};

export const getLambdaAliasesTreeItems = (profileName: string, regionName: string, functionName: string): Thenable<vscode.TreeItem[]> => {
    return new Promise(async (resolve, reject) => {
        const result: vscode.TreeItem[] = [];
        const aliases = await getLambdaAliases(profileName, regionName, functionName);
        for (let a of aliases) {
            if (a.Name) {
                result.push(new TreeItemLambdaAlias(a.Name, a));
            }
        }
        return resolve(result);
    });
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
                        result.push(new TreeItemS3Object(profileName, regionName, bucketName, c.Key, label, c));
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
};

export const downloadS3Object = (profileName: string, regionName: string, bucketName: string, key: string, destination: string): Thenable<string> => {
    return new Promise((resolve, reject) => {
        const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
        const s3Client = new AWS.S3({ credentials: creds, region: regionName });

        const params: AWS.S3.GetObjectRequest = {
            Bucket: bucketName,
            Key: key,
        };

        const callApi = () => {
            s3Client.getObject(params, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                if (!data) {
                    reject('no data recieved');
                }

                fs.writeFileSync(destination, data.Body);
                resolve(key);
            });
        };
        callApi();
    });
};