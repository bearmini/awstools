import * as vscode from 'vscode';
import * as fs from 'fs';
import * as ini from 'ini';
import * as os from 'os';
import * as path from 'path';
import * as AWS from 'aws-sdk';

import { AwsProfile } from './models/aws-profile';
import { AwsRegion } from './models/aws-region';
import { AwsService } from './models/aws-service';
import { TreeItemAwsProfile } from './tree-items/aws-profile';
import { TreeItemAwsRegion } from './tree-items/aws-region';
import { TreeItemAwsResource } from './tree-items/aws-resource';
import { TreeItemAwsService } from './tree-items/aws-service';
import { TreeItemNoRegions } from './tree-items/no-regions';
import { TreeItemNoResources } from './tree-items/no-resources';
import { TreeItemNoServices } from './tree-items/no-services';
import { TreeItemS3Folder } from './tree-items/s3/folder';

export class AwsProfilesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private awsProfiles: AwsProfile[];

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string | undefined) {
        this.awsProfiles = this.load();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        console.log("getChildren(): element == ", element);

        if (!element) { // returns items at root level i.e. profiles
            const treeItems: vscode.TreeItem[] = [];
            for (let p of this.awsProfiles) {
                treeItems.push(p.toTreeItem());
            }
            return Promise.resolve(treeItems);
        }

        if (element instanceof TreeItemAwsProfile) { // returns regions for the profile
            const children = element.getChildren();
            if (children.length === 0) {
                return Promise.resolve([new TreeItemNoRegions(element.label)]);
            }
            return Promise.resolve(children);
        }

        if (element instanceof TreeItemAwsRegion) { // returns services for the region
            const children = element.getChildren();
            if (children.length === 0) {
                return Promise.resolve([new TreeItemNoServices(element.label)]);
            }
            return Promise.resolve(children);
        }

        if (element instanceof TreeItemAwsService) { // returns resources for the service
            const children = element.getChildren();
            if (children.length === 0) {
                return Promise.resolve([new TreeItemNoResources()]);
            }
            return Promise.resolve(children);
        }

        if (element instanceof TreeItemAwsResource) { // returns items for the resource
            return element.getChildren().then((children) => {
                if (children.length === 0) {
                    return Promise.resolve([new TreeItemNoResources()]);
                }
                return Promise.resolve(children);
            });
        }

        if (element instanceof TreeItemS3Folder) {
            return element.getChildren();
        }

        return Promise.resolve([]);
    }

    getProfileCandidates(): string[] {
        if (!this.workspaceRoot) {
            return [];
        }

        let candidates: string[] = this.loadAwsProfilesFromCredentialsFile();

        for (let profile of this.awsProfiles) {
            candidates = this.removeIfExists(candidates, profile.name);
        }

        return candidates;
    }

    async getRegionCandidates(profileName: string): Promise<string[]> {
        let candidates = this.getRegions(profileName);

        return candidates;
    }

    getRegions(profileName: string): Thenable<string[]> {
        return new Promise((resolve, reject) => {
            const creds = new AWS.SharedIniFileCredentials({ profile: profileName });
            const ec2Client = new AWS.EC2({ credentials: creds, region: 'us-east-1' });
            ec2Client.describeRegions((err: AWS.AWSError, data: AWS.EC2.DescribeRegionsResult) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                if (!data || !data.Regions) {
                    console.log('getRegions(): unexpected error: no response');
                    reject(null);
                    return;
                }

                const result: string[] = [];
                for (let r of data.Regions) {
                    if (r.RegionName) {
                        result.push(r.RegionName);
                    }
                }
                resolve(result);
            });
        });
    }

    getServiceCandidates(profileName: string, regionName: string): string[] {
        let candidates = [
            "AWS Lambda",
            "API Gateway",
            "CloudWatch Logs",
            "DynamoDB",
            "S3"
        ];

        const profile = this.findProfileByName(profileName);
        if (!profile) {
            return candidates;
        }

        const region = profile.findRegionByName(regionName);
        if (!region) {
            return candidates;
        }

        for (let s of region.services) {
            candidates = this.removeIfExists(candidates, s.name);
        }

        return candidates;
    }

    async getResourceCandidates(profileName: string, regionName: string, serviceName: string): Promise<string[]> {
        switch (serviceName) {
            case 'S3':
                return await this.getS3ResourceCandidates(profileName, regionName);
            default:
                console.log(`getResourceCandidates(): service ${serviceName} is not supported yet`);
                return [];
        }
    }

    getS3ResourceCandidates(profileName: string, regionName: string): Thenable<string[]> {
        return new Promise((resolve, reject) => {
            var creds = new AWS.SharedIniFileCredentials({ profile: profileName });
            const s3Client = new AWS.S3({ credentials: creds, region: regionName });
            s3Client.listBuckets((err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }

                const buckets: string[] = [];
                if (data && data.Buckets) {
                    for (let b of data.Buckets) {
                        if (b.Name) {
                            buckets.push(b.Name);
                        }
                    }
                }
                resolve(buckets);
            });
        });
    }

    private findProfileByName(name: string): AwsProfile | undefined {
        for (let p of this.awsProfiles) {
            if (p.name === name) {
                return p;
            }
        }
    }

    private findRegionByName(profileName: string, regionName: string): AwsRegion | undefined {
        const profile = this.findProfileByName(profileName);
        if (!profile) {
            return;
        }

        for (let r of profile.regions) {
            if (r.name === regionName) {
                return r;
            }
        }
    }

    private findServiceByName(profileName: string, regionName: string, serviceName: string): AwsService | undefined {
        const region = this.findRegionByName(profileName, regionName);
        if (!region) {
            return;
        }

        for (let s of region.services) {
            if (s.name === serviceName) {
                return s;
            }
        }
    }

    addProfile(profileName: string) {
        this.awsProfiles.push(new AwsProfile({ name: profileName, expanded: false, services: [] }));
        this.save();
        this.refresh();
    }

    removeProfile(profileName: string) {
        const newProfiles: AwsProfile[] = [];
        for (let p of this.awsProfiles) {
            if (p.name !== profileName) {
                newProfiles.push(p);
            }
        }
        this.awsProfiles = newProfiles;
        this.save();
        this.refresh();
    }

    addRegion(profileName: string, regionName: string) {
        const profile = this.findProfileByName(profileName);
        if (!profile) {
            console.log(`no profile found: ${profileName}`);
            return;
        }

        profile.addRegion(regionName);
        this.save();
        this.refresh();
    }

    removeRegion(profileName: string, regionName: string) {
        const profile = this.findProfileByName(profileName);
        if (!profile) {
            console.log(`no profile found: ${profileName}`);
            return;
        }

        profile.removeRegion(regionName);
        this.save();
        this.refresh();
    }

    addService(profileName: string, regionName: string, serviceName: string) {
        const region = this.findRegionByName(profileName, regionName);
        if (!region) {
            console.log(`no region found: ${regionName}`);
            return;
        }

        region.addService(serviceName);
        this.save();
        this.refresh();
    }

    removeService(profileName: string, regionName: string, serviceName: string) {
        const region = this.findRegionByName(profileName, regionName);
        if (!region) {
            console.log(`no region found: ${regionName}`);
            return;
        }

        region.removeService(serviceName);
        this.save();
        this.refresh();
    }

    addResource(profileName: string, regionName: string, serviceName: string, resourceName: string) {
        const service = this.findServiceByName(profileName, regionName, serviceName);
        if (!service) {
            console.log(`no service found: ${serviceName}`);
            return;
        }

        service.addResource(resourceName);
        this.save();
        this.refresh();
    }

    removeResource(profileName: string, regionName: string, serviceName: string, resourceName: string) {
        const service = this.findServiceByName(profileName, regionName, resourceName);
        if (!service) {
            console.log(`no service found: ${serviceName}`);
            return;
        }

        service.removeResource(serviceName);
        this.save();
        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    handleCommandAddProfile(context: any) {
        try {
            console.log('handling command [awstools.addProfile]:', context);
            const profiles = this.getProfileCandidates();
            vscode.window.showQuickPick(profiles).then((selected) => {
                if (selected) {
                    this.addProfile(selected);
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    handleCommandRemoveProfile(context: any) {
        try {
            console.log('handling command [awstools.removeProfile]:', context);
            if (context instanceof TreeItemAwsProfile) {
                const options: vscode.MessageOptions = {
                    modal: true
                };
                vscode.window.showWarningMessage("Are you sure you want to remove the profile from this view?", options, "Remove from this view").then(value => {
                    if (!value) {
                        return;
                    }
                    this.removeProfile(context.label);
                });
            }
        } catch (err) {
            console.log(err);
        }
    }

    handleCommandAddRegion(context: any) {
        try {
            console.log('handling command [awstools.addRegion]:', context);
            if (context instanceof TreeItemAwsProfile) {
                const profile = context.label;
                this.getRegionCandidates(profile).then((regions) => {
                    console.log(regions);
                    vscode.window.showQuickPick(regions).then((selected) => {
                        if (selected) {
                            this.addRegion(profile, selected);
                        }
                    });
                });
            } else {
                console.log(context.constructor.name);
            }
        } catch (err) {
            console.log(err);
        }
    }

    handleCommandRemoveRegion(context: any) {
        try {
            console.log('handling command [awstools.removeRegion]:', context);
            if (context instanceof TreeItemAwsRegion) {
                const options: vscode.MessageOptions = {
                    modal: true
                };
                vscode.window.showWarningMessage("Are you sure you want to remove the region from this view?", options, "Remove from this view").then(value => {
                    if (!value) {
                        return;
                    }
                    this.removeRegion(context.profileName, context.label);
                });
            }
        } catch (err) {
            console.log(err);
        }
    }

    handleCommandAddService(context: any) {
        try {
            console.log('handling command [awstools.addService]:', context);
            if (context instanceof TreeItemAwsRegion) {
                const profile = context.profileName;
                const region = context.label;
                const services = this.getServiceCandidates(profile, region);
                vscode.window.showQuickPick(services).then((selected) => {
                    if (selected) {
                        this.addService(profile, region, selected);
                    }
                });
            } else {
                console.log(context.constructor.name);
            }
        } catch (err) {
            console.log(err);
        }
    }

    handleCommandRemoveService(context: any) {
        try {
            console.log('handling command [awstools.removeService]:', context);
            if (context instanceof TreeItemAwsService) {
                const options: vscode.MessageOptions = {
                    modal: true
                };
                vscode.window.showWarningMessage("Are you sure you want to remove the service from this view?", options, "Remove from this view").then(value => {
                    if (!value) {
                        return;
                    }
                    this.removeService(context.profileName, context.regionName, context.label);
                });
            }
        } catch (err) {
            console.log(err);
        }
    }

    handleCommandAddResource(context: any) {
        try {
            console.log('handling command [awstools.addResource]:', context);
            if (context instanceof TreeItemAwsService) {
                const profile = context.profileName;
                const region = context.regionName;
                const service = context.label;
                const resources = this.getResourceCandidates(profile, region, service);
                vscode.window.showQuickPick(resources).then((selected) => {
                    if (selected) {
                        this.addResource(profile, region, service, selected);
                    }
                });
            } else {
                console.log(context.constructor.name);
            }
        } catch (err) {
            console.log(err);
        }
    }

    handleCommandRemoveResource(context: any) {
        try {
            console.log('handling command [awstools.removeResource]:', context);
            if (context instanceof TreeItemAwsResource) {
                const options: vscode.MessageOptions = {
                    modal: true
                };
                vscode.window.showWarningMessage("Are you sure you want to remove the resource from this view?", options, "Remove from this view").then(value => {
                    if (!value) {
                        return;
                    }
                    this.removeResource(context.profileName, context.regionName, context.serviceName, context.label);
                });
            }
        } catch (err) {
            console.log(err);
        }
    }


    private removeIfExists(a: string[], b: string): string[] {
        const result: string[] = [];
        for (let s of a) {
            if (s !== b) {
                result.push(s);
            }
        }
        return result;
    }

    private loadAwsProfilesFromCredentialsFile(): string[] {
        const p = path.join(os.homedir(), ".aws", "credentials");
        if (!this.pathExists(p)) {
            vscode.window.showErrorMessage('.aws/credentials is not found');
            return [];
        }

        const credentials = ini.parse(fs.readFileSync(p, 'utf8'));

        return Object.keys(credentials);
    }

    private load(): AwsProfile[] {
        if (!this.workspaceRoot) {
            console.log("load: workspaceRoot is undefined");
            return [];
        }

        const p = path.join(this.workspaceRoot, '.aws-tools.json');
        if (!this.pathExists(p)) {
            console.log('load: .aws-tools.json is not found. created.');
            fs.writeFileSync(p, '[]', 'utf8');
            return [];
        }

        return this.loadProfiles(p);
    }

    private loadProfiles(p: string): AwsProfile[] {
        const profiles = JSON.parse(fs.readFileSync(p, 'utf8'));
        const result: AwsProfile[] = [];
        for (let p of profiles) {
            try {
                result.push(new AwsProfile(p));
            } catch (err) {
                console.error(err);
            }
        }
        return result;
    }

    private save() {
        if (!this.workspaceRoot) {
            return;
        }

        const content = this.awsProfilesToJSON();
        const p = path.join(this.workspaceRoot, '.aws-tools.json');
        fs.writeFileSync(p, content, 'utf8');
    }

    private awsProfilesToJSON(): string {
        const profiles: Object[] = [];

        for (let p of this.awsProfiles) {
            profiles.push(p.toSerializableObject());
        }

        return JSON.stringify(profiles, null, 2);
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }
}



class AwsResourceProperty {
    constructor(
        public readonly arn: string,
        public readonly expanded: boolean,
        public readonly properties: AwsResourceProperty[]
    ) { }
}
