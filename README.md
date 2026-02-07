# Mystery Detective Game (Landscape)

Mobile-first landscape-mode mystery/puzzle web app.

- 20-case structure supported (Cases 2–20 are placeholders)
- Case 1 is fully implemented per the provided spec
- Core loop enforced:
  1) Case introduction
  2) Investigation via optional minigames (earn Investigation Points)
  3) Mandatory interviews with all suspects
  4) Deduction
  5) Accusation + resolution (no permanent game over)

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

This repo includes a GitHub Actions workflow that builds on every push to `main` and deploys the `dist/` folder to GitHub Pages.

After the first successful workflow run:
- Repo → **Settings** → **Pages**
- Ensure **Source** is set to **GitHub Actions**

Expected URL:
- https://ericargyle.github.io/mysterygame/
