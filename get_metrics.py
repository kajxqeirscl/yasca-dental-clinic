import os
import ast
import re

def count_lines(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return sum(1 for _ in f)
    except:
        return 0

def count_functions_python(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read())
        return sum(isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) for node in ast.walk(tree))
        # Wait, the prompt said functions, let's just count functions, not classes, but let's separate them.
    except:
        return 0

def count_functions_js_ts(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        # regex to roughly find function declarations and arrow functions
        func_matches = re.findall(r'(?:function\s+\w+\s*\(|=>\s*{|\w+\s*\([^)]*\)\s*{)', content)
        return len(func_matches)
    except:
        return 0

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    exclude_dirs = {'.git', 'node_modules', 'venv', 'dist', '.pytest_cache', '__pycache__', 'media', 'logs', '.husky', 'coverage', '.vscode', 'build', '.idea', '.agents'}
    valid_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md', '.json', '.yml', '.yaml'}
    
    total_lines = 0
    total_functions = 0
    file_count = 0
    
    metrics = {
        'lines_by_ext': {},
        'files_by_ext': {}
    }

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Modify dirnames in-place to avoid traversing excluded directories
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            if ext in valid_extensions:
                filepath = os.path.join(dirpath, filename)
                file_count += 1
                
                lines = count_lines(filepath)
                total_lines += lines
                
                metrics['lines_by_ext'][ext] = metrics['lines_by_ext'].get(ext, 0) + lines
                metrics['files_by_ext'][ext] = metrics['files_by_ext'].get(ext, 0) + 1
                
                if ext == '.py':
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            tree = ast.parse(f.read())
                        total_functions += sum(isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) for node in ast.walk(tree))
                    except:
                        pass
                elif ext in {'.js', '.jsx', '.ts', '.tsx'}:
                    total_functions += count_functions_js_ts(filepath)

    print("="*40)
    print("CODEBASE METRICS")
    print("="*40)
    print(f"Total Files Analyzed : {file_count}")
    print(f"Total Lines of Code  : {total_lines}")
    print(f"Total Functions      : {total_functions} (approximate for JS/TS)")
    print("-" * 40)
    print("Lines of Code by Extension:")
    for ext, count in sorted(metrics['lines_by_ext'].items(), key=lambda x: x[1], reverse=True):
        print(f"  {ext if ext else 'no_ext'}: {count} lines ({metrics['files_by_ext'][ext]} files)")
    print("="*40)

if __name__ == "__main__":
    main()
