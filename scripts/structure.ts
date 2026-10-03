// Checks that every operation in src/functions has its specs, its bench, its export, its chain method and a complete JSDoc,
// and that the operations are listed in alphabetical order.
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
/** The pages of the API reference that list operations: every page but the index. */
const API_REFERENCE_PAGE = /^documentation\/docs\/api-reference\/(?!index\.md$)[\w-]+\.md$/;
const SECTION = /^## (\w+)\s*$/;
const TLDR_ROW = /^\s*\| \[(\w+)\]\(#/;

interface INamedItem {
	name: string;
	line: number;
}

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

/** The named methods of the chain class, in the order of the file: not the constructor, not `[Symbol.iterator]`. */
function chainClassMethodItems(source: ts.SourceFile | undefined): INamedItem[] {
	return source?.statements.filter(ts.isClassDeclaration).flatMap(declaration =>
		declaration.members.filter(ts.isMethodDeclaration).filter(m => ts.isIdentifier(m.name))
			.map(method => ({ name: method.name.getText(source), line: lineOf(method) }))) ?? [];
}

/** The modules exported by `src/functions/index.ts`, without `./`. */
function exportedModules(source: ts.SourceFile | undefined): INamedItem[] {
	return source?.statements.filter(ts.isExportDeclaration)
		.filter(declaration => declaration.moduleSpecifier && ts.isStringLiteral(declaration.moduleSpecifier))
		.map(declaration => ({ name: (declaration.moduleSpecifier as ts.StringLiteral).text.replace(/^\.\//, ''), line: lineOf(declaration) })) ?? [];
}

/** The names imported from `./functions`. */
function importedOperations(source: ts.SourceFile | undefined): INamedItem[] {
	const declaration = source?.statements.filter(ts.isImportDeclaration)
		.find(d => ts.isStringLiteral(d.moduleSpecifier) && d.moduleSpecifier.text === './functions');
	const bindings = declaration?.importClause?.namedBindings;
	return bindings && ts.isNamedImports(bindings)
		? bindings.elements.map(element => ({ name: element.name.text, line: lineOf(element) }))
		: [];
}

function markdownItems(content: string, pattern: RegExp): INamedItem[] {
	return content.split('\n').flatMap((text, index) => {
		const name = pattern.exec(text)?.[1];
		return name === undefined ? [] : [{ name, line: index + 1 }];
	});
}

function compareNames(a: string, b: string): number {
	const [x, y] = [a.toLowerCase(), b.toLowerCase()];
	return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * The items out of alphabetical order. The same name may repeat (the overloads of an operation), but only next to itself.
 */
function checkOrder(path: string, items: INamedItem[], list: string): IStructureProblem[] {
	const problems: IStructureProblem[] = [];
	items.forEach((item, index) => {
		const previous = items[index - 1];
		if (previous === undefined || previous.name === item.name)
			return;
		if (items.slice(0, index - 1).some(other => other.name === item.name))
			problems.push({ path, line: item.line, message: `${list}: keep the overloads of "${item.name}" next to each other` });
		else if (compareNames(previous.name, item.name) > 0) {
			const next = items.find(other => compareNames(other.name, item.name) > 0)!;
			problems.push({ path, line: item.line, message: `${list}: "${item.name}" should come before "${next.name}" (alphabetical order)` });
		}
	});
	return problems;
}

function findOrderProblems(files: ISourceFile[], sources: Map<string, ts.SourceFile>): IStructureProblem[] {
	const chainClass = sources.get(CHAIN_CLASS);
	const problems = [
		...checkOrder(INDEX, exportedModules(sources.get(INDEX)), 'the exports'),
		...checkOrder(CHAIN_CLASS, importedOperations(chainClass), 'the imports from ./functions'),
		...checkOrder(CHAIN_CLASS, chainClassMethodItems(chainClass), 'the methods of the chain'),
		...checkOrder(CHAIN_INTERFACE, chainInterfaceMethods(sources.get(CHAIN_INTERFACE))
			.map(method => ({ name: method.name.getText(), line: lineOf(method) })), 'the members of IIterableLinqBase')
	];
	for (const { path, content } of files.filter(f => API_REFERENCE_PAGE.test(f.path))) {
		problems.push(...checkOrder(path, markdownItems(content, SECTION), 'the sections'));
		problems.push(...checkOrder(path, markdownItems(content, TLDR_ROW), 'the TLDR table'));
	}
	return problems;
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
		// `this` types the receiver of a chain method, it is not an argument
		if (ts.isIdentifier(parameter.name) && parameter.name.text !== 'this' && !documented.has(parameter.name.text))
			problems.push(`${label}: the JSDoc has no @param for "${parameter.name.text}"`);
	}
	return problems;
}

/**
 * Every operation of `src/functions` without its spec, wrapper spec, bench, export or chain method,
 * every exported function or chain method without a complete JSDoc,
 * and every operation out of alphabetical order in the exports, the chain and the API reference.
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
	return [...problems, ...findOrderProblems(files, sources)];
}
