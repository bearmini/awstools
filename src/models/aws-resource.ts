import * as vscode from 'vscode';

import { AwsService } from './aws-service';
import { TreeItemAwsLambdaResource, TreeItemAwsUnknownResource } from '../tree-items/aws-resource';
import { collapsibleState } from '../utils';
import { ITreeItemModel } from './tree-item-model';

export interface AwsResource extends ITreeItemModel {
    id: string;
    toTreeItem(): vscode.TreeItem;
    toSerializableObject(): Object;
}

export class AwsLambdaResource implements AwsResource {
    public readonly parent: AwsService;
    public readonly name: string;
    public readonly id: string;
    public expanded: boolean;

    constructor(parent: AwsService, obj: any) {
        this.parent = parent;
        this.name = obj.name || '';
        this.id = obj.id;
        this.expanded = !!obj.expanded;
    }

    toTreeItem(): vscode.TreeItem {
        const service = this.parent;
        const region = service.parent;
        const profile = region.parent;
        const workspace = profile.parent;
        return new TreeItemAwsLambdaResource(workspace.name, profile.name, region.name, service.name, this.name, collapsibleState(this.expanded));
    }

    toSerializableObject(): Object {
        return {
            id: this.id,
            name: this.name,
            expanded: this.expanded
        };
    }
}

export class AwsUnknownResource implements AwsResource {
    public readonly parent: AwsService;
    public readonly name: string;
    public readonly id: string;
    public expanded: boolean;

    constructor(parent: AwsService, obj: any) {
        this.parent = parent;
        this.name = obj.name || '';
        this.id = obj.id;
        this.expanded = !!obj.expanded;
    }

    toTreeItem(): vscode.TreeItem {
        const service = this.parent;
        const region = service.parent;
        const profile = region.parent;
        const workspace = profile.parent;
        return new TreeItemAwsUnknownResource(workspace.name, profile.name, region.name, service.name, this.name, collapsibleState(this.expanded));
    }

    toSerializableObject(): Object {
        return {
            name: this.name
        };
    }
}
