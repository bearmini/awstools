import * as vscode from 'vscode';

import { AwsRegion } from './aws-region';
import { TreeItemAwsProfile } from '../tree-items/aws-profile';
import { collapsibleState } from '../utils';
import { Workspace } from './workspace';
import { ITreeItemModel } from './tree-item-model';

export class AwsProfile implements ITreeItemModel {
    public readonly parent: Workspace;
    public readonly name: string;
    public expanded: boolean;
    public regions: AwsRegion[];

    constructor(parent: Workspace, obj: any) {
        this.parent = parent;
        this.name = obj.name || 'no name (profile)';
        this.expanded = !!obj.expanded;

        this.regions = [];
        if (obj.regions && Array.isArray(obj.regions)) {
            for (let r of obj.regions) {
                this.regions.push(new AwsRegion(this, r));
            }
        }
    }

    addRegion(regionName: string) {
        if (this.findRegionByName(regionName)) {
            console.log(`region name ${regionName} is already added`);
            return;
        }
        this.regions.push(new AwsRegion(this, { name: regionName }));
    }

    removeRegion(regionName: string) {
        const newRegions: AwsRegion[] = [];
        for (let r of this.regions) {
            if (r.name !== regionName) {
                newRegions.push(r);
            }
        }
        this.regions = newRegions;
    }

    findRegionByName(regionName: string): AwsRegion | undefined {
        for (let r of this.regions) {
            if (r.name === regionName) {
                return r;
            }
        }
    }

    toTreeItem(): vscode.TreeItem {
        const regions: vscode.TreeItem[] = [];
        for (let r of this.regions) {
            regions.push(r.toTreeItem());
        }
        return new TreeItemAwsProfile(this.parent.name, this.name, collapsibleState(this.expanded), regions);
    }

    toSerializableObject(): Object {
        const regions: Object[] = [];
        for (let r of this.regions) {
            regions.push(r.toSerializableObject());
        }
        return {
            name: this.name,
            expanded: this.expanded,
            regions: regions,
        };
    }
}
