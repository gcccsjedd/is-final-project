import json

# Load the JSON file
with open('items.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Clean each item
for item in data:
    item.pop('stats', None)  # Remove 'icon' if it exists

# Save cleaned JSON
with open('cleaned_items.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
