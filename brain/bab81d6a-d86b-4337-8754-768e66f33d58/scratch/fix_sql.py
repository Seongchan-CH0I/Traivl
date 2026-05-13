
import re

def reorder_places(sql_content):
    # Regex to find INSERT INTO "Place" blocks
    insert_pattern = re.compile(r'(INSERT INTO "Place" \([^)]+\) VALUES\n(.*?);)', re.DOTALL)
    
    def process_block(match):
        full_statement = match.group(1)
        header = match.group(1).split('VALUES\n')[0] + 'VALUES\n'
        values_part = match.group(2).strip()
        
        # Split by rows
        # We need to be careful with commas inside strings/arrays.
        # Each row ends with ), or );
        rows_raw = re.findall(r"(\([^)]+\))", values_part, re.DOTALL)
        
        parsed_rows = []
        for rr in rows_raw:
            # Category is '관광지' or '맛집'
            category = '관광지' if "'관광지'" in rr else '맛집'
            
            # Parse columns to get current rank
            parts = []
            current = []
            in_quote = False
            in_array = False
            for char in rr:
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
            
            parsed_rows.append({'parts': parts, 'category': category})
            
        # Sort: '관광지' first, then '맛집'
        parsed_rows.sort(key=lambda x: 0 if x['category'] == '관광지' else 1)
        
        # Re-assign ranks 1 to 10
        final_rows = []
        for i, row in enumerate(parsed_rows):
            parts = row['parts']
            # parts[5] is the rank
            parts[5] = str(i + 1)
            final_rows.append(", ".join(parts))
            
        new_values = ",\n".join(final_rows) + ";"
        return header + new_values

    return insert_pattern.sub(process_block, sql_content)

if __name__ == "__main__":
    with open(r'c:\Traivl\Traivl\database\init.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = reorder_places(content)
    
    with open(r'c:\Traivl\Traivl\database\init.sql', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully reordered places and ranks in init.sql")
