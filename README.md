# JCE Faculty Time Table Mobile App 📱

A specialized mobile application for Android phones tailored for the faculty of **Jain College of Engineering (JCE), Belagavi**, Department of Computer Science & Engineering. Designed to match the official institutional timetable template with full editable flexibility, sober color styling, and offline mobile support.

---

## ✨ Features

1. **Top Options Switcher (Edit View vs Display View)**:
   - **Edit View**:
     - **Faculty Name**, **Academic Year**, **Class**, **W.E.F.**, and all empty time slots are editable.
     - Tap any cell or slot to open a mobile-friendly bottom sheet.
     - Add Subject Code/Name, Room/Lab number, Batch, and categorize as Lecture, Lab, Tutorial, or Meeting.
     - Live auto-save to device local storage (`localStorage`).
   - **Display View**:
     - Read-only protection preventing accidental changes.
     - Displays all content in **sober, calming, professional academic colors** (muted slate, soft indigo, sage greens, warm neutral accents).
     - Distinct sober badges for **Tea Break** (10:20 AM - 10:35 AM) and **Lunch Break** (12:25 PM - 01:00 PM).

2. **Official College Template Alignment**:
   - Institutional Header: Jain College of Engineering, AICTE & VTU affiliation, NBA accreditation, and Department of Computer Science & Engineering.
   - Official circular gear emblem/logo extracted and embedded in high resolution.
   - 6 Days: Monday to Saturday.
   - All 9 official time periods, including breaks formatted according to the college schema.

3. **Dual Mobile Views**:
   - **Full Table Grid**: Responsive horizontal scrollable matrix with sticky Day/Time column.
   - **Day-by-Day Cards**: Optimized for vertical portrait smartphone use; tap tabs (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`) to view periods as cards.

4. **Productivity Tools**:
   - **Export to PDF / Print**: Formatted for standard A4 landscape print with all edit controls automatically hidden.
   - **Backup & Restore**: Export your schedule to a `.json` file and restore it on another phone anytime.
   - **Sample CSE Schedule**: One-click demo schedule for quick preview.

---

## 🚀 How to Run on Android Phone

### Option 1: Instant PWA Mobile App (Recommended - No SDK Needed)

1. On your PC, double-click **`start_server.bat`** (or run `python start_server.py`).
2. Make sure your Android phone is connected to the same Wi-Fi network.
3. Open **Google Chrome** on your Android phone and type the URL shown in the terminal (for example: `http://192.168.1.X:8080`).
4. In Chrome, tap the **three dots menu (⋮)** in the top right corner:
   - Tap **"Add to Home screen"** or **"Install app"**.
5. The **JCE Timetable** icon will now appear on your phone's home screen and app launcher.
6. Once installed, it works **100% offline** without needing any internet connection!

---

### Option 2: Native Android Studio Project (For Building an `.apk`)

The complete Gradle-based native Android Studio project is included in the `android/` folder:

1. Open **Android Studio**.
2. Select **Open an Existing Project** and browse to:
   ```
   c:\Users\vikra\Downloads\Time Table app\android
   ```
3. Let Gradle sync dependencies.
4. Connect your Android phone with USB Debugging enabled, or select an emulator.
5. Click **Run** (`Shift + F10`) or go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate the standalone `.apk`.

---

## 📁 Project Directory Structure

```
Time Table app/
├── index.html                 # Main mobile app structure
├── styles.css                 # Responsive styling & sober color palette
├── app.js                     # State management, local storage, view switcher
├── manifest.json              # Android PWA install configuration
├── sw.js                      # Offline service worker cache
├── college_logo.png           # Official JCE emblem
├── icon-192.png / icon-512.png# App icons for Android
├── start_server.py            # Local network server
├── start_server.bat           # Double-click launcher for Windows
├── README.md                  # Documentation
└── android/                   # Native Android Studio Project
    ├── build.gradle
    ├── settings.gradle
    └── app/
        ├── build.gradle
        └── src/main/
            ├── AndroidManifest.xml
            ├── java/com/jce/timetable/MainActivity.java
            └── assets/www/    # Bundled mobile web assets
```
