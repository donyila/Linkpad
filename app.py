import os
import sys
import socket
import time
import threading
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory, render_template, abort
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def resource_path(relative):
    """Path to bundled read-only assets (templates/static).
    When frozen by PyInstaller, these live inside the temp _MEIPASS folder."""
    base = getattr(sys, "_MEIPASS", BASE_DIR)
    return os.path.join(base, relative)


def app_root():
    """Folder where the running exe/script actually lives, used for data
    that must persist next to the program (the uploads folder)."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return BASE_DIR


UPLOAD_DIR = os.path.join(app_root(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(
    __name__,
    template_folder=resource_path("templates"),
    static_folder=resource_path("static"),
)
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024  # 1 GB per request

# --- Shared in-memory state -------------------------------------------------
state_lock = threading.Lock()
clipboard_state = {"text": "", "updated_at": 0}


def get_local_ip():
    """Best-effort detection of the LAN IP address of this machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def human_size(num_bytes):
    for unit in ["B", "KB", "MB", "GB"]:
        if num_bytes < 1024:
            return f"{num_bytes:.0f} {unit}" if unit == "B" else f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"


# --- Pages -------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", local_ip=get_local_ip(), port=PORT)


# --- Clipboard API -------------------------------------------------------------
@app.route("/api/clipboard", methods=["GET"])
def get_clipboard():
    with state_lock:
        return jsonify(clipboard_state)


@app.route("/api/clipboard", methods=["POST"])
def set_clipboard():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    with state_lock:
        clipboard_state["text"] = text
        clipboard_state["updated_at"] = time.time()
        result = dict(clipboard_state)
    return jsonify(result)


# --- Files API -----------------------------------------------------------------
@app.route("/api/files", methods=["GET"])
def list_files():
    items = []
    for name in sorted(os.listdir(UPLOAD_DIR)):
        full = os.path.join(UPLOAD_DIR, name)
        if os.path.isfile(full):
            st = os.stat(full)
            items.append({
                "name": name,
                "size": st.st_size,
                "size_human": human_size(st.st_size),
                "modified": datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
            })
    items.sort(key=lambda x: x["modified"], reverse=True)
    return jsonify({"files": items})


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "no file part"}), 400
    uploaded = request.files.getlist("file")
    saved = []
    for f in uploaded:
        if not f or f.filename == "":
            continue
        filename = secure_filename(f.filename)
        if not filename:
            continue
        target = os.path.join(UPLOAD_DIR, filename)
        # avoid overwriting: append a counter if the name already exists
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(target):
            filename = f"{base} ({counter}){ext}"
            target = os.path.join(UPLOAD_DIR, filename)
            counter += 1
        f.save(target)
        saved.append(filename)
    return jsonify({"saved": saved})


@app.route("/api/download/<path:filename>", methods=["GET"])
def download_file(filename):
    safe_name = secure_filename(filename)
    if safe_name != filename or not os.path.isfile(os.path.join(UPLOAD_DIR, filename)):
        abort(404)
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=True)


@app.route("/api/delete/<path:filename>", methods=["POST"])
def delete_file(filename):
    safe_name = secure_filename(filename)
    target = os.path.join(UPLOAD_DIR, filename)
    if safe_name != filename or not os.path.isfile(target):
        abort(404)
    os.remove(target)
    return jsonify({"deleted": filename})


PORT = int(os.environ.get("PORT", 5000))

if __name__ == "__main__":
    ip = get_local_ip()
    print("\n" + "=" * 52)
    print("  LinkPad is running")
    print(f"  On this computer :  http://127.0.0.1:{PORT}")
    print(f"  On other devices  :  http://{ip}:{PORT}")
    print("=" * 52 + "\n")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
