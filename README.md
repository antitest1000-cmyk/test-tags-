# test-tags-

# AURA™ — 3D Sculpted Hydration Vessels & Thermal Flasks

An award-winning interactive 3D web application and bottle customizer built with **Three.js**, **Vanilla CSS**, and **Vite**.

## ✨ Features

- **Real-Time 3D Bottle Studio**: Procedural 3D model generation using Three.js `LatheGeometry` and PBR materials (`MeshPhysicalMaterial`).
- **4 Signature Silhouettes**:
  - *AURA Urban Pro* (Aerodynamic thermal flask with diamond knurl accents)
  - *AURA Crystal Apothecary* (Heavy frosted borosilicate glass with refraction)
  - *AURA Apex Cyber* (Aerospace titanium with OLED digital temp display)
  - *AURA Kinetic Sport* (High-velocity ergonomic ribbed sports bottle)
- **Interactive Liquid Physics**: Volumetric liquid simulation with real-time fill slider (0–100%) and beverage presets (Alpine Water, Matcha, Amber Brew, Wild Berry).
- **Custom Laser Engraving**: Offscreen dynamic HTML5 canvas texture that burns personalized text directly onto the 3D bottle in real time with multiple typography choices.
- **Exploded Anatomy View**: 3D assembly animation breaking down the cap, silicone seal, radiant copper vacuum chamber, outer shell, and base bumper with smooth spring transitions.
- **Procedural Web Audio Engine**: Tactile clicks, harmonic pitch chimes, liquid pour effects, and servo hum synthesized natively using the Web Audio API.
- **Interactive 3D Hotspots**: Screen-space projected annotations linked to 3D world coordinates with smooth camera transitions.
- **Eco-Impact & Thermal Degradation Calculators**: Dynamic calculations for plastic bottles saved, CO2 prevented, and 24h temperature retention curves.
- **Interactive Cart & Checkout**: Slide-over order drawer with promo code validation and confetti celebration.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
```

## 🛠️ Tech Stack
- **Three.js** (WebGL 3D rendering, OrbitControls, MeshPhysicalMaterial)
- **Vanilla CSS** (Custom luxury dark theme, glassmorphism, responsive grid)
- **Canvas Confetti** (Checkout animation)
- **Web Audio API** (Procedural sound synthesis)
- **Vite** (Next-gen frontend tooling)
