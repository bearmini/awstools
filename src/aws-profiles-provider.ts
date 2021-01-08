import * as vscode from 'vscode';
import * as fs from 'fs';
import * as ini from 'ini';
import * as os from 'os';
import * as path from 'path';
import * as AWS from 'aws-sdk';

import { AwsProfile } from './models/aws-profile';
import { AwsRegion } from './models/aws-region';
import { AwsService } from './models/aws-service';
import { ITreeItemModel } from './models/tree-item-model';
import { TreeItemAwsProfile } from './tree-items/aws-profile';
import { TreeItemAwsRegion } from './tree-items/aws-region';
import { TreeItemAwsLambdaResource } from './tree-items/aws-resource';
import { TreeItemAwsService } from './tree-items/aws-service';
import { TreeItemNoProfiles } from './tree-items/no-profiles';
import { TreeItemNoRegions } from './tree-items/no-regions';
import { TreeItemNoResources } from './tree-items/no-resources';
import { TreeItemNoServices } from './tree-items/no-services';
import { TreeItemS3Folder } from './tree-items/s3/folder';
import { TreeItemWorkspace } from './tree-items/workspace';
import { getLambdaFunctions, getEC2Instances, getEC2SecurityGroups } from './utils';
import { AwsResource } from './models/aws-resource';
import { Workspace } from './models/workspace';

class ResourceQuickPickItem implements vscode.QuickPickItem {
    constructor(public label: string, public id: string) {
    }
}

export class AwsProfilesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private workspaces: Workspace[];

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private readonly workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined) {
        this.workspaces = this.load();
    }

    onTreeViewItemCollapsed(ev: vscode.TreeViewExpansionEvent<vscode.TreeItem>) {
        this.onTreeViewItemExpandedOrCollapsed(ev, false);
    }

    onTreeViewItemExpanded(ev: vscode.TreeViewExpansionEvent<vscode.TreeItem>) {
        this.onTreeViewItemExpandedOrCollapsed(ev, true);
    }

    onTreeViewItemExpandedOrCollapsed(ev: vscode.TreeViewExpansionEvent<vscode.TreeItem>, expanded: boolean) {
        const model = this.findModelForTreeItem(ev.element);
        if (model) {
            model.expanded = expanded;
            this.save();
        }
    }

    findModelForTreeItem(treeItem: vscode.TreeItem): ITreeItemModel | undefined {
        if (treeItem instanceof TreeItemWorkspace) {
            return this.findWorkspaceByName(treeItem.label);
        }

        if (treeItem instanceof TreeItemAwsProfile) {
            return this.findProfileByName(treeItem.workspaceName, treeItem.label);
        }

        if (treeItem instanceof TreeItemAwsRegion) {
            return this.findRegionByName(treeItem.workspaceName, treeItem.profileName, treeItem.label);
        }

        if (treeItem instanceof TreeItemAwsService) {
            return this.findServiceByName(treeItem.workspaceName, treeItem.profileName, treeItem.regionName, treeItem.label);
        }

        if (treeItem instanceof TreeItemAwsLambdaResource) {
            return this.findResourceByName(treeItem.workspaceName, treeItem.profileName, treeItem.regionName, treeItem.serviceName, treeItem.label);
        }

        console.log("onTreeViewItemExpandedOrCollapsed: Unknown TreeItem type");
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        console.log("getChildren(): element == ", element);

        if (!element) { // returns items at root level i.e. workspaces
            const treeItems: vscode.TreeItem[] = [];
            for (let ws of this.workspaces) {
                treeItems.push(ws.toTreeItem());
            }
            return Promise.resolve(treeItems);
        }

        if (element instanceof TreeItemWorkspace) { // returns profile for the workspace
            const children = element.getChildren();
            if (children.length === 0) {
                return Promise.resolve([new TreeItemNoProfiles(element.label)]);
            }
            return Promise.resolve(children);
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

        if (element instanceof TreeItemAwsLambdaResource) { // returns items for the resource
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

    getProfileCandidates(workspaceName: string): string[] {
        const ws = this.findWorkspaceByName(workspaceName);
        if (!ws) {
            return [];
        }

        let candidates: string[] = this.loadAwsProfilesFromCredentialsFile();

        for (let profile of ws.profiles) {
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

    getServiceCandidates(workspaceName: string, profileName: string, regionName: string): string[] {
        let candidates = [
            "API Gateway",
            "CloudWatch Logs",
            "DynamoDB",
            "EC2 - Instances",
            "EC2 - Security groups",
            "Lambda",
            "S3",
            "VPC"
        ];

        const profile = this.findProfileByName(workspaceName, profileName);
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

    async getResourceCandidates(workspaceName: string, profileName: string, regionName: string, serviceName: string): Promise<vscode.QuickPickItem[]> {
        switch (serviceName) {
            case 'EC2 - Instances':
                return await this.getEC2InstanceResourceCandidates(workspaceName, profileName, regionName);
            case 'EC2 - Security groups':
                return await this.getEC2SecurityGroupResourceCandidates(workspaceName, profileName, regionName);
            case 'Lambda':
                return await this.getLambdaResourceCandidates(workspaceName, profileName, regionName);
            case 'S3':
                return await this.getS3ResourceCandidates(profileName, regionName);
            default:
                console.log(`getResourceCandidates(): service ${serviceName} is not supported yet`);
                return [];
        }
    }

    async getEC2InstanceResourceCandidates(workspaceName: string, profileName: string, regionName: string): Promise<vscode.QuickPickItem[]> {
        return new Promise(async (resolve, reject) => {
            const instances = await getEC2Instances(profileName, regionName);
            const result: vscode.QuickPickItem[] = [];

            for (let i of instances) {
                if (i.InstanceId) {
                    if (!this.findEC2Instance(workspaceName, profileName, regionName, i.InstanceId)) {
                        let name = '';
                        if (i.Tags) {
                            const nameTag = i.Tags.find((tag: AWS.EC2.Tag, index: number, obj: AWS.EC2.Tag[]) => {
                                if (tag.Key && tag.Key === 'Name') {
                                    return tag;
                                }
                            });
                            if (nameTag && nameTag.Value) {
                                name = nameTag.Value;
                            }
                        }
                        result.push(new ResourceQuickPickItem(`${name} - ${i.InstanceId}`, i.InstanceId));
                    }
                }
            }
            resolve(result);
        });
    }

    private findEC2Instance(workspaceName: string, profileName: string, regionName: string, instanceId: string): AwsResource | undefined {
        const service = this.findServiceByName(workspaceName, profileName, regionName, 'Lambda');
        if (!service) {
            return;
        }
        for (let r of service.resources) {
            if (r.name === instanceId) {
                return r;
            }
        }
    }

    async getEC2SecurityGroupResourceCandidates(workspaceName: string, profileName: string, regionName: string): Promise<vscode.QuickPickItem[]> {
        return new Promise(async (resolve, reject) => {
            const sgs = await getEC2SecurityGroups(profileName, regionName);
            const result: vscode.QuickPickItem[] = [];

            for (let sg of sgs) {
                if (sg.GroupId) {
                    if (!this.findEC2SecurityGroup(workspaceName, profileName, regionName, sg.GroupId)) {
                        let name = '';
                        if (sg.Tags) {
                            const nameTag = sg.Tags.find((tag: AWS.EC2.Tag, index: number, obj: AWS.EC2.Tag[]) => {
                                if (tag.Key && tag.Key === 'Name') {
                                    return tag;
                                }
                            });
                            if (nameTag && nameTag.Value) {
                                name = nameTag.Value;
                            }
                        }
                        result.push(new ResourceQuickPickItem(`${name} - ${sg.GroupId}`, sg.GroupId));
                    }
                }
            }
            resolve(result);
        });
    }

    private findEC2SecurityGroup(workspaceName: string, profileName: string, regionName: string, groupId: string): AwsResource | undefined {
        const service = this.findServiceByName(workspaceName, profileName, regionName, 'Lambda');
        if (!service) {
            return;
        }
        for (let r of service.resources) {
            if (r.id === groupId) {
                return r;
            }
        }
    }

    async getLambdaResourceCandidates(workspaceName: string, profileName: string, regionName: string): Promise<vscode.QuickPickItem[]> {
        return new Promise(async (resolve, reject) => {
            const functions = await getLambdaFunctions(profileName, regionName);
            const result: vscode.QuickPickItem[] = [];

            for (let f of functions) {
                if (f.FunctionName) {
                    if (!this.findLambdaFunction(workspaceName, profileName, regionName, f.FunctionName)) {
                        result.push(new ResourceQuickPickItem(f.FunctionName, f.FunctionName));
                    }
                }
            }
            resolve(result);
        });
    }

    private findLambdaFunction(workspaceName: string, profileName: string, regionName: string, functionName: string): AwsResource | undefined {
        const service = this.findServiceByName(workspaceName, profileName, regionName, 'Lambda');
        if (!service) {
            return;
        }
        for (let r of service.resources) {
            if (r.name === functionName) {
                return r;
            }
        }
    }

    getS3ResourceCandidates(profileName: string, regionName: string): Thenable<vscode.QuickPickItem[]> {
        return new Promise((resolve, reject) => {
            var creds = new AWS.SharedIniFileCredentials({ profile: profileName });
            const s3Client = new AWS.S3({ credentials: creds, region: regionName });
            s3Client.listBuckets((err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }

                const buckets: vscode.QuickPickItem[] = [];
                if (data && data.Buckets) {
                    for (let b of data.Buckets) {
                        if (b.Name) {
                            buckets.push(new ResourceQuickPickItem(b.Name, b.Name));
                        }
                    }
                }
                resolve(buckets);
            });
        });
    }

    private findProfileByName(workspaceName: string, profileName: string): AwsProfile | undefined {
        const ws = this.findWorkspaceByName(workspaceName);
        if (!ws) {
            return;
        }

        for (let p of ws.profiles) {
            if (p.name === profileName) {
                return p;
            }
        }
    }

    private findRegionByName(workspaceName: string, profileName: string, regionName: string): AwsRegion | undefined {
        const profile = this.findProfileByName(workspaceName, profileName);
        if (!profile) {
            return;
        }

        for (let r of profile.regions) {
            if (r.name === regionName) {
                return r;
            }
        }
    }

    private findServiceByName(workspaceName: string, profileName: string, regionName: string, serviceName: string): AwsService | undefined {
        const region = this.findRegionByName(workspaceName, profileName, regionName);
        if (!region) {
            return;
        }

        for (let s of region.services) {
            if (s.name === serviceName) {
                return s;
            }
        }
    }

    private findResourceByName(workspaceName: string, profileName: string, regionName: string, serviceName: string, resourceName: string): ITreeItemModel | undefined {
        const service = this.findServiceByName(workspaceName, profileName, regionName, serviceName);
        if (!service) {
            return;
        }

        for (let r of service.resources) {
            if (r.name === resourceName) {
                return r;
            }
        }
    }

    addProfile(workspaceName: string, profileName: string) {
        const ws = this.findWorkspaceByName(workspaceName);
        if (!ws) {
            console.log(`no workspace found: ${workspaceName}`);
            return;
        }

        ws.addProfile(profileName);
        this.save();
        this.refresh();
    }

    removeProfile(workspaceName: string, profileName: string) {
        const ws = this.findWorkspaceByName(workspaceName);
        if (!ws) {
            console.log(`no workspace found: ${workspaceName}`);
            return;
        }

        ws.removeProfile(profileName);
        this.save();
        this.refresh();
    }

    addRegion(workspaceName: string, profileName: string, regionName: string) {
        const profile = this.findProfileByName(workspaceName, profileName);
        if (!profile) {
            console.log(`no profile found: ${profileName}`);
            return;
        }

        profile.addRegion(regionName);
        this.save();
        this.refresh();
    }

    removeRegion(workspaceName: string, profileName: string, regionName: string) {
        const profile = this.findProfileByName(workspaceName, profileName);
        if (!profile) {
            console.log(`no profile found: ${profileName}`);
            return;
        }

        profile.removeRegion(regionName);
        this.save();
        this.refresh();
    }

    addService(workspaceName: string, profileName: string, regionName: string, serviceName: string) {
        const region = this.findRegionByName(workspaceName, profileName, regionName);
        if (!region) {
            console.log(`no region found: ${regionName}`);
            return;
        }

        region.addService(serviceName);
        this.save();
        this.refresh();
    }

    removeService(workspaceName: string, profileName: string, regionName: string, serviceName: string) {
        const region = this.findRegionByName(workspaceName, profileName, regionName);
        if (!region) {
            console.log(`no region found: ${regionName}`);
            return;
        }

        region.removeService(serviceName);
        this.save();
        this.refresh();
    }

    addResource(workspaceName: string, profileName: string, regionName: string, serviceName: string, resourceName: string) {
        const service = this.findServiceByName(workspaceName, profileName, regionName, serviceName);
        if (!service) {
            console.log(`no service found: ${serviceName}`);
            return;
        }

        service.addResource(resourceName);
        this.save();
        this.refresh();
    }

    removeResource(workspaceName: string, profileName: string, regionName: string, serviceName: string, resourceName: string) {
        const service = this.findServiceByName(workspaceName, profileName, regionName, resourceName);
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
            const workspaceName = context.label;
            const profiles = this.getProfileCandidates(workspaceName);
            vscode.window.showQuickPick(profiles).then((selected) => {
                if (selected) {
                    this.addProfile(workspaceName, selected);
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
                    this.removeProfile(context.workspaceName, context.label);
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
                const ws = context.workspaceName;
                const profile = context.label;
                this.getRegionCandidates(profile).then((regions) => {
                    console.log(regions);
                    vscode.window.showQuickPick(regions).then((selected) => {
                        if (selected) {
                            this.addRegion(ws, profile, selected);
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
                const ws = context.workspaceName;
                const options: vscode.MessageOptions = {
                    modal: true
                };
                vscode.window.showWarningMessage("Are you sure you want to remove the region from this view?", options, "Remove from this view").then(value => {
                    if (!value) {
                        return;
                    }
                    this.removeRegion(ws, context.profileName, context.label);
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
                const ws = context.workspaceName;
                const profile = context.profileName;
                const region = context.label;
                const services = this.getServiceCandidates(ws, profile, region);
                vscode.window.showQuickPick(services).then((selected) => {
                    if (selected) {
                        this.addService(ws, profile, region, selected);
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
                    this.removeService(context.workspaceName, context.profileName, context.regionName, context.label);
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
                const ws = context.workspaceName;
                const profile = context.profileName;
                const region = context.regionName;
                const service = context.label;
                const resources = this.getResourceCandidates(ws, profile, region, service);
                vscode.window.showQuickPick(resources).then((selected) => {
                    if (selected && selected instanceof ResourceQuickPickItem) {
                        this.addResource(ws, profile, region, service, selected.id);
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
            if (context instanceof TreeItemAwsLambdaResource) {
                const options: vscode.MessageOptions = {
                    modal: true
                };
                vscode.window.showWarningMessage("Are you sure you want to remove the resource from this view?", options, "Remove from this view").then(value => {
                    if (!value) {
                        return;
                    }
                    this.removeResource(context.workspaceName, context.profileName, context.regionName, context.serviceName, context.label);
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

    private load(): Workspace[] {
        const result: Workspace[] = [];

        if (!this.workspaceFolders) {
            console.log("load: workspaceFolders == undefined");
            return result;
        }

        for (let ws of this.workspaceFolders) {
            const p = path.join(ws.uri.fsPath, '.aws-tools.json');

            if (!this.pathExists(p)) {
                console.log('load: .aws-tools.json is not found. created.');
                fs.writeFileSync(p, '[]', 'utf8');
                result.push(new Workspace({
                    name: ws.name,
                    profiles: [],
                }));
                continue;
            }

            result.push(this.loadWorkspace(ws.name, p));
        }

        return result;
    }

    private loadWorkspace(name: string, p: string): Workspace {
        const workspaceObject = JSON.parse(fs.readFileSync(p, 'utf8')) as WorkspaceObject;
        const profiles: AwsProfile[] = [];
        const ws: Workspace = new Workspace({ name: name, expanded: workspaceObject.expanded });
        for (let p of workspaceObject.profiles) {
            try {
                profiles.push(new AwsProfile(ws, p));
            } catch (err) {
                console.error(err);
            }
        }
        ws.profiles = profiles;
        return ws;
    }

    private save() {
        if (!this.workspaceFolders) {
            return;
        }

        for (let wsf of this.workspaceFolders) {
            const ws = this.findWorkspaceByName(wsf.name);
            if (!ws) {
                continue;
            }
            const content = this.workspaceToJSON(ws);
            const p = path.join(wsf.uri.fsPath, '.aws-tools.json');
            fs.writeFileSync(p, content, 'utf8');
        }
    }

    private findWorkspaceByName(name: string): Workspace | undefined {
        for (let ws of this.workspaces) {
            if (ws.name === name) {
                return ws;
            }
        }
    }

    private workspaceToJSON(workspace: Workspace): string {
        let result: WorkspaceObject = new WorkspaceObject(workspace.expanded, []);

        for (let p of workspace.profiles) {
            result.profiles.push(p.toSerializableObject());
        }

        return JSON.stringify(result, null, 2);
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

class WorkspaceObject {
    constructor(public expanded: boolean, public profiles: Object[]) { }
}
