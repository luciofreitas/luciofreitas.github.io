import re
import os
from pathlib import Path

SRC = Path('src')
EXT = ('.js', '.jsx', '.css', '.scss', '.html')

origins = set()

# find className occurrences
cn_re = re.compile(r'className\s*=\s*(?:"([^"]*)"|\'([^\']*)\')')
css_sel_re = re.compile(r'\.([A-Za-z0-9_]+)')

for p in SRC.rglob('*'):
    if p.suffix.lower() in EXT:
        text = p.read_text(encoding='utf8')
        # className attributes
        for m in cn_re.finditer(text):
            val = m.group(1) or m.group(2)
            if val:
                for token in re.split(r'\s+', val.strip()):
                    if '_' in token or re.search(r'[A-Z]', token):
                        origins.add(token)
        # css selectors
        for m in css_sel_re.finditer(text):
            token = m.group(1)
            if token and ('_' in token or re.search(r'[A-Z]', token)):
                origins.add(token)

origins = sorted(origins)

def to_kebab(name):
    s = name
    # replace underscores and double underscores and double dashes with hyphen
    s = re.sub(r'[_]+', '-', s)
    s = re.sub(r'-{2,}', '-', s)
    # insert hyphen between camelCase boundaries
    s = re.sub(r'([a-z0-9])([A-Z])', r"\1-\2", s)
    s = s.replace('--', '-')
    s = s.lower()
    s = re.sub(r'-{2,}', '-', s)
    s = s.strip('-')
    return s

mapping = {o: to_kebab(o) for o in origins if to_kebab(o) != o}

if not mapping:
    print('No class names to rename found.')
    exit(0)

print('Found {} class names to rename.'.format(len(mapping)))
for k,v in mapping.items():
    print(f'{k} -> {v}')

# apply replacements
changed_files = set()

# patterns for replacements
# in className attributes: we'll parse attributes and replace tokens
cn_attr_re = re.compile(r'(className\s*=\s*)("[^"]*"|\'[^\']*\')')

for p in SRC.rglob('*'):
    if p.suffix.lower() in EXT:
        text = p.read_text(encoding='utf8')
        original_text = text
        if p.suffix.lower() in ('.js', '.jsx', '.html'):
            # replace inside className attributes
            def repl_attr(m):
                prefix = m.group(1)
                quoteval = m.group(2)
                quote = quoteval[0]
                val = quoteval[1:-1]
                tokens = re.split(r'\s+', val) if val.strip() else []
                newtokens = []
                changed = False
                for t in tokens:
                    if t in mapping:
                        newtokens.append(mapping[t])
                        changed = True
                    else:
                        newtokens.append(t)
                newval = ' '.join(newtokens)
                return prefix + quote + newval + quote
            text = cn_attr_re.sub(repl_attr, text)
            # also globally replace any standalone occurrences in strings or JSX
            for old, new in mapping.items():
                # word boundary replacement
                text = re.sub(r'(?<![\w-])' + re.escape(old) + r'(?![\w-])', new, text)
        else:
            # css-like file: replace selectors .old and occurrences
            for old, new in mapping.items():
                # replace .old where followed by space, {, ., :, >, #, [, comma, eol
                text = re.sub(r'(?<=\.)' + re.escape(old) + r'(?=[\s\.{:,>\[#]|$)', new, text)
                # also replace occurrences in other contexts safely
                text = re.sub(r'(?<![\w-])' + re.escape(old) + r'(?![\w-])', new, text)

        if text != original_text:
            p.write_text(text, encoding='utf8')
            changed_files.add(str(p))

print('\nModified {} files.'.format(len(changed_files)))
for f in sorted(changed_files):
    print('-', f)

# exit with success
print('\nDone. Now please check, then commit changes.')
