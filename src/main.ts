import * as core from "@actions/core";
import { $ } from "zx";

async function getSchemaRemovalCount(mainBranch: string, path: string) {
	const { stdout } =
		await $`git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat ${path} | awk '{ print $2}'`;
	return parseInt(stdout.trim(), 10);
}

// TODO: Ignore anything under `prisma/*` (migration files)
async function getModifiedFileCount(mainBranch: string) {
	const { stdout } =
		await $`git diff $(git log -n 1 origin/${mainBranch} --pretty=format:"%H") $(git log -n 1 --pretty=format:"%H") --numstat | wc -l`;

	return parseInt(stdout.trim(), 10);
}

async function run(): Promise<void> {
	try {
		const mainBranch = core.getInput("main-branch");
		const path = core.getInput("path");

		const schemaRemovalCount = await getSchemaRemovalCount(mainBranch, path);
		const modifiedFileCount = await getModifiedFileCount(mainBranch);

		if (schemaRemovalCount > 0 && modifiedFileCount > 0) {
			const warning = core.getBooleanInput("warning");
			const fail = core.getBooleanInput("fail");
			const repeat = core.getBooleanInput("repeat");
			const message = core.getMultilineInput("message");

			if (fail) {
				core.setFailed(
					"Potentially unsafe Prisma migration detected. Please separate migration changes into their own Pull Request."
				);
			}

			if (warning) {
				// Get previous comments
				// check if it exists && repeat
				// create comment with message
			}
		}
		core.info(`No potentially unsafe Prisma migration detected.`);
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
	}
}

run();
