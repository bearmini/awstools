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


	context.subscriptions.push(vscode.commands.registerCommand('awstools.addProfile', (context) => awsProfilesProvider.handleCommandAddProfile(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.removeProfile', (context) => awsProfilesProvider.handleCommandRemoveProfile(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.addRegion', (context) => awsProfilesProvider.handleCommandAddRegion(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.removeRegion', (context) => awsProfilesProvider.handleCommandRemoveRegion(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.addService', (context) => awsProfilesProvider.handleCommandAddService(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.removeService', (context) => awsProfilesProvider.handleCommandRemoveService(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.moveServiceUp', (context) => awsProfilesProvider.handleCommandMoveServiceUp(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.moveServiceDown', (context) => awsProfilesProvider.handleCommandMoveServiceDown(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.addResource', (context) => awsProfilesProvider.handleCommandAddResource(context)));
	context.subscriptions.push(vscode.commands.registerCommand('awstools.removeResource', (context) => awsProfilesProvider.handleCommandRemoveResource(context)));
}

// this method is called when your extension is deactivated
export function deactivate() { }
