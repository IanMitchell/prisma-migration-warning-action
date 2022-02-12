"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const core = __importStar(require("@actions/core"));
const action_1 = require("@octokit/action");
const node_child_process_1 = require("node:child_process");
const octokit = new action_1.Octokit();
const [OWNER, REPOSITORY] = process.env.GITHUB_REPOSITORY.split("/");
function getPullRequestId() {
    const ev = JSON.parse(node_fs_1.default.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    return ev.pull_request.number;
}
async function getSchemaRemovalCount(mainBranch, path) {
    const stdout = (0, node_child_process_1.execSync)(`git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat ${path}/schema.prisma | awk '{ print $2}'`);
    return parseInt(stdout.toString().trim(), 10);
}
async function getModifiedFileCount(mainBranch, path) {
    const stdout = (0, node_child_process_1.execSync)(`git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat -- . :^${path} | wc -l`);
    return parseInt(stdout.toString().trim(), 10);
}
async function run() {
    try {
        const mainBranch = core.getInput("main-branch");
        const path = core.getInput("path");
        const schemaRemovalCount = await getSchemaRemovalCount(mainBranch, path);
        const modifiedFileCount = await getModifiedFileCount(mainBranch, path);
        console.log(`Found ${schemaRemovalCount} removed lines and ${modifiedFileCount} modified files`);
        if (schemaRemovalCount > 0 && modifiedFileCount > 0) {
            const warning = core.getBooleanInput("warning");
            const fail = core.getBooleanInput("fail");
            const repeat = core.getBooleanInput("repeat");
            const message = core.getInput("message");
            if (warning) {
                const id = getPullRequestId();
                const comments = await octokit.issues.listComments({
                    owner: OWNER,
                    repo: REPOSITORY,
                    issue_number: id,
                });
                const isWarningPosted = comments.data.some((comment) => comment.body === message);
                if (!isWarningPosted || (isWarningPosted && repeat)) {
                    octokit.issues.createComment({
                        owner: OWNER,
                        repo: REPOSITORY,
                        issue_number: id,
                        body: message,
                    });
                }
            }
            if (fail) {
                core.setFailed("Potentially unsafe Prisma migration detected. Please separate migration changes into their own Pull Request.");
            }
        }
        else {
            core.info(`No potentially unsafe Prisma migration detected.`);
        }
    }
    catch (error) {
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
run();
