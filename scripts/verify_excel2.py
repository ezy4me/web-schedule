"""Строгая сверка: каждая строка xlsx должна быть представлена в excel-2.json и наоборот."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from read_xlsx import read_sheet

DL = r'C:\Users\maximovrs\Downloads'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAY_MAP = {'пн': 'Понедельник', 'вт': 'Вторник', 'ср': 'Среда', 'чт': 'Четверг', 'пт': 'Пятница', 'сб': 'Суббота', 'вс': 'Воскресенье'}
TYPE_MAP = {'лаб.': 'л.р.', 'пр.': 'пр', 'л.': 'лек', 'л.р.': 'л.р.', 'пр': 'пр', 'лек': 'лек'}


def norm_teacher(raw):
    parts = raw.strip().split()
    if len(parts) >= 3:
        fam = parts[0][0] + parts[0][1:].lower()
        return f"{fam} {parts[1][0].upper()}.{parts[2][0].upper()}."
    return raw.strip().title() if raw.strip() else None


def main():
    cands = [n for n in os.listdir(DL) if n.endswith('.xlsx') and not n.startswith('~$') and '14.09.2026' in n]
    rows = read_sheet(os.path.join(DL, cands[0]))
    xlsx_rows = [r for r in rows[1:] if len(r) > 10 and r[10].strip() == 'Максимов Роман Сергеевич']
    with open(os.path.join(ROOT, 'public', 'excel-2.json'), encoding='utf-8') as f:
        js = json.load(f)

    errors = []

    def find_entry(group, day, time, typ, subject, room, teacher, parity):
        for e in js:
            if (e['day'] == day and e['time'] == time and e['type'] == typ
                    and e['subject'] == subject and e['room'] == room
                    and (e.get('teacher') or None) == teacher
                    and (e.get('parity') or None) == parity
                    and group in [g.strip() for g in e['group'].split(',')]):
                return e
        return None

    for i, r in enumerate(xlsx_rows):
        group, wd, time, alt, dates_raw, subject, typ_raw, aud, bld = (r[j].strip() if len(r) > j else '' for j in range(9))
        teacher = norm_teacher(r[10])
        day = DAY_MAP.get(wd.lower(), wd)
        typ = TYPE_MAP.get(typ_raw)
        room = f'{bld} / {aud}'
        parity = alt if alt in ('Ч', 'Н') else None
        dates = dates_raw.split()
        if typ is None:
            errors.append(f'XLSX row {i}: unknown type {typ_raw!r}')
            continue
        e = find_entry(group, day, time, typ, subject, room, teacher, parity)
        if e is None:
            errors.append(f'XLSX row {i} NOT IN JSON: {group} {day} {time} {typ} {subject[:25]} {room} dates={dates_raw}')
            continue
        missing = [d for d in dates if d not in e['dates']]
        if missing:
            errors.append(f'XLSX row {i} dates missing in JSON: {missing} :: {group} {day} {time}')

    # обратная проверка: каждая JSON-запись должна иметь опору в xlsx
    for e in js:
        for g in [x.strip() for x in e['group'].split(',')]:
            hit = any(
                (r[0].strip() if len(r) > 0 else '') == g
                and DAY_MAP.get((r[1].strip() if len(r) > 1 else '').lower(), r[1].strip() if len(r) > 1 else '') == e['day']
                and (r[2].strip() if len(r) > 2 else '') == e['time']
                and TYPE_MAP.get((r[6].strip() if len(r) > 6 else '')) == e['type']
                and (r[5].strip() if len(r) > 5 else '') == e['subject']
                and f"{(r[8].strip() if len(r) > 8 else '')} / {(r[7].strip() if len(r) > 7 else '')}" == e['room']
                and norm_teacher(r[10] if len(r) > 10 else '') == (e.get('teacher') or None)
                and ((r[3].strip() if len(r) > 3 else '') if (r[3].strip() if len(r) > 3 else '') in ('Ч', 'Н') else None) == (e.get('parity') or None)
                and set((r[4].strip() if len(r) > 4 else '').split()) == set(e['dates'])
                for r in xlsx_rows
            )
            if not hit:
                # допускаем склейку: ищем xlsx-строку с тем же ключом, но другой группой (группы объединяются)
                same_key = [r for r in xlsx_rows
                            if DAY_MAP.get((r[1].strip() if len(r) > 1 else '').lower(), '') == e['day']
                            and (r[2].strip() if len(r) > 2 else '') == e['time']
                            and TYPE_MAP.get((r[6].strip() if len(r) > 6 else '')) == e['type']
                            and (r[5].strip() if len(r) > 5 else '') == e['subject']
                            and f"{(r[8].strip() if len(r) > 8 else '')} / {(r[7].strip() if len(r) > 7 else '')}" == e['room']]
                if not same_key:
                    errors.append(f"JSON entry WITHOUT xlsx support: {e['day']} {e['time']} {g} {e['type']} {e['subject'][:25]} {e['room']} {e['dates']}")

    print(f'XLSX rows: {len(xlsx_rows)}, JSON entries: {len(js)}, ERRORS: {len(errors)}')
    for er in errors:
        print(' ', er)


if __name__ == '__main__':
    main()
