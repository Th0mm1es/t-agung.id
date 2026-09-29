import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')

files = [
    'apps/web/components/equivalence/EquivalenceCalculatorClient.tsx',
    'apps/web/components/compare/CompareClient.tsx',
    'apps/web/components/wizard/Step7Results.tsx',
    'apps/web/components/wizard/Step3Income.tsx',
    'apps/web/components/percentile/PercentileClient.tsx',
    'apps/web/components/contribute/ContributeClient.tsx',
    'apps/web/components/wizard/Step4Housing.tsx',
    'apps/web/components/wizard/Step5Lifestyle.tsx',
    'apps/web/components/wizard/Step1Destination.tsx',
    'apps/web/components/wizard/Step6Review.tsx',
    'apps/web/components/common/PriceCorrectionModal.tsx',
    'apps/web/components/share/SharedScenarioClient.tsx'
]

def parse_txt_calls(src):
    calls = []
    idx = 0
    while True:
        pos = src.find('txt(', idx)
        if pos == -1:
            break
        p_count = 1
        end = pos + 4
        in_str = None
        esc = False
        while end < len(src) and p_count > 0:
            ch = src[end]
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif in_str:
                if ch == in_str:
                    in_str = None
            elif ch in ('"', "'", '`'):
                in_str = ch
            elif ch == '(':
                p_count += 1
            elif ch == ')':
                p_count -= 1
            end += 1
        
        arg_str = src[pos+4:end-1]
        calls.append((pos, arg_str))
        idx = pos + 4
    
    three_args = []
    four_args = []
    for pos, call in calls:
        args = []
        cur = []
        in_s = None
        esc = False
        p_lvl = 0
        for ch in call:
            if esc:
                esc = False
                cur.append(ch)
            elif ch == '\\':
                esc = True
                cur.append(ch)
            elif in_s:
                cur.append(ch)
                if ch == in_s:
                    in_s = None
            elif ch in ('"', "'", '`'):
                in_s = ch
                cur.append(ch)
            elif ch in ('(', '[', '{'):
                p_lvl += 1
                cur.append(ch)
            elif ch in (')', ']', '}'):
                p_lvl -= 1
                cur.append(ch)
            elif ch == ',' and p_lvl == 0 and not in_s:
                args.append(''.join(cur).strip())
                cur = []
            else:
                cur.append(ch)
        if cur:
            args.append(''.join(cur).strip())
        
        if len(args) == 3:
            three_args.append((pos, args))
        elif len(args) == 4:
            four_args.append((pos, args))
    return three_args, four_args

all_3args = []
unique_ids = {}

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        src = f.read()
    three_args, four_args = parse_txt_calls(src)
    for pos, a in three_args:
        lno = src[:pos].count('\n') + 1
        # Check if first arg is string literal
        id_raw = a[0]
        en_raw = a[1]
        ja_raw = a[2]
        all_3args.append((fpath, lno, id_raw, en_raw, ja_raw))
        if (id_raw.startswith('"') and id_raw.endswith('"')) or (id_raw.startswith("'") and id_raw.endswith("'")):
            # unescape
            try:
                # remove surrounding quotes
                val = id_raw[1:-1].replace('\\"', '"').replace("\\'", "'")
                en_val = en_raw[1:-1].replace('\\"', '"').replace("\\'", "'") if (en_raw.startswith('"') or en_raw.startswith("'")) else en_raw
                ja_val = ja_raw[1:-1].replace('\\"', '"').replace("\\'", "'") if (ja_raw.startswith('"') or ja_raw.startswith("'")) else ja_raw
                unique_ids[val] = (en_val, ja_val, fpath, lno)
            except Exception as e:
                pass

print(f"Total 3-arg calls found in 12 files: {len(all_3args)}")
print(f"Total unique literal id strings: {len(unique_ids)}")

with open('scripts/parsed_literals.json', 'w', encoding='utf-8') as out:
    json.dump({k: {'en': v[0], 'ja': v[1], 'file': v[2], 'line': v[3]} for k, v in unique_ids.items()}, out, ensure_ascii=False, indent=2)
print("Saved to scripts/parsed_literals.json")
