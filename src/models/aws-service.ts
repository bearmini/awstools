import * as vscode from 'vscode';

import { AwsRegion } from './aws-region';
import { AwsResource } from './aws-resource';
import { TreeItemAwsService } from '../tree-items/aws-service';
import { collapsibleState } from '../utils';

export class AwsService {
    public readonly parent: AwsRegion;
    public readonly name: string;
    public expanded: boolean;
    public resources: AwsResource[];

    constructor(parent: AwsRegion, obj: any) {
        this.parent = parent;
        this.name = obj.name || 'no name (service)';
        this.expanded = !!obj.expanded;
        this.resources = [];
        if (obj.resources && Array.isArray(obj.resources)) {
            for (let r of obj.resources) {
                this.resources.push(new AwsResource(this, r));
            }
        }
    }

    addResource(resourceName: string) {
        if (this.findResourceByName(resourceName)) {
            console.log(`resource name ${resourceName} is already added.`);
            return;
        }
        this.resources.push(new AwsResource(this, { name: resourceName }));
    }

    removeResource(resourceName: string) {
        const newResources: AwsResource[] = [];
        for (let r of this.resources) {
            if (r.name !== resourceName) {
                newResources.push(r);
            }
        }
        this.resources = newResources;
    }

    findResourceByName(resourceName: string): AwsResource | undefined {
        for (let r of this.resources) {
            if (r.name === resourceName) {
                return r;
            }
        }
    }

    toTreeItem(): vscode.TreeItem {
        const resources: vscode.TreeItem[] = [];
        for (let r of this.resources) {
            resources.push(r.toTreeItem());
        }
        return new TreeItemAwsService(this.parent.parent.name, this.parent.name, this.name, collapsibleState(this.expanded), resources);
    }

    toSerializableObject(): Object {
        const resources: Object[] = [];
        for (let r of this.resources) {
            resources.push(r.toSerializableObject());
        }
        return {
            name: this.name,
            expanded: this.expanded,
            resources: resources
        };
    }
}
