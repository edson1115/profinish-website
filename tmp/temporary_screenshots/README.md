# Temporary Screenshots

This folder is for temporary screenshots related to the ProFinish landing page and design iterations.

How to capture screenshots (Windows - PowerShell script provided):

1. Open PowerShell in this project folder.
2. Run the capture script to save a screenshot to this folder:

```powershell
.\capture_screenshots.ps1 -OutputDir . -Mode FullScreen
```

Modes:
- `FullScreen` — captures the primary screen.
- `Window` — prompts to capture the active window.

Files in this folder:
- `capture_screenshots.ps1` — helper script to capture screenshots.
- `.gitkeep` — keep folder tracked in git (if needed).
