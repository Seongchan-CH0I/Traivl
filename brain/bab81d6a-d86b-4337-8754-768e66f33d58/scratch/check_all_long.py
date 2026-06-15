import re

sql_path = r'c:\Traivl\Traivl\database\init.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all single-quoted strings
strings = re.findall(r"'([^']*)'", content)

long_non_conforming = []
for s in strings:
    if len(s) > 100:
        if not (s.startswith('http') or s.startswith('data:')):
            long_non_conforming.append(s)

print(f"Found {len(long_non_conforming)} non-conforming long strings:")
for s in long_non_conforming:
    print(f"Length: {len(s)}")
    print(f"Prefix: {s[:100]}...")
