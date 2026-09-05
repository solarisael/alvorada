import ts from "typescript";
import { convertToTSX } from "@astrojs/compiler";
import {
  TraceMap,
  originalPositionFor,
  LEAST_UPPER_BOUND,
} from "@jridgewell/trace-mapping";

const branching_kinds = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ConditionalExpression,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.CatchClause,
  ts.SyntaxKind.CaseClause,
]);
const logical_kinds = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);
const optional_kinds = new Set([
  ts.SyntaxKind.PropertyAccessExpression,
  ts.SyntaxKind.ElementAccessExpression,
  ts.SyntaxKind.CallExpression,
]);
const defaulted_kinds = new Set([
  ts.SyntaxKind.Parameter,
  ts.SyntaxKind.BindingElement,
]);

const node_decisions = (node) => {
  if (branching_kinds.has(node.kind)) return 1;
  if (ts.isBinaryExpression(node)) {
    return Number(logical_kinds.has(node.operatorToken.kind));
  }
  if (optional_kinds.has(node.kind))
    return Number(Boolean(node.questionDotToken));
  if (defaulted_kinds.has(node.kind)) return Number(Boolean(node.initializer));
  return 0;
};

const count_decisions = (node, owner) => {
  if (node !== owner && ts.isFunctionLike(node)) return 0;
  let count = node_decisions(node);
  ts.forEachChild(node, (child) => {
    count += count_decisions(child, owner);
  });
  return count;
};

const function_name = (node, tree) => {
  if (node.name) return node.name.getText(tree);
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) {
    return parent.name.getText(tree);
  }
  return "<anonymous>";
};

const parse_functions = (file, source) => {
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const line_at = (position) =>
    tree.getLineAndCharacterOfPosition(position).line + 1;
  const functions = [];
  const visit = (node) => {
    if (ts.isFunctionLike(node) && node.body) {
      const start = line_at(node.getStart(tree));
      const end = line_at(node.end);
      functions.push({
        name: function_name(node, tree),
        start,
        end,
        lines: end - start + 1,
        ccn: 1 + count_decisions(node, node),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  const errors = tree.parseDiagnostics.map((diagnostic) => ({
    line: line_at(diagnostic.start ?? 0),
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
  }));
  return { functions, errors };
};

const source_line = (trace, line) => {
  const original = originalPositionFor(trace, {
    line,
    column: 0,
    bias: LEAST_UPPER_BOUND,
  });
  if (original.line === null)
    throw new Error(`Unmapped Astro function at generated line ${line}`);
  return original.line;
};

const astro_functions = async (file, source) => {
  const compiled = await convertToTSX(source, { filename: file });
  const trace = new TraceMap(compiled.map);
  const parsed = parse_functions(`${file}.tsx`, compiled.code);
  const functions = parsed.functions
    .filter((entry) => {
      // Astro emits a synthetic default export; it is not a production function.
      return !(
        entry.name.endsWith("__AstroComponent_") &&
        source_line(trace, entry.start) === 1
      );
    })
    .map((entry) => {
      const start = source_line(trace, entry.start);
      const end = source_line(trace, entry.end);
      return { ...entry, start, end, lines: end - start + 1 };
    });
  return { functions, errors: parsed.errors };
};

export const measure_source = async (file, source) => {
  const parsed = file.endsWith(".astro")
    ? await astro_functions(file, source)
    : parse_functions(file, source);
  const decisions = parsed.functions.reduce(
    (sum, entry) => sum + entry.ccn - 1,
    0,
  );
  const count = parsed.functions.length;
  return {
    file,
    lines: source.split(/\r?\n/).length,
    functions: parsed.functions,
    errors: parsed.errors,
    decisions,
    average_ccn: count === 0 ? 0 : (decisions + count) / count,
    above_10: parsed.functions.filter((entry) => entry.ccn > 10).length,
    max_ccn: Math.max(0, ...parsed.functions.map((entry) => entry.ccn)),
  };
};

export const exceeds_budget = (entry) =>
  entry.errors.length > 0 ||
  entry.max_ccn > 15 ||
  entry.average_ccn > 4 ||
  entry.above_10 > 1 ||
  entry.decisions > 60;
