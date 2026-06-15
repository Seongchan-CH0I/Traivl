with open(r'c:\Traivl\Traivl\database\init.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'dynamic-media-cdn' in line:
        print(f"Line {i+1}: {line[:150]}...")
