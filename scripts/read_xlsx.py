"""Чтение .xlsx без внешних зависимостей (zip + xml из stdlib)."""
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def col_to_index(col):
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - ord('A') + 1)
    return n - 1


def read_sheet(xlsx_path, sheet_index=0):
    with zipfile.ZipFile(xlsx_path) as z:
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = wb.findall('m:sheets/m:sheet', NS)
        print('SHEETS:', [s.get('name') for s in sheets])
        target = sheets[sheet_index].get('name')
        print('READING SHEET:', target)
        try:
            shared = ET.fromstring(z.read('xl/sharedStrings.xml'))
            strings = [''.join(t.text or '' for t in si.findall('m:t', NS)) for si in shared.findall('m:si', NS)]
        except KeyError:
            strings = []
        data = z.read(f'xl/worksheets/sheet{sheet_index + 1}.xml')
        root = ET.fromstring(data)
        rows = []
        for row in root.findall('m:sheetData/m:row', NS):
            cells = {}
            max_idx = -1
            for c in row.findall('m:c', NS):
                ref = c.get('r', '')
                m = re.match(r'^([A-Z]+)', ref)
                if not m:
                    continue
                idx = col_to_index(m.group(1))
                max_idx = max(max_idx, idx)
                t = c.get('t')
                v = c.find('m:v', NS)
                val = ''
                if v is not None and v.text is not None:
                    if t == 's':
                        try:
                            val = strings[int(v.text)]
                        except (IndexError, ValueError):
                            val = ''
                    else:
                        val = v.text
                else:
                    inline = c.find('m:is', NS)
                    if inline is not None:
                        val = ''.join(tn.text or '' for tn in inline.findall('m:t', NS))
                cells[idx] = val
            if max_idx >= 0:
                rows.append([cells.get(i, '') for i in range(max_idx + 1)])
        return rows


if __name__ == '__main__':
    dl = r'C:\Users\maximovrs\Downloads'
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        cands = [n for n in os.listdir(dl) if n.endswith('.xlsx') and not n.startswith('~$') and '14.09.2026' in n]
        print('CANDIDATES:', cands)
        path = os.path.join(dl, cands[0])
    print('FILE:', path)
    rows = read_sheet(path)
    print('ROWS:', len(rows))
    for r in rows[:8]:
        print(repr(r))
