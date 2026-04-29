
import re

def reorder_places(sql_content):
    # Regex to find INSERT INTO "Place" blocks
    # It looks for the INSERT statement and then all lines until a semicolon
    insert_pattern = re.compile(r'(INSERT INTO "Place" [^;]+;)', re.DOTALL)
    
    def process_block(match):
        block = match.group(1)
        header_match = re.match(r'(INSERT INTO "Place" \([^)]+\) VALUES\n)', block)
        if not header_match:
            return block
        
        header = header_match.group(1)
        values_part = block[len(header):].strip()
        if values_part.endswith(';'):
            values_part = values_part[:-1]
        
        # Split by lines, assuming each line is one row ending with ), or ,
        # This is a bit naive but works for the current file structure
        rows = []
        # Use regex to find rows like ('...', ..., ...)
        row_pattern = re.compile(r"(\([^)]+\))", re.DOTALL)
        raw_rows = row_pattern.findall(values_part)
        
        parsed_rows = []
        for rr in raw_rows:
            # We need to extract the category and rank.
            # Category is the 3rd column, rank is the 6th.
            # Splitting by comma is tricky because of ARRAY['...'] and strings with commas.
            # However, for this specific file, we can try to find them.
            
            # Category is always '관광지' or '맛집'
            category = '관광지' if "'관광지'" in rr else '맛집'
            parsed_rows.append({'raw': rr, 'category': category})
            
        # Sort: '관광지' first, then '맛집'
        # In Python, '관광지' < '맛집' is True (ㄱ < ㅁ)
        parsed_rows.sort(key=lambda x: x['category'])
        
        # Re-assign ranks 1 to 10
        final_rows = []
        for i, row in enumerate(parsed_rows):
            raw = row['raw']
            # Find the rank (it's the first integer after the 5th comma-separated part)
            # Or we can just use regex to replace the rank.
            # The rank is usually after the imageUrl (which is a URL) and before the address.
            # Let's try a safer way: split by comma but respect quotes/arrays.
            # Actually, the rank is the 6th element.
            
            parts = []
            current = []
            in_quote = False
            in_array = False
            for char in raw:
                if char == "'" and not in_array:
                    in_quote = not in_quote
                    current.append(char)
                elif char == "[" and not in_quote:
                    in_array = True
                    current.append(char)
                elif char == "]" and not in_quote:
                    in_array = False
                    current.append(char)
                elif char == "," and not in_quote and not in_array:
                    parts.append("".join(current).strip())
                    current = []
                else:
                    current.append(char)
            parts.append("".join(current).strip())
            
            # parts[5] is the rank
            parts[5] = str(i + 1)
            
            new_row = ", ".join(parts)
            final_rows.append(new_row)
            
        # Join rows with comma and newline
        new_values = ",\n".join(final_rows) + ";"
        return header + new_values

    return insert_pattern.sub(process_block, sql_content)

if __name__ == "__main__":
    with open(r'c:\Traivl\Traivl\database\init.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = reorder_places(content)
    
    with open(r'c:\Traivl\Traivl\database\init.sql', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully reordered places in init.sql")
