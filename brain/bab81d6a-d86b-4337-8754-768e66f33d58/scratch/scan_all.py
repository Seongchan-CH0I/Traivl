import re

sql_path = r'c:\Traivl\Traivl\database\init.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find all values under INSERT INTO "Place"
# We can find the rows inside parenthesis
# We'll split the query to isolate the Place inserts
place_inserts = re.findall(r'INSERT INTO "Place" [^;]+;', content, re.DOTALL)

for i, insert in enumerate(place_inserts):
    print(f"Insert statement {i+1}:")
    rows = re.findall(r'\(([^)]+)\)', insert, re.DOTALL)
    for r in rows:
        # split by comma, but be mindful of quotes
        # simple quote splitter:
        parts = re.findall(r"'([^']*)'", r)
        if len(parts) >= 2:
            name = parts[1]
            img = ""
            for p in parts[2:]:
                if len(p) > 50:
                    img = p
                    break
                elif p.startswith('http'):
                    img = p
                    break
            print(f"  Name: {name}, Image URL Prefix: {img[:60]}... (Len: {len(img)})")
