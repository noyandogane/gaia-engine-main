# Quick Start Guide - Gaia Engine

## 🚀 Get The Game Running In 5 Minutes

### Step 1: Prerequisites

```bash
# Check Node.js version (needs 20+)
node --version
```

If Node.js is not v20+, install it from https://nodejs.org

### Step 2: Install & Run

```bash
# Navigate to project
cd /home/engine/project

# Install dependencies (only needed once)
npm install

# Start the game
npm run dev
```

### Step 3: Open In Browser

Open your browser and go to:

```
http://localhost:5173
```

**That's it!** 🎉 You should see a 3D planet on your screen.

---

## 🎮 How To Use The Game

### Camera Controls

- **Rotate**: Click + drag mouse
- **Zoom**: Scroll wheel
- **Pan**: Right-click + drag (or Shift + drag)

### Terrain Controls (Right Panel)

- **Seed**: Changes planet shape randomly
- **Scale**: Makes features bigger/smaller
- **Persistence**: Affects terrain roughness
- **Water Level**: How much ocean
- **Random Seed**: Quick randomize button

### Climate Controls (Right Panel)

- **Temperature Overlay**: Toggle on to see heat zones
- **Axial Tilt**: Changes climate zones
- **Albedo**: Planet reflectivity

### Simulation Controls (Bottom Left)

- **Play/Pause**: Start/stop time
- **Speed**: 0.5x, 1x, 2x, 4x, 8x

### Save/Load

- Settings → Enable "Load Last Save On Startup" to auto-restore

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check code quality
npm run lint

# Format code
npm run format
```

---

## 📂 Project Structure

- **`src/app/`** - React UI components
- **`src/sim/`** - Game simulation logic
- **`src/render/`** - Three.js 3D rendering
- **`src/stores/`** - Game state (Zustand)

---

## ⚠️ Current Limitations

This is a **prototype** not a full game:

- No objectives or goals
- No gameplay mechanics
- Can only view/adjust parameters
- No civilization management (exists as data only)
- No disasters or events
- No progression system

It's a **terrain editor** with climate effects, not a playable game yet.

---

## 📚 More Information

For detailed analysis, see: `GAME_ANALYSIS.md`

For testing info, see: `TESTING.md`

For technical details, see: `README.md`

---

## 🐛 Troubleshooting

**Port 5173 in use?**

```bash
npx kill-port 5173
npm run dev
```

**Node.js version wrong?**
Use nvm to install Node 20:

```bash
nvm install 20
nvm use 20
```

**Dependencies won't install?**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Game won't load?**

1. Check browser console (F12)
2. Try hard refresh (Ctrl+Shift+R)
3. Check that WebGL is enabled

---

## 🎯 Next Steps

- Explore the controls and generate different planets
- Check the code in `src/sim/` to understand the simulation
- Read the `GAME_ANALYSIS.md` for enhancement ideas
- Run tests: `npm test`

**Enjoy exploring!** 🪐
