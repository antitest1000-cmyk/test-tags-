import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import { BottleSystem } from './bottleModel.js';
import { soundEngine } from './soundEngine.js';

/**
 * AURA™ 3D Bottle Application Controller
 */

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.loaderEl = document.getElementById('canvas-loader');

    // State
    this.modelPrices = {
      urban: 68,
      glass: 74,
      smart: 89,
      wave: 62,
    };
    this.currentModel = 'urban';
    this.currentFinish = 'matte';
    this.currentColor = 0x141518;
    this.currentColorName = 'Obsidian Matte';
    this.currentCap = 'magnetic';
    this.currentSize = '750';
    this.currentPrice = 68;
    this.engravingText = 'AURA • 2026';
    this.autoRotate = true;
    this.promoApplied = false;

    // Camera preset animation targets
    this.camTargetPos = new THREE.Vector3(0, 0.4, 7.2);
    this.camTargetLook = new THREE.Vector3(0, 0, 0);

    // Initialize 3D Engine & UI
    this.initThree();
    this.initBottle();
    this.initHotspots();
    this.initUI();
    this.initCalculator();
    this.initThermalChart();
    this.initCart();
    this.animate();

    // Fade out loader
    setTimeout(() => {
      if (this.loaderEl) {
        this.loaderEl.style.opacity = '0';
        setTimeout(() => this.loaderEl.remove(), 500);
      }
      this.showHotspots();
    }, 400);
  }

  /* ==========================================================================
     Three.js Setup
     ========================================================================== */
  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.copy(this.camTargetPos);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 14;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below ground
    this.controls.target.copy(this.camTargetLook);

    // 5. Studio Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(this.ambientLight);

    // Key Light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.keyLight.position.set(5, 7, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.bias = -0.001;
    this.scene.add(this.keyLight);

    // Rim / Contour Light
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    this.rimLight.position.set(-6, 4, -4);
    this.scene.add(this.rimLight);

    // Fill Light
    this.fillLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    this.fillLight.position.set(0, -4, 4);
    this.scene.add(this.fillLight);

    // Floor Shadow Receiver (Subtle dark pedestal disk)
    const floorGeo = new THREE.PlaneGeometry(15, 15);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.8;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initBottle() {
    this.bottle = new BottleSystem(this.scene);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /* ==========================================================================
     Interactive 3D Hotspots Projection
     ========================================================================== */
  initHotspots() {
    this.hotspotElements = {
      cap: document.getElementById('hotspot-cap'),
      body: document.getElementById('hotspot-body'),
      engraving: document.getElementById('hotspot-engraving'),
      base: document.getElementById('hotspot-base'),
    };

    // Hotspot click camera focusing
    Object.keys(this.hotspotElements).forEach(key => {
      const el = this.hotspotElements[key];
      if (el) {
        el.addEventListener('click', () => {
          soundEngine.playClick();
          this.setCameraPreset(key);
        });
      }
    });
  }

  showHotspots() {
    Object.values(this.hotspotElements).forEach(el => {
      if (el) el.style.display = 'block';
    });
  }

  updateHotspots() {
    if (!this.bottle || !this.camera || !this.container) return;
    const positions = this.bottle.getHotspotPositions();
    const halfW = this.container.clientWidth / 2;
    const halfH = this.container.clientHeight / 2;

    Object.keys(positions).forEach(key => {
      const el = this.hotspotElements[key];
      if (!el) return;

      const pos = positions[key].clone();
      // Apply root bottle rotation
      pos.applyEuler(this.bottle.rootGroup.rotation);
      pos.project(this.camera);

      // Check if behind camera
      if (pos.z > 1) {
        el.style.opacity = '0';
        return;
      }

      const x = pos.x * halfW + halfW;
      const y = -pos.y * halfH + halfH;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.opacity = '1';
    });
  }

  /* ==========================================================================
     Camera Preset Transitions
     ========================================================================== */
  setCameraPreset(preset) {
    if (preset === 'cap') {
      this.camTargetPos.set(0, 3.2, 3.8);
      this.camTargetLook.set(0, 2.6, 0);
    } else if (preset === 'engraving') {
      this.camTargetPos.set(0, -0.4, 4.0);
      this.camTargetLook.set(0, -0.4, 0);
    } else if (preset === 'base') {
      this.camTargetPos.set(0, -2.1, 4.0);
      this.camTargetLook.set(0, -2.4, 0);
    } else if (preset === 'exploded') {
      this.camTargetPos.set(0, 0.6, 8.8);
      this.camTargetLook.set(0, 0.4, 0);
    } else {
      // 'hero' / overview
      this.camTargetPos.set(0, 0.4, 7.2);
      this.camTargetLook.set(0, 0, 0);
    }
  }

  /* ==========================================================================
     UI Event Listeners & Binding
     ========================================================================== */
  initUI() {
    // 1. Audio Mute / Unmute
    const audioBtn = document.getElementById('audio-toggle');
    const audioOnIcon = audioBtn.querySelector('.audio-on-icon');
    const audioOffIcon = audioBtn.querySelector('.audio-off-icon');

    audioBtn.addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      audioOnIcon.classList.toggle('hidden', isMuted);
      audioOffIcon.classList.toggle('hidden', !isMuted);
      if (!isMuted) soundEngine.playChime(1.2);
    });

    // 2. Camera View Buttons
    document.querySelectorAll('.cam-btn[data-cam]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        soundEngine.playClick();
        this.setCameraPreset(btn.dataset.cam);
      });
    });

    // 3. Exploded Anatomy View Toggle
    const explodeBtn = document.getElementById('explode-btn');
    explodeBtn.addEventListener('click', () => {
      const isExploded = this.bottle.toggleExplode();
      explodeBtn.classList.toggle('active', isExploded);
      soundEngine.playServo(isExploded);
      if (isExploded) {
        this.setCameraPreset('exploded');
      } else {
        this.setCameraPreset('hero');
      }
    });

    // 4. Auto-rotate Turntable Toggle
    const autoRotateBtn = document.getElementById('autorotate-btn');
    autoRotateBtn.addEventListener('click', () => {
      this.autoRotate = !this.autoRotate;
      autoRotateBtn.classList.toggle('active', this.autoRotate);
      soundEngine.playClick();
    });

    // 5. Studio Environment Switcher
    document.querySelectorAll('.light-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.light-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        soundEngine.playClick();
        this.setEnvironment(btn.dataset.env);
      });
    });

    // 6. 4K High-Res Snapshot Download
    const snapshotBtn = document.getElementById('snapshot-btn');
    snapshotBtn.addEventListener('click', () => {
      soundEngine.playClick();
      this.exportSnapshot();
    });

    // 7. Config Tabs Switching
    document.querySelectorAll('.config-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(`tab-${tab.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
        soundEngine.playClick();
      });
    });

    // 8. Model Selection Cards
    document.querySelectorAll('.model-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.model-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const model = card.dataset.model;
        this.currentModel = model;
        this.currentPrice = this.modelPrices[model];
        this.updatePriceDisplay();

        this.bottle.setModel(model);
        soundEngine.playChime(1.1);
        this.updateTelemetry();
      });
    });

    // 9. Capacity / Size Pills
    document.querySelectorAll('.size-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        this.currentSize = pill.dataset.size;
        this.bottle.setSize(this.currentSize);
        soundEngine.playClick();
        this.updateTelemetry();
      });
    });

    // 10. Material Surface Treatment
    document.querySelectorAll('.material-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.currentFinish = btn.dataset.mat;
        this.bottle.setFinish(this.currentFinish);
        soundEngine.playChime(1.2);
        this.updateTelemetry();
      });
    });

    // 11. Color Palette Swatches
    const colorCaption = document.getElementById('active-color-name');
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');

        const hex = parseInt(swatch.dataset.color.replace('#', '0x'), 16);
        this.currentColor = hex;
        this.currentColorName = swatch.dataset.name;
        colorCaption.textContent = `Color: ${this.currentColorName}`;

        this.bottle.setColor(hex);
        soundEngine.playChime(1.0);
        this.updateTelemetry();
      });
    });

    // 12. Cap Engineering Options
    document.querySelectorAll('.cap-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.cap-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');

        this.currentCap = opt.dataset.cap;
        this.bottle.setCap(this.currentCap);
        soundEngine.playClick();
      });
    });

    // 13. Liquid Fill Slider
    const liquidSlider = document.getElementById('liquid-slider');
    const liquidPct = document.getElementById('liquid-fill-pct');
    liquidSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      liquidPct.textContent = `${Math.round(val)}%`;
      this.bottle.setFill(val / 100);
      soundEngine.playLiquidTone(val / 100);
    });

    // 14. Liquid Beverage Types
    const liquidCaption = document.getElementById('liquid-name-caption');
    document.querySelectorAll('.liquid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.liquid-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const hex = parseInt(btn.dataset.liquidColor.replace('#', '0x'), 16);
        this.bottle.setLiquidColor(hex);
        liquidCaption.textContent = `Simulating: ${btn.dataset.liquidName}`;
        soundEngine.playLiquidTone(0.8);
      });
    });

    // 15. Laser Engraving Input & Preview
    const engraveInput = document.getElementById('engraving-input');
    const engravePreview = document.getElementById('engrave-text-preview');
    const clearBtn = document.getElementById('clear-engrave-btn');

    engraveInput.addEventListener('input', (e) => {
      const text = e.target.value;
      this.engravingText = text;
      engravePreview.textContent = text.length > 0 ? text : 'YOUR TEXT HERE';
      this.bottle.setEngraving(text);
    });

    clearBtn.addEventListener('click', () => {
      engraveInput.value = '';
      this.engravingText = '';
      engravePreview.textContent = 'YOUR TEXT HERE';
      this.bottle.setEngraving('');
      soundEngine.playClick();
    });

    // Font style selector
    document.querySelectorAll('.font-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.font-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const font = pill.dataset.font;
        engravePreview.className = `engrave-text-preview font-${font}`;
        this.bottle.setEngraving(this.engravingText, font);
        soundEngine.playClick();
      });
    });

    // 16. Engineering Feature Cards -> Focus 3D
    document.querySelectorAll('.interactive-hotspot-card').forEach(card => {
      card.addEventListener('click', () => {
        const target = card.dataset.focus;
        soundEngine.playClick();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => this.setCameraPreset(target), 400);
      });
    });

    // 17. Collection "Load in 3D Studio" buttons
    document.querySelectorAll('[data-load-model]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const model = btn.dataset.loadModel;
        this.currentModel = model;
        this.currentPrice = this.modelPrices[model];
        this.updatePriceDisplay();
        this.bottle.setModel(model);

        // Update active card in customizer
        document.querySelectorAll('.model-card').forEach(c => {
          c.classList.toggle('active', c.dataset.model === model);
        });

        soundEngine.playChime(1.1);
        this.updateTelemetry();

        // Smooth scroll to studio
        document.getElementById('studio').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // Update Environment Lighting Presets
  setEnvironment(env) {
    if (env === 'cyber') {
      this.ambientLight.color.set(0x1e1b4b);
      this.keyLight.color.set(0x38bdf8);
      this.rimLight.color.set(0xf43f5e);
      this.fillLight.color.set(0xa855f7);
    } else if (env === 'sunset') {
      this.ambientLight.color.set(0x451a03);
      this.keyLight.color.set(0xfbbf24);
      this.rimLight.color.set(0xf97316);
      this.fillLight.color.set(0xe11d48);
    } else {
      // Default Studio Minimalist
      this.ambientLight.color.set(0xffffff);
      this.keyLight.color.set(0xffffff);
      this.rimLight.color.set(0x38bdf8);
      this.fillLight.color.set(0x818cf8);
    }
  }

  // Export 4K PNG
  exportSnapshot() {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `AURA-${this.currentModel}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  updatePriceDisplay() {
    const el = document.getElementById('current-price');
    if (el) el.textContent = this.currentPrice;
  }

  updateTelemetry() {
    const capEl = document.getElementById('telemetry-capacity');
    const tempEl = document.getElementById('telemetry-temp');
    const weightEl = document.getElementById('telemetry-weight');
    const summaryDesc = document.getElementById('summary-bottle-desc');

    const names = {
      urban: 'AURA Urban Pro',
      glass: 'AURA Crystal Apothecary',
      smart: 'AURA Apex Cyber',
      wave: 'AURA Kinetic Sport',
    };

    if (capEl) capEl.textContent = `${this.currentSize} ML / ${this.currentSize === '500' ? '17' : this.currentSize === '1000' ? '34' : '25'} OZ`;
    if (summaryDesc) summaryDesc.textContent = `${names[this.currentModel]} ${this.currentSize}ml • ${this.currentColorName}`;
  }

  /* ==========================================================================
     Eco Impact Calculator Logic
     ========================================================================== */
  initCalculator() {
    const litersSlider = document.getElementById('calc-liters-slider');
    const yearsSlider = document.getElementById('calc-years-slider');
    const litersVal = document.getElementById('calc-liters-val');
    const yearsVal = document.getElementById('calc-years-val');

    const bottlesResult = document.getElementById('result-bottles');
    const co2Result = document.getElementById('result-co2');
    const savingsResult = document.getElementById('result-savings');

    const recalculate = () => {
      const litersPerDay = parseFloat(litersSlider.value);
      const years = parseInt(yearsSlider.value, 10);

      litersVal.textContent = `${litersPerDay.toFixed(1)} Liters / Day`;
      yearsVal.textContent = `${years} ${years === 1 ? 'Year' : 'Years'}`;

      // Standard single-use bottle = 500ml (0.5L)
      const bottlesPerYear = (litersPerDay / 0.5) * 365;
      const totalBottles = Math.round(bottlesPerYear * years);

      // CO2: approx 82.8 grams CO2 per 500ml plastic bottle
      const totalCO2Kg = Math.round((totalBottles * 0.0828));

      // Financial savings: $1.25 average bottled water vs tap/filtered
      const totalSavings = Math.round(totalBottles * 1.25);

      bottlesResult.textContent = totalBottles.toLocaleString();
      co2Result.innerHTML = `${totalCO2Kg.toLocaleString()}<span class="result-unit">kg</span>`;
      savingsResult.textContent = `$${totalSavings.toLocaleString()}`;
    };

    litersSlider.addEventListener('input', recalculate);
    yearsSlider.addEventListener('input', recalculate);
  }

  /* ==========================================================================
     Thermal Degradation Graph Switching
     ========================================================================== */
  initThermalChart() {
    const singlePath = document.getElementById('curve-single');
    const compPath = document.getElementById('curve-comp');
    const auraPath = document.getElementById('curve-aura');

    document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.dataset.tempMode;
        soundEngine.playClick();

        if (mode === 'hot') {
          // Piping Hot mode (starts high at 95°C and drops)
          singlePath.setAttribute('d', 'M 60 50 Q 235 240, 760 270');
          compPath.setAttribute('d', 'M 60 50 Q 410 120, 760 210');
          auraPath.setAttribute('d', 'M 60 50 Q 410 70, 760 85');
        } else {
          // Cold mode (starts low at 4°C and stays cool)
          singlePath.setAttribute('d', 'M 60 260 Q 235 70, 760 50');
          compPath.setAttribute('d', 'M 60 260 Q 410 200, 760 120');
          auraPath.setAttribute('d', 'M 60 260 Q 410 250, 760 235');
        }
      });
    });
  }

  /* ==========================================================================
     Cart & Checkout Flow
     ========================================================================== */
  initCart() {
    const cartBtn = document.getElementById('cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeBtn = document.getElementById('close-cart-btn');
    const backdrop = document.getElementById('cart-backdrop');
    const addBtn = document.getElementById('add-to-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const promoBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-input');
    const promoMsg = document.getElementById('promo-msg');

    const openCart = () => {
      this.renderCartItems();
      cartDrawer.classList.add('open');
      soundEngine.playClick();
    };

    const closeCart = () => {
      cartDrawer.classList.remove('open');
      soundEngine.playClick();
    };

    cartBtn.addEventListener('click', openCart);
    closeBtn.addEventListener('click', closeCart);
    backdrop.addEventListener('click', closeCart);

    addBtn.addEventListener('click', () => {
      openCart();
      soundEngine.playChime(1.3);
    });

    // Promo code handler
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'AURA10') {
        this.promoApplied = true;
        promoMsg.className = 'promo-msg success';
        promoMsg.textContent = 'Promo code applied: 10% discount!';
        document.getElementById('discount-row').classList.remove('hidden');
        soundEngine.playChime(1.4);
      } else {
        promoMsg.className = 'promo-msg error';
        promoMsg.textContent = 'Invalid promo code. Try AURA10';
        soundEngine.playClick();
      }
      this.updateCartTotals();
    });

    // Checkout Celebration with Confetti
    checkoutBtn.addEventListener('click', () => {
      soundEngine.playChime(1.5);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#818cf8', '#10b981', '#ffffff'],
      });

      checkoutBtn.textContent = 'Processing Order...';
      checkoutBtn.disabled = true;

      setTimeout(() => {
        alert(`Thank you for choosing AURA™!\n\nYour bespoke ${this.currentSize}ml vessel in ${this.currentColorName} with custom engraving "${this.engravingText}" has been queued for precision laser fabrication.`);
        checkoutBtn.textContent = 'Proceed to Secure Checkout →';
        checkoutBtn.disabled = false;
        closeCart();
      }, 1200);
    });
  }

  renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    const names = {
      urban: 'AURA Urban Pro 316L',
      glass: 'AURA Crystal Borosilicate Apothecary',
      smart: 'AURA Apex Cyber Titanium',
      wave: 'AURA Kinetic Sport Ergonomic',
    };

    container.innerHTML = `
      <div class="cart-item-card">
        <div class="cart-item-preview">
          <div style="width: 24px; height: 60px; background: ${'#' + this.currentColor.toString(16).padStart(6, '0')}; border-radius: 4px; box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);"></div>
        </div>
        <div class="cart-item-info">
          <h4>${names[this.currentModel]}</h4>
          <div class="cart-item-meta">
            <div>Volume: <strong>${this.currentSize} ml</strong></div>
            <div>Finish: <strong>${this.currentFinish.toUpperCase()}</strong> • ${this.currentColorName}</div>
            <div>Cap: <strong>${this.currentCap.toUpperCase()}</strong></div>
            <div>Laser Engraving: <strong>"${this.engravingText || 'None'}"</strong></div>
          </div>
          <div class="cart-item-price-row">
            <span>$${this.currentPrice}.00</span>
          </div>
        </div>
      </div>
    `;

    this.updateCartTotals();
  }

  updateCartTotals() {
    const subtotal = this.currentPrice;
    const discount = this.promoApplied ? subtotal * 0.1 : 0;
    const total = subtotal - discount;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-discount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
  }

  /* ==========================================================================
     Animation Loop
     ========================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;
    const delta = 0.016;

    // Turntable Auto-rotation
    if (this.autoRotate && this.bottle) {
      this.bottle.rootGroup.rotation.y += 0.007;
    }

    // Smooth Camera Transition towards target preset
    this.camera.position.lerp(this.camTargetPos, 0.05);
    this.controls.target.lerp(this.camTargetLook, 0.05);
    this.controls.update();

    // Update Bottle System
    if (this.bottle) {
      this.bottle.update(time, delta);
    }

    // Project 3D Hotspot positions
    this.updateHotspots();

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
