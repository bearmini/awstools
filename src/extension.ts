// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AwsProfilesProvider } from './aws-profiles-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log("awstools: activated");
	const awsProfilesProvider = new AwsProfilesProvider(vscode.workspace.workspaceFolders);
	const treeView = vscode.window.createTreeView('awstoolsWorkspaces', {
		treeDataProvider: awsProfilesProvider,
	});
	treeView.onDidExpandElement((ev: vscode.TreeViewExpansionEvent<vscode.TreeItem>) => {
		console.log("treeView.onDidExpandElement:", ev);
		awsProfilesProvider.onTreeViewItemExpanded(ev);
	});
	treeView.onDidCollapseElement((ev: vscode.TreeViewExpansionEvent<vscode.TreeItem>) => {
		console.log("treeView.onDidCollapseElement:", ev);
		awsProfilesProvider.onTreeViewItemCollapsed(ev);
	});

	const commandAndHandlerPairs: { [index: string]: (...args: any[]) => any } = {
		'awstools.addProfile': (context: any) => awsProfilesProvider.handleCommandAddProfile(context),
		'awstools.removeProfile': (context: any) => awsProfilesProvider.handleCommandRemoveProfile(context),
		'awstools.addRegion': (context: any) => awsProfilesProvider.handleCommandAddRegion(context),
		'awstools.removeRegion': (context: any) => awsProfilesProvider.handleCommandRemoveRegion(context),
		'awstools.addService': (context: any) => awsProfilesProvider.handleCommandAddService(context),
		'awstools.removeService': (context: any) => awsProfilesProvider.handleCommandRemoveService(context),
		'awstools.moveServiceUp': (context: any) => awsProfilesProvider.handleCommandMoveServiceUp(context),
		'awstools.moveServiceDown': (context: any) => awsProfilesProvider.handleCommandMoveServiceDown(context),
		'awstools.addResource': (context: any) => awsProfilesProvider.handleCommandAddResource(context),
		'awstools.removeResource': (context: any) => awsProfilesProvider.handleCommandRemoveResource(context),
		'awstools.downloadS3Object': (context: any) => awsProfilesProvider.handleCommandDownloadS3Object(context)
	};

	for (let key in commandAndHandlerPairs) {
		context.subscriptions.push(vscode.commands.registerCommand(key, commandAndHandlerPairs[key]));
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
