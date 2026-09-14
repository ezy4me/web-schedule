"""Выгрузка строк преподавателя из xlsx расписания в CSV-фикстуру."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from read_xlsx import read_sheet

DL = r'C:\Users\maximovrs\Downloads'


def find_file():
    cands = [n for n in os.listdir(DL) if n.endswith('.xlsx') and not n.startswith('~$') and '14.09.2026' in n]
    return os.path.join(DL, cands[0])


def main():
    teacher_filter = sys.argv[1] if len(sys.argv) > 1 else None
    out_csv = sys.argv[2] if len(sys.argv) > 2 else None
    rows = read_sheet(find_file())
    header, data = rows[0], rows[1:]
    print('HEADER:', header)
    print('TOTAL DATA ROWS:', len(data))
    # статистика по преподавателям (колонка 10)
    from collections import Counter
    teachers = Counter((r[10] if len(r) > 10 else '').strip() for r in data)
    print('TEACHERS:')
    for t, c in teachers.most_common():
        print(f'  {t!r}: {c}')
    if teacher_filter:
        sel = [r for r in data if len(r) > 10 and r[10].strip() == teacher_filter]
        print(f'ROWS for {teacher_filter!r}: {len(sel)}')
        groups = sorted(set(r[0].strip() for r in sel if r[0].strip()))
        print('GROUPS:', groups)
        if out_csv:
            with open(out_csv, 'w', encoding='utf-8') as f:
                f.write(';'.join(['Группа', 'День недели', 'Время', 'Альтернативное', 'Дата', 'Дисциплина', 'Вид занятий', 'Аудитория', 'Здание', 'Должность', 'Преподаватель']) + '\n')
                for r in sel:
                    cells = [(r[i] if len(r) > i else '').strip() for i in range(11)]
                    f.write(';'.join(cells) + '\n')
            print('WROTE:', out_csv)


if __name__ == '__main__':
    main()
