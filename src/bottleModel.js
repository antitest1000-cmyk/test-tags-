import * as THREE from 'three';

/**
 * Procedural Dynamic 3D Bottle Generator
 * Creates physically modeled bottles with distinct silhouettes, materials,
 * dynamic liquid simulation, and real-time laser engraving canvas texture.
 */

export class BottleSystem {
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Sub-components for exploded view
    this.capGroup = new THREE.Group();
    this.gasketMesh = null;
    this.bodyMesh = null;
    this.liquidMesh = null;
    this.innerFlaskMesh = null;
    this.baseMesh = null;

    this.rootGroup.add(this.capGroup);

    // Current State
    this.modelType = 'urban';
    this.finishType = 'matte';
    this.bottleColor = 0x141518;
    this.capType = 'magnetic';
    this.fillLevel = 0.75;
    this.liquidColor = 0x38bdf8;
    this.engravingText = 'AURA • 2026';
    this.engravingFont = 'sans';
    this.scaleFactor = 1.0;

    // Exploded View Transition State
    this.isExploded = false;
    this.explodeProgress = 0.0; // 0 to 1

    // Canvas Texture for Laser Engraving
    this.canvasTexture = null;
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.width = 1024;
    this.textureCanvas.height = 1024;
    this.textureCtx = this.textureCanvas.getContext('2d');

    // Build initial bottle
    this.rebuildBottle();
  }

  // Re-render offscreen dynamic canvas for laser etching
  updateLaserTexture() {
    const ctx = this.textureCtx;
    const w = this.textureCanvas.width;
    const h = this.textureCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.engravingText.trim().length > 0) {
      // Draw subtle laser engraved typography
      ctx.save();
      ctx.translate(w / 2, h / 2);

      let fontFamily = 'sans-serif';
      if (this.engravingFont === 'serif') fontFamily = 'Georgia, serif';
      if (this.engravingFont === 'mono') fontFamily = 'Courier New, monospace';

      // Laser etched text with sharp outline and subtle inner fill
      ctx.font = `bold 64px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Sub-micron laser mark styling
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(this.engravingText.toUpperCase(), 0, -20);

      // Subtle minimalist aesthetic framing lines
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(-160, 25);
      ctx.lineTo(160, 25);
      ctx.stroke();

      ctx.font = `600 22px ${fontFamily}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 0;
      ctx.fillText('DESIGNED IN COPENHAGEN • 316L', 0, 52);

      ctx.restore();
    }

    if (!this.canvasTexture) {
      this.canvasTexture = new THREE.CanvasTexture(this.textureCanvas);
      this.canvasTexture.wrapS = THREE.RepeatWrapping;
      this.canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.canvasTexture.repeat.set(1, 1);
    } else {
      this.canvasTexture.needsUpdate = true;
    }

    return this.canvasTexture;
  }

  // Create PBR materials based on selected finish
  createBodyMaterial() {
    this.updateLaserTexture();

    const color = new THREE.Color(this.bottleColor);

    if (this.finishType === 'frosted') {
      return new THREE.MeshPhysicalMaterial({
        color: color,
        transmission: 0.82,
        opacity: 1,
        transparent: true,
        roughness: 0.28,
        ior: 1.48,
        thickness: 1.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        map: this.canvasTexture,
      });
    }

    if (this.finishType === 'brushed') {
      return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.88,
        roughness: 0.28,
        map: this.canvasTexture,
      });
    }

    if (this.finishType === 'gloss') {
      return new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.15,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        map: this.canvasTexture,
      });
    }

    // Default: Matte Powdercoat
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.15,
      roughness: 0.48,
      map: this.canvasTexture,
    });
  }

  // Generate 2D Profile Curves for LatheGeometry based on model silhouette
  createSilhouettePoints(type) {
    const pts = [];

    if (type === 'glass') {
      // Apothecary / Cryo Glass: Heavy thick base, rounded wide body, elegant tapered neck
      pts.push(new THREE.Vector2(0.0, -2.4));
      pts.push(new THREE.Vector2(1.15, -2.4)); // Solid flat heavy bottom
      pts.push(new THREE.Vector2(1.25, -2.2));
      pts.push(new THREE.Vector2(1.22, 0.4));
      pts.push(new THREE.Vector2(1.15, 0.9));
      pts.push(new THREE.Vector2(0.85, 1.4)); // Rounded shoulder
      pts.push(new THREE.Vector2(0.55, 1.8)); // Tapered neck
      pts.push(new THREE.Vector2(0.52, 2.3));
      pts.push(new THREE.Vector2(0.58, 2.4)); // Lip collar
      pts.push(new THREE.Vector2(0.46, 2.4)); // Inner lip
      pts.push(new THREE.Vector2(0.44, 2.2));
    } else if (type === 'smart') {
      // Apex Cyber: Precision cylindrical aerospace titanium with chamfers
      pts.push(new THREE.Vector2(0.0, -2.5));
      pts.push(new THREE.Vector2(1.05, -2.5));
      pts.push(new THREE.Vector2(1.15, -2.35));
      pts.push(new THREE.Vector2(1.15, 1.2));
      pts.push(new THREE.Vector2(0.95, 1.55)); // 45 degree sharp chamfer
      pts.push(new THREE.Vector2(0.68, 1.7));
      pts.push(new THREE.Vector2(0.68, 2.4));
      pts.push(new THREE.Vector2(0.72, 2.45));
      pts.push(new THREE.Vector2(0.60, 2.45));
    } else if (type === 'wave') {
      // Kinetic Sport: Ergonomic curved grip, ribbed contours
      pts.push(new THREE.Vector2(0.0, -2.6));
      pts.push(new THREE.Vector2(1.1, -2.6));
      pts.push(new THREE.Vector2(1.2, -2.4));
      pts.push(new THREE.Vector2(1.18, -1.0));
      pts.push(new THREE.Vector2(1.02, -0.2)); // Grip waist indent
      pts.push(new THREE.Vector2(1.02, 0.4));
      pts.push(new THREE.Vector2(1.16, 1.1));
      pts.push(new THREE.Vector2(0.88, 1.6));
      pts.push(new THREE.Vector2(0.62, 1.9));
      pts.push(new THREE.Vector2(0.62, 2.4));
      pts.push(new THREE.Vector2(0.66, 2.45));
      pts.push(new THREE.Vector2(0.55, 2.45));
    } else {
      // Urban Pro (Flagship): Quintessential double wall thermal cylinder with smooth shoulder
      pts.push(new THREE.Vector2(0.0, -2.5));
      pts.push(new THREE.Vector2(1.08, -2.5));
      pts.push(new THREE.Vector2(1.18, -2.38));
      pts.push(new THREE.Vector2(1.18, 0.8));
      pts.push(new THREE.Vector2(1.14, 1.2));
      pts.push(new THREE.Vector2(0.85, 1.65)); // Elegant shoulder curve
      pts.push(new THREE.Vector2(0.58, 1.95)); // Neck
      pts.push(new THREE.Vector2(0.58, 2.4));
      pts.push(new THREE.Vector2(0.64, 2.45));
      pts.push(new THREE.Vector2(0.52, 2.45));
    }

    return pts;
  }

  // Rebuild the complete 3D bottle mesh hierarchy
  rebuildBottle() {
    // Clear existing objects
    while (this.capGroup.children.length > 0) {
      const obj = this.capGroup.children[0];
      this.capGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }

    [this.bodyMesh, this.gasketMesh, this.liquidMesh, this.innerFlaskMesh, this.baseMesh].forEach(m => {
      if (m && m.parent) {
        m.parent.remove(m);
        if (m.geometry) m.geometry.dispose();
      }
    });

    // 1. Build Outer Body Mesh using LatheGeometry
    const pts = this.createSilhouettePoints(this.modelType);
    const bodyGeo = new THREE.LatheGeometry(pts, 64);
    const bodyMat = this.createBodyMaterial();

    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.rootGroup.add(this.bodyMesh);

    // 2. Build Inner Liquid Mesh
    this.rebuildLiquid();

    // 3. Build Inner Thermal Copper / Steel Vacuum Chamber (revealed in exploded view)
    const innerGeo = new THREE.CylinderGeometry(0.85, 0.85, 3.8, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Polished copper vacuum radiant barrier
      metalness: 0.95,
      roughness: 0.15,
    });
    this.innerFlaskMesh = new THREE.Mesh(innerGeo, innerMat);
    this.innerFlaskMesh.position.y = -0.1;
    this.innerFlaskMesh.castShadow = true;
    this.innerFlaskMesh.visible = this.isExploded; // Show during exploded view
    this.rootGroup.add(this.innerFlaskMesh);

    // 4. Build Cap & Silicone Gasket
    this.rebuildCap();

    // 5. Build Base Protective Ring (Silicone Bumper)
    const baseGeo = new THREE.CylinderGeometry(1.19, 1.2, 0.25, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x181920,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.baseMesh = new THREE.Mesh(baseGeo, baseMat);
    this.baseMesh.position.y = -2.42;
    this.baseMesh.castShadow = true;
    this.rootGroup.add(this.baseMesh);

    // Apply scale
    this.rootGroup.scale.set(this.scaleFactor, this.scaleFactor, this.scaleFactor);
  }

  // Liquid Inside Bottle
  rebuildLiquid() {
    if (this.liquidMesh && this.liquidMesh.parent) {
      this.liquidMesh.parent.remove(this.liquidMesh);
      if (this.liquidMesh.geometry) this.liquidMesh.geometry.dispose();
    }

    const maxHeight = 3.8;
    const height = Math.max(0.1, maxHeight * this.fillLevel);
    const radius = this.modelType === 'glass' ? 1.05 : 0.92;

    const liquidGeo = new THREE.CylinderGeometry(radius, radius, height, 48);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.liquidColor),
      transmission: 0.92,
      opacity: 0.92,
      transparent: true,
      roughness: 0.08,
      ior: 1.333, // Water refractive index
      thickness: 0.8,
      specularIntensity: 1.0,
      clearcoat: 0.8,
    });

    this.liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    // Position liquid bottom aligned with bottle floor
    const bottomY = -2.3;
    this.liquidMesh.position.y = bottomY + height / 2;
    this.liquidMesh.castShadow = false;
    this.liquidMesh.receiveShadow = true;
    this.rootGroup.add(this.liquidMesh);
  }

  // Build Cap Variations
  rebuildCap() {
    const neckY = 2.45;

    // Silicone Gasket Ring
    const gasketGeo = new THREE.TorusGeometry(0.55, 0.06, 16, 48);
    const gasketMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.gasketMesh = new THREE.Mesh(gasketGeo, gasketMat);
    this.gasketMesh.rotation.x = Math.PI / 2;
    this.gasketMesh.position.y = neckY;
    this.rootGroup.add(this.gasketMesh);

    if (this.capType === 'wood') {
      // Artisanal Walnut Cap with Brass Ring
      const capBodyGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.8, 36);
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0x5a3422, // Rich dark walnut
        roughness: 0.65,
        metalness: 0.05,
      });
      const woodCap = new THREE.Mesh(capBodyGeo, woodMat);
      woodCap.position.y = neckY + 0.4;
      woodCap.castShadow = true;
      this.capGroup.add(woodCap);

      const brassRingGeo = new THREE.CylinderGeometry(0.70, 0.70, 0.15, 36);
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // Polished brass
        metalness: 0.9,
        roughness: 0.2,
      });
      const brassRing = new THREE.Mesh(brassRingGeo, brassMat);
      brassRing.position.y = neckY + 0.1;
      this.capGroup.add(brassRing);

    } else if (this.capType === 'oled') {
      // Apex Smart OLED Cap with glowing digital temp ring
      const smartCapGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.6, 40);
      const smartMat = new THREE.MeshStandardMaterial({
        color: 0x181a20,
        metalness: 0.85,
        roughness: 0.2,
      });
      const smartCap = new THREE.Mesh(smartCapGeo, smartMat);
      smartCap.position.y = neckY + 0.3;
      smartCap.castShadow = true;
      this.capGroup.add(smartCap);

      // OLED screen circle
      const screenGeo = new THREE.CircleGeometry(0.55, 32);
      const screenMat = new THREE.MeshBasicMaterial({
        color: 0x050608,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.rotation.x = -Math.PI / 2;
      screen.position.y = neckY + 0.605;
      this.capGroup.add(screen);

      // Glowing Cyan LED status ring
      const ringGeo = new THREE.RingGeometry(0.48, 0.52, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
      });
      const glowRing = new THREE.Mesh(ringGeo, ringMat);
      glowRing.rotation.x = -Math.PI / 2;
      glowRing.position.y = neckY + 0.608;
      this.capGroup.add(glowRing);

    } else {
      // Default: AeroLock™ Magnetic Carry Loop Cap
      const capGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.7, 36);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x22252e,
        metalness: 0.7,
        roughness: 0.3,
      });
      const mainCap = new THREE.Mesh(capGeo, capMat);
      mainCap.position.y = neckY + 0.35;
      mainCap.castShadow = true;
      this.capGroup.add(mainCap);

      // Knurled grip band
      const knurlGeo = new THREE.CylinderGeometry(0.71, 0.71, 0.3, 36);
      const knurlMat = new THREE.MeshStandardMaterial({
        color: 0x111317,
        metalness: 0.9,
        roughness: 0.5,
      });
      const knurl = new THREE.Mesh(knurlGeo, knurlMat);
      knurl.position.y = neckY + 0.35;
      this.capGroup.add(knurl);

      // Magnetic silicone loop handle
      const handleGeo = new THREE.TorusGeometry(0.35, 0.08, 16, 32, Math.PI);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // Cyan accent strap
        roughness: 0.5,
      });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.y = neckY + 0.7;
      handle.rotation.z = Math.PI;
      this.capGroup.add(handle);
    }
  }

  // Setters for reactive UI updates
  setModel(type) {
    this.modelType = type;
    this.rebuildBottle();
  }

  setFinish(finish) {
    this.finishType = finish;
    if (this.bodyMesh) {
      this.bodyMesh.material.dispose();
      this.bodyMesh.material = this.createBodyMaterial();
    }
  }

  setColor(hex) {
    this.bottleColor = hex;
    if (this.bodyMesh) {
      this.bodyMesh.material.color.set(hex);
    }
  }

  setCap(cap) {
    this.capType = cap;
    this.rebuildBottle();
  }

  setFill(fraction) {
    this.fillLevel = fraction;
    this.rebuildLiquid();
  }

  setLiquidColor(hex) {
    this.liquidColor = hex;
    if (this.liquidMesh) {
      this.liquidMesh.material.color.set(hex);
    }
  }

  setSize(capacity) {
    if (capacity === '500') {
      this.scaleFactor = 0.88;
    } else if (capacity === '1000') {
      this.scaleFactor = 1.15;
    } else {
      this.scaleFactor = 1.0;
    }
    this.rootGroup.scale.set(this.scaleFactor, this.scaleFactor, this.scaleFactor);
  }

  setEngraving(text, font) {
    this.engravingText = text;
    if (font) this.engravingFont = font;
    this.updateLaserTexture();
  }

  toggleExplode() {
    this.isExploded = !this.isExploded;
    if (this.innerFlaskMesh) {
      this.innerFlaskMesh.visible = true; // Make visible during animation
    }
    return this.isExploded;
  }

  // Animation tick for exploded transitions and subtle liquid slosh
  update(time, delta) {
    // Smooth Exploded View Interpolation
    const target = this.isExploded ? 1.0 : 0.0;
    this.explodeProgress += (target - this.explodeProgress) * 0.08;

    if (this.innerFlaskMesh) {
      this.innerFlaskMesh.visible = this.explodeProgress > 0.02;
    }

    // Apply exploded offsets
    if (this.capGroup) {
      this.capGroup.position.y = this.explodeProgress * 2.5;
    }
    if (this.gasketMesh) {
      this.gasketMesh.position.y = 2.45 + this.explodeProgress * 1.4;
    }
    if (this.innerFlaskMesh) {
      this.innerFlaskMesh.position.y = -0.1 + this.explodeProgress * 0.7;
    }
    if (this.baseMesh) {
      this.baseMesh.position.y = -2.42 - this.explodeProgress * 0.9;
    }

    // Gentle liquid meniscus movement
    if (this.liquidMesh && !this.isExploded) {
      this.liquidMesh.rotation.y += 0.005;
      const wave = Math.sin(time * 3) * 0.015;
      this.liquidMesh.position.x = wave;
    }
  }

  // Get world position coordinates for interactive 3D UI hotspot markers
  getHotspotPositions() {
    const s = this.scaleFactor;
    return {
      cap: new THREE.Vector3(0, (2.8 + this.explodeProgress * 2.5) * s, 0.4 * s),
      body: new THREE.Vector3(1.15 * s, 0.4 * s, 0.3 * s),
      engraving: new THREE.Vector3(0, -0.6 * s, 1.15 * s),
      base: new THREE.Vector3(0, (-2.45 - this.explodeProgress * 0.9) * s, 0.8 * s),
    };
  }
}
