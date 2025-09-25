import re
from pathlib import Path

SRC = Path('src')
FILES = list(SRC.rglob('*.js')) + list(SRC.rglob('*.jsx'))

id_token_re = re.compile(r"\b[a-zA-Z][a-z0-9-]*-[a-z0-9-]*\b")

changed_files = []

def kebab_to_camel(s):
    parts = s.split('-')
    return parts[0] + ''.join(p.capitalize() for p in parts[1:])

for p in FILES:
    text = p.read_text(encoding='utf8')
    parts = re.split(r'("[^"]*"|\'[^\']*\'|`[^`]*`)', text)
    new_parts = []
    modified = False
    for i, part in enumerate(parts):
        # parts with quotes are at odd indexes
        if i % 2 == 1:
            new_parts.append(part)
            continue
        # outside quotes: replace tokens
        def repl(m):
            tok = m.group(0)
            # heuristic: avoid changing CSS-like tokens starting with number
            if re.match(r'^[0-9]', tok):
                return tok
            new = kebab_to_camel(tok)
            if new != tok:
                nonlocal_mod = True
                return new
            return tok
        nonlocal_mod = False
        new_part = id_token_re.sub(repl, part)
        if new_part != part:
            modified = True
        new_parts.append(new_part)
    if modified:
        new_text = ''.join(new_parts)
        p.write_text(new_text, encoding='utf8')
        changed_files.append(str(p))

print('Modified', len(changed_files), 'JS/JSX files:')
for f in changed_files:
    print('-', f)
print('Done')
