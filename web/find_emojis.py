import os
import re

emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)
directory = r'c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app'

found_any = False
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx') or file.endswith('.css'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if emoji_pattern.search(content):
                        print(path)
                        found_any = True
            except Exception as e:
                pass

if not found_any:
    print("No emojis found!")
