"""Извлечь строки Максимова из xlsx, сравнить с вставленной таблицей, сохранить CSV-фикстуру."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from read_xlsx import read_sheet

DL = r'C:\Users\maximovrs\Downloads'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def find_file():
    cands = [n for n in os.listdir(DL) if n.endswith('.xlsx') and not n.startswith('~$') and '14.09.2026' in n]
    return os.path.join(DL, cands[0])


def row_key(r):
    return '|'.join((r[i] if len(r) > i else '').strip() for i in range(11))


def main():
    rows = read_sheet(find_file())
    data = rows[1:]
    sel = [r for r in data if len(r) > 10 and r[10].strip() == 'Максимов Роман Сергеевич']
    print('MAXIMOV ROWS:', len(sel))
    groups = sorted(set(r[0].strip() for r in sel if r[0].strip()))
    print('GROUPS:', ' '.join(groups))
    # distinct lesson types
    types = sorted(set(r[6].strip() for r in sel if len(r) > 6))
    print('TYPES:', types)
    # dump full rows to file for diffing
    out = os.path.join(ROOT, 'scripts', 'xlsx_maximov_dump.txt')
    with open(out, 'w', encoding='utf-8') as f:
        for r in sel:
            f.write('|'.join((r[i] if len(r) > i else '').strip() for i in range(11)) + '\n')
    print('DUMPED:', out)
    # fixture CSV для node-конвертера (тот же формат, что excel-new.csv)
    fixture = os.path.join(ROOT, 'scripts', 'fixtures', 'excel-2.csv')
    with open(fixture, 'w', encoding='utf-8', newline='') as f:
        f.write(';'.join(['Группа', 'День недели', 'Время', 'Альтернативное', 'Дата', 'Дисциплина', 'Вид занятий', 'Аудитория', 'Здание', 'Должность', 'Преподаватель']) + '\n')
        for r in sel:
            f.write(';'.join((r[i] if len(r) > i else '').strip() for i in range(11)) + '\n')
    print('FIXTURE:', fixture, f'({len(sel)} rows)')


if __name__ == '__main__':
    main()
