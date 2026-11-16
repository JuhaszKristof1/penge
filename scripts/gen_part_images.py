#!/usr/bin/env python3
"""Generate self-contained SVG product illustrations for the AutoFit AI part catalog.

Each illustration is a stylised, product-photo-style rendering of a single part on a
light studio background. Kept offline (no external image hosts) so the UI never shows
broken or mismatched photos. Output: public/parts/<key>.svg
"""
import math
import os
import xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "parts")

DEFS = """
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8eef5"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.32" r="0.72">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="alu" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f2f5f8"/><stop offset="0.5" stop-color="#c6cfd8"/><stop offset="1" stop-color="#98a4b0"/>
  </linearGradient>
  <linearGradient id="aluV" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#eef2f6"/><stop offset="0.45" stop-color="#bcc6d0"/><stop offset="1" stop-color="#8b96a2"/>
  </linearGradient>
  <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3c434d"/><stop offset="1" stop-color="#16191e"/>
  </linearGradient>
  <linearGradient id="darkV" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#343b45"/><stop offset="0.5" stop-color="#1c2027"/><stop offset="1" stop-color="#0e1115"/>
  </linearGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#d3dbe3"/><stop offset="1" stop-color="#9aa6b2"/>
  </linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#dde2e8"/><stop offset="1" stop-color="#9aa3ad"/>
  </linearGradient>
  <linearGradient id="copper" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e2a463"/><stop offset="1" stop-color="#9c5a22"/>
  </linearGradient>
  <linearGradient id="rubber" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2b3038"/><stop offset="1" stop-color="#0d0f12"/>
  </linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e2503f"/><stop offset="1" stop-color="#a2231a"/>
  </linearGradient>
  <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#0b1220" stop-opacity="0.30"/>
    <stop offset="1" stop-color="#0b1220" stop-opacity="0"/>
  </radialGradient>
"""


def svg(inner: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" '
        'role="img" preserveAspectRatio="xMidYMid meet">\n'
        f"<defs>{DEFS}</defs>\n"
        '<rect width="400" height="300" fill="url(#bg)"/>\n'
        '<rect width="400" height="300" fill="url(#glow)"/>\n'
        '<ellipse cx="200" cy="258" rx="152" ry="26" fill="url(#shadow)"/>\n'
        f"{inner}\n</svg>\n"
    )


def ring(cx, cy, r, n, dot_r, fill, start=0.0):
    out = []
    for i in range(n):
        a = math.radians(start + i * 360.0 / n)
        out.append(f'<circle cx="{cx + r*math.cos(a):.1f}" cy="{cy + r*math.sin(a):.1f}" r="{dot_r}" fill="{fill}"/>')
    return "".join(out)


def spokes(cx, cy, n, r_in, r_out, w_in, w_out, fill, start=0.0):
    out = []
    for i in range(n):
        a = math.radians(start + i * 360.0 / n)
        ca, sa = math.cos(a), math.sin(a)
        px, py = -sa, ca
        pts = [
            (cx + r_in * ca + w_in * px, cy + r_in * sa + w_in * py),
            (cx + r_out * ca + w_out * px, cy + r_out * sa + w_out * py),
            (cx + r_out * ca - w_out * px, cy + r_out * sa - w_out * py),
            (cx + r_in * ca - w_in * px, cy + r_in * sa - w_in * py),
        ]
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
        out.append(f'<path d="{d}" fill="{fill}" stroke="#7c8794" stroke-width="1.2"/>')
    return "".join(out)


def radial_lines(cx, cy, r1, r2, n, stroke, width, start=0.0):
    out = []
    for i in range(n):
        a = math.radians(start + i * 360.0 / n)
        ca, sa = math.cos(a), math.sin(a)
        out.append(
            f'<line x1="{cx + r1*ca:.1f}" y1="{cy + r1*sa:.1f}" x2="{cx + r2*ca:.1f}" y2="{cy + r2*sa:.1f}" '
            f'stroke="{stroke}" stroke-width="{width}"/>'
        )
    return "".join(out)


def vlines(x, y, h, n, gap, stroke, width):
    return "".join(
        f'<line x1="{x + i*gap:.1f}" y1="{y}" x2="{x + i*gap:.1f}" y2="{y+h}" stroke="{stroke}" stroke-width="{width}"/>'
        for i in range(n)
    )


def hlines(x, y, w, n, gap, stroke, width):
    return "".join(
        f'<line x1="{x}" y1="{y + i*gap:.1f}" x2="{x+w}" y2="{y + i*gap:.1f}" stroke="{stroke}" stroke-width="{width}"/>'
        for i in range(n)
    )


def engine_block():
    g = ['<rect x="86" y="96" width="228" height="112" rx="12" fill="url(#alu)" stroke="#7c8794" stroke-width="1.5"/>',
         '<rect x="98" y="104" width="204" height="14" rx="6" fill="#b9c3cd" opacity="0.7"/>']
    for i in range(4):
        x = 108 + i * 50
        g.append(f'<rect x="{x}" y="70" width="34" height="34" rx="7" fill="url(#dark)" stroke="#5a636e" stroke-width="1.4"/>')
        g.append(f'<circle cx="{x+17}" cy="87" r="9" fill="#2a3038" stroke="#69727d" stroke-width="1.4"/>')
        g.append(f'<circle cx="{x+17}" cy="87" r="3.4" fill="url(#chrome)"/>')
    g += ['<rect x="86" y="208" width="228" height="18" rx="6" fill="url(#dark)"/>',
          '<rect x="300" y="120" width="34" height="64" rx="8" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.3"/>']
    for i in range(5):
        g.append(f'<line x1="304" y1="{128+i*12}" x2="330" y2="{128+i*12}" stroke="#8b96a2" stroke-width="2.2"/>')
    g += ['<circle cx="112" cy="150" r="20" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.5"/>',
          '<circle cx="112" cy="150" r="9" fill="#2a3038"/>', vlines(150, 108, 88, 6, 18, "#98a4b0", 2)]
    return "".join(g)


def turbo():
    g = ['<circle cx="150" cy="150" r="62" fill="url(#alu)" stroke="#7c8794" stroke-width="1.6"/>',
         '<circle cx="150" cy="150" r="50" fill="#aeb9c4"/>']
    for i in range(14):
        a1 = math.radians(i * 25.7); a2 = math.radians((i + 1) * 25.7); am = math.radians(i * 25.7 + 11)
        g.append(f'<path d="M150,150 L{150+50*math.cos(a1):.1f},{150+50*math.sin(a1):.1f} '
                 f'Q{150+34*math.cos(am):.1f},{150+34*math.sin(am):.1f} {150+50*math.cos(a2):.1f},{150+50*math.sin(a2):.1f}" '
                 f'fill="#8b96a2" stroke="#6f7a86" stroke-width="0.8"/>')
    g += ['<circle cx="150" cy="150" r="14" fill="url(#chrome)"/><circle cx="150" cy="150" r="5" fill="#2a3038"/>',
          '<circle cx="270" cy="150" r="44" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.5"/>',
          '<circle cx="270" cy="150" r="33" fill="#9aa6b2"/>', radial_lines(270, 150, 8, 32, 12, "#7c8794", 2.4),
          '<circle cx="270" cy="150" r="9" fill="url(#chrome)"/>',
          '<rect x="196" y="132" width="34" height="36" rx="6" fill="url(#dark)"/>',
          '<rect x="120" y="196" width="60" height="26" rx="8" fill="url(#dark)"/>']
    return "".join(g)


def alternator():
    g = ['<circle cx="176" cy="150" r="64" fill="url(#alu)" stroke="#7c8794" stroke-width="1.6"/>',
         '<circle cx="176" cy="150" r="53" fill="#b6c0ca"/>', radial_lines(176, 150, 40, 52, 26, "#7f8a96", 3),
         '<circle cx="176" cy="150" r="40" fill="#98a4b0"/>', '<circle cx="176" cy="150" r="30" fill="url(#aluV)"/>',
         '<circle cx="176" cy="150" r="12" fill="url(#chrome)"/><circle cx="176" cy="150" r="4" fill="#2a3038"/>',
         '<rect x="232" y="112" width="66" height="76" rx="10" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.4"/>']
    for i in range(4):
        g.append(f'<line x1="238" y1="{124+i*18}" x2="292" y2="{124+i*18}" stroke="#8b96a2" stroke-width="2.4"/>')
    g += ['<circle cx="286" cy="120" r="6" fill="url(#copper)"/>', '<rect x="150" y="96" width="52" height="20" rx="6" fill="url(#dark)"/>']
    return "".join(g)


def starter():
    return "".join([
        '<rect x="112" y="104" width="120" height="120" rx="18" fill="url(#dark)" stroke="#5a636e" stroke-width="1.5"/>',
        '<rect x="124" y="116" width="96" height="96" rx="12" fill="url(#darkV)"/>',
        radial_lines(172, 164, 16, 44, 20, "#4a525c", 3),
        '<circle cx="172" cy="164" r="16" fill="url(#chrome)"/><circle cx="172" cy="164" r="6" fill="#14171b"/>',
        '<rect x="232" y="128" width="66" height="72" rx="14" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.4"/>',
        '<circle cx="265" cy="164" r="20" fill="#aeb9c4" stroke="#7c8794" stroke-width="1.3"/>',
        '<circle cx="265" cy="164" r="8" fill="url(#chrome)"/>',
        '<circle cx="150" cy="88" r="15" fill="url(#copper)" stroke="#7c4a1c" stroke-width="1.2"/>',
        '<rect x="146" y="66" width="8" height="26" rx="3" fill="url(#chrome)"/>',
    ])


def headlight():
    return "".join([
        '<path d="M78,168 Q78,92 178,86 Q300,80 322,116 Q336,140 316,182 Q300,206 200,210 Q108,212 78,168 Z" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.6"/>',
        '<path d="M96,162 Q100,106 182,102 Q286,98 302,126 Q312,146 296,176 Q282,194 198,196 Q118,197 96,162 Z" fill="#dfe9f2" opacity="0.9"/>',
        '<ellipse cx="150" cy="150" rx="40" ry="38" fill="#f6fbff" stroke="#9aa6b2" stroke-width="1.6"/>',
        '<ellipse cx="150" cy="150" rx="27" ry="26" fill="url(#chrome)"/>',
        '<ellipse cx="150" cy="150" rx="12" ry="12" fill="#eef4fa"/>',
        '<ellipse cx="248" cy="150" rx="34" ry="30" fill="#eef6fd" stroke="#9aa6b2" stroke-width="1.5"/>',
        '<ellipse cx="248" cy="150" rx="20" ry="18" fill="url(#chrome)"/>',
        '<path d="M96,178 Q200,196 300,172" fill="none" stroke="#ffb066" stroke-width="4" opacity="0.75"/>',
        '<circle cx="300" cy="118" r="5" fill="#ffb066"/>',
    ])


def taillight():
    return "".join([
        '<path d="M84,110 Q84,84 120,82 L306,88 Q330,92 330,124 L326,190 Q322,210 296,210 L118,204 Q88,198 84,170 Z" fill="url(#red)" stroke="#7c1d14" stroke-width="1.6"/>',
        '<path d="M100,120 Q200,112 312,120 L308,166 Q204,176 100,166 Z" fill="#e8786a" opacity="0.55"/>',
        '<rect x="150" y="130" width="46" height="30" rx="8" fill="#ffffff" opacity="0.82" stroke="#c9d3dc" stroke-width="1.2"/>',
        '<rect x="210" y="132" width="46" height="26" rx="8" fill="#ffd9d2" opacity="0.7"/>',
        '<rect x="104" y="128" width="34" height="34" rx="8" fill="#f2f6fa" opacity="0.6"/>',
        '<circle cx="300" cy="196" r="5" fill="#ffd9d2"/>',
    ])


def bumper():
    g = ['<path d="M60,196 Q60,128 150,120 L258,118 Q338,122 344,168 Q346,192 328,208 L96,214 Q66,212 60,196 Z" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.6"/>',
         '<path d="M84,164 Q160,142 320,156" fill="none" stroke="#98a4b0" stroke-width="3"/>',
         '<rect x="118" y="176" width="82" height="26" rx="9" fill="url(#dark)" stroke="#5a636e" stroke-width="1.2"/>']
    for i in range(5):
        g.append(f'<line x1="{126+i*16}" y1="180" x2="{126+i*16}" y2="198" stroke="#6f7a86" stroke-width="3"/>')
    g += ['<circle cx="286" cy="176" r="20" fill="#c6cfd8" stroke="#7c8794" stroke-width="1.5"/>',
          '<circle cx="286" cy="176" r="10" fill="url(#chrome)"/><circle cx="286" cy="176" r="4" fill="#2a3038"/>',
          '<path d="M214,120 Q244,112 274,120" fill="none" stroke="#b9c3cd" stroke-width="3"/>']
    return "".join(g)


def radiator():
    g = ['<rect x="92" y="96" width="216" height="118" rx="10" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.5"/>',
         vlines(100, 104, 102, 24, 8.4, "#3d444d", 2.2),
         '<rect x="92" y="88" width="216" height="16" rx="7" fill="url(#alu)"/>',
         '<rect x="92" y="206" width="216" height="16" rx="7" fill="url(#alu)"/>',
         '<rect x="78" y="96" width="16" height="118" rx="6" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.2"/>',
         '<rect x="306" y="96" width="16" height="118" rx="6" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.2"/>',
         '<rect x="176" y="60" width="48" height="30" rx="7" fill="url(#dark)"/>',
         '<circle cx="200" cy="58" r="12" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.3"/>',
         '<circle cx="288" cy="216" r="7" fill="url(#copper)"/>']
    return "".join(g)


def intercooler():
    return "".join([
        '<rect x="86" y="108" width="228" height="96" rx="10" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.5"/>',
        vlines(96, 116, 80, 26, 8.2, "#8b96a2", 2.4),
        '<rect x="86" y="100" width="228" height="14" rx="6" fill="url(#alu)"/>',
        '<rect x="86" y="198" width="228" height="14" rx="6" fill="url(#alu)"/>',
        '<rect x="66" y="118" width="24" height="76" rx="8" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.3"/>',
        '<rect x="310" y="118" width="24" height="76" rx="8" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.3"/>',
        '<circle cx="78" cy="156" r="9" fill="#7c8794"/><circle cx="322" cy="156" r="9" fill="#7c8794"/>',
    ])


def brake_disc():
    g = ['<circle cx="200" cy="150" r="104" fill="url(#steel)" stroke="#7c8794" stroke-width="1.6"/>',
         '<circle cx="200" cy="150" r="104" fill="none" stroke="#8b96a2" stroke-width="2"/>',
         '<circle cx="200" cy="150" r="96" fill="none" stroke="#7f8a96" stroke-width="1.4" stroke-dasharray="4 5"/>',
         radial_lines(200, 150, 42, 96, 40, "#8b96a2", 1.1),
         '<circle cx="200" cy="150" r="72" fill="none" stroke="#c6cfd8" stroke-width="2"/>',
         '<circle cx="200" cy="150" r="58" fill="url(#steel)" stroke="#8b96a2" stroke-width="1.4"/>',
         ring(200, 150, 42, 5, 7, "#2a3038")]
    for i in range(5):
        a = math.radians(90 + i * 72)
        g.append(f'<circle cx="{200+42*math.cos(a):.1f}" cy="{150+42*math.sin(a):.1f}" r="6" fill="#2a3038"/>')
    g += ['<circle cx="200" cy="150" r="22" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.4"/>',
          '<circle cx="200" cy="150" r="8" fill="#2a3038"/>']
    return "".join(g)


def brake_caliper():
    return "".join([
        '<path d="M120,74 Q98,74 96,98 L96,200 Q96,226 122,226 L178,226 Q200,224 200,200 L200,150 Q200,140 190,140 L150,140 Q138,140 138,128 L138,110 Q138,98 150,98 L188,98 Q200,98 200,86 Q200,74 178,74 Z" fill="url(#red)" stroke="#7c1d14" stroke-width="1.6"/>',
        '<path d="M236,74 Q258,74 260,98 L260,200 Q260,226 234,226 L214,226 Q204,222 204,204 L204,150 Q204,140 214,140 L226,140 Q238,140 238,128 L238,110 Q238,98 226,98 L214,98 Q204,98 204,86 Q204,74 226,74 Z" fill="url(#red)" stroke="#7c1d14" stroke-width="1.6"/>',
        '<rect x="150" y="112" width="56" height="96" rx="8" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.3"/>',
        '<rect x="158" y="120" width="40" height="80" rx="5" fill="#3d444d"/>',
        '<circle cx="178" cy="96" r="8" fill="url(#chrome)"/><circle cx="178" cy="204" r="8" fill="url(#chrome)"/>',
        '<path d="M118,86 L100,80" stroke="#8b96a2" stroke-width="3"/>',
    ])


def brake_pads():
    g = []
    for x in (112, 214):
        g += [f'<rect x="{x}" y="96" width="74" height="112" rx="10" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
              f'<rect x="{x+8}" y="106" width="58" height="30" rx="6" fill="url(#dark)"/>',
              f'<rect x="{x+8}" y="146" width="58" height="52" rx="6" fill="#3d444d"/>',
              f'<circle cx="{x+18}" cy="118" r="4" fill="url(#chrome)"/>',
              f'<path d="M{x+37},96 L{x+37},150" stroke="#8b96a2" stroke-width="2" stroke-dasharray="3 4"/>']
    g.append('<rect x="188" y="150" width="24" height="10" rx="4" fill="url(#copper)"/>')
    return "".join(g)


def shock_absorber():
    return "".join([
        '<circle cx="200" cy="66" r="14" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
        '<circle cx="200" cy="66" r="6" fill="#2a3038"/>',
        '<rect x="192" y="66" width="16" height="42" rx="4" fill="url(#chrome)"/>',
        '<rect x="178" y="104" width="44" height="96" rx="8" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.4"/>',
        '<rect x="184" y="112" width="32" height="80" rx="5" fill="#3d444d"/>',
        '<rect x="172" y="198" width="56" height="30" rx="8" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.3"/>',
        '<rect x="192" y="228" width="16" height="40" rx="4" fill="url(#chrome)"/>',
        '<circle cx="200" cy="272" r="13" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
        '<circle cx="200" cy="272" r="5" fill="#2a3038"/>',
        '<path d="M200,74 L200,104" stroke="#8b96a2" stroke-width="1.4" stroke-dasharray="3 4"/>',
    ])


def control_arm():
    return "".join([
        '<path d="M96,196 Q120,150 178,144 L300,132 Q326,130 326,150 Q326,168 300,170 L186,180 Q140,184 122,214 Q112,232 96,222 Q84,214 96,196 Z" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.5"/>',
        '<circle cx="110" cy="204" r="24" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
        '<circle cx="110" cy="204" r="10" fill="#2a3038"/>',
        '<circle cx="310" cy="152" r="20" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
        '<circle cx="310" cy="152" r="8" fill="#2a3038"/>',
        '<circle cx="216" cy="156" r="15" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.3"/>',
        '<circle cx="216" cy="156" r="6" fill="url(#chrome)"/>',
        '<path d="M140,178 Q180,164 300,150" fill="none" stroke="#c6cfd8" stroke-width="2"/>',
    ])


def wheel_rim():
    return "".join([
        '<circle cx="200" cy="152" r="112" fill="url(#rubber)" stroke="#0a0c0e" stroke-width="2"/>',
        '<circle cx="200" cy="152" r="94" fill="url(#alu)" stroke="#7c8794" stroke-width="1.6"/>',
        '<circle cx="200" cy="152" r="90" fill="none" stroke="#dfe5ea" stroke-width="3"/>',
        spokes(200, 152, 5, 24, 84, 9, 20, "#d7dee4", start=-90),
        '<circle cx="200" cy="152" r="27" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.6"/>',
        ring(200, 152, 18, 5, 3.6, "#2a3038", start=-90),
        '<circle cx="200" cy="152" r="8" fill="#2a3038"/>',
        '<circle cx="200" cy="152" r="4" fill="#ff6a00"/>',
    ])


def exhaust_muffler():
    return "".join([
        '<rect x="70" y="128" width="46" height="24" rx="8" fill="url(#steel)" stroke="#7c8794" stroke-width="1.3"/>',
        '<rect x="284" y="128" width="52" height="22" rx="8" fill="url(#steel)" stroke="#7c8794" stroke-width="1.3"/>',
        '<rect x="110" y="104" width="180" height="72" rx="20" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.6"/>',
        '<path d="M126,112 L274,112" stroke="#dfe5ea" stroke-width="4" opacity="0.7"/>',
        '<path d="M126,168 L274,168" stroke="#7f8a96" stroke-width="4" opacity="0.6"/>',
        '<rect x="150" y="116" width="100" height="48" rx="12" fill="#aeb9c4" opacity="0.55"/>',
        '<circle cx="316" cy="139" r="12" fill="url(#dark)"/>',
        '<circle cx="316" cy="139" r="6" fill="#14171b"/>',
        '<rect x="92" y="120" width="10" height="40" rx="4" fill="#8b96a2"/>',
    ])


def catalytic_converter():
    return "".join([
        '<rect x="66" y="132" width="42" height="20" rx="8" fill="url(#steel)" stroke="#7c8794" stroke-width="1.3"/>',
        '<rect x="292" y="132" width="48" height="20" rx="8" fill="url(#steel)" stroke="#7c8794" stroke-width="1.3"/>',
        '<rect x="104" y="116" width="36" height="52" rx="8" fill="url(#alu)"/>',
        '<rect x="140" y="106" width="120" height="72" rx="16" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.6"/>',
        '<path d="M152,116 L248,116" stroke="#dfe5ea" stroke-width="3" opacity="0.6"/>',
        '<rect x="260" y="116" width="34" height="52" rx="8" fill="url(#alu)"/>',
        '<circle cx="200" cy="86" r="9" fill="url(#copper)"/>',
        '<rect x="196" y="60" width="8" height="30" rx="3" fill="url(#chrome)"/>',
        '<circle cx="200" cy="196" r="8" fill="url(#copper)"/>',
        '<rect x="196" y="196" width="8" height="26" rx="3" fill="url(#chrome)"/>',
    ])


def dpf():
    return "".join([
        '<rect x="112" y="96" width="176" height="112" rx="22" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.6"/>',
        '<rect x="126" y="108" width="148" height="88" rx="14" fill="#262c34"/>',
        hlines(138, 120, 124, 5, 16, "#454d57", 2.6),
        '<rect x="76" y="132" width="40" height="40" rx="10" fill="url(#steel)" stroke="#7c8794" stroke-width="1.3"/>',
        '<rect x="284" y="132" width="44" height="40" rx="10" fill="url(#steel)" stroke="#7c8794" stroke-width="1.3"/>',
        '<circle cx="200" cy="84" r="10" fill="url(#copper)"/>',
        '<rect x="196" y="56" width="8" height="30" rx="3" fill="url(#chrome)"/>',
        '<rect x="170" y="150" width="60" height="18" rx="6" fill="#8b96a2" opacity="0.5"/>',
    ])


def clutch_kit():
    return "".join([
        '<circle cx="200" cy="150" r="96" fill="url(#steel)" stroke="#7c8794" stroke-width="1.6"/>',
        '<circle cx="200" cy="150" r="96" fill="none" stroke="#8b96a2" stroke-width="2"/>',
        radial_lines(200, 150, 60, 92, 24, "#8b96a2", 1.2),
        '<circle cx="200" cy="150" r="64" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.4"/>',
        spokes(200, 150, 6, 20, 60, 6, 14, "#aeb9c4", start=0),
        '<circle cx="200" cy="150" r="26" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.5"/>',
        ring(200, 150, 18, 6, 4, "#2a3038"),
        '<circle cx="200" cy="150" r="9" fill="#2a3038"/>',
        ring(200, 150, 86, 12, 5, "#2a3038"),
    ])


def gearbox():
    return "".join([
        '<path d="M120,120 L280,120 L316,150 L280,182 L120,182 Q104,182 104,150 Q104,120 120,120 Z" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.6"/>',
        '<circle cx="146" cy="150" r="30" fill="url(#alu)" stroke="#7c8794" stroke-width="1.4"/>',
        '<circle cx="146" cy="150" r="12" fill="#2a3038"/><circle cx="146" cy="150" r="5" fill="url(#chrome)"/>',
        '<rect x="186" y="98" width="52" height="24" rx="7" fill="url(#dark)"/>',
        '<rect x="186" y="180" width="52" height="24" rx="7" fill="url(#dark)"/>',
        hlines(200, 132, 70, 3, 12, "#8b96a2", 2.2),
        '<rect x="286" y="132" width="30" height="36" rx="7" fill="url(#darkV)"/>',
        '<circle cx="118" cy="196" r="7" fill="url(#copper)"/><circle cx="272" cy="196" r="7" fill="url(#copper)"/>',
    ])


def water_pump():
    return "".join([
        '<circle cx="184" cy="152" r="70" fill="url(#alu)" stroke="#7c8794" stroke-width="1.6"/>',
        '<circle cx="184" cy="152" r="56" fill="#b6c0ca"/>',
        spokes(184, 152, 6, 18, 52, 6, 14, "#8b96a2", start=-90),
        '<circle cx="184" cy="152" r="20" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.4"/>',
        ring(184, 152, 13, 4, 3.6, "#2a3038", start=-90),
        '<circle cx="184" cy="152" r="7" fill="#2a3038"/>',
        '<rect x="236" y="120" width="70" height="64" rx="12" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.4"/>',
        '<circle cx="286" cy="138" r="10" fill="url(#dark)"/>',
        '<circle cx="270" cy="182" r="8" fill="url(#copper)"/>',
    ])


def timing_belt_kit():
    return "".join([
        '<circle cx="132" cy="160" r="52" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
        ring(132, 160, 44, 22, 4, "#7f8a96"),
        '<circle cx="132" cy="160" r="20" fill="url(#chrome)"/><circle cx="132" cy="160" r="8" fill="#2a3038"/>',
        '<circle cx="296" cy="128" r="30" fill="url(#steel)" stroke="#7c8794" stroke-width="1.4"/>',
        ring(296, 128, 24, 14, 3.2, "#7f8a96"),
        '<circle cx="296" cy="128" r="12" fill="url(#chrome)"/><circle cx="296" cy="128" r="5" fill="#2a3038"/>',
        '<path d="M132,108 Q210,58 296,98" fill="none" stroke="#16191e" stroke-width="14"/>',
        '<path d="M132,108 Q210,58 296,98" fill="none" stroke="#2b3038" stroke-width="10"/>',
        vlines(160, 74, 12, 26, 5.4, "#0d0f12", 2),
        '<path d="M132,212 Q214,262 296,158" fill="none" stroke="#16191e" stroke-width="14"/>',
        '<path d="M132,212 Q214,262 296,158" fill="none" stroke="#2b3038" stroke-width="10"/>',
        '<circle cx="222" cy="216" r="16" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.3"/>',
        '<circle cx="222" cy="216" r="7" fill="#2a3038"/>',
    ])


def cabin_filter():
    return "".join([
        '<rect x="104" y="92" width="192" height="116" rx="8" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
        vlines(112, 100, 100, 22, 8.6, "#8b96a2", 2.4),
        hlines(112, 100, 176, 12, 8.4, "#aeb9c4", 1.6),
        '<rect x="104" y="92" width="192" height="14" rx="6" fill="#c6cfd8"/>',
        '<rect x="104" y="194" width="192" height="14" rx="6" fill="#c6cfd8"/>',
        '<rect x="92" y="104" width="14" height="92" rx="5" fill="url(#alu)"/>',
        '<rect x="294" y="104" width="14" height="92" rx="5" fill="url(#alu)"/>',
    ])


def oil_filter():
    return "".join([
        '<rect x="150" y="70" width="100" height="150" rx="18" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.6"/>',
        '<rect x="160" y="80" width="80" height="130" rx="12" fill="#2b3038"/>',
        vlines(166, 88, 114, 12, 6.4, "#454d57", 2),
        '<ellipse cx="200" cy="70" rx="50" ry="14" fill="url(#alu)" stroke="#7c8794" stroke-width="1.3"/>',
        '<circle cx="200" cy="70" r="22" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.3"/>',
        '<circle cx="200" cy="70" r="10" fill="#2a3038"/>',
        '<rect x="176" y="214" width="48" height="14" rx="6" fill="#ff6a00" opacity="0.85"/>',
    ])


def air_filter():
    return "".join([
        '<rect x="98" y="112" width="204" height="76" rx="10" fill="url(#steel)" stroke="#7c8794" stroke-width="1.5"/>',
        vlines(108, 120, 60, 22, 8.6, "#8b96a2", 3),
        '<rect x="98" y="112" width="204" height="12" rx="5" fill="#c6cfd8"/>',
        '<rect x="98" y="176" width="204" height="12" rx="5" fill="#c6cfd8"/>',
        '<rect x="98" y="120" width="204" height="10" rx="4" fill="#ff6a00" opacity="0.7"/>',
    ])


def spark_plugs():
    g = []
    for x in (108, 168, 228, 288):
        g += [f'<rect x="{x}" y="86" width="22" height="60" rx="6" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.3"/>',
              f'<rect x="{x+3}" y="92" width="16" height="30" rx="4" fill="#dfe5ea"/>',
              f'<rect x="{x}" y="146" width="22" height="26" rx="5" fill="url(#steel)"/>',
              ring(x + 11, 172, 9, 6, 2, "#8b96a2"),
              f'<rect x="{x+6}" y="178" width="10" height="22" rx="4" fill="url(#copper)"/>',
              f'<rect x="{x+8}" y="200" width="6" height="18" rx="2" fill="#c6cfd8"/>']
    return "".join(g)


def battery():
    return "".join([
        '<rect x="94" y="104" width="212" height="120" rx="12" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.6"/>',
        '<rect x="104" y="114" width="192" height="100" rx="8" fill="#262c34"/>',
        '<rect x="112" y="122" width="176" height="34" rx="6" fill="#3d444d"/>',
        '<circle cx="130" cy="98" r="14" fill="url(#red)"/>',
        '<rect x="126" y="84" width="8" height="16" rx="3" fill="url(#chrome)"/>',
        '<circle cx="270" cy="98" r="14" fill="url(#dark)"/>',
        '<rect x="266" y="84" width="8" height="16" rx="3" fill="url(#chrome)"/>',
        '<text x="200" y="146" font-family="Inter,Arial" font-size="20" font-weight="800" fill="#c6cfd8" text-anchor="middle" letter-spacing="3">70Ah</text>',
        '<text x="200" y="196" font-family="Inter,Arial" font-size="13" font-weight="700" fill="#ff6a00" text-anchor="middle" letter-spacing="4">AGM</text>',
        '<rect x="112" y="200" width="176" height="6" rx="3" fill="#14171b"/>',
    ])


def engine_oil():
    return "".join([
        '<path d="M150,92 L250,92 L250,120 Q286,140 286,196 Q286,240 244,240 L156,240 Q114,240 114,196 Q114,140 150,120 Z" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.6"/>',
        '<rect x="176" y="72" width="48" height="24" rx="6" fill="#2b3038"/>',
        '<rect x="182" y="60" width="36" height="14" rx="5" fill="url(#dark)"/>',
        '<rect x="132" y="152" width="136" height="66" rx="8" fill="#3d444d" opacity="0.75"/>',
        '<rect x="150" y="168" width="100" height="16" rx="4" fill="#ff6a00" opacity="0.9"/>',
        '<text x="200" y="214" font-family="Inter,Arial" font-size="15" font-weight="800" fill="#dfe5ea" text-anchor="middle" letter-spacing="2">5W-30</text>',
        '<path d="M150,92 L250,92" stroke="#8b96a2" stroke-width="2" opacity="0.6"/>',
    ])


def brake_fluid():
    return "".join([
        '<path d="M158,84 L242,84 L242,110 Q276,132 276,188 Q276,236 236,236 L164,236 Q124,236 124,188 Q124,132 158,110 Z" fill="url(#darkV)" stroke="#5a636e" stroke-width="1.6"/>',
        '<rect x="180" y="66" width="40" height="20" rx="5" fill="#2b3038"/>',
        '<rect x="186" y="56" width="28" height="12" rx="4" fill="url(#dark)"/>',
        '<rect x="140" y="150" width="120" height="60" rx="8" fill="#3d444d" opacity="0.75"/>',
        '<rect x="156" y="166" width="88" height="14" rx="4" fill="#e2503f" opacity="0.9"/>',
        '<text x="200" y="210" font-family="Inter,Arial" font-size="15" font-weight="800" fill="#dfe5ea" text-anchor="middle" letter-spacing="2">DOT 4</text>',
    ])


def ac_gas():
    return "".join([
        '<rect x="140" y="80" width="120" height="176" rx="18" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.6"/>',
        '<rect x="150" y="90" width="100" height="156" rx="12" fill="#c6cfd8" opacity="0.55"/>',
        '<rect x="188" y="58" width="24" height="26" rx="6" fill="url(#steel)"/>',
        '<rect x="192" y="48" width="16" height="14" rx="5" fill="url(#dark)"/>',
        '<rect x="150" y="150" width="100" height="46" rx="8" fill="#8b96a2" opacity="0.7"/>',
        '<text x="200" y="180" font-family="Inter,Arial" font-size="15" font-weight="800" fill="#1c2027" text-anchor="middle" letter-spacing="1">R134a</text>',
        '<circle cx="200" cy="112" r="12" fill="url(#copper)" opacity="0.8"/>',
    ])


def tyre():
    g = ['<circle cx="200" cy="152" r="116" fill="url(#rubber)" stroke="#0a0c0e" stroke-width="2"/>',
         '<circle cx="200" cy="152" r="104" fill="none" stroke="#23282f" stroke-width="10"/>',
         '<circle cx="200" cy="152" r="104" fill="none" stroke="#3a4048" stroke-width="2" stroke-dasharray="3 7"/>']
    for i in range(28):
        a = math.radians(i * 360.0 / 28)
        g.append(f'<line x1="{200+94*math.cos(a):.1f}" y1="{152+94*math.sin(a):.1f}" '
                 f'x2="{200+112*math.cos(a):.1f}" y2="{152+112*math.sin(a):.1f}" stroke="#4a525c" stroke-width="3.4"/>')
    g += ['<circle cx="200" cy="152" r="72" fill="url(#steel)" stroke="#7c8794" stroke-width="1.6"/>',
          '<circle cx="200" cy="152" r="58" fill="url(#aluV)"/>',
          spokes(200, 152, 5, 18, 54, 6, 13, "#c6cfd8", start=-90),
          '<circle cx="200" cy="152" r="18" fill="url(#chrome)"/><circle cx="200" cy="152" r="7" fill="#2a3038"/>']
    return "".join(g)


def mirror():
    return "".join([
        '<path d="M120,96 Q120,76 142,76 L246,80 Q268,82 268,104 L268,158 Q268,180 246,180 L142,180 Q120,180 120,158 Z" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.6"/>',
        '<path d="M134,94 Q134,84 146,84 L252,88 Q260,89 260,100 L260,156 Q260,166 248,166 L146,166 Q134,166 134,156 Z" fill="#dfe9f2" stroke="#9aa6b2" stroke-width="1.3"/>',
        '<path d="M146,96 L246,100 L246,124 L146,120 Z" fill="#ffffff" opacity="0.7"/>',
        '<rect x="268" y="120" width="40" height="20" rx="8" fill="url(#darkV)"/>',
        '<rect x="296" y="112" width="18" height="36" rx="7" fill="url(#dark)"/>',
        '<path d="M120,180 L110,206" stroke="#8b96a2" stroke-width="4"/>',
    ])


def power_steering_pump():
    return "".join([
        '<circle cx="170" cy="150" r="66" fill="url(#alu)" stroke="#7c8794" stroke-width="1.6"/>',
        '<circle cx="170" cy="150" r="52" fill="#b6c0ca"/>',
        '<circle cx="170" cy="150" r="40" fill="url(#aluV)"/>',
        '<circle cx="170" cy="150" r="16" fill="url(#chrome)"/><circle cx="170" cy="150" r="6" fill="#2a3038"/>',
        '<rect x="230" y="120" width="66" height="60" rx="12" fill="url(#aluV)" stroke="#7c8794" stroke-width="1.4"/>',
        '<circle cx="262" cy="132" r="9" fill="url(#dark)"/>',
        '<circle cx="250" cy="182" r="8" fill="url(#copper)"/>',
        '<rect x="146" y="82" width="48" height="18" rx="6" fill="url(#dark)"/>',
    ])


def generic_part():
    return "".join([
        '<circle cx="200" cy="150" r="86" fill="url(#alu)" stroke="#7c8794" stroke-width="1.6"/>',
        '<circle cx="200" cy="150" r="70" fill="#b6c0ca"/>',
        ring(200, 150, 70, 14, 6, "#98a4b0"),
        '<circle cx="200" cy="150" r="54" fill="url(#aluV)"/>',
        spokes(200, 150, 8, 20, 50, 5, 11, "#8b96a2", start=0),
        '<circle cx="200" cy="150" r="24" fill="url(#chrome)" stroke="#8b96a2" stroke-width="1.5"/>',
        '<circle cx="200" cy="150" r="9" fill="#2a3038"/>',
        '<circle cx="200" cy="150" r="4" fill="#ff6a00"/>',
    ])


CATALOG = {
    "part-generic": generic_part,
    "engine-block": engine_block,
    "turbo": turbo,
    "alternator": alternator,
    "starter": starter,
    "headlight": headlight,
    "taillight": taillight,
    "bumper": bumper,
    "radiator": radiator,
    "intercooler": intercooler,
    "brake-disc": brake_disc,
    "brake-caliper": brake_caliper,
    "brake-pads": brake_pads,
    "shock-absorber": shock_absorber,
    "control-arm": control_arm,
    "wheel-rim": wheel_rim,
    "exhaust-muffler": exhaust_muffler,
    "catalytic-converter": catalytic_converter,
    "dpf": dpf,
    "clutch-kit": clutch_kit,
    "gearbox": gearbox,
    "water-pump": water_pump,
    "timing-belt-kit": timing_belt_kit,
    "cabin-filter": cabin_filter,
    "oil-filter": oil_filter,
    "air-filter": air_filter,
    "spark-plugs": spark_plugs,
    "battery": battery,
    "engine-oil": engine_oil,
    "brake-fluid": brake_fluid,
    "ac-gas": ac_gas,
    "tyre": tyre,
    "mirror": mirror,
    "power-steering-pump": power_steering_pump,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for key, fn in CATALOG.items():
        data = svg(fn())
        ET.fromstring(data)  # validate well-formed XML
        with open(os.path.join(OUT, f"{key}.svg"), "w", encoding="utf-8") as f:
            f.write(data)
    print(f"wrote {len(CATALOG)} illustrations to {os.path.abspath(OUT)}")


if __name__ == "__main__":
    main()
