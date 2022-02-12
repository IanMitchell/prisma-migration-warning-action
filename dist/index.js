require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 109:
/***/ (function() {

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
define(["require", "exports", "node:fs", "@actions/core", "@octokit/action", "zx"], function (require, exports, node_fs_1, core, action_1, zx_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    node_fs_1 = __importDefault(node_fs_1);
    core = __importStar(core);
    const octokit = new action_1.Octokit();
    const [OWNER, REPOSITORY] = process.env.GITHUB_REPOSITORY.split("/");
    function getPullRequestId() {
        const ev = JSON.parse(node_fs_1.default.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
        console.log(ev);
        return ev.pull_request.number;
    }
    async function getSchemaRemovalCount(mainBranch, path) {
        const { stdout } = await (0, zx_1.$) `git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat ${path}/prisma.schema | awk '{ print $2}'`;
        return parseInt(stdout.trim(), 10);
    }
    async function getModifiedFileCount(mainBranch, path) {
        const { stdout } = await (0, zx_1.$) `git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat -- . :^${path} | wc -l`;
        return parseInt(stdout.trim(), 10);
    }
    async function run() {
        try {
            const mainBranch = core.getInput("main-branch");
            const path = core.getInput("path");
            const schemaRemovalCount = await getSchemaRemovalCount(mainBranch, path);
            console.log(`Detected ${schemaRemovalCount} lines removed`);
            const modifiedFileCount = await getModifiedFileCount(mainBranch, path);
            console.log(`Detected ${modifiedFileCount} modified files`);
            if (schemaRemovalCount > 0 && modifiedFileCount > 0) {
                const warning = core.getBooleanInput("warning");
                const fail = core.getBooleanInput("fail");
                const repeat = core.getBooleanInput("repeat");
                const message = core.getInput("message");
                console.log(`Options: Warning [${warning}], Fail [${fail}], Repeat [${repeat}]`);
                console.log(`Message: \n${message}`);
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
            core.info(`No potentially unsafe Prisma migration detected.`);
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    }
    run();
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__[109]();
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map