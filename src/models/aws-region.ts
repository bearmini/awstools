import * as vscode from 'vscode';

import { AwsProfile } from './aws-profile';
import { AwsService } from './aws-service';
import { TreeItemAwsRegion } from '../tree-items/aws-region';
import { collapsibleState } from '../utils';

export class AwsRegion {
    public readonly parent: AwsProfile;
    public readonly name: string;
    public expanded: boolean;
    public services: AwsService[];

    constructor(parent: AwsProfile, obj: any) {
        this.parent = parent;
        this.name = obj.name || 'no name (region)';
        this.expanded = !!obj.expanded;
        this.services = [];
        if (obj.services && Array.isArray(obj.services)) {
            for (let s of obj.services) {
                this.services.push(new AwsService(this, s));
            }
        }
    }

    addService(serviceName: string) {
        if (this.findServiceByName(serviceName)) {
            console.log(`service name ${serviceName} is already added`);
            return;
        }
        this.services.push(new AwsService(this, { name: serviceName }));
    }

    removeService(serviceName: string) {
        const newServices: AwsService[] = [];
        for (let s of this.services) {
            if (s.name !== serviceName) {
                newServices.push(s);
            }
        }
        this.services = newServices;
    }

    findServiceByName(serviceName: string): AwsService | undefined {
        for (let s of this.services) {
            if (s.name === serviceName) {
                return s;
            }
        }
    }

    toTreeItem(): vscode.TreeItem {
        const services: vscode.TreeItem[] = [];
        for (let s of this.services) {
            services.push(s.toTreeItem());
        }
        return new TreeItemAwsRegion(this.parent.name, this.name, collapsibleState(this.expanded), services);
    }

    toSerializableObject(): Object {
        const services: Object[] = [];
        for (let s of this.services) {
            services.push(s.toSerializableObject());
        }
        return {
            name: this.name,
            expanded: this.expanded,
            services: services,
        };
    }
}
