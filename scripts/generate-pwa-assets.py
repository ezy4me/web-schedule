"""Генерация иконок и splash-экранов PWA.

Запуск:  python scripts/generate-pwa-assets.py
Результат кладётся в public/.

Палитра совпадает с приложением: бумага, чернила, глина.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

PAPER = (250, 249, 246)
INK = (28, 26, 23)
INK_SOFT = (43, 40, 37)
CLAY = (189, 107, 63)  # clay-500
CLAY_LIGHT = (209, 138, 96)  # clay-400
DARK_BG = (18, 17, 16)

S = 1024  # мастер-размер, из него уменьшаем

FONT_SEMIBOLD_CANDIDATES = [
    Path(r"C:\Windows\Fonts\seguisb.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
]
FONT_REGULAR_CANDIDATES = [
    Path(r"C:\Windows\Fonts\segoeui.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
]


def font(candidates, size: int):
    for path in candidates:
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_page(d: ImageDraw.ImageDraw, cx: float, cy: float, w: float, h: float, bg=None):
    """Страница расписания: бумажный лист, глиняная плашка-шапка, строки."""
    radius = w * 0.14
    left, top = cx - w / 2, cy - h / 2
    d.rounded_rectangle([left, top, left + w, top + h], radius=radius, fill=bg or PAPER)

    pad = w * 0.16
    band_h = h * 0.15
    band_top = top + h * 0.12
    d.rounded_rectangle(
        [left + pad, band_top, left + w - pad, band_top + band_h],
        radius=band_h / 2,
        fill=CLAY,
    )

    line_h = h * 0.055
    gap = h * 0.105
    line_top = band_top + band_h + h * 0.11
    widths = (0.68, 0.68, 0.42)
    for index, factor in enumerate(widths):
        y = line_top + index * (line_h + gap)
        d.rounded_rectangle(
            [left + pad, y, left + pad + (w - 2 * pad) * factor, y + line_h],
            radius=line_h / 2,
            fill=INK if index < 2 else INK_SOFT,
        )


def icon_any(size: int, bg=PAPER) -> Image.Image:
    """Обычная иконка: бумажный фон + чернильный квадрат с листом."""
    img = Image.new("RGB", (S, S), bg)
    d = ImageDraw.Draw(img)
    inset = S * 0.085
    tile = S - 2 * inset
    d.rounded_rectangle([inset, inset, inset + tile, inset + tile], radius=tile * 0.235, fill=INK)
    draw_page(d, S / 2, S / 2, tile * 0.5, tile * 0.56)
    return img.resize((size, size), Image.LANCZOS)


def icon_maskable(size: int) -> Image.Image:
    """Maskable: фон во весь холст, лист в безопасной зоне (80%)."""
    img = Image.new("RGB", (S, S), INK)
    d = ImageDraw.Draw(img)
    draw_page(d, S / 2, S / 2, S * 0.38, S * 0.43)
    return img.resize((size, size), Image.LANCZOS)


def icon_tile(size: int, background=None) -> Image.Image:
    """Квадратная иконка без внешнего поля (для favicon)."""
    img = Image.new("RGBA", (S, S), background or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S, S], radius=S * 0.22, fill=INK)
    draw_page(d, S / 2, S / 2, S * 0.5, S * 0.56)
    return img.resize((size, size), Image.LANCZOS)


def splash(width: int, height: int, dark: bool = False) -> Image.Image:
    bg = DARK_BG if dark else PAPER
    ink = PAPER if dark else INK
    muted = (154, 147, 135)
    img = Image.new("RGB", (width, height), bg)
    d = ImageDraw.Draw(img)

    unit = min(width, height)
    mark = unit * 0.30
    cx, cy = width / 2, height / 2 - unit * 0.055

    # На тёмном фоне чернильный квадрат почти сливается — делаем его чуть светлее
    tile_bg = (38, 35, 31) if dark else INK

    left, top = cx - mark / 2, cy - mark / 2
    d.rounded_rectangle(
        [left, top, left + mark, top + mark], radius=mark * 0.235, fill=tile_bg
    )
    draw_page(d, cx, cy, mark * 0.5, mark * 0.56)

    title = "Расписание"
    subtitle = "Учебное расписание КАИ"
    title_font = font(FONT_SEMIBOLD_CANDIDATES, int(unit * 0.052))
    subtitle_font = font(FONT_REGULAR_CANDIDATES, int(unit * 0.026))

    title_y = top + mark + unit * 0.075
    d.text((cx, title_y), title, font=title_font, fill=ink, anchor="ma")
    d.text(
        (cx, title_y + unit * 0.075),
        subtitle,
        font=subtitle_font,
        fill=muted if not dark else (140, 134, 126),
        anchor="ma",
    )
    return img


def save(img: Image.Image, name: str):
    path = PUBLIC / name
    img.save(path, optimize=True)
    print(f"{name}: {path.stat().st_size / 1024:.1f} KB")


def main():
    PUBLIC.mkdir(exist_ok=True)

    save(icon_any(192), "pwa-192x192.png")
    save(icon_any(512), "pwa-512x512.png")
    save(icon_maskable(512), "pwa-maskable-512.png")
    # iOS обрезает иконку по своим скруглениям — отдаём вариант без внешнего поля
    save(icon_maskable(180), "apple-touch-icon.png")
    save(icon_any(64), "favicon.png")

    tile = icon_tile(256)
    tile.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("favicon.ico:", (PUBLIC / "favicon.ico").stat().st_size / 1024, "KB")

    # iOS startup images: (ширина, высота) в физических пикселях
    splash_sizes = [
        (640, 1136),   # iPhone SE (1st), 320x568 @2x
        (750, 1334),   # iPhone 6/7/8/SE2/SE3, 375x667 @2x
        (828, 1792),   # iPhone XR/11, 414x896 @2x
        (1125, 2436),  # iPhone X/XS/11 Pro/12 mini, 375x812 @3x
        (1170, 2532),  # iPhone 12/13/14, 390x844 @3x
        (1179, 2556),  # iPhone 14 Pro/15 Pro, 393x852 @3x
        (1206, 2622),  # iPhone 16 Pro, 402x874 @3x
        (1242, 2688),  # iPhone XS Max/11 Pro Max, 414x896 @3x
        (1284, 2778),  # iPhone 12/13 Pro Max, 14 Plus, 428x926 @3x
        (1290, 2796),  # iPhone 14/15 Pro Max, 15 Plus, 430x932 @3x
        (1320, 2868),  # iPhone 16 Pro Max, 440x956 @3x
        (1536, 2048),  # iPad, 768x1024 @2x
        (1668, 2388),  # iPad Pro 11", 834x1194 @2x
        (2048, 2732),  # iPad Pro 12.9", 1024x1366 @2x
    ]
    for w, h in splash_sizes:
        save(splash(w, h), f"splash-{w}x{h}.png")
        save(splash(w, h, dark=True), f"splash-dark-{w}x{h}.png")


if __name__ == "__main__":
    main()
