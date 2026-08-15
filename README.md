# LinkPad

A tiny self-hosted web app that lets you share **clipboard text** and **files** between devices on the same local network — no cloud, no account, no internet required.

Run it on one machine, open the given IP address from any other device's browser on the same Wi‑Fi/LAN, and you're synced.

> 📄 مستندات فارسی: [README.fa.md](README.fa.md) · راهنمای ساخت exe ویندوز: [BUILD_WINDOWS_EXE.md](BUILD_WINDOWS_EXE.md)

## Features

- **Shared clipboard** — text typed on one device syncs to every other open device in ~2 seconds.
- **File transfer** — drag & drop (or click) to upload; download or delete from any connected device.
- **Zero external dependencies at runtime** — pure Flask backend, plain HTML/CSS/JS frontend, no database.
- **Cross-platform** — runs on Linux, macOS, and Windows (and can be packaged as a standalone `.exe` on Windows).
- **Private by design** — everything stays on your local network; nothing is sent anywhere else.

## Quick start

```bash
git clone https://github.com/<your-username>/linkpad.git
cd linkpad
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
```

The terminal prints two URLs:

```
On this computer :  http://127.0.0.1:5000
On other devices  :  http://192.168.x.x:5000
```

Open the first on the host machine, and the second on any other device connected to the same network.

Change the port with:

```bash
PORT=8080 python3 app.py
```

## Project structure

```
linkpad/
  app.py               # Flask server (clipboard + file API)
  requirements.txt
  templates/index.html # UI markup
  static/style.css     # Styling
  static/script.js     # Client-side sync logic
  uploads/             # Uploaded files land here (gitignored)
```

## Building a standalone Windows executable

See [BUILD_WINDOWS_EXE.md](BUILD_WINDOWS_EXE.md) for a full step-by-step guide using PyInstaller — the result is a single `LinkPad.exe` that needs no Python installed on the target machine.

## Android client app

The `android-client/` folder contains a small Kotlin/WebView Android app plus a GitHub Actions workflow (`.github/workflows/build-apk.yml`) that builds a debug APK for free on GitHub's servers — no local Android Studio required. See [android-client/README.md](android-client/README.md) for details.

## Roadmap / ideas

- [ ] WebSocket-based sync instead of polling
- [ ] Optional pairing PIN / basic auth
- [ ] QR code for the connection URL
- [ ] Clipboard history
- [ ] HTTPS support for full clipboard-API access on remote devices

Contributions and suggestions welcome — feel free to open an issue or PR.

## License

MIT — see [LICENSE](LICENSE).
