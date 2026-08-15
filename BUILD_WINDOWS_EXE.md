# ساخت یک فایل EXE مستقل از LinkPad (بدون نیاز به نصب پایتون)

با این راهنما یک فایل واحد `LinkPad.exe` می‌سازید که هر کاربری روی ویندوز بدون نصب پایتون می‌تواند دابل‌کلیک کند و اجرا شود.

⚠️ نکتهٔ مهم: این کار باید **روی خودِ ویندوز** انجام شود (نمی‌شود از لینوکس یک exe ویندوزی ساخت). یک بار این مراحل را روی ویندوز خودتان انجام می‌دهید، و فایل exe نهایی را برای هر دستگاه ویندوزی دیگری هم می‌توانید کپی/ارسال کنید — دیگر نیازی به تکرار مراحل نیست.

---

## پیش‌نیاز: نصب پایتون (فقط روی همین یک دستگاه، برای ساخت exe)

1. از [python.org/downloads](https://www.python.org/downloads/) آخرین نسخه را دانلود و نصب کنید.
2. هنگام نصب حتماً تیک **Add python.exe to PATH** را بزنید.
3. در Command Prompt یا PowerShell تست کنید:
   ```
   python --version
   ```

## مرحله ۱ — آماده‌سازی پوشهٔ پروژه

فایل `lansync.zip` را از پیام قبلی روی ویندوز باز (extract) کنید. باید ساختار زیر را داشته باشید:

```
lansync\
  app.py
  requirements.txt
  templates\index.html
  static\style.css
  static\script.js
```

در Command Prompt وارد این پوشه شوید:
```powershell
cd path\to\lansync
```

## مرحله ۲ — ساخت محیط مجازی و نصب وابستگی‌ها

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller
```

## مرحله ۳ — ساخت فایل exe

در ویندوز، جداکنندهٔ `--add-data` باید **سمی‌کالن `;`** باشد (نه دو نقطه):

```powershell
pyinstaller --onefile --name LinkPad --add-data "templates;templates" --add-data "static;static" app.py
```

توضیح گزینه‌ها:
- `--onefile` → همه‌چیز را در یک فایل exe واحد بسته‌بندی می‌کند.
- `--name LinkPad` → نام فایل خروجی را `LinkPad.exe` می‌گذارد.
- `--add-data "templates;templates"` و `--add-data "static;static"` → فایل‌های HTML/CSS/JS را داخل exe کپی می‌کند (این فایل‌ها معمولاً به‌صورت پیش‌فرض شامل نمی‌شوند).
- کنسول را عمداً **نبستید** (از `--noconsole` استفاده نکردیم)، چون آدرس IP سرور در همان پنجرهٔ سیاه چاپ می‌شود و کاربر باید آن را ببیند.

اجرای این دستور چند ثانیه تا چند دقیقه طول می‌کشد. در پایان:

```
dist\LinkPad.exe
```

همان فایل نهایی مستقل شماست.

## مرحله ۴ — تست

```powershell
cd dist
LinkPad.exe
```

باید همان پیام آشنا را ببینید:
```
On this computer :  http://127.0.0.1:5000
On other devices  :  http://192.168.x.x:5000
```

مرورگر را باز کرده و `127.0.0.1:5000` را امتحان کنید.

## مرحله ۵ — توزیع فایل exe

- فقط کافی است فایل `LinkPad.exe` (داخل پوشهٔ `dist`) را برای هر دستگاه ویندوزی دیگر کپی کنید — نیازی به پایتون، pip یا هیچ فایل دیگری نیست.
- با دابل‌کلیک روی exe، یک پنجرهٔ کنسول باز می‌شود و آدرس IP را نشان می‌دهد.
- پوشهٔ `uploads` به‌صورت خودکار **کنار همان فایل exe** ساخته می‌شود (نه در یک پوشهٔ موقت)، پس فایل‌های آپلودشده بین اجراهای مختلف از بین نمی‌روند.

## نکات مهم

- **فایروال ویندوز:** اولین بار که exe را اجرا کنید، ویندوز یک پنجرهٔ هشدار امنیتی (Windows Defender Firewall) نشان می‌دهد. حتماً گزینهٔ **Private networks** را تیک بزنید و «Allow access» را بزنید، وگرنه دستگاه‌های دیگر نمی‌توانند وصل شوند.
- **SmartScreen:** چون فایل امضای دیجیتال ندارد، ممکن است ویندوز پیام «Windows protected your PC» نشان دهد. روی «More info» → «Run anyway» بزنید.
- **آنتی‌ویروس‌ها:** بعضی آنتی‌ویروس‌ها فایل‌های ساخته‌شده با PyInstaller را به‌اشتباه مشکوک تشخیص می‌دهند (False Positive رایج در این ابزار است). اگر پیش آمد، فایل را در لیست استثناها (Exclusions) اضافه کنید.
- برای تغییر پورت پیش از اجرا: `set PORT=8080 && LinkPad.exe`
- اگر خواستید آیکون سفارشی هم داشته باشد: یک فایل `.ico` تهیه کنید و دستور را این‌طور بزنید:
  ```powershell
  pyinstaller --onefile --name LinkPad --icon=icon.ico --add-data "templates;templates" --add-data "static;static" app.py
  ```

## خلاصهٔ دستورها (کپی/پیست سریع)

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt pyinstaller
pyinstaller --onefile --name LinkPad --add-data "templates;templates" --add-data "static;static" app.py
cd dist
LinkPad.exe
```
