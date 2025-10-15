import json
import re

def expand_years_in_applications(apps):
    expanded = []
    for app in apps:
        # Se for string, procura intervalos de anos
        if isinstance(app, str):
            # Encontra todos os intervalos e anos
            matches = re.findall(r'(\d{4})(?:-(\d{4}))?', app)
            if matches:
                # Remove anos do texto
                base = re.sub(r'\d{4}(?:-\d{4})?', '', app).strip()
                anos = []
                for start, end in matches:
                    if end:
                        anos.extend([str(y) for y in range(int(start), int(end)+1)])
                    else:
                        anos.append(start)
                # Gera string expandida
                if anos:
                    expanded.append(f"{base} {'-'.join(anos)}")
                else:
                    expanded.append(app)
            else:
                expanded.append(app)
        else:
            expanded.append(app)
    return expanded

def main():
    db_path = 'src/parts_db.json'
    with open(db_path, encoding='utf-8') as f:
        parts = json.load(f)
    for part in parts:
        if 'applications' in part:
            part['applications'] = expand_years_in_applications(part['applications'])
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(parts, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    main()
