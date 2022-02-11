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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const core = __importStar(require("@actions/core"));
const action_1 = require("@octokit/action");
const zx_1 = require("zx");
const octokit = new action_1.Octokit();
const [OWNER, REPOSITORY] = process.env.GITHUB_REPOSITORY.split("/");
function getPullRequestId() {
    const ev = JSON.parse(node_fs_1.default.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    return ev.pull_request.number;
}
function getSchemaRemovalCount(mainBranch, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const { stdout } = yield (0, zx_1.$) `git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat ${path}/prisma.schema | awk '{ print $2}'`;
        return parseInt(stdout.trim(), 10);
    });
}
function getModifiedFileCount(mainBranch, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const { stdout } = yield (0, zx_1.$) `git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat -- . :^${path} | wc -l`;
        return parseInt(stdout.trim(), 10);
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mainBranch = core.getInput("main-branch");
            const path = core.getInput("path");
            const schemaRemovalCount = yield getSchemaRemovalCount(mainBranch, path);
            const modifiedFileCount = yield getModifiedFileCount(mainBranch, path);
            if (schemaRemovalCount > 0 && modifiedFileCount > 0) {
                const warning = core.getBooleanInput("warning");
                const fail = core.getBooleanInput("fail");
                const repeat = core.getBooleanInput("repeat");
                const message = core.getInput("message");
                if (fail) {
                    core.setFailed("Potentially unsafe Prisma migration detected. Please separate migration changes into their own Pull Request.");
                }
                if (warning) {
                    const id = getPullRequestId();
                    const comments = yield octokit.issues.listComments({
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
            }
            core.info(`No potentially unsafe Prisma migration detected.`);
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
run();
