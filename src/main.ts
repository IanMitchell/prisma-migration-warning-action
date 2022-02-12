import fs from "node:fs";
import * as core from "@actions/core";
import { Octokit } from "@octokit/action";
import { execSync } from "node:child_process";

const octokit = new Octokit();
const [OWNER, REPOSITORY] = process.env.GITHUB_REPOSITORY!.split("/");

function getPullRequestId() {
	const ev = JSON.parse(
		fs.readFileSync(process.env.GITHUB_EVENT_PATH!, "utf8")
	);
	console.log(ev);
	return ev.pull_request.number;
}

async function getSchemaRemovalCount(mainBranch: string, path: string) {
	const stdout = execSync(
		`git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat ${path}/prisma.schema | awk '{ print $2}'`
	);
	return parseInt(stdout.toString().trim(), 10);
}

async function getModifiedFileCount(mainBranch: string, path: string) {
	const stdout = execSync(
		`git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat -- . :^${path} | wc -l`
	);

	return parseInt(stdout.toString().trim(), 10);
}

async function run(): Promise<void> {
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
			console.log(
				`Options: Warning [${warning}], Fail [${fail}], Repeat [${repeat}]`
			);
			console.log(`Message: \n${message}`);

			if (warning) {
				const id = getPullRequestId();
				const comments = await octokit.issues.listComments({
					owner: OWNER,
					repo: REPOSITORY,
					issue_number: id,
				});
				const isWarningPosted = comments.data.some(
					(comment) => comment.body === message
				);

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
				core.setFailed(
					"Potentially unsafe Prisma migration detected. Please separate migration changes into their own Pull Request."
				);
			}
		}
		core.info(`No potentially unsafe Prisma migration detected.`);
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
	}
}

run();
