import * as vscode from 'vscode';

import { AwsService } from './aws-service';
import { TreeItemAwsResource } from '../tree-items/aws-resource';
import { collapsibleState } from '../utils';

export class AwsResource {
    public readonly parent: AwsService;
    public readonly name: string;
    public expanded: boolean;

    constructor(parent: AwsService, obj: any) {
        this.parent = parent;
        this.name = obj.name || '';
        this.expanded = !!obj.expanded;
    }

    toTreeItem(): vscode.TreeItem {
        return new TreeItemAwsResource(this.parent.parent.parent.name, this.parent.parent.name, this.parent.name, this.name, collapsibleState(this.expanded));
    }

    toSerializableObject(): Object {
        return {
            name: this.name
        };
    }
}
