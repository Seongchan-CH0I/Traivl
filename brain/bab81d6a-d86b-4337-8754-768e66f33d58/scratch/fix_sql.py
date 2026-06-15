import os

sql_path = r'c:\Traivl\Traivl\database\init.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
changed = False
for line in lines:
    if '카멜리아힐' in line and 'gaonrnKcVIkvVi' in line:
        # replace the long base64 string with the unsplash url
        # the line looks like:
        # ('KR_JEJU', '카멜리아힐', '관광지', '동백꽃 정원', 'gaonrn...', 4, '서귀포시 안덕면', 33.289, 126.369, '08:30-19:00', '064-792-0088', ARRAY['#동백','#사진'], 8000, 4.5),
        # We can find the quote after '동백꽃 정원', 
        # and replace the next single-quoted segment.
        import re
        parts = re.findall(r"'([^']*)'", line)
        for part in parts:
            if 'gaonrnKcVIkvVi' in part:
                line = line.replace(f"'{part}'", "'https://images.unsplash.com/photo-1542350327-463ff302029a?q=80&w=800'")
                changed = True
                break
    new_lines.append(line)

if changed:
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Success: init.sql updated successfully!")
else:
    print("Error: Target line not found or not matched in init.sql")
