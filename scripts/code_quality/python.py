import ast
import json
import sys
from pathlib import Path

FUNCTIONS = (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)
BRANCHES = (ast.If, ast.IfExp, ast.For, ast.AsyncFor, ast.While, ast.ExceptHandler, ast.Assert)


def match_decisions(node):
    wildcard = isinstance(node.pattern, ast.MatchAs) and node.pattern.pattern is None
    return int(not wildcard) + int(node.guard is not None)


def node_decisions(node):
    if isinstance(node, ast.BoolOp):
        return len(node.values) - 1
    if isinstance(node, ast.comprehension):
        return 1 + len(node.ifs)
    if isinstance(node, ast.match_case):
        return match_decisions(node)
    if isinstance(node, ast.MatchOr):
        return len(node.patterns) - 1
    return int(isinstance(node, BRANCHES))


def count_decisions(node, owner):
    if node is not owner and isinstance(node, FUNCTIONS):
        return 0
    return node_decisions(node) + sum(
        count_decisions(child, owner) for child in ast.iter_child_nodes(node)
    )


def function_record(node):
    return {
        "name": getattr(node, "name", "<lambda>"),
        "start": node.lineno,
        "end": node.end_lineno,
        "lines": node.end_lineno - node.lineno + 1,
        "ccn": 1 + count_decisions(node, node),
    }


def measure_file(file):
    source = Path(file).read_text(encoding="utf-8")
    errors = []
    try:
        tree = ast.parse(source, filename=file)
    except SyntaxError as error:
        errors.append({"line": error.lineno, "message": error.msg})
        tree = ast.Module(body=[], type_ignores=[])
    functions = [function_record(node) for node in ast.walk(tree) if isinstance(node, FUNCTIONS)]
    decisions = sum(entry["ccn"] - 1 for entry in functions)
    count = len(functions)
    return {
        "file": file,
        "lines": len(source.splitlines()),
        "functions": functions,
        "errors": errors,
        "decisions": decisions,
        "average_ccn": (decisions + count) / count if count else 0,
        "above_10": sum(entry["ccn"] > 10 for entry in functions),
        "max_ccn": max((entry["ccn"] for entry in functions), default=0),
    }


if __name__ == "__main__":
    print(json.dumps([measure_file(file) for file in sys.argv[1:]]))
