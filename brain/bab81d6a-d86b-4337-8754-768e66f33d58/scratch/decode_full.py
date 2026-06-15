import re
import base64

sql_path = r'c:\Traivl\Traivl\database\init.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

camellia_line = None
for line in lines:
    if '카멜리아힐' in line:
        camellia_line = line
        break

if camellia_line:
    parts = re.findall(r"'([^']*)'", camellia_line)
    # The image url should be the long one
    img_url = None
    for part in parts:
        if len(part) > 100:
            img_url = part
            break
    
    if img_url:
        print("Image URL found! Length:", len(img_url))
        print("Starts with:", img_url[:50])
        # Let's decode it
        missing_padding = len(img_url) % 4
        padded_url = img_url
        if missing_padding:
            padded_url += '=' * (4 - missing_padding)
        
        try:
            decoded = base64.b64decode(padded_url)
            print("Decoded length:", len(decoded))
            print("First 20 bytes (hex):", decoded[:20].hex())
            # Save to temp file
            with open('camellia_decoded.jpg', 'wb') as out_f:
                out_f.write(decoded)
            print("Saved to camellia_decoded.jpg")
        except Exception as e:
            print("Decode error:", e)
    else:
        print("Image URL not found in parts:", parts)
else:
    print("카멜리아힐 line not found")
