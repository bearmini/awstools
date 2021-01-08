import * as vscode from 'vscode';

import { AwsProfile } from './aws-profile';
import { ITreeItemModel } from './tree-item-model';
import { TreeItemWorkspace } from '../tree-items/workspace';
import { collapsibleState } from '../utils';

export class Workspace implements ITreeItemModel {
    public readonly name: string;
    public expanded: boolean;
    public profiles: AwsProfile[];

    constructor(obj: any) {
        this.name = obj.name || 'no name (profile)';
        this.expanded = !!obj.expanded;

        this.profiles = [];
        if (obj.profiles && Array.isArray(obj.profiles)) {
            for (let p of obj.profiles) {
                this.profiles.push(new AwsProfile(this, p));
            }
        }
    }

    addProfile(profileName: string) {
        if (this.findProfileByName(profileName)) {
            console.log(`profile name ${profileName} is already added`);
            return;
        }
        this.profiles.push(new AwsProfile(this, { name: profileName }));
    }

    removeProfile(profileName: string) {
        const newProfiles: AwsProfile[] = [];
        for (let p of this.profiles) {
            if (p.name !== profileName) {
                newProfiles.push(p);
            }
        }
        this.profiles = newProfiles;
    }

    findProfileByName(profileName: string): AwsProfile | undefined {
        for (let p of this.profiles) {
            if (p.name === profileName) {
                return p;
            }
        }
    }

    toTreeItem(): vscode.TreeItem {
        const profiles: vscode.TreeItem[] = [];
        for (let p of this.profiles) {
            profiles.push(p.toTreeItem());
        }
        return new TreeItemWorkspace(this.name, collapsibleState(this.expanded), profiles);
    }

    toSerializableObject(): Object {
        const profiles: Object[] = [];
        for (let p of this.profiles) {
            profiles.push(p.toSerializableObject());
        }
        return {
            name: this.name,
            expanded: this.expanded,
            profiles: profiles,
        };
    }
}

