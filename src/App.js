import React, { Component } from "react";
import ReactJson from "react-json-view";

// Import a Filesystem
import LightningFS from "@isomorphic-git/lightning-fs";

// Import our main git library
import * as git from "isomorphic-git";

// Basic CSS
import "./App.css";

// Initialize isomorphic-git with a file system
// LightningFS, a subset of node's fs
let fs = new LightningFS("fs");

// Register our filesystem to our git interface
git.plugins.set("fs", fs);

// Use the Promisified version of LightningFS
const pfs = fs.promises;

// Set static Directory Path
const dir = "/moonwalk";

export class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dirContent: {},
      fileContent: "",
      fileName: "",
      gitStatus: "",
      gitLog: {},
      sha: ""
    };

    this.setupGitRepo();
  }

  async setupGitRepo() {
    // Let's pick a directory to work in
    // if it doesnt exist, create that directory

    let dirInitialized;
    try {
      dirInitialized = await pfs.readdir(dir);
    } catch (e) {
      // error while reading, so dir doesn't exist yet
    }
    if (!dirInitialized) await pfs.mkdir(dir);
  }

  async clearDirectory() {
    fs = new LightningFS("fs", { wipe: true });
  }

  listDirectory = async () => {
    const dirContent = await pfs.readdir(dir);
    this.setState({ dirContent });
  };

  gitLog = async () => {
    try {
      const gitLog = await git.log({ dir, depth: 1 });
      this.setState({ gitLog });
    } catch {
      // Not a valid git dir yet
      this.setState({ gitLog: { error: "Nothing Committed in Repo Yet" } });
    }
  };

  gitStatus = async () => {
    const gitStatus = await git.status({ dir, filepath: this.state.fileName });
    this.setState({ gitStatus });
  };

  async cloneRemoteRepo() {
    const clone = await git.clone({
      dir,
      corsProxy: "https://cors.isomorphic-git.org",
      url: "https://github.com/isomorphic-git/isomorphic-git",
      ref: "master",
      singleBranch: true,
      depth: 10
    });

    console.log(clone);
  }

  readFile = async () => {
    try {
      const fileContent = await pfs.readFile(
        `${dir}/${this.state.fileName}`,
        "utf8"
      );
      this.setState({ fileContent });
    } catch {
      // error reading the file
      console.log("Error reading file");
    }
  };

  addFile = async () => {
    await git.add({ dir, filepath: this.state.fileName });
  };

  writeFile = async () => {
    await pfs.writeFile(
      `${dir}/${this.state.fileName}`,
      this.state.fileContent,
      "utf8"
    );
  };

  commit = async () => {
    const sha = await git.commit({
      dir,
      message: "Delete package.json and overwrite README.",
      author: {
        name: "Mr. Test",
        email: "mrtest@example.com"
      }
    });

    this.setState({ sha });
  };

  handleFileNameChange = e => {
    this.setState({ fileName: e.target.value });
  };

  handleFileContentChange = e => {
    this.setState({ fileContent: e.target.value });
  };

  render() {
    return (
      <div className="App">
        <h1>Git in the browser Example</h1>
        <div className="margin">
          <h4>General Commands:</h4>
          <div className="margin">
            <button onClick={this.clearDirectory}>Clear Directory</button>
            <button onClick={this.listDirectory}>List Directory</button>
            <button onClick={this.gitLog}>Git Log</button>
            <button onClick={this.cloneRemoteRepo}>Clone a Remote Repo</button>
          </div>
        </div>
        <div className="margin">
          <h4>File Specific Commands</h4>
          <div className="margin">
            <div>
              <label>Filename:</label>
              <div>
                <input
                  type="text"
                  value={this.state.fileName}
                  onChange={this.handleFileNameChange}
                />
              </div>
              <button onClick={this.readFile}>Read File</button>
              <button onClick={this.writeFile}>Write File</button>
            </div>
            <div className="marginTop">
              <label>File Contents:</label>
              <div>
                <textarea
                  value={this.state.fileContent}
                  onChange={this.handleFileContentChange}
                  rows="4"
                  cols="50"
                />
              </div>
            </div>

            <button onClick={this.gitStatus}>Git Status</button>
            <button onClick={this.addFile}>Git Add</button>

            <div className="marginTop">
              <button onClick={this.commit}>Git Commit</button>
              <div className="marginTop">SHA: {this.state.sha}</div>
            </div>
          </div>
        </div>
        <div className="margin">
          <h4>Git Status</h4>
          <div className="margin">
            <pre>{this.state.gitStatus}</pre>
          </div>
        </div>
        <div className="margin">
          <h4>Git Log</h4>
          <div className="margin">
            <ReactJson src={this.state.gitLog} />
          </div>
        </div>
        <div className="margin">
          <h4>Dir Log</h4>
          <div className="margin">
            <ReactJson src={this.state.dirContent} />
          </div>
        </div>
      </div>
    );
  }
}
