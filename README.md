# 🪬 Drishti Dangle

**Drishti Dangle** is a lightweight, transparent Windows desktop screen charm inspired by the traditional South Indian **Drishti Bommai** (protective guardian mask). It hangs naturally from the top edge of your laptop or desktop display, gently swaying with realistic pendulum physics to ward off the evil eye (*buri nazar* / *kan drishti*).

---

## ✨ Features

- **Transparent & Frameless**: Completely see-through around the Bommai. Floats unobtrusively over all normal desktop windows (`alwaysOnTop`).
- **Zero Interference (Click-Through)**: Mouse clicks and keystrokes outside the Bommai pass through directly to your active apps and browser windows.
- **Realistic Pendulum Physics**:
  - Continuous ambient idle sway with momentum and damping.
  - Interactive cursor reaction (brushing past pushes it gently).
  - Clicking gives a lively, springy swing.
  - Horizontal drag along the top edge repositions the charm anywhere across your screen.
- **Authentic Original Artwork**: Custom vector SVG artwork crafted with traditional iconography:
  - Wide bulging protector eyes with pupil highlights.
  - Curled upward mustache and sharp fangs.
  - Forehead sacred *Tripundra* stripes and red vermillion *Tilak*.
  - Braided hanging cord and golden ear *kundalas*.
- **Windows System Tray**:
  - Right-click tray menu to Show/Hide Drishti, change positions (Left, Center, Right), open Settings, or Quit.
- **6 Selectable Hanging Charms**: Choose between 6 distinct handcrafted charms on the fly:
  1. **Classic Black Mask**: Iconic traditional fierce guardian mask with yellow borders and sacred *Tripundra* & *Tilak*.
  2. **Terracotta Guardian**: Warm temple clay aesthetic with amber/crimson tones and sacred flame crown.
  3. **Swarna Royal Gold**: Regal metallic gold talisman adorned with emerald and ruby accents.
  4. **Cute Chibi Guardian**: Playful, friendly chibi guardian with oversized sparkling anime eyes and blush cheeks.
  5. **Spider-Man (Web-Slinger)**: Hanging upside down by spun web strands with expressive eye lenses, spider insignia, and dynamic web cord!
  6. **Batman (The Dark Knight)**: Hanging from a high-tensile steel grapnel cable with iconic pointed bat cowl, glowing white slit eyes, and draped bat cape!
- **Instant Charm Switching**: Change charms via visual cards in Settings, system tray menu, or right-clicking on screen (*Next Charm*).
- **Comprehensive Settings**:
  - Toggle swing animation on/off.
  - Adjust swing intensity and speed.
  - Quick-position presets (Left / Center / Right).
  - Show / hide hanging string.
  - Start automatically with Windows.
- **100% Local & Free**: No paid APIs, no external backend, no telemetry.

---

## 🚀 Quick Start Guide

### Prerequisites
- Windows 10 or 11
- [Node.js](https://nodejs.org/) (v18 or higher recommended; verified on Node v24)

---

### 1. How to Install Dependencies

Open PowerShell or Command Prompt in the project folder and run:

```powershell
npm.cmd install
```
*(On Windows PowerShell where script execution may be restricted, use `npm.cmd`)*

---

### 2. How to Run in Development Mode

To launch the app immediately:

```powershell
npm.cmd start
```

You will see the Drishti Bommai appear hanging from the top center of your display, with the icon in your Windows system tray.

---

### 3. How to Interact & Test

- **Natural Idle Sway**: Watch it gently sway with organic physics.
- **Mouse Push**: Move your cursor swiftly across the Bommai mask to nudge it.
- **Click**: Left-click on the Bommai to give it a punchy swing.
- **Drag & Reposition**: Click and hold the top bracket or the Bommai, then drag horizontally to slide it anywhere along the top edge of your monitor.
- **Right-Click Context Menu**: Right-click directly on the Bommai on screen to quickly open Settings, cycle positions, or hide it.
- **System Tray**:
  - Double-click the tray icon to open Settings.
  - Right-click the tray icon for quick controls:
    - *Show / Hide Drishti*
    - *Position -> Left / Center / Right*
    - *Settings...*
    - *Quit Drishti Dangle*
- **Settings Window**:
  - Tune the **Swing Intensity** slider from subtle to dramatic.
  - Tune the **Animation Speed** slider.
  - Toggle **Show Hanging String**.
  - Toggle **Start with Windows**.

---

### 4. How to Build a Windows .exe

To package the application into a standalone Windows executable:

#### Option A: Build Portable Executable (`.exe` ready to run without installation)
```powershell
npm.cmd run dist:portable
```
The output file will be created in:
```
dist/Drishti Dangle 1.0.0.exe
```
You can copy this `.exe` anywhere or share it—no installer needed!

#### Option B: Build Full Windows Installer (`.exe` with desktop shortcut)
```powershell
npm.cmd run dist
```
Generates both an NSIS installer and a portable executable inside the `dist/` directory.

#### Option C: Unpacked Directory (Fast local binary test)
```powershell
npm.cmd run dist:dir
```
Creates an unpacked executable inside `dist/win-unpacked/Drishti Dangle.exe`.

---

## 📁 Project Structure

```
Drishti-Bommai-App/
├── assets/
│   ├── drishti-bommai.svg    # Custom original vector artwork of the Bommai
│   ├── tray-icon.png         # 32x32 system tray icon
│   ├── icon.png              # 128x128 app icon
│   └── icon.ico              # Windows .ico icon for executable & windows
├── index.html                # Transparent overlay window HTML structure
├── style.css                 # Overlay styling, glowing aura, and context menu
├── renderer.js               # Physics engine (momentum, damping, mouse velocity, drag)
├── main.js                   # Electron main process (tray, window lifecycle, IPC, autostart)
├── preload.js                # Secure contextBridge IPC bridge
├── settings.html             # Settings window UI (sliders, switches, presets)
├── settings.js               # Settings controller & live configuration sync
├── package.json              # App metadata, dependencies, build settings
└── README.md                 # Documentation and instructions
```

---

## 🛡️ License
MIT License. Free to use, modify, and distribute.
