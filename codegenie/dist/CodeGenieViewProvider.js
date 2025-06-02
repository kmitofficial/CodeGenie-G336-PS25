"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenieViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class CodeGenieViewProvider {
    constructor(context) {
        this.context = context;
    } //Context helps TypeScript access other folders but it also provides storage, lifecycle management, and utilities for building a clean extension.
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, "src", "codegenie-ui", "build")), // The WebView is allowed to load files from src/codegenie-ui/build folder 
            ],
        };
        const webviewDistPath = path.join(this.context.extensionPath, "src", "codegenie-ui", "build"); // Builds absolute file paths to your Webview's frontend files
        const indexPath = path.join(webviewDistPath, "index.html"); // This creates the full path to the index.html file
        try {
            let html = fs.readFileSync(indexPath, "utf8"); // Reads the content in file. "utf8" means in the form of text and not bytes.
            if (!html.includes('Content-Security-Policy')) { // Ads the meta data cunsorning to Security Issues
                html = html.replace(/<head>/i, `<head>
            <meta http-equiv="Content-Security-Policy" 
                  content="default-src 'none'; 
                          connect-src http://127.0.0.1:8000 https://6a7a-183-82-97-138.ngrok-free.app vscode-resource:; 
                          img-src vscode-resource: https:; 
                          script-src vscode-resource: 'unsafe-inline'; 
                          style-src vscode-resource: 'unsafe-inline'; 
                          font-src vscode-resource:;">
          `);
            }
            html = html.replace(/(src|href)="(?!https?:\/\/)(.*?)"/g, (match, attr, src) => {
                const resourceUri = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(webviewDistPath, src))); // Converts these files into vscode resource so that they can easily be loaded without any trouble
                return `${attr}="${resourceUri}"`; // returns like src="vscode-resource://extension-folder/main.js"
            });
            webviewView.webview.html = html;
        }
        catch (error) {
            console.error("❌ Failed to load Webview:", error);
            webviewView.webview.html = `<h1>Error loading UI</h1><p>${error.message}</p>`;
        }
    }
    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
        else {
            vscode.window.showErrorMessage("CodeGenie panel is not visible.");
        }
    }
}
exports.CodeGenieViewProvider = CodeGenieViewProvider;
CodeGenieViewProvider.viewType = "codegenieView"; //This line is just the id of the webview and just used by package.json to identify the file
