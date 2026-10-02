// Checks the messages of the commits of a pull request: a feat, fix, perf or refactor commit explains itself in a body.

export interface ICommit {
	hash: string;
	subject: string;
	body: string;
}

const NEEDS_BODY = /^(feat|fix|perf|refactor)(\([^)]*\))?!?:/;
/** Lines that are not an explanation: trailers like `Co-Authored-By:` and the issue links like `Closes #12`. */
const NOT_AN_EXPLANATION = /^([A-Za-z]+(-[A-Za-z]+)+: .*|(close[sd]?|fix(e[sd])?|resolve[sd]?|refs?) #\d+)$/i;

/**
 * The `feat`, `fix`, `perf` and `refactor` commits whose body says nothing more than the trailers and the issue links.
 */
export function findCommitsWithoutBody(commits: ICommit[]): ICommit[] {
	return commits.filter(commit => NEEDS_BODY.test(commit.subject)
		&& commit.body.split('\n').map(line => line.trim()).every(line => line === '' || NOT_AN_EXPLANATION.test(line)));
}
