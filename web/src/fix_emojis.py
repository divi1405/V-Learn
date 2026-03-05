import os

search_dir = r"c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src"

replacements = {
    "â ±": "⏱",
    "â†’": "→",
    "â† ": "←",
    "â °": "⏰",
    "âš ï¸ ": "⚠️",
    "âš\x00ï¸ ": "⚠️", # Sometimes invisible characters get in
    "âœ…": "✅",
    "ðŸ””": "🔔",
    "ðŸ“‹": "📋",
    "ðŸ †": "🏆",
    "ðŸ”•": "🔕",
    "ðŸ” ": "🔑",
    "ðŸ”’": "🔒",
    "ðŸ‘¥": "👥",
}

modified_count = 0

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(".js") or file.endswith(".jsx") or file.endswith(".css"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                original = content
                
                for bad, good in replacements.items():
                    content = content.replace(bad, good)
                
                # Also handle the warning symbol which was weirdly encoded as âš  (with non-breaking space)
                content = content.replace("âš" + chr(160) + "ï¸ ", "⚠️")
                content = content.replace("âš ï¸ ", "⚠️")

                if content != original:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Fixed: {filepath}")
                    modified_count += 1
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

print(f"Total modified: {modified_count}")
