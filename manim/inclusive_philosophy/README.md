# Sharing the Extra ₹2: Inclusive Philosophy for children

A Manim animation (about 6 minutes, 1080p, 30 fps) of the lecture note
*Inclusive Philosophy* by Srijit Mishra (School of Economics, University of Hyderabad, 21 January 2025).
It follows Figure 1 and Table 1 of the note exactly. The numbers are checked with `assert` statements before anything is drawn.

## Render

Needs Manim Community v0.18 or newer, LaTeX (for `MathTex`) and ffmpeg.

```bash
pip install manim
manim -pqh --fps 30 inclusive_philosophy.py Scene1_Intro        # one scene
manim -qh --fps 30 inclusive_philosophy.py -a           # all scenes

cd media/videos/inclusive_philosophy/1080p30
printf "file '%s.mp4'\n" Scene1_Intro Scene2_Story Scene3_Graph Scene4_PathsAB \
  Scene5_PathsCD Scene6_PathE Scene7_Triangle Scene8_Recap > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy Inclusive_Philosophy.mp4
```

Settings at the top of the file:
- `PACE`: multiplies every reading pause. The default is 1.5; raise it for younger children.
- `HIGH_CONTRAST`: when on, the darkest legend colours (navy ZB, dark green ZD, and others) are lightened so they show up on the dark background. Set it to `False` to use the exact hex colours from the PDF.

## Scenes

| # | Scene | What it shows |
|---|---|---|
| 1 | `Scene1_Intro` | Title, "Inclusive = no one is left out", Ambedkar, Gandhi and Rawls |
| 2 | `Scene2_Story` | Xavi ₹7 and Yami ₹3, a new ₹2, the rule ΔX + ΔY = ₹2 with ΔX, ΔY ≥ 0 (Pareto improvement) |
| 3 | `Scene3_Graph` | Axes, planetary bounds, line of equality, point Z(7, 3), budget line x + y = 12 |
| 4 | `Scene4_PathsAB` | ZA (property-rights fetish) and ZB (Gini-coefficient fetish) |
| 5 | `Scene5_PathsCD` | ZC (gap of ₹4 stays) and ZD (shortfall bars, ratio 3 : 7) |
| 6 | `Scene6_PathE` | ZE, then up to E(7, 7) and along ED |
| 7 | `Scene7_Triangle` | Inclusive triangle ZED, Xavi's share 100% → 0%, the grey areas, the three thinkers |
| 8 | `Scene8_Recap` | Table 1 with ZD and ZE marked inclusive, the conclusion |

The ₹2 is shown as 10 pieces of 20 paise each. This way a split such as ₹1.4 / ₹0.6 (7 pieces / 3 pieces) can be shown exactly with whole coins.

## Voice-over script

1. **Intro.** Hello friends! Today we will learn a big idea: inclusive philosophy. Inclusive means that no one is left out. Our ideas come from three great thinkers: Ambedkar, Gandhi and Rawls.
2. **Story.** Meet two friends, Xavi and Yami. Xavi has 7 rupees. Yami has only 3. Together they have 10, so Xavi has 70% and Yami has 30%. Yami does not have less because Yami is lazy. It is because of circumstances. Now a new technology brings 2 more rupees! How should the extra 2 rupees be shared? The rule: the two parts add up to 2 rupees, and nobody loses anything. When nobody is worse off, economists call it a Pareto improvement.
3. **Graph.** Let us draw a picture. Across is Xavi's money and up is Yami's money. The green box is our planet's limit: we cannot grow forever. On the blue line, both friends have exactly the same money. Today Xavi has 7 and Yami has 3. That is point Z. After sharing 2 more rupees, the total is 12, so every way of sharing lands on this purple line.
4. **ZA.** Path ZA: all of the extra money goes to Xavi. Xavi now has 9, and Yami still has 3. This is like paying Yami a fixed wage while the owner keeps all the gain. We call it the property-rights fetish, because it ignores Yami's effort.
5. **ZB.** Path ZB: both keep the same percentages, 70 and 30. Xavi gets 1.40 and Yami gets 0.60. It is like raising everyone's pay by 1.2 times. The shares stay the same, but the gap grows from 4 to 4.80. This is the Gini-coefficient fetish.
6. **ZC.** Path ZC: one rupee each, so Xavi has 8 and Yami has 4. It is like 50 : 50 sharecropping, or equal pay for equal work. It is fair today, but the old gap of 4 rupees is still there.
7. **ZD.** Path ZD: the ideal is 10 rupees each. Xavi is 3 short and Yami is 7 short, so we share in the ratio 3 to 7. Xavi gets 0.60 and Yami gets 1.40. This is public policy that gives everyone a level playing field. This path is inclusive!
8. **ZE.** Path ZE: all of the extra money goes to Yami, who needs help the most. This is like extra help in education and health. Also inclusive! If we keep going up, Yami catches up at E, where both have 7. After that, we share equally along ED.
9. **Triangle ZED.** Look at the triangle Z, E, D. Paths inside it help Yami catch up, so they are inclusive. As we move from ZA to ZE, Xavi's share of the extra money falls from 100% to 0%. The grey areas are possible, but they are not inclusive. Ambedkar's Constitution gives positive help to the disadvantaged. Gandhi's Talisman asks: think of the poorest person you have seen. Will your action help them? Rawls says: make the worst-off as well-off as possible, and remember that many fair paths can be reasonable.
10. **Recap.** Here is everything in one table. The rows ZD and ZE are the inclusive ones. Remember: for growth to be inclusive, extra money should be shared at least in proportion to how far each person is from the ideal. Thank you!
