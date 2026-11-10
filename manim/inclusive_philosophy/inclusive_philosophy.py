"""
Sharing the Extra ₹2 - Inclusive Philosophy, explained for children.

A Manim Community Edition animation of the lecture note
"Inclusive Philosophy" by Srijit Mishra (School of Economics,
University of Hyderabad, 21 January 2025), Figure 1 and Table 1.

Render one scene (1080p, 30 fps):
    manim -pqh --fps 30 inclusive_philosophy.py Scene1_Intro

Render every scene in order:
    manim -qh --fps 30 inclusive_philosophy.py Scene1_Intro Scene2_Story Scene3_Graph \
        Scene4_PathsAB Scene5_PathsCD Scene6_PathE Scene7_Triangle Scene8_Recap

Join the scenes into one video (run from this folder after rendering):
    cd media/videos/inclusive_philosophy/1080p30
    printf "file '%s.mp4'\n" Scene1_Intro Scene2_Story Scene3_Graph \
        Scene4_PathsAB Scene5_PathsCD Scene6_PathE Scene7_Triangle \
        Scene8_Recap > list.txt
    ffmpeg -f concat -safe 0 -i list.txt -c copy Inclusive_Philosophy.mp4

Needs: manim >= 0.18, a LaTeX install (for MathTex), ffmpeg.
"""

from manim import *
import manimpango
import numpy as np

config.background_color = "#0F172A"

FONT = "Poppins" if "Poppins" in manimpango.list_fonts() else ""

# ---------------------------------------------------------------------------
# Colours (exact hex values from the legend of Figure 1)
# ---------------------------------------------------------------------------
PDF_COLORS = {
    "OX": "#1F5F8B",   # better-off axis
    "OY": "#E67E22",   # worse-off axis
    "BOX": "#1B5E20",  # planetary bounds X-L-Y
    "OL": "#29ABE2",   # line of equality
    "Z": "#B5179E",    # current scenario
    "a": "#7CB342",    # ZA worse-off status quo
    "b": "#0D3B66",    # ZB shares status quo
    "c": "#C0501E",    # ZC hereafter equal
    "d": "#1B5E20",    # ZD proportionate to shortfall
    "e": "#0E5E6F",    # ZE better-off status quo
    "BUDGET": "#6A1B4D",
}

# Some legend colours are very dark and almost vanish on the navy
# background. With HIGH_CONTRAST on, those are mixed with white so children
# can see them; the hue stays the same. Set it to False for the exact hex.
HIGH_CONTRAST = True
_LIGHTEN = {"OX": 0.35, "BOX": 0.35, "b": 0.5, "d": 0.35, "e": 0.4, "BUDGET": 0.45}


def col(key):
    c = PDF_COLORS[key]
    if HIGH_CONTRAST and key in _LIGHTEN:
        return interpolate_color(ManimColor(c), WHITE, _LIGHTEN[key])
    return ManimColor(c)


GOOD = "#43A047"
GOLD_C = "#F4C430"

# Reading pace: every pause is multiplied by this (raise it for younger children)
PACE = 1.5


def pause(scene, t=1.0):
    scene.wait(t * PACE)


# Story panel (right 40% of the frame)
PANEL_X = 4.2
PANEL_W = 5.0

# ---------------------------------------------------------------------------
# The exact economics of Figure 1
# ---------------------------------------------------------------------------
Z = np.array([7.0, 3.0])       # today: Xavi ₹7, Yami ₹3
EXTRA = 2.0                    # new income to share
IDEAL = 10.0                   # presumed ideal for each person
SHORT_X, SHORT_Y = IDEAL - Z[0], IDEAL - Z[1]   # 3 and 7

SHARES = {
    "a": (EXTRA, 0.0),                                       # all to X
    "b": (EXTRA * Z[0] / Z.sum(), EXTRA * Z[1] / Z.sum()),   # 7 : 3
    "c": (EXTRA / 2, EXTRA / 2),                             # 1 : 1
    "d": (EXTRA * SHORT_X / (SHORT_X + SHORT_Y),
          EXTRA * SHORT_Y / (SHORT_X + SHORT_Y)),            # 3 : 7
    "e": (0.0, EXTRA),                                       # all to Y
}


def path_end(zk):
    """Extend the ray Z -> zk to the edge of Figure 1: the line x = 10, or the
    line of equality y = x for the vertical path ZE."""
    d = zk - Z
    t = (10 - Z[0]) / d[0] if d[0] > 1e-12 else (Z[0] - Z[1]) / d[1]
    return Z + t * d


ZPTS = {k: Z + np.array(v) for k, v in SHARES.items()}
ENDS = {k: path_end(p) for k, p in ZPTS.items()}

# --- precision checks ------------------------------------------------------
_EXPECTED_Z = {"a": (9, 3), "b": (8.4, 3.6), "c": (8, 4), "d": (7.6, 4.4), "e": (7, 5)}
_EXPECTED_END = {"a": (10, 3), "b": (10, 30 / 7), "c": (10, 6), "d": (10, 10), "e": (7, 7)}
for _k in SHARES:
    assert np.allclose(ZPTS[_k], _EXPECTED_Z[_k]), _k
    assert np.allclose(ENDS[_k], _EXPECTED_END[_k]), _k
    assert abs(ZPTS[_k].sum() - 12) < 1e-9, _k                  # on x + y = 12
    _d1, _d2 = ZPTS[_k] - Z, ENDS[_k] - Z
    assert abs(_d1[0] * _d2[1] - _d1[1] * _d2[0]) < 1e-9, _k    # on its path
E_PT = ENDS["e"]
D_PT = ENDS["d"]
assert np.allclose(E_PT, (7, 7)) and np.allclose(D_PT, (10, 10))

PATHS = {
    "a": dict(
        end="A", title="Path ZA: Worse-off status quo",
        dx="₹2", dy="₹0", newx="₹9", newy="₹3",
        ratio=r"3:1", pct="75% / 25%", chips=(10, 0),
        example="Yami gets a fixed wage.\nOwner Xavi keeps all the gain.",
        badge="Property-rights fetish:\nignores Yami's effort", badge_color="#E53935",
        sad=True,
    ),
    "b": dict(
        end="B", title="Path ZB: Shares status quo",
        dx="₹1.4", dy="₹0.6", newx="₹8.4", newy="₹3.6",
        ratio=r"2\tfrac{1}{3}:1", pct="70% / 30%", chips=(7, 3),
        example="Everyone's pay × 1.2 (fitment factor)\n8.4 ÷ 7 = 3.6 ÷ 3 = 1.2",
        badge="Gini-coefficient fetish: shares same,\nbut the gap grows: ₹4 → ₹4.8",
        badge_color="#FB8C00", sad=False,
    ),
    "c": dict(
        end="C", title="Path ZC: Hereafter, equal",
        dx="₹1", dy="₹1", newx="₹8", newy="₹4",
        ratio=r"2:1", pct="67% / 33%", chips=(5, 5),
        example="50 : 50 sharecropping.\nEqual pay for equal work.",
        badge="Fair today, but the old\ngap of ₹4 stays", badge_color="#FDD835",
        sad=False,
    ),
    "d": dict(
        end="D", title="Path ZD: Proportionate to shortfall",
        dx="₹0.6", dy="₹1.4", newx="₹7.6", newy="₹4.4",
        ratio=r"1\tfrac{8}{11}:1", pct="63% / 37%", chips=(3, 7),
        example="Public policy: stop elite capture,\na level playing field (World Bank 2024)",
        badge="Inclusive ✓", badge_color=GOOD, sad=False,
    ),
    "e": dict(
        end="E", title="Path ZE: Better-off status quo",
        dx="₹0", dy="₹2", newx="₹7", newy="₹5",
        ratio=r"1\tfrac{2}{5}:1", pct="58% / 42%", chips=(0, 10),
        example="Extra help in education and health\nfor those who need hand-holding",
        badge="Inclusive ✓", badge_color=GOOD, sad=False,
    ),
}
ORDER = ["a", "b", "c", "d", "e"]


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def T(s, size=28, color=WHITE, weight=NORMAL, max_w=None):
    t = Text(s, font=FONT, font_size=size, color=color, weight=weight, line_spacing=0.8)
    if max_w is not None and t.width > max_w:
        t.scale_to_fit_width(max_w)
    return t


def in_panel(mob, y, max_w=PANEL_W):
    if mob.width > max_w:
        mob.scale_to_fit_width(max_w)
    mob.move_to([PANEL_X, y, 0])
    return mob


def card(content, color=WHITE, pad=0.25, fill="#1E293B"):
    box = SurroundingRectangle(content, buff=pad, corner_radius=0.15,
                               color=color, stroke_width=2.5)
    box.set_fill(fill, opacity=0.95)
    return VGroup(box, content)


def ratio_line(tex, pct, size=24):
    return VGroup(T("Ratio X : Y =", size), MathTex(tex, font_size=size * 1.6),
                  T(f"({pct})", size, color=GREY_A)).arrange(RIGHT, buff=0.15)


def coin(r=0.12):
    c = Circle(radius=r, stroke_color="#8D6E00", stroke_width=2,
               fill_color=GOLD_C, fill_opacity=1)
    t = T("₹1", 20, color="#5A3E00", weight=BOLD)
    t.scale_to_fit_width(r * 1.25)
    return VGroup(c, t.move_to(c))


def chip(r=0.08):
    """One 20-paise piece: the ₹2 is broken into 10 of these."""
    return Circle(radius=r, stroke_color="#8D6E00", stroke_width=1.5,
                  fill_color=GOLD_C, fill_opacity=1)


def mouth(head, sad=False):
    r = head.width / 2
    if sad:
        m = Arc(radius=r * 0.4, start_angle=PI * 0.2, angle=PI * 0.6)
        m.move_to(head.get_center() + DOWN * r * 0.42)
    else:
        m = Arc(radius=r * 0.45, start_angle=PI * 1.2, angle=PI * 0.6)
        m.move_to(head.get_center() + DOWN * r * 0.3)
    return m.set_stroke(BLACK, width=4)


def face(color, name, r=0.45, sad=False, name_size=22):
    head = Circle(radius=r, fill_color=color, fill_opacity=1,
                  stroke_color=WHITE, stroke_width=2)
    eyes = VGroup(
        Dot(head.get_center() + r * (LEFT * 0.35 + UP * 0.18), radius=r * 0.09, color=BLACK),
        Dot(head.get_center() + r * (RIGHT * 0.35 + UP * 0.18), radius=r * 0.09, color=BLACK),
    )
    label = T(name, name_size).next_to(head, DOWN, buff=0.12)
    return VGroup(head, eyes, mouth(head, sad), label)


def set_mood(f, sad):
    return Transform(f[2], mouth(f[0], sad))


def xavi(**kw):
    return face(col("OX"), "Xavi", **kw)


def yami(**kw):
    return face(PDF_COLORS["OY"], "Yami", **kw)


def person_card(name, tag):
    head = Circle(radius=0.35, fill_color=GREY_B, fill_opacity=1, stroke_width=0)
    body = Arc(radius=0.6, start_angle=0, angle=PI).set_fill(GREY_B, 1).set_stroke(width=0)
    body.next_to(head, DOWN, buff=0.08)
    pic = VGroup(head, body)
    txt = VGroup(T(name, 30, weight=BOLD), T(tag, 20, color=GREY_A)).arrange(DOWN, buff=0.12)
    inner = VGroup(pic, txt).arrange(DOWN, buff=0.3)
    box = RoundedRectangle(width=3.4, height=3.4, corner_radius=0.25,
                           stroke_color=GOLD_C, stroke_width=3)
    box.set_fill("#1E293B", 1)
    return VGroup(box, inner.move_to(box))


# ---------------------------------------------------------------------------
# The graph (Figure 1)
# ---------------------------------------------------------------------------
def make_axes():
    ax = Axes(
        x_range=[0, 10, 2], y_range=[0, 10, 2], x_length=6.5, y_length=6.5,
        axis_config={"include_numbers": True, "font_size": 24,
                     "include_tip": False, "color": GREY_B},
    )
    # Pin the plotting area itself (not the bounding box with its labels)
    ax.shift(np.array([-3.35, 3.45, 0]) - ax.c2p(5, 10))
    return ax


def dot(ax, x, y, color, label, direction=UR, size=26, radius=0.07):
    d = Dot(ax.c2p(x, y), radius=radius, color=color)
    lab = MathTex(label, font_size=size, color=color).next_to(d, direction, buff=0.08)
    return VGroup(d, lab)


def seg(ax, p, q, color, width=4):
    return Line(ax.c2p(*p), ax.c2p(*q), color=color, stroke_width=width)


def path_arrow(ax, k, width=5):
    return Arrow(ax.c2p(*Z), ax.c2p(*ENDS[k]), buff=0, color=col(k),
                 stroke_width=width, tip_length=0.2, max_tip_length_to_length_ratio=0.15)


class Graph:
    """Builds every part of Figure 1 so each scene can recreate it identically."""

    def __init__(self):
        ax = self.ax = make_axes()
        self.xlabel = T("Xavi's money (better-off) ₹", 20, color=BLUE_B)
        self.xlabel.next_to(ax.x_axis, DOWN, buff=0.2)
        self.ylabel = T("Yami's money (worse-off) ₹", 20, color=PDF_COLORS["OY"])
        self.ylabel.next_to(ax.c2p(0, 10), UP, buff=0.08).align_to(ax.c2p(0, 10), LEFT).shift(LEFT * 0.4)

        self.OX = seg(ax, (0, 0), (10, 0), col("OX"), 7)
        self.OY = seg(ax, (0, 0), (0, 10), PDF_COLORS["OY"], 5)
        self.box = VGroup(seg(ax, (10, 0), (10, 10), col("BOX"), 4),
                          seg(ax, (10, 10), (0, 10), col("BOX"), 4))
        self.OL = seg(ax, (0, 0), (10, 10), PDF_COLORS["OL"], 4)
        self.OL_label = T("X = Y", 18, color=PDF_COLORS["OL"]).rotate(PI / 4)
        self.OL_label.move_to(ax.c2p(3.6, 4.3))

        self.corner_labels = VGroup(
            MathTex("O", font_size=26).next_to(ax.c2p(0, 0), DL, buff=0.1),
            MathTex("X", font_size=26, color=BLUE_B).next_to(ax.c2p(10, 0), DR, buff=0.1),
            MathTex("Y", font_size=26, color=PDF_COLORS["OY"]).next_to(ax.c2p(0, 10), UL, buff=0.1).shift(DOWN * 0.15),
            MathTex("L,D", font_size=26, color=col("BOX")).next_to(ax.c2p(10, 10), UR, buff=0.08),
        )
        self.Z = dot(ax, *Z, PDF_COLORS["Z"], "Z", DL, radius=0.09)
        self.budget = seg(ax, ZPTS["a"], ZPTS["e"], col("BUDGET"), 4)
        self.letters = {
            "A": MathTex("A", font_size=26).next_to(ax.c2p(*ENDS["a"]), RIGHT, buff=0.1),
            "B": MathTex("B", font_size=26).next_to(ax.c2p(*ENDS["b"]), RIGHT, buff=0.1),
            "C": MathTex("C", font_size=26).next_to(ax.c2p(*ENDS["c"]), RIGHT, buff=0.1),
            "E": MathTex("E", font_size=26).next_to(ax.c2p(*E_PT), LEFT, buff=0.12),
        }

    def zdot(self, k):
        direction = RIGHT if k == "e" else UR
        return dot(self.ax, *ZPTS[k], col(k), f"Z_{k}", direction, size=24, radius=0.06)

    def base(self):
        return VGroup(self.ax, self.xlabel, self.ylabel, self.box, self.OX, self.OY,
                      self.OL, self.OL_label, self.corner_labels, self.budget, self.Z)


def chip_grid(n, center, cols=5):
    if n == 0:
        return VGroup()
    g = VGroup(*[chip() for _ in range(n)]).arrange_in_grid(cols=min(cols, n), buff=0.05)
    return g.move_to(center)


def play_path(scene, g, k, prev_arrows):
    """Shows one way of sharing the ₹2: arrow on the graph, coins, card, badge."""
    p = PATHS[k]
    ax = g.ax

    # VO: (title) Let us try path Z-<letter>.
    title = in_panel(T(p["title"], 30, color=col(k), weight=BOLD), 3.5)
    scene.play(Write(title))

    # 1. Arrow along the path, in its colour.
    arrow = path_arrow(ax, k)
    letter = g.letters.get(p["end"])
    anims = [Create(arrow)]
    if letter is not None and letter not in scene.mobjects:
        anims.append(FadeIn(letter))
    scene.play(*anims, run_time=1.5)

    # 2. A coin travels from Z to the new point and drops a labelled dot.
    traveller = coin(0.12).move_to(ax.c2p(*Z))
    scene.play(FadeIn(traveller, scale=0.5))
    scene.play(traveller.animate.move_to(ax.c2p(*ZPTS[k])), run_time=1.5)
    zk = g.zdot(k)
    scene.play(FadeOut(traveller), GrowFromCenter(zk[0]), Write(zk[1]))

    # 3. Story panel: the ₹2 broken into 10 pieces of 20 paise.
    fx = xavi(r=0.35, name_size=20).move_to([PANEL_X - 1.75, 2.35, 0])
    fy = yami(r=0.35, name_size=20).move_to([PANEL_X + 1.75, 2.35, 0])
    mx = T("₹7", 22, color=BLUE_B).next_to(fx, DOWN, buff=0.1)
    my = T("₹3", 22, color=PDF_COLORS["OY"]).next_to(fy, DOWN, buff=0.1)
    pot = chip_grid(10, [PANEL_X, 2.45, 0])
    pot_label = T("₹2 = 10 × 20 paise", 16, color=GOLD_C).next_to(pot, DOWN, buff=0.12)
    scene.play(FadeIn(fx), FadeIn(fy), FadeIn(mx), FadeIn(my),
               FadeIn(pot, lag_ratio=0.1), FadeIn(pot_label))
    pause(scene, 0.5)

    nx, ny = p["chips"]
    to_x = VGroup(*pot[:nx])
    to_y = VGroup(*pot[nx:])
    moves = []
    if nx:
        moves.append(to_x.animate.arrange_in_grid(cols=5, buff=0.05).next_to(mx, DOWN, buff=0.12))
    if ny:
        moves.append(to_y.animate.arrange_in_grid(cols=5, buff=0.05).next_to(my, DOWN, buff=0.12))
    scene.play(*moves, FadeOut(pot_label), run_time=1.5)
    new_mx = T(f"₹7 → {p['newx']}", 22, color=BLUE_B).move_to(mx)
    new_my = T(f"₹3 → {p['newy']}", 22, color=PDF_COLORS["OY"]).move_to(my)
    scene.play(Transform(mx, new_mx), Transform(my, new_my))
    if p["sad"]:
        scene.play(set_mood(fy, True))
    pause(scene, 1)

    extra = VGroup()
    if k == "d":
        extra = shortfall_bars()
        in_panel(extra, -0.35)
        # VO: The ideal is ₹10 each. Xavi is ₹3 short, Yami is ₹7 short.
        scene.play(FadeIn(extra[0]), FadeIn(extra[1]))
        scene.play(Create(extra[2]), Create(extra[3]), FadeIn(extra[4]))
        pause(scene, 2)
        scene.play(FadeOut(extra))

    # 4. Numbers card.
    lines = VGroup(
        T(f"ΔX = {p['dx']}     ΔY = {p['dy']}", 24),
        T(f"New: X = {p['newx']},  Y = {p['newy']}", 24),
        ratio_line(p["ratio"], p["pct"]),
    ).arrange(DOWN, buff=0.18)
    numbers = in_panel(card(lines, color=col(k)), 0.0, PANEL_W)
    scene.play(FadeIn(numbers, shift=UP * 0.2))
    pause(scene, 2)

    example = VGroup(T("Example", 20, color=GOLD_C, weight=BOLD), T(p["example"], 22))
    example.arrange(DOWN, buff=0.1)
    in_panel(example, -1.65)
    scene.play(FadeIn(example))
    pause(scene, 2)

    badge_txt = T(p["badge"], 24, color=BLACK if k == "c" else WHITE, weight=BOLD)
    badge = card(badge_txt, color=p["badge_color"], fill=p["badge_color"], pad=0.18)
    in_panel(badge, -3.05)
    scene.play(GrowFromCenter(badge))
    pause(scene, 2)

    if k == "c":
        # VO: The gap was ₹4 before and is still ₹4 after.
        scene.play(FadeOut(numbers), FadeOut(example))
        gaps = gap_bars()
        if gaps.height > 3.2:
            gaps.scale_to_fit_height(3.2)
        in_panel(gaps, -0.7)
        scene.play(FadeIn(gaps, lag_ratio=0.2), run_time=2)
        pause(scene, 2.5)
        scene.play(FadeOut(gaps))
        numbers = VGroup()
        example = VGroup()

    panel = VGroup(title, fx, fy, mx, my, pot, numbers, example, badge)
    return panel, arrow, zk


def bar_pair(x_amt, y_amt, unit=0.32, h=0.26):
    bx = Rectangle(width=x_amt * unit, height=h, fill_color=col("OX"), fill_opacity=1, stroke_width=0)
    by = Rectangle(width=y_amt * unit, height=h, fill_color=PDF_COLORS["OY"], fill_opacity=1, stroke_width=0)
    bars = VGroup(bx, by).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
    return bars


def gap_bars():
    rows = VGroup()
    for name, xa, ya in (("Before", 7, 3), ("After ZC", 8, 4)):
        bars = bar_pair(xa, ya)
        gap = Line(bars[1].get_right(), [bars[0].get_right()[0], bars[1].get_right()[1], 0])
        brace = BraceBetweenPoints(bars[1].get_right() + DOWN * 0.15,
                                   [bars[0].get_right()[0], bars[1].get_right()[1] - 0.15, 0],
                                   direction=DOWN, color=YELLOW)
        gtxt = T(f"gap ₹{xa - ya}", 18, color=YELLOW).next_to(brace, DOWN, buff=0.05)
        lab = T(f"{name}: X ₹{xa}, Y ₹{ya}", 18).next_to(bars, UP, buff=0.08, aligned_edge=LEFT)
        rows.add(VGroup(lab, bars, brace, gtxt))
    return rows.arrange(DOWN, buff=0.3, aligned_edge=LEFT)


def shortfall_bars(unit=0.4, h=0.32):
    """Progress bars to the ₹10 ideal with the missing part highlighted."""
    outline_x = Rectangle(width=10 * unit, height=h, stroke_color=WHITE, stroke_width=2)
    outline_y = outline_x.copy()
    VGroup(outline_x, outline_y).arrange(DOWN, buff=0.55)
    fill_x = Rectangle(width=7 * unit, height=h, fill_color=col("OX"), fill_opacity=1,
                       stroke_width=0).align_to(outline_x, LEFT).match_y(outline_x)
    fill_y = Rectangle(width=3 * unit, height=h, fill_color=PDF_COLORS["OY"], fill_opacity=1,
                       stroke_width=0).align_to(outline_y, LEFT).match_y(outline_y)
    miss_x = Rectangle(width=3 * unit, height=h, stroke_color=YELLOW, stroke_width=3,
                       fill_color=YELLOW, fill_opacity=0.25).align_to(outline_x, RIGHT).match_y(outline_x)
    miss_y = Rectangle(width=7 * unit, height=h, stroke_color=YELLOW, stroke_width=3,
                       fill_color=YELLOW, fill_opacity=0.25).align_to(outline_y, RIGHT).match_y(outline_y)
    lx = T("Xavi ₹7 of ₹10", 18).next_to(outline_x, UP, buff=0.06, aligned_edge=LEFT)
    ly = T("Yami ₹3 of ₹10", 18).next_to(outline_y, UP, buff=0.06, aligned_edge=LEFT)
    sx = T("short ₹3", 16, color=YELLOW).move_to(miss_x)
    sy = T("short ₹7", 16, color=YELLOW).move_to(miss_y)
    rule = T("Share the ₹2 in the ratio 3 : 7", 22, color=YELLOW, weight=BOLD)
    group_bars = VGroup(VGroup(outline_x, fill_x, lx), VGroup(outline_y, fill_y, ly))
    rule.next_to(group_bars, DOWN, buff=0.25)
    return VGroup(group_bars[0], group_bars[1],
                  VGroup(miss_x, sx), VGroup(miss_y, sy), rule)


def setup_graph(scene, g, done=()):
    """Recreate the graph exactly as it was at the end of Scene 3, plus any
    paths shown in earlier scenes (dimmed)."""
    scene.add(g.base())
    for k in done:
        a = path_arrow(g.ax, k).set_opacity(0.4)
        zk = g.zdot(k)
        letter = g.letters.get(PATHS[k]["end"])
        scene.add(a, zk)
        if letter is not None:
            scene.add(letter)
    scene.bring_to_front(g.Z)


def finish_path(scene, panel, arrow):
    scene.play(FadeOut(panel), arrow.animate.set_opacity(0.4))


# ---------------------------------------------------------------------------
# Scenes
# ---------------------------------------------------------------------------
class Scene1_Intro(Scene):
    def construct(self):
        # VO: Hello friends! Today we will learn a big idea: inclusive philosophy.
        title = T("Inclusive Philosophy", 64, color=GOLD_C, weight=BOLD)
        sub = T("How should we share new growth?", 34)
        VGroup(title, sub).arrange(DOWN, buff=0.35).shift(UP * 0.8)
        credit = T("Based on lecture note by Srijit Mishra, University of Hyderabad", 22,
                   color=GREY_B).to_edge(DOWN, buff=0.6)
        self.play(Write(title), run_time=2)
        self.play(FadeIn(sub, shift=UP * 0.2))
        self.play(FadeIn(credit))
        pause(self, 2)

        # VO: Inclusive means that no one is left out.
        big = card(T("Inclusive = no one is left out.", 44, weight=BOLD), color=GOOD, pad=0.4)
        self.play(FadeOut(title), FadeOut(sub), FadeOut(credit))
        self.play(GrowFromCenter(big))
        pause(self, 2.5)
        self.play(FadeOut(big))

        # VO: Our ideas come from three great thinkers: Ambedkar, Gandhi and Rawls.
        head = T("Our inspiration", 44, color=GOLD_C, weight=BOLD).to_edge(UP, buff=0.8)
        cards = VGroup(
            person_card("Ambedkar", "Indian Constitution"),
            person_card("Gandhi", "The Talisman"),
            person_card("Rawls", "Justice as fairness"),
        ).arrange(RIGHT, buff=0.6).shift(DOWN * 0.4)
        self.play(Write(head))
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.3) for c in cards], lag_ratio=0.4), run_time=2.5)
        pause(self, 2.5)
        self.play(FadeOut(head), FadeOut(cards))


class Scene2_Story(Scene):
    def construct(self):
        # VO: Meet two friends, Xavi and Yami.
        head = T("Meet Xavi and Yami", 42, color=GOLD_C, weight=BOLD).to_edge(UP, buff=0.5)
        fx = xavi(r=0.6, name_size=28).move_to([-4, 1.6, 0])
        fy = yami(r=0.6, name_size=28).move_to([4, 1.6, 0])
        self.play(Write(head), FadeIn(fx, shift=RIGHT), FadeIn(fy, shift=LEFT))

        # VO: Xavi has 7 rupees. Yami has only 3 rupees.
        cx = VGroup(*[coin(0.25) for _ in range(7)]).arrange_in_grid(rows=2, cols=4, buff=0.08)
        cy = VGroup(*[coin(0.25) for _ in range(3)]).arrange_in_grid(rows=1, cols=3, buff=0.08)
        cx.next_to(fx, DOWN, buff=0.35)
        cy.next_to(fy, DOWN, buff=0.35)
        self.play(LaggedStart(*[FadeIn(c, shift=DOWN * 0.6) for c in cx], lag_ratio=0.15),
                  LaggedStart(*[FadeIn(c, shift=DOWN * 0.6) for c in cy], lag_ratio=0.15),
                  run_time=2.5)
        lx = T("₹7", 32, color=BLUE_B, weight=BOLD).next_to(cx, DOWN, buff=0.2)
        ly = T("₹3", 32, color=PDF_COLORS["OY"], weight=BOLD).next_to(cy, DOWN, buff=0.2)
        self.play(FadeIn(lx), FadeIn(ly))
        facts = T("Total = ₹10.  Xavi 70%, Yami 30%.  Ratio 7 : 3", 30).to_edge(DOWN, buff=0.9)
        self.play(Write(facts))
        pause(self, 2)

        # VO: Yami does not have less because Yami is lazy. It is because of circumstances.
        note = T("Yami has less not because of laziness,\nbut because of circumstances.", 28,
                 color=YELLOW).to_edge(DOWN, buff=0.5)
        self.play(FadeOut(facts), FadeIn(note))
        pause(self, 3)

        # VO: Now a new technology brings 2 more rupees!
        star = Star(n=5, outer_radius=0.25, color=GOLD_C, fill_opacity=1)
        banner_txt = T("New technology!  +₹2", 34, color=GOLD_C, weight=BOLD)
        banner = VGroup(star, banner_txt).arrange(RIGHT, buff=0.25).move_to(head)
        new = VGroup(coin(0.3), coin(0.3)).arrange(RIGHT, buff=0.15).move_to(UP * 4.6)
        self.play(FadeOut(head), FadeIn(banner, scale=1.2))
        self.play(new.animate.move_to(UP * 1.0), rate_func=rate_functions.ease_out_bounce, run_time=1.5)
        self.play(Flash(new, color=GOLD_C, line_length=0.3))
        q = T("How should the extra ₹2 be shared?", 34, weight=BOLD).to_edge(DOWN, buff=0.5)
        self.play(FadeOut(note), Write(q))
        pause(self, 2.5)

        # VO: The rule: the two parts add up to 2 rupees, and nobody loses anything.
        self.play(*[FadeOut(m) for m in self.mobjects])
        rule = VGroup(
            T("The rule", 36, color=GOLD_C, weight=BOLD),
            T("ΔX + ΔY = ₹2", 40),
            T("and nobody loses:  ΔX ≥ 0,  ΔY ≥ 0", 32),
        ).arrange(DOWN, buff=0.35)
        rule_card = card(rule, color=GOLD_C, pad=0.45).shift(UP * 0.6)
        pareto = T("No one is worse off = Pareto improvement", 30, color=GOOD, weight=BOLD)
        pareto.next_to(rule_card, DOWN, buff=0.6)
        hint = T("(Δ means 'the change in')", 22, color=GREY_B).next_to(pareto, DOWN, buff=0.3)
        self.play(FadeIn(rule_card, shift=UP * 0.2))
        pause(self, 2)
        self.play(Write(pareto), FadeIn(hint))
        pause(self, 3)
        self.play(FadeOut(rule_card), FadeOut(pareto), FadeOut(hint))


class Scene3_Graph(Scene):
    def construct(self):
        g = Graph()
        ax = g.ax

        # VO: Let us draw a picture. Across: Xavi's money. Up: Yami's money.
        head = in_panel(T("Drawing the picture", 34, color=GOLD_C, weight=BOLD), 3.3)
        self.play(Write(head))
        self.play(Create(ax), run_time=2)
        self.play(FadeIn(g.xlabel), FadeIn(g.ylabel))
        self.play(Create(g.OX), Create(g.OY), FadeIn(g.corner_labels[:3]))
        info = in_panel(T("Across: Xavi (better-off)\nUp: Yami (worse-off)", 26), 1.9)
        self.play(FadeIn(info))
        pause(self, 1.5)

        # VO: The green box is our planet's limit. We cannot grow forever.
        self.play(Create(g.box), FadeIn(g.corner_labels[3]), run_time=1.5)
        bounds = in_panel(card(T("Green box = planetary bounds:\nwe can't grow forever", 24),
                               color=col("BOX")), 0.5)
        self.play(FadeIn(bounds))
        pause(self, 2)

        # VO: On the blue line, both friends have exactly the same money.
        self.play(Create(g.OL), FadeIn(g.OL_label), run_time=1.5)
        eq = in_panel(card(T("Blue line = equal money (X = Y)", 24), color=PDF_COLORS["OL"]), -0.75)
        self.play(FadeIn(eq))
        pause(self, 2)

        # VO: Today Xavi has 7 and Yami has 3. That is point Z.
        mover = Dot(ax.c2p(0, 0), radius=0.09, color=PDF_COLORS["Z"])
        self.play(FadeIn(mover))
        self.play(mover.animate.move_to(ax.c2p(*Z)), run_time=2)
        gx = DashedLine(ax.c2p(*Z), ax.c2p(Z[0], 0), color=PDF_COLORS["Z"], stroke_width=2)
        gy = DashedLine(ax.c2p(*Z), ax.c2p(0, Z[1]), color=PDF_COLORS["Z"], stroke_width=2)
        self.play(Create(gx), Create(gy))
        self.remove(mover)
        self.add(g.Z[0])
        self.play(Write(g.Z[1]), Flash(g.Z[0], color=PDF_COLORS["Z"]))
        ztxt = in_panel(card(T("Z: today (₹7, ₹3)", 26, weight=BOLD), color=PDF_COLORS["Z"]), -1.95)
        self.play(FadeIn(ztxt))
        pause(self, 2)

        # VO: After sharing 2 more rupees, the total is 12. Every fair split lands on this purple line.
        self.play(FadeOut(gx), FadeOut(gy))
        self.play(Create(g.budget), run_time=1.5)
        bl = in_panel(card(T("Purple line: X + Y = ₹12\nAll ways to share ₹2 land here", 24),
                           color=col("BUDGET")), -3.15)
        self.play(FadeIn(bl))
        self.play(Indicate(g.budget, color=WHITE, scale_factor=1.05))
        pause(self, 3)
        self.play(FadeOut(VGroup(head, info, bounds, eq, ztxt, bl)))


class Scene4_PathsAB(Scene):
    def construct(self):
        g = Graph()
        setup_graph(self, g)
        # VO: There are many ways to share. Let us look at five special ones.
        intro = in_panel(T("Five ways to share the ₹2", 34, color=GOLD_C, weight=BOLD), 0.3)
        self.play(Write(intro))
        pause(self, 1.5)
        self.play(FadeOut(intro))

        # VO: Path ZA: all of the extra money goes to Xavi. Yami gets nothing and feels sad.
        panel, arrow, _ = play_path(self, g, "a", [])
        finish_path(self, panel, arrow)
        # VO: Path ZB: both get the same percentage as before, 70 and 30.
        panel, arrow, _ = play_path(self, g, "b", [])
        finish_path(self, panel, arrow)


class Scene5_PathsCD(Scene):
    def construct(self):
        g = Graph()
        setup_graph(self, g, done=("a", "b"))
        # VO: Path ZC: one rupee each. Fair today, but the old gap stays.
        panel, arrow, _ = play_path(self, g, "c", [])
        finish_path(self, panel, arrow)
        # VO: Path ZD: whoever is further from the ideal gets more.
        panel, arrow, _ = play_path(self, g, "d", [])
        finish_path(self, panel, arrow)


class Scene6_PathE(Scene):
    def construct(self):
        g = Graph()
        setup_graph(self, g, done=("a", "b", "c", "d"))
        # VO: Path ZE: all the extra money goes to Yami, who needs help the most.
        panel, arrow, _ = play_path(self, g, "e", [])

        # VO: If we keep going up, Yami reaches equality at E. After that, share equally along ED.
        self.play(FadeOut(panel[6:]))
        msg = in_panel(card(T("Keep going up to E: now X = Y!\nAfter reaching equality at E,\nshare equally (path ED).", 24),
                            color=PDF_COLORS["OL"]), -0.8)
        self.play(FadeIn(msg))
        runner = Dot(g.ax.c2p(*ZPTS["e"]), radius=0.08, color=YELLOW)
        self.play(FadeIn(runner))
        self.play(runner.animate.move_to(g.ax.c2p(*E_PT)), run_time=1.5)
        self.play(Flash(runner, color=PDF_COLORS["OL"]), FadeIn(g.letters["E"]))
        ed = Arrow(g.ax.c2p(*E_PT), g.ax.c2p(*D_PT), buff=0, color=PDF_COLORS["OL"],
                   stroke_width=7, tip_length=0.22)
        self.play(Create(ed), runner.animate.move_to(g.ax.c2p(*D_PT)), run_time=2)
        pause(self, 2.5)
        self.play(FadeOut(VGroup(panel[:6], msg, runner, ed)), arrow.animate.set_opacity(0.4))


class Scene7_Triangle(Scene):
    def construct(self):
        g = Graph()
        ax = g.ax
        setup_graph(self, g, done=ORDER)
        self.add(g.letters["E"])

        # VO: Look at the triangle Z, E, D. Paths inside it are inclusive.
        tri = Polygon(ax.c2p(*Z), ax.c2p(*E_PT), ax.c2p(*D_PT), color=GOOD, stroke_width=4)
        tri.set_fill(GOOD, opacity=0.35)
        self.play(FadeIn(tri), run_time=1.5)
        self.play(tri.animate.set_fill(opacity=0.6), rate_func=there_and_back, run_time=1.2)
        self.play(tri.animate.set_fill(opacity=0.6), rate_func=there_and_back, run_time=1.2)
        lab = in_panel(T("Inclusive zone: triangle ZED", 32, color=GOOD, weight=BOLD), 3.3)
        why = in_panel(T("Paths here help Yami catch up.\nThey can lead to X = Y.", 26), 2.3)
        self.play(Write(lab))
        self.play(FadeIn(why))
        pause(self, 2.5)

        # VO: As we move from ZA to ZE, Xavi's share of the extra money falls.
        pct = {"a": 100, "b": 70, "c": 50, "d": 30, "e": 0}
        pointer = Triangle(color=YELLOW, fill_opacity=1).scale(0.1).rotate(PI)
        pointer.next_to(ax.c2p(*ZPTS["a"]), UP, buff=0.05)
        gauge_head = T("Xavi's share of extra money", 22, color=GREY_A)
        gauge_val = T("100%", 44, color=YELLOW, weight=BOLD)
        gauge = in_panel(VGroup(gauge_head, gauge_val).arrange(DOWN, buff=0.15), 0.7)
        self.play(FadeIn(pointer), FadeIn(gauge))
        for k in ORDER[1:]:
            new_val = T(f"{pct[k]}%", 44, color=YELLOW, weight=BOLD).move_to(gauge_val)
            self.play(pointer.animate.next_to(ax.c2p(*ZPTS[k]), UP, buff=0.05),
                      Transform(gauge_val, new_val), run_time=1)
            pause(self, 0.6)
        pause(self, 1)

        # VO: The grey areas are possible, but they are not inclusive.
        C, B, A = ENDS["c"], ENDS["b"], ENDS["a"]
        greys = VGroup(
            Polygon(ax.c2p(*Z), ax.c2p(*D_PT), ax.c2p(*C)),
            Polygon(ax.c2p(*Z), ax.c2p(*C), ax.c2p(*B)),
            Polygon(ax.c2p(*Z), ax.c2p(*B), ax.c2p(*A)),
        )
        greys.set_stroke(GREY_B, 1).set_fill(GREY, opacity=0.45)
        grey_lab = in_panel(card(T("Grey: possible, but not inclusive", 24), color=GREY_B), -0.9)
        self.play(FadeOut(pointer), FadeIn(greys, lag_ratio=0.3), FadeIn(grey_lab), run_time=1.5)
        pause(self, 2.5)
        self.play(FadeOut(greys), FadeOut(grey_lab), FadeOut(gauge), FadeOut(why))

        # VO: Our three thinkers say the same thing in their own words.
        bubbles = [
            ("Ambedkar", "The Constitution gives\npositive help: education,\njobs, representation\nto the disadvantaged."),
            ("Gandhi's Talisman", "Think of the poorest\nperson you have seen.\nWill your action\nhelp them?"),
            ("Rawls", "Make the worst-off\nas well-off as possible.\nMany fair paths can be\nreasonable (reasonable\npluralism)."),
        ]
        for name, quote in bubbles:
            content = VGroup(T(name, 32, color=GOLD_C, weight=BOLD), T(quote, 28)).arrange(DOWN, buff=0.25)
            b = in_panel(card(content, color=GOLD_C, pad=0.3), 0.0)
            self.play(FadeIn(b, shift=UP * 0.2))
            pause(self, 6 / PACE)
            self.play(FadeOut(b))
        self.play(FadeOut(lab))


class Scene8_Recap(Scene):
    def construct(self):
        # VO: Here is everything in one table.
        head = T("Table 1: Sharing between better-off X and worse-off Y", 30,
                 color=GOLD_C, weight=BOLD).to_edge(UP, buff=0.35)
        self.play(Write(head))

        def m(s):
            return MathTex(s, font_size=38) if "frac" in s or ":" in s else T(s, 24)

        rows_data = [
            ("Z", "Current Z", "—", "7.0, 3.0", "—", r"2\tfrac{1}{3}:1"),
            ("a", "ZA Worse-off status quo", "2.0, 0.0", "9.0, 3.0", r"1:0", r"3:1"),
            ("b", "ZB Shares status quo", "1.4, 0.6", "8.4, 3.6", r"2\tfrac{1}{3}:1", r"2\tfrac{1}{3}:1"),
            ("c", "ZC Hereafter equal", "1.0, 1.0", "8.0, 4.0", r"1:1", r"2:1"),
            ("d", "ZD Proportionate to shortfall", "0.6, 1.4", "7.6, 4.4", r"\tfrac{3}{7}:1", r"1\tfrac{8}{11}:1"),
            ("e", "ZE Better-off status quo", "0.0, 2.0", "7.0, 5.0", r"0:1", r"1\tfrac{2}{5}:1"),
        ]
        table_rows = []
        for key, name, add, tot, r1, r2 in rows_data:
            c = PDF_COLORS["Z"] if key == "Z" else col(key)
            table_rows.append([T(name, 26, color=c, weight=BOLD), T(add, 26), T(tot, 26),
                               m(r1) if r1 != "—" else T("—", 26),
                               m(r2)])
        headers = [T(h, 22, color=GREY_A, weight=BOLD) for h in
                   ("Scenario", "Additional (ΔX, ΔY) ₹", "Total (X, Y) ₹",
                    "Extra ratio X:Y", "Total ratio X:Y")]
        table = MobjectTable(table_rows, col_labels=headers, include_outer_lines=True,
                             line_config={"stroke_width": 1.5, "color": GREY_C},
                             v_buff=0.62, h_buff=0.3)
        table.scale_to_fit_width(13.6)
        if table.height > 6.3:
            table.scale_to_fit_height(6.3)
        table.next_to(head, DOWN, buff=0.3)

        self.play(Create(table.get_horizontal_lines()), Create(table.get_vertical_lines()), run_time=1.5)
        rows = table.get_rows()
        self.play(FadeIn(rows[0]))
        for r in rows[1:]:
            self.play(FadeIn(r, shift=RIGHT * 0.2), run_time=0.8)
            pause(self, 1.2)

        # VO: The last two rows, ZD and ZE, are the inclusive ones.
        box = SurroundingRectangle(VGroup(rows[5], rows[6]), color=GOOD, buff=0.08, stroke_width=5)
        inc = T("Inclusive", 26, color=GOOD, weight=BOLD).next_to(box, DOWN, buff=0.1).align_to(box, RIGHT)
        self.play(Create(box), Write(inc))
        pause(self, 3)
        self.play(*[FadeOut(mo) for mo in self.mobjects])

        # VO: Remember: growth is inclusive when extra money is shared at least
        # in proportion to how far each person is from the ideal.
        msg = T("For growth to be inclusive,\nextra money should be shared\nat least in proportion to how far\neach person is from the ideal.",
                40, weight=BOLD, color=WHITE)
        msg.move_to(UP * 1.2)
        self.play(Write(msg), run_time=4)
        pause(self, 2.5)

        fx = xavi(r=0.5, name_size=24, sad=True).move_to([-2.5, -1.6, 0])
        fy = yami(r=0.5, name_size=24, sad=True).move_to([2.5, -1.6, 0])
        cx = VGroup(*[coin(0.18) for _ in range(5)]).arrange(RIGHT, buff=0.05).next_to(fx, DOWN, buff=0.2)
        cy = VGroup(*[coin(0.18) for _ in range(5)]).arrange(RIGHT, buff=0.05).next_to(fy, DOWN, buff=0.2)
        self.play(FadeIn(fx), FadeIn(fy), FadeIn(cx, lag_ratio=0.2), FadeIn(cy, lag_ratio=0.2))
        self.play(set_mood(fx, False), set_mood(fy, False))
        pause(self, 1.5)
        thanks = T("Thank you!", 56, color=GOLD_C, weight=BOLD)
        self.play(FadeOut(msg), FadeOut(cx), FadeOut(cy),
                  fx.animate.shift(UP * 1.0), fy.animate.shift(UP * 1.0))
        self.play(Write(thanks.move_to(DOWN * 2.4)))
        pause(self, 2)
        self.play(*[FadeOut(mo) for mo in self.mobjects], run_time=1.5)


RENDER_ORDER = [
    "Scene1_Intro",
    "Scene2_Story",
    "Scene3_Graph",
    "Scene4_PathsAB",
    "Scene5_PathsCD",
    "Scene6_PathE",
    "Scene7_Triangle",
    "Scene8_Recap",
]
