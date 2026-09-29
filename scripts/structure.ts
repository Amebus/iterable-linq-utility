// Checks that every operation in src/functions has its specs, its bench, its export, its chain method and a complete JSDoc.
import ts from 'typescript';

import type { ISourceFile } from './since.ts';

export interface IStructureProblem {
	path: string;
	line: number;
	message: string;
}

/** Operations that start a chain: they have no chain method, and their wrapper spec and bench use the public name. */
const CHAIN_STARTERS: Record<string, string> = { empty: 'empty', range: 'fromRange', repeat: 'repeat' };

/** Exported functions of src/functions that are not operations: their JSDoc needs no `@operation` and no `@example`. */
const HELPERS = new Set(['getMemoizeDefaultOptions']);

const OPERATION_TAGS = ['operation', 'returns', 'example', 'since'];
const HELPER_TAGS = ['returns', 'since'];

const OPERATION_FILE = /^src\/functions\/(\w+)\.ts$/;
const INDEX = 'src/functions/index.ts';
const CHAIN_INTERFACE = 'src/types/iterableLinq.ts';
const CHAIN_CLASS = 'src/linqIterable.ts';

function parse(path: string, content: string): ts.SourceFile {
	return ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
}

function lineOf(node: ts.Node): number {
	const source = node.getSourceFile();
	return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function isExported(node: ts.FunctionDeclaration): boolean {
	return node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function exportedNames(source: ts.SourceFile | undefined): Set<string> {
	const names = new Set<string>();
	source?.statements.filter(ts.isExportDeclaration).forEach(declaration => {
		const clause = declaration.exportClause;
		if (clause && ts.isNamedExports(clause))
			clause.elements.forEach(element => names.add(element.name.text));
	});
	return names;
}

/** The operations of the chain: its named methods, not `[Symbol.iterator]`. */
function chainInterfaceMethods(source: ts.SourceFile | undefined): ts.MethodSignature[] {
	const chain = source?.statements.filter(ts.isInterfaceDeclaration).find(i => i.name.text === 'IIterableLinqBase');
	return chain?.members.filter(ts.isMethodSignature).filter(m => ts.isIdentifier(m.name)) ?? [];
}

function chainClassMethods(source: ts.SourceFile | undefined): Set<string> {
	const names = new Set<string>();
	source?.statements.filter(ts.isClassDeclaration).forEach(declaration =>
		declaration.members.filter(ts.isMethodDeclaration).forEach(method => names.add(method.name.getText(source))));
	return names;
}

/** The functions to document: every exported declaration, except the implementation of an overloaded function. */
function documentedFunctions(source: ts.SourceFile): ts.FunctionDeclaration[] {
	const functions = source.statements.filter(ts.isFunctionDeclaration).filter(f => f.name && isExported(f));
	return functions.filter(f => !(f.body && functions.some(other => other !== f && !other.body && other.name!.text === f.name!.text)));
}

function checkJsDoc(node: ts.SignatureDeclaration, label: string, tags: string[]): string[] {
	const doc = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc).at(-1);
	if (!doc)
		return [`${label}: no JSDoc`];

	const problems: string[] = [];
	if (!ts.getTextOfJSDocComment(doc.comment)?.trim())
		problems.push(`${label}: the JSDoc has no summary`);
	const present = new Set(doc.tags?.map(tag => tag.tagName.text));
	for (const tag of tags) {
		if (!present.has(tag))
			problems.push(`${label}: the JSDoc has no @${tag}`);
	}
	const documented = new Set(doc.tags?.filter(ts.isJSDocParameterTag).map(tag => tag.name.getText()));
	for (const parameter of node.parameters) {
		if (ts.isIdentifier(parameter.name) && !documented.has(parameter.name.text))
			problems.push(`${label}: the JSDoc has no @param for "${parameter.name.text}"`);
	}
	return problems;
}

/**
 * Every operation of `src/functions` without its spec, wrapper spec, bench, export or chain method,
 * and every exported function or chain method without a complete JSDoc.
 */
export function findStructureProblems(files: ISourceFile[]): IStructureProblem[] {
	const paths = new Set(files.map(f => f.path));
	const sources = new Map(files.filter(f => f.path.endsWith('.ts')).map(f => [f.path, parse(f.path, f.content)]));
	const exported = exportedNames(sources.get(INDEX));
	const interfaceMethods = chainInterfaceMethods(sources.get(CHAIN_INTERFACE));
	const interfaceNames = new Set(interfaceMethods.map(m => m.name.getText()));
	const classNames = chainClassMethods(sources.get(CHAIN_CLASS));

	const problems: IStructureProblem[] = [];
	for (const [path, source] of sources) {
		const name = OPERATION_FILE.exec(path)?.[1];
		if (!name || path === INDEX)
			continue;

		const functions = documentedFunctions(source);
		const main = functions.find(f => f.name!.text === name);
		const report = (message: string, line = main ? lineOf(main) : 1) => problems.push({ path, line, message });

		const publicName = CHAIN_STARTERS[name];
		const required = publicName === undefined
			? [`test/functions/${name}.spec.ts`, `test/linqIterableWrapper/${name}.spec.ts`, `test/bench/functions/${name}.bench.ts`]
			: [`test/functions/${name}.spec.ts`, `test/${publicName}.spec.ts`, `test/bench/functions/${publicName}.bench.ts`];
		required.filter(file => !paths.has(file)).forEach(file => report(`"${name}" has no ${file}`));

		if (!exported.has(name))
			report(`"${name}" is not exported from ${INDEX}`);
		if (publicName === undefined && !interfaceNames.has(name))
			report(`"${name}" has no method on IIterableLinqBase in ${CHAIN_INTERFACE}`);
		if (publicName === undefined && !classNames.has(name))
			report(`"${name}" has no method in ${CHAIN_CLASS}`);

		for (const f of functions) {
			const tags = HELPERS.has(f.name!.text) ? HELPER_TAGS : OPERATION_TAGS;
			checkJsDoc(f, f.name!.text, tags).forEach(message => report(message, lineOf(f)));
		}
	}

	for (const method of interfaceMethods) {
		checkJsDoc(method, `IIterableLinqBase.${method.name.getText()}`, OPERATION_TAGS)
			.forEach(message => problems.push({ path: CHAIN_INTERFACE, line: lineOf(method), message }));
	}
	return problems;
}
