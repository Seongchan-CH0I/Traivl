import re

sql_path = r'c:\Traivl\Traivl\database\init.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find all rows inside INSERT INTO "Place"
place_inserts = re.findall(r'INSERT INTO "Place" [^;]+;', content, re.DOTALL)

invalid_count = 0
for i, insert in enumerate(place_inserts):
    rows = re.findall(r'\(([^)]+)\)', insert, re.DOTALL)
    for r in rows:
        parts = re.findall(r"'([^']*)'", r)
        if len(parts) >= 2:
            name = parts[1]
            img = None
            for p in parts[2:]:
                # Usually image URL is base64 (starts with gaon... or data:...) or starts with http
                # Let's find the one that fits length or starts with http/data/url pattern
                if len(p) > 50 or p.startswith('http'):
                    img = p
                    break
            
            if img:
                if not (img.startswith('http') or img.startswith('data:')):
                    print(f"Invalid Image URL for: {name}")
                    print(f"  Prefix: {img[:100]}")
                    print(f"  Length: {len(img)}")
                    invalid_count += 1
            else:
                print(f"Could not extract image for: {name}")

print(f"Total invalid: {invalid_count}")
