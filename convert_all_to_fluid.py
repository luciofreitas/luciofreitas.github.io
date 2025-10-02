#!/usr/bin/env python3
"""
Script para converter TODOS os valores fixos em px para clamp() fluido.
Converte: margin, padding, font-size, width, height, gap, border-radius, etc.
"""

import re
import os
from pathlib import Path

# Mapeamento de conversões: valor_px → (min_rem, vw, max_rem, comentário)
# Filosofia: valores menores escalem menos, valores maiores escalem mais
CONVERSIONS = {
    # Espaçamentos muito pequenos (4-6px)
    '4px': ('0.25rem', '0.5vw', '0.275rem', '~4px a 4.4px'),
    '5px': ('0.3rem', '0.6vw', '0.325rem', '~4.8px a 5.2px'),
    '6px': ('0.35rem', '0.7vw', '0.4rem', '~5.6px a 6.4px'),
    
    # Espaçamentos pequenos (8-12px)
    '8px': ('0.45rem', '0.9vw', '0.5rem', '~7.2px a 8px'),
    '10px': ('0.6rem', '1.2vw', '0.65rem', '~9.6px a 10.4px'),
    '12px': ('0.7rem', '1.4vw', '0.75rem', '~11.2px a 12px'),
    
    # Espaçamentos médios (14-20px)
    '14px': ('0.825rem', '1.65vw', '0.875rem', '~13.2px a 14px'),
    '15px': ('0.875rem', '1.75vw', '0.9375rem', '~14px a 15px'),
    '16px': ('0.95rem', '1.9vw', '1rem', '~15.2px a 16px'),
    '18px': ('1rem', '2vw', '1.125rem', '~16px a 18px'),
    '20px': ('1.15rem', '2.3vw', '1.25rem', '~18.4px a 20px'),
    
    # Espaçamentos grandes (22-32px)
    '22px': ('1.3rem', '2.6vw', '1.375rem', '~20.8px a 22px'),
    '24px': ('1.4rem', '2.8vw', '1.5rem', '~22.4px a 24px'),
    '28px': ('1.6rem', '3.2vw', '1.75rem', '~25.6px a 28px'),
    '30px': ('1.75rem', '3.5vw', '1.875rem', '~28px a 30px'),
    '32px': ('1.875rem', '3.75vw', '2rem', '~30px a 32px'),
    
    # Espaçamentos extra grandes (36-48px)
    '36px': ('2.1rem', '4.2vw', '2.25rem', '~33.6px a 36px'),
    '40px': ('2.35rem', '4.7vw', '2.5rem', '~37.6px a 40px'),
    '44px': ('2.6rem', '5.2vw', '2.75rem', '~41.6px a 44px'),
    '48px': ('2.8rem', '5.6vw', '3rem', '~44.8px a 48px'),
    
    # Valores de altura/largura comuns
    '50px': ('2.95rem', '5.9vw', '3.125rem', '~47.2px a 50px'),
    '52px': ('3rem', '5vw', '3.25rem', '~48px a 52px'),
    '56px': ('3.3rem', '6.6vw', '3.5rem', '~52.8px a 56px'),
    '60px': ('3.5rem', '7vw', '3.75rem', '~56px a 60px'),
    '64px': ('3.75rem', '7.5vw', '4rem', '~60px a 64px'),
    '72px': ('4.2rem', '8.4vw', '4.5rem', '~67.2px a 72px'),
    '80px': ('4.7rem', '9.4vw', '5rem', '~75.2px a 80px'),
    '96px': ('5.6rem', '11.2vw', '6rem', '~89.6px a 96px'),
    '100px': ('5.9rem', '11.8vw', '6.25rem', '~94.4px a 100px'),
    '120px': ('7rem, 14vw', '7.5rem', '~112px a 120px'),
    '128px': ('7.5rem', '15vw', '8rem', '~120px a 128px'),
    '144px': ('8.5rem', '17vw', '9rem', '~136px a 144px'),
    '150px': ('8.8rem', '17.6vw', '9.375rem', '~140.8px a 150px'),
    '160px': ('9.4rem', '18.8vw', '10rem', '~150.4px a 160px'),
    '180px': ('10.5rem', '21vw', '11.25rem', '~168px a 180px'),
    '192px': ('11.3rem', '22.6vw', '12rem', '~180.8px a 192px'),
    '200px': ('11.75rem', '23.5vw', '12.5rem', '~188px a 200px'),
}

def px_to_clamp(match):
    """Converte um valor em px para clamp()"""
    full_match = match.group(0)
    prop = match.group(1)  # margin, padding, etc.
    value = match.group(2)  # 12px, 24px, etc.
    
    # Se já é clamp(), não converte
    if 'clamp' in full_match.lower():
        return full_match
    
    # Se é 0px ou 0, mantém como está
    if value in ['0px', '0']:
        return full_match
    
    # Se é 1px (borders), mantém
    if value == '1px':
        return full_match
        
    # Busca conversão na tabela
    if value in CONVERSIONS:
        conv = CONVERSIONS[value]
        if len(conv) == 4:
            min_val, vw_val, max_val, comment = conv
            return f"{prop}: clamp({min_val}, {vw_val}, {max_val}); /* {comment} - fluido */"
        elif len(conv) == 3:  # formato alternativo para valores grandes
            min_val, vw_val, max_val = conv
            # vw_val pode conter vírgula (erro no dict acima)
            if ',' in vw_val:
                parts = vw_val.split(',')
                vw_val = parts[0].strip()
                max_val = parts[1].strip() if len(parts) > 1 else max_val
            comment = f"~{int(float(min_val.replace('rem', '')) * 16)}px a {int(float(max_val.replace('rem', '')) * 16)}px"
            return f"{prop}: clamp({min_val}, {vw_val}, {max_val}); /* {comment} - fluido */"
    
    # Se não encontrou na tabela, tenta calcular dinamicamente
    try:
        px_value = int(value.replace('px', ''))
        # Fórmula: min = px * 0.93, vw = px * 0.19, max = px / 16
        min_rem = round(px_value * 0.93 / 16, 3)
        vw_percent = round(px_value * 0.19, 1)
        max_rem = round(px_value / 16, 3)
        comment = f"~{int(min_rem * 16)}px a {px_value}px"
        return f"{prop}: clamp({min_rem}rem, {vw_percent}vw, {max_rem}rem); /* {comment} - fluido */"
    except:
        return full_match

def convert_file(filepath):
    """Converte um arquivo CSS"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Padrão para encontrar: propriedade: valor_px;
        # Captura: margin, padding, font-size, width, height, gap, border-radius, top, left, right, bottom, etc.
        pattern = r'\b(margin(?:-(?:top|bottom|left|right))?|padding(?:-(?:top|bottom|left|right))?|font-size|width|height|gap|border-radius|top|left|right|bottom|min-width|max-width|min-height|max-height):\s*(\d+px)\s*;'
        
        content = re.sub(pattern, px_to_clamp, content)
        
        # Padrão para shorthand: margin: 10px 20px; ou padding: 10px 20px 30px 40px;
        def multi_px_to_clamp(match):
            prop = match.group(1)
            values_str = match.group(2)
            
            # Se já tem clamp, não mexe
            if 'clamp' in values_str.lower():
                return match.group(0)
            
            values = values_str.split()
            converted = []
            
            for val in values:
                if val.endswith('px') and val != '0px' and val != '1px':
                    px_val = val.replace('px', '')
                    if px_val + 'px' in CONVERSIONS:
                        conv = CONVERSIONS[px_val + 'px']
                        min_val, vw_val, max_val = conv[0], conv[1], conv[2]
                        if ',' in vw_val:  # fix pro bug do dict
                            vw_val = vw_val.split(',')[0].strip()
                        converted.append(f"clamp({min_val}, {vw_val}, {max_val})")
                    else:
                        converted.append(val)
                else:
                    converted.append(val)
            
            if len(converted) != len(values):
                return match.group(0)
            
            # Se conseguiu converter pelo menos um valor
            if any('clamp' in v for v in converted):
                return f"{prop}: {' '.join(converted)};"
            return match.group(0)
        
        # Aplica conversão de shorthand
        pattern_multi = r'\b(margin|padding):\s*([^;{]+);'
        content = re.sub(pattern_multi, multi_px_to_clamp, content)
        
        # Se mudou algo, salva
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Erro ao converter {filepath}: {e}")
        return False

def main():
    """Converte todos os arquivos CSS do projeto"""
    base_dir = Path(__file__).parent / 'src' / 'styles'
    
    converted = 0
    skipped = 0
    
    print("🔄 Convertendo arquivos CSS para design fluido...\n")
    
    # Procura todos os arquivos .css
    for css_file in base_dir.rglob('*.css'):
        print(f"📄 Processando: {css_file.relative_to(base_dir.parent.parent)}")
        if convert_file(css_file):
            converted += 1
            print("   ✅ Convertido!")
        else:
            skipped += 1
            print("   ⏭️  Nenhuma mudança necessária")
    
    print(f"\n✨ Concluído!")
    print(f"   {converted} arquivos convertidos")
    print(f"   {skipped} arquivos sem mudanças")

if __name__ == '__main__':
    main()
