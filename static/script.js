(() => {
  const clipboardArea = document.getElementById('clipboardArea');
  const clipSyncNote = document.getElementById('clipSyncNote');
  const pasteBtn = document.getElementById('pasteBtn');
  const copyClipBtn = document.getElementById('copyClipBtn');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const fileCountBadge = document.getElementById('fileCountBadge');

  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const copyIpBtn = document.getElementById('copyIpBtn');
  const ipValue = document.getElementById('ipValue');
  const toastEl = document.getElementById('toast');

  let lastServerUpdate = 0;
  let localDirty = false;
  let dirtyTimer = null;

  // ---------- toast ----------
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ---------- connection status ----------
  function setOnline(isOnline) {
    statusDot.classList.toggle('online', isOnline);
    statusText.textContent = isOnline ? 'متصل و در حال همگام‌سازی' : 'در حال تلاش برای اتصال…';
  }

  // ---------- clipboard sync ----------
  async function pollClipboard() {
    try {
      const res = await fetch('/api/clipboard');
      const data = await res.json();
      setOnline(true);
      if (!localDirty && data.updated_at !== lastServerUpdate) {
        const cursor = clipboardArea.selectionStart;
        const hadFocus = document.activeElement === clipboardArea;
        if (!hadFocus) {
          clipboardArea.value = data.text;
        }
        lastServerUpdate = data.updated_at;
      }
    } catch (e) {
      setOnline(false);
    }
  }

  async function pushClipboard() {
    try {
      const res = await fetch('/api/clipboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clipboardArea.value }),
      });
      const data = await res.json();
      lastServerUpdate = data.updated_at;
      clipSyncNote.textContent = 'ذخیره شد';
      setTimeout(() => { clipSyncNote.textContent = ''; }, 1200);
    } catch (e) {
      clipSyncNote.textContent = 'خطا در ارسال';
    } finally {
      localDirty = false;
    }
  }

  clipboardArea.addEventListener('input', () => {
    localDirty = true;
    clipSyncNote.textContent = 'در حال تایپ…';
    clearTimeout(dirtyTimer);
    dirtyTimer = setTimeout(pushClipboard, 600);
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      clipboardArea.value = text;
      localDirty = true;
      pushClipboard();
      toast('از کلیپ‌بورد دستگاه جای‌گذاری شد');
    } catch (e) {
      toast('دسترسی مستقیم به کلیپ‌بورد مرورگر مسدود است — متن را دستی جای‌گذاری کنید (Ctrl+V)');
      clipboardArea.focus();
    }
  });

  copyClipBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(clipboardArea.value);
      toast('در کلیپ‌بورد دستگاه کپی شد');
    } catch (e) {
      clipboardArea.focus();
      clipboardArea.select();
      try {
        document.execCommand('copy');
        toast('کپی شد');
      } catch (err) {
        toast('کپی خودکار ممکن نبود — متن انتخاب شد، Ctrl+C را بزنید');
      }
    }
  });

  copyIpBtn.addEventListener('click', async () => {
    const value = ipValue.textContent.trim();
    try {
      await navigator.clipboard.writeText(value);
      toast('آدرس کپی شد');
    } catch (e) {
      toast('کپی خودکار ممکن نبود — آدرس را دستی انتخاب کنید');
    }
  });

  // ---------- files ----------
  function fileIconSvg() {
    return '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm7 1.5L18.5 9H13z"/></svg>';
  }
  function trashIconSvg() {
    return '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 3v1H4v2h16V4h-5V3zM6 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8z"/></svg>';
  }
  function downloadIconSvg() {
    return '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 3v10.6l3.6-3.6L17 11.4 12 16.4 7 11.4l1.4-1.4 3.6 3.6V3zM5 19h14v2H5z"/></svg>';
  }

  async function refreshFiles() {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      renderFiles(data.files);
    } catch (e) { /* ignore, next poll will retry */ }
  }

  function renderFiles(files) {
    fileCountBadge.textContent = `${files.length} فایل`;
    if (files.length === 0) {
      fileList.innerHTML = '<li class="file-empty">هنوز فایلی رد و بدل نشده است</li>';
      return;
    }
    fileList.innerHTML = files.map(f => `
      <li class="file-item">
        <span class="file-icon">${fileIconSvg()}</span>
        <span class="file-meta">
          <div class="file-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
          <div class="file-sub">${f.size_human} · ${f.modified}</div>
        </span>
        <span class="file-actions">
          <a class="icon-btn" title="دانلود" href="/api/download/${encodeURIComponent(f.name)}">${downloadIconSvg()}</a>
          <button class="icon-btn danger" title="حذف" data-name="${escapeHtml(f.name)}">${trashIconSvg()}</button>
        </span>
      </li>
    `).join('');

    fileList.querySelectorAll('button[data-name]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.getAttribute('data-name');
        await fetch(`/api/delete/${encodeURIComponent(name)}`, { method: 'POST' });
        toast('فایل حذف شد');
        refreshFiles();
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function uploadFiles(fileArr) {
    if (!fileArr.length) return;
    const formData = new FormData();
    for (const f of fileArr) formData.append('file', f);
    toast('در حال ارسال فایل…');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.saved && data.saved.length) {
        toast(`${data.saved.length} فایل ارسال شد`);
      }
      refreshFiles();
    } catch (e) {
      toast('ارسال فایل با خطا مواجه شد');
    }
  }

  fileInput.addEventListener('change', () => {
    uploadFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length) uploadFiles(Array.from(files));
  });

  // ---------- init ----------
  pollClipboard();
  refreshFiles();
  setInterval(pollClipboard, 2000);
  setInterval(refreshFiles, 3000);
})();
