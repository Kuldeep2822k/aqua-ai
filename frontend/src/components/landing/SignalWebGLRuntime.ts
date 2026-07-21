import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
  type Texture,
} from 'three';

type SceneCleanup = () => void;

function createPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;

  const context = canvas.getContext('2d');
  if (!context) {
    return undefined;
  }

  const gradient = context.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height
  );
  gradient.addColorStop(0, 'rgba(102, 232, 249, 0.55)');
  gradient.addColorStop(0.46, 'rgba(248, 113, 113, 0.24)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.38)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = 'rgba(255, 255, 255, 0.13)';
  context.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 72) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 72) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  const glare = context.createRadialGradient(280, 150, 20, 280, 150, 320);
  glare.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  glare.addColorStop(0.26, 'rgba(255, 255, 255, 0.16)');
  glare.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = glare;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createEllipseLine(radiusX: number, radiusY: number, opacity: number) {
  const points = Array.from({ length: 160 }, (_, index) => {
    const angle = (index / 160) * Math.PI * 2;
    return new Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, 0);
  });

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0x68e1fd,
    transparent: true,
    opacity,
  });

  return new LineLoop(geometry, material);
}

function createParticleField() {
  const count = 760;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const radius = 2.2 + Math.random() * 6.8;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 5.6;
    const color = new Color(
      index % 8 === 0 ? 0xff8f8f : index % 3 === 0 ? 0x68e1fd : 0xffffff
    );

    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = height;
    positions[index * 3 + 2] = Math.sin(angle) * radius - 1.2;
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  const material = new PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  return new Points(geometry, material);
}

function disposeScene(root: Object3D) {
  root.traverse((object) => {
    const mesh = object as Mesh;
    mesh.geometry?.dispose();

    const material = mesh.material;
    const materials = Array.isArray(material)
      ? material
      : material
        ? [material]
        : [];
    materials.forEach((item) => {
      const mapped = item as Material & { map?: Texture };
      mapped.map?.dispose();
      item.dispose();
    });
  });
}

export function mountSignalScene(canvas: HTMLCanvasElement): SceneCleanup {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  const root = new Group();
  const pointer = new Vector2(0, 0);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let animationId = 0;
  let frame = 0;

  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;

  camera.position.set(0, 0.15, 9.2);
  scene.add(root);

  const panelMaterial = new MeshBasicMaterial({
    map: createPanelTexture(),
    transparent: true,
    opacity: 0.78,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const panel = new Mesh(new PlaneGeometry(6.3, 3.15, 48, 24), panelMaterial);
  panel.rotation.set(-0.04, -0.2, -0.04);
  panel.position.set(0.1, -0.1, 0);
  root.add(panel);

  const bloom = new Mesh(
    new PlaneGeometry(8.4, 5.2),
    new MeshBasicMaterial({
      color: 0x68e1fd,
      transparent: true,
      opacity: 0.055,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  bloom.position.set(0, 0, -0.65);
  root.add(bloom);

  const rings = new Group();
  [0.18, 0.13, 0.1, 0.075, 0.055].forEach((opacity, index) => {
    const line = createEllipseLine(
      2.7 + index * 0.62,
      1.45 + index * 0.36,
      opacity
    );
    line.rotation.z = index * 0.13;
    rings.add(line);
  });
  rings.position.set(0.1, -0.05, -0.9);
  rings.scale.set(1.18, 1.18, 1);
  root.add(rings);

  const particles = createParticleField();
  root.add(particles);

  const satelliteMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  });
  const topSatellite = new Mesh(
    new PlaneGeometry(1.15, 1.95),
    satelliteMaterial
  );
  topSatellite.position.set(2.85, 1.25, 0.2);
  topSatellite.rotation.set(0.06, -0.24, 0.08);
  root.add(topSatellite);

  const bottomSatellite = new Mesh(
    new PlaneGeometry(0.9, 1.36),
    satelliteMaterial.clone()
  );
  bottomSatellite.position.set(-2.7, -1.55, 0.18);
  bottomSatellite.rotation.set(-0.08, 0.24, -0.12);
  root.add(bottomSatellite);

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);

    renderer.setSize(safeWidth, safeHeight, false);
    camera.aspect = safeWidth / safeHeight;
    camera.position.z = safeWidth < 700 ? 10.6 : 10.7;
    root.scale.setScalar(safeWidth < 700 ? 0.86 : 0.92);
    camera.updateProjectionMatrix();
  };

  const render = () => {
    const drift = frame * 0.01;
    root.rotation.y = pointer.x * 0.16;
    root.rotation.x = -pointer.y * 0.08;
    panel.position.y = Math.sin(drift * 0.75) * 0.08;
    rings.rotation.z = drift * 0.05;
    particles.rotation.y = drift * 0.025;
    topSatellite.position.y = 1.25 + Math.sin(drift * 0.82) * 0.1;
    bottomSatellite.position.y = -1.55 + Math.cos(drift * 0.74) * 0.08;

    renderer.render(scene, camera);

    if (!motionQuery.matches) {
      frame += 1;
      animationId = window.requestAnimationFrame(render);
    }
  };

  const redraw = () => {
    window.cancelAnimationFrame(animationId);
    resize();
    render();
  };

  const updatePointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  redraw();
  window.addEventListener('resize', redraw);
  window.addEventListener('pointermove', updatePointer);
  motionQuery.addEventListener('change', redraw);

  return () => {
    window.cancelAnimationFrame(animationId);
    window.removeEventListener('resize', redraw);
    window.removeEventListener('pointermove', updatePointer);
    motionQuery.removeEventListener('change', redraw);
    disposeScene(scene);
    renderer.dispose();
  };
}
