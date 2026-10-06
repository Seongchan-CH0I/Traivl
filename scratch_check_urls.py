import re
import requests
import urllib.request
import urllib.error

with open('database/init.sql', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

places = []
for idx, line in enumerate(lines):
    line = line.strip()
    # Place insert lines: ('CITY_ID', 'Name', 'Category', 'Desc', 'ImageUrl', ...)
    if line.startswith("('") and ("'관광지'" in line or "'맛집'" in line or "'카페'" in line or "'체험'" in line or "'쇼핑'" in line or "'이벤트'" in line or "'숙소'" in line or "'명소'" in line):
        # find urls in line
        m = re.findall(r"'(http[^']+)'", line)
        # find name
        name_m = re.search(r"\('[^']+',\s*'([^']+)'", line)
        name = name_m.group(1) if name_m else f'Line_{idx+1}'
        if m:
            places.append((idx + 1, name, m[0]))

print(f"Found {len(places)} places with HTTP/HTTPS image URLs.")

failed = []
for line_num, name, url in places:
    # Test request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=3) as resp:
            status = resp.status
            content_type = resp.headers.get('Content-Type', '')
            if status != 200:
                failed.append((line_num, name, url, f"Status {status}"))
            elif not any(t in content_type.lower() for t in ['image', 'octet-stream', 'binary']):
                failed.append((line_num, name, url, f"Not image: {content_type}"))
    except urllib.error.HTTPError as e:
        failed.append((line_num, name, url, f"HTTP {e.code} ({e.reason})"))
    except Exception as e:
        failed.append((line_num, name, url, f"Error: {type(e).__name__} - {e}"))

print(f"\n--- FAILED / PROBLEMATIC URLS ({len(failed)}) ---")
for line_num, name, url, reason in failed:
    print(f"[Line {line_num}] {name}: {reason}")
    print(f"   URL: {url[:100]}...")
