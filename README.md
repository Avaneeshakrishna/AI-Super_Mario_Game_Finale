# AI Super Mario Finale (Hands-Free Nose Control)

This project is a browser-based Mario-style game/editor with an accessibility input mode that uses webcam nose motion tracking.

## What is implemented

- Keyboard and touch control (existing behavior).
- **Nose control mode** (new):
  - Face tracking via MediaPipe Face Mesh (JavaScript CDN).
  - Neutral calibration at start.
  - Smoothed nose movement with dead-zone.
  - Nose left/right => move left/right.
  - Larger lateral movement => run.
  - Upward movement => jump.
  - Press **R** in nose mode to re-center calibration.

No Python backend is required.

## How to run locally

Because camera APIs require a served origin, do not open `index.html` directly from file explorer.

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000`

## How to test nose control

1. Open the start screen.
2. Click **Input: Keyboard** until it shows **Input: Nose**.
3. Start game.
4. Allow webcam permission.
5. Keep your face centered during calibration.
6. Move your nose/head:
   - left/right to move,
   - slightly upward to jump,
   - larger side movement to run.
7. If controls drift, press **R** to recalibrate.

## Troubleshooting

- If camera fails, ensure browser permission is granted.
- Best in Chromium-based browsers.
- Use normal room lighting and keep your face visible.


## GitHub update / PR troubleshooting

If your GitHub repo did not update, verify your local repo has a remote configured and push the branch manually:

```bash
git remote -v
git branch --show-current
git push -u origin <your-branch-name>
```

If `git remote -v` shows nothing, add your remote first:

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin <your-branch-name>
```

## Screenshot note

Links shown in AI chat replies such as `browser:/tmp/...` are **temporary tool artifacts** for this session and are not permanent GitHub URLs.

For permanent screenshots, generate and commit image files inside this repository (for example `docs/images/...`) and then reference those files in GitHub.
