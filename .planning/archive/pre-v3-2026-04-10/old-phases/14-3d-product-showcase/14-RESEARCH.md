# Phase 14: 3D Product Showcase - Research

**Researched:** 2026-03-09
**Domain:** Interactive 3D Product Visualization with React Three Fiber
**Confidence:** HIGH

## Summary

Phase 14 requires implementing interactive 3D product viewing with rotation, zoom, realistic lighting, and mobile optimization. The established ecosystem for this is **React Three Fiber (R3F)** with **drei** helpers, built on Three.js.

**Critical Context:** Three.js was previously removed from this project in Phase 9 because it added 600KB for a simple background effect. However, Phase 14 requires genuine 3D product showcases (rotation, zoom, lighting, shadows), making this a legitimate use case. Bundle size and mobile performance remain top concerns.

**Primary recommendation:** Use React Three Fiber v9 + drei v10 with aggressive Next.js 14 dynamic imports (SSR disabled), gltfjsx for model conversion, progressive loading with Suspense, and realistic staging via Environment + AccumulativeShadows. Target <150KB initial bundle impact through code splitting, with 3D components loaded only when needed.

The react-three-next starter demonstrates achieving 79KB First Load JS with proper architecture. Combined with Next.js 14 App Router dynamic imports (`ssr: false`), you can defer the entire Three.js payload until a user actually views a product in 3D mode.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-three/fiber | 9.5.0 | React renderer for Three.js | Official React integration, declarative JSX for 3D scenes, 435K+ weekly downloads |
| @react-three/drei | 10.7.7 | Helper components for R3F | Official helpers (OrbitControls, Environment, Shadows, etc), 543 dependent projects |
| three | r183 | 3D graphics library | WebGL abstraction, industry standard, automatic WebGL 2/WebGPU fallback |
| three-stdlib | latest | Tree-shakeable Three.js examples | Class-based, optimized for tree-shaking, ESM/CJS exports |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-three/gltfjsx | latest | CLI to convert GLTF to JSX | Convert 3D models to React components with preloading |
| leva | latest | React-first GUI controls | Development/debugging (3D parameter tweaking), optional |
| @react-three/postprocessing | latest | Post-processing effects | Advanced visual effects (bloom, depth of field), use sparingly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Three Fiber | @google/model-viewer | Simpler web component (124K downloads/week), but limited customization, no React integration, less control over lighting/camera |
| React Three Fiber | Spline Design exports | No-code visual tool, but experimental R3F export, larger bundle, less control over optimization |
| Manual Three.js | R3F + drei | Lower-level control, but loses React declarative patterns, no component reuse, harder to maintain |

**Installation:**
```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @react-three/gltfjsx
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── 3d/
│       ├── ProductViewer.tsx      # Main 3D viewer wrapper (dynamic import target)
│       ├── PerfumeBottle.tsx      # Generated via gltfjsx
│       ├── Lighting.tsx           # Environment + shadows setup
│       ├── Controls.tsx           # OrbitControls configuration
│       └── Scene.tsx              # Canvas + Suspense wrapper
├── lib/
│   └── three/
│       ├── loader.ts              # useLoader preload logic
│       └── config.ts              # Camera, lighting constants
└── public/
    └── models/
        └── perfume-bottle.glb     # Optimized 3D models
```

### Pattern 1: Next.js Dynamic Import with SSR Disabled
**What:** Three.js relies on browser WebGL APIs, so must be client-side only. Next.js 14 App Router requires explicit SSR disabling.

**When to use:** Always for 3D components in Next.js.

**Example:**
```typescript
// src/app/products/[slug]/page.tsx
import dynamic from 'next/dynamic';

const ProductViewer = dynamic(
  () => import('@/components/3d/ProductViewer'),
  {
    ssr: false,
    loading: () => <ProductViewerSkeleton />
  }
);

export default function ProductPage() {
  return (
    <div>
      <ProductViewer modelPath="/models/perfume-bottle.glb" />
    </div>
  );
}
```

**Why:** Prevents SSR errors, defers ~600KB Three.js bundle until component mounts, enables skeleton loading state.

### Pattern 2: Canvas + Suspense + Error Boundary
**What:** R3F's Canvas wraps the 3D scene, Suspense handles async model loading, ErrorBoundary catches WebGL failures.

**When to use:** Every 3D scene root.

**Example:**
```typescript
// Source: https://r3f.docs.pmnd.rs/tutorials/loading-models
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

function ProductViewer({ modelPath }) {
  return (
    <ErrorBoundary fallback={<WebGLError />}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={<Loader />}>
          <PerfumeBottle modelPath={modelPath} />
          <Lighting />
          <Controls />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
}
```

**Why:** Prevents white screens on model load failures, handles async GLTF loading, provides loading UI.

### Pattern 3: gltfjsx Model Conversion
**What:** CLI tool converts GLTF/GLB files to JSX components with automatic preloading and optimized structure.

**When to use:** All 3D product models.

**Example:**
```bash
# With optimization (Draco compression, texture resizing, WebP conversion)
npx gltfjsx public/models/perfume-bottle.glb --transform --output src/components/3d/PerfumeBottle.tsx

# Basic conversion
npx gltfjsx public/models/perfume-bottle.glb
```

Generated component:
```typescript
// Source: https://github.com/pmndrs/gltfjsx
import { useGLTF } from '@react-three/drei';

export function PerfumeBottle(props) {
  const { nodes, materials } = useGLTF('/models/perfume-bottle-transformed.glb');
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Bottle.geometry} material={materials.Glass} />
      <mesh geometry={nodes.Cap.geometry} material={materials.Gold} />
    </group>
  );
}

// Preload for instant rendering
useGLTF.preload('/models/perfume-bottle-transformed.glb');
```

**Why:** Draco compression (40-60% size reduction), automatic preloading, React component reuse, type-safe refs.

### Pattern 4: Realistic Lighting with Environment + AccumulativeShadows
**What:** drei's Environment provides HDRI-based lighting, AccumulativeShadows creates raycast-quality shadows.

**When to use:** Product showcases requiring photorealism.

**Example:**
```typescript
// Source: https://drei.docs.pmnd.rs/staging/accumulative-shadows
import { Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';

function Lighting() {
  return (
    <>
      {/* HDRI environment for reflections */}
      <Environment preset="city" background={false} />

      {/* Soft ambient + key light */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {/* Realistic ground shadows */}
      <AccumulativeShadows
        temporal
        frames={100}
        color="#9d4b4b"
        colorBlend={0.5}
        alphaTest={0.9}
        scale={20}
      >
        <RandomizedLight amount={8} radius={4} position={[5, 5, -10]} />
      </AccumulativeShadows>
    </>
  );
}
```

**Why:** Environment works with PBR materials (MeshStandardMaterial) for realistic reflections without manual light setup. AccumulativeShadows distributes shadow rendering across frames (temporal mode) for better performance than real-time shadows.

### Pattern 5: OrbitControls for Product Rotation
**What:** drei's OrbitControls enables mouse/touch rotation, zoom, and pan.

**When to use:** Interactive product viewing.

**Example:**
```typescript
// Source: https://github.com/pmndrs/drei
import { OrbitControls } from '@react-three/drei';

function Controls() {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={10}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2}
      target={[0, 0, 0]}
    />
  );
}
```

**Why:** Smooth damped rotation, configurable limits (prevent upside-down views), mobile touch support, industry-standard UX.

### Pattern 6: Progressive Loading with useLoader
**What:** R3F's useLoader caches assets and enables preloading to prevent redundant fetches.

**When to use:** Shared textures, environment maps, or models used across multiple components.

**Example:**
```typescript
// Source: https://r3f.docs.pmnd.rs/advanced/pitfalls
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

function ProductWithTexture() {
  const texture = useLoader(TextureLoader, '/textures/label.jpg');

  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// Preload before component mounts
useLoader.preload(TextureLoader, '/textures/label.jpg');
```

**Why:** Caches loaded assets globally, prevents re-fetching per component instance, supports preloading for instant display.

### Pattern 7: Mutation in useFrame (Not setState)
**What:** R3F's useFrame runs every render frame (~60fps). Mutate refs directly for animations, never setState.

**When to use:** Any animation (rotation, position, scale changes).

**Example:**
```typescript
// Source: https://r3f.docs.pmnd.rs/advanced/pitfalls
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function RotatingBottle() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // ✅ Mutate ref directly
    meshRef.current.rotation.y += delta * 0.5;

    // ❌ NEVER do this (triggers React re-render)
    // setRotation(rotation + delta);
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry />
      <meshStandardMaterial />
    </mesh>
  );
}
```

**Why:** setState triggers React's scheduler (expensive), mutations are direct WebGL updates (60fps capable), delta ensures refresh-rate independence.

### Anti-Patterns to Avoid
- **Creating objects in loops:** Allocating `new THREE.Vector3()` every frame forces garbage collection. Use pooled objects with `.set()` instead.
- **Mounting/unmounting for visibility:** Remounting reinitializes buffers/materials (expensive). Use `visible={false}` prop instead.
- **Fixed animation values:** `position.x += 0.1` breaks on high-refresh displays. Always use delta: `position.x += delta * speed`.
- **Individual materials per mesh:** Every material compiles shaders. Share materials via `useMemo` or instancing.
- **Reactive binding to fast state:** Binding 60fps animations to React state causes constant re-renders. Fetch state in useFrame instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera controls | Custom mouse/touch rotation | drei's `<OrbitControls>` | Handles damping, momentum, touch gestures, zoom limits, polar angle constraints, mobile edge cases |
| Environment lighting | Manual HDRI texture loading + equirectangular mapping | drei's `<Environment>` | Presets (city, sunset, studio), automatic PBR material integration, background control, performance-optimized |
| Model loading | Manual GLTFLoader + parse + cache | drei's `useGLTF` + gltfjsx CLI | Automatic caching, Draco decompression, preloading, type-safe component generation |
| Realistic shadows | Manual shadow map configuration | drei's `<AccumulativeShadows>` + `<RandomizedLight>` | Raycast-quality soft shadows, temporal rendering (spreads cost across frames), configurable quality/performance |
| 3D text | Custom text geometry + font loading | drei's `<Text3D>` or `<Text>` | SDF-based rendering, troika-three-text (high quality), automatic font loading, billboard mode |
| Loading states | Manual progress tracking | React `<Suspense>` + Canvas fallback | Built-in async handling, automatic progress tracking, error boundaries integration |
| Performance monitoring | Custom FPS counter | drei's `<Stats>` (dev) or `<PerformanceMonitor>` | Three.js stats.js integration, automatic regression detection, adaptive quality scaling |

**Key insight:** The drei library exists because these problems have subtle edge cases. Custom OrbitControls might work on desktop but fail on iOS Safari touch events. Custom HDRI loading might work for one texture but cause memory leaks with multiple. Use battle-tested helpers.

## Common Pitfalls

### Pitfall 1: Forgetting Dynamic Import with `ssr: false`
**What goes wrong:** "ReferenceError: window is not defined" or "WebGLRenderer is not a constructor" during Next.js SSR.

**Why it happens:** Three.js relies on browser-only APIs (WebGL, canvas, window). Next.js 14 App Router renders components server-side by default.

**How to avoid:**
```typescript
// ✅ Correct
const ProductViewer = dynamic(
  () => import('@/components/3d/ProductViewer'),
  { ssr: false }
);

// ❌ Wrong
import ProductViewer from '@/components/3d/ProductViewer';
```

**Warning signs:** Build errors mentioning "window", "document", or "WebGL" during `npm run build`.

### Pitfall 2: Large Model Files Freezing Page Load
**What goes wrong:** 5-40MB GLTF models freeze the browser for seconds on first load, especially mobile.

**Why it happens:** JavaScript single-threaded parsing, uncompressed geometry, large textures.

**How to avoid:**
1. **Use gltfjsx with `--transform` flag:** Applies Draco compression (40-60% reduction), texture resizing (1024x1024 max), WebP conversion, deduplication.
2. **Preload critical models:** `useGLTF.preload('/models/hero-bottle.glb')` in parent component before Canvas mounts.
3. **Progressive loading:** Show low-poly version first, swap to high-poly after load.
4. **Lazy load non-visible models:** Only load model when user clicks "View in 3D" button.

**Warning signs:** Browser DevTools Performance tab shows long "Parse" tasks, mobile devices lag on product pages.

### Pitfall 3: No Lights = Black Screen
**What goes wrong:** 3D model loads but renders completely black.

**Why it happens:** MeshStandardMaterial (PBR) requires lights. Without lights, material has no illumination to reflect.

**How to avoid:**
```typescript
// ✅ Minimum lighting setup
<ambientLight intensity={0.5} />
<directionalLight position={[5, 5, 5]} intensity={1} />

// ✅ Better: Use Environment (includes ambient)
<Environment preset="city" />
```

**Warning signs:** Model visible in wireframe mode but black in solid mode, shadows work but surfaces are dark.

### Pitfall 4: Camera Aspect Ratio Mismatch
**What goes wrong:** Products appear stretched or squashed on certain screen sizes.

**Why it happens:** Canvas CSS size doesn't match camera aspect ratio, or camera aspect set incorrectly.

**How to avoid:**
```typescript
// ✅ Let R3F handle it automatically
<Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
  {/* R3F syncs camera.aspect to canvas size automatically */}
</Canvas>

// ❌ Don't manually set aspect unless you handle resize
camera.aspect = window.innerWidth / window.innerHeight; // Breaks on resize
```

**Warning signs:** Product looks correct on desktop but distorted on mobile, aspect changes on window resize.

### Pitfall 5: Mobile Safari Performance Degradation
**What goes wrong:** 3D scene runs at 60fps on desktop but <20fps on iPhone, overheating.

**Why it happens:** Mobile GPUs ~5x weaker, iOS WebGL restrictions, battery-saving throttling.

**How to avoid:**
1. **Target <100 draw calls:** Each mesh = one draw call. Use instancing for repeated objects.
2. **Reduce texture sizes:** Max 1024x1024 on mobile, use KTX2 compression.
3. **Disable shadows on mobile:** Detect with `window.matchMedia('(max-width: 768px)')`.
4. **Use `<PerformanceMonitor>`:** drei helper that automatically reduces quality on slow devices.
5. **Enable on-demand rendering:** Only render when user interacts (not tested in this research, but documented in R3F docs).

**Warning signs:** DevTools FPS drops below 30, battery drains quickly, device gets hot.

### Pitfall 6: Memory Leaks from Unmanaged Geometry/Materials
**What goes wrong:** Page becomes slower over time, eventually crashes on tab switch or navigation.

**Why it happens:** Three.js geometries and materials allocate GPU memory. React component unmount doesn't auto-dispose them.

**How to avoid:**
```typescript
// ✅ Use dispose={null} on groups (R3F auto-disposes children)
<group dispose={null}>
  <mesh geometry={nodes.Bottle.geometry} material={materials.Glass} />
</group>

// ✅ Manual cleanup in useEffect
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
}, []);
```

**Warning signs:** Chrome Task Manager shows memory increasing over time, "out of memory" errors on low-end devices.

### Pitfall 7: setState in useFrame Kills Performance
**What goes wrong:** Frame rate drops from 60fps to <10fps when animations start.

**Why it happens:** setState triggers React reconciliation every frame (60 times/second), cascading re-renders.

**How to avoid:**
```typescript
// ❌ NEVER do this
const [rotation, setRotation] = useState(0);
useFrame((state, delta) => {
  setRotation(r => r + delta); // Triggers React render every frame
});

// ✅ Mutate refs directly
const meshRef = useRef();
useFrame((state, delta) => {
  meshRef.current.rotation.y += delta; // Direct WebGL mutation
});
```

**Warning signs:** React DevTools Profiler shows thousands of renders per second, laggy animations.

## Code Examples

Verified patterns from official sources:

### Complete Product Viewer Component
```typescript
// Source: https://github.com/pmndrs/react-three-next
// Combines Next.js dynamic import + R3F patterns
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';

// Dynamic import with SSR disabled
const PerfumeBottle = dynamic(
  () => import('./PerfumeBottle').then(mod => ({ default: mod.PerfumeBottle })),
  { ssr: false }
);

function Loader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
    </div>
  );
}

export function ProductViewer({ modelPath }: { modelPath: string }) {
  return (
    <div className="w-full h-[600px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <PerfumeBottle position={[0, 0, 0]} />

          {/* Lighting */}
          <Environment preset="city" background={false} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

          {/* Shadows */}
          <AccumulativeShadows
            temporal
            frames={100}
            alphaTest={0.9}
            scale={20}
            position={[0, -1, 0]}
          >
            <RandomizedLight amount={8} radius={4} position={[5, 5, -10]} />
          </AccumulativeShadows>

          {/* Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

### Mobile Performance Optimization
```typescript
// Source: https://r3f.docs.pmnd.rs/advanced/scaling-performance
import { PerformanceMonitor } from '@react-three/drei';
import { useState } from 'react';

function AdaptiveProductViewer() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas dpr={dpr}>
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
      >
        <Suspense fallback={null}>
          <PerfumeBottle />
          <Lighting simplified={dpr === 1} />
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  );
}

function Lighting({ simplified }: { simplified: boolean }) {
  if (simplified) {
    // Low-end devices: basic lighting, no shadows
    return (
      <>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
      </>
    );
  }

  // High-end devices: full lighting + shadows
  return (
    <>
      <Environment preset="city" />
      <AccumulativeShadows temporal frames={100}>
        <RandomizedLight amount={8} radius={4} position={[5, 5, -10]} />
      </AccumulativeShadows>
    </>
  );
}
```

### Custom Perfume Builder 3D Preview
```typescript
// Integrates with existing custom perfume builder
// Uses color selection to tint bottle material
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

type BottleProps = {
  topNoteColor: string;
  heartNoteColor: string;
  baseNoteColor: string;
};

function CustomPerfumeBottle({ topNoteColor, heartNoteColor, baseNoteColor }: BottleProps) {
  const liquidRef = useRef<THREE.Mesh>(null);
  const glassRef = useRef<THREE.Mesh>(null);

  // Smooth rotation for showcase
  useFrame((state, delta) => {
    if (glassRef.current) {
      glassRef.current.rotation.y += delta * 0.2;
    }
  });

  // Blend note colors into liquid gradient
  const liquidColor = new THREE.Color(heartNoteColor);

  return (
    <group>
      {/* Glass bottle */}
      <mesh ref={glassRef}>
        <cylinderGeometry args={[0.5, 0.5, 2, 32]} />
        <meshPhysicalMaterial
          transmission={0.95}
          thickness={0.1}
          roughness={0.05}
          envMapIntensity={1}
        />
      </mesh>

      {/* Liquid inside */}
      <mesh ref={liquidRef} position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 1.4, 32]} />
        <meshStandardMaterial
          color={liquidColor}
          transparent
          opacity={0.8}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>

      {/* Gold cap */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.4, 32]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Three.js r160 with manual setup | Three.js r183 with WebGPU auto-fallback | Sept 2025 (Safari 26 WebGPU support) | Better mobile performance, automatic WebGL 2 fallback, simplified renderer setup |
| Manual GLTFLoader + parse | gltfjsx CLI with `--transform` flag | Ongoing (improved in 2024-2025) | Automated Draco compression, texture optimization, WebP conversion, 40-60% size reduction |
| Three.js examples imports | three-stdlib | 2021-ongoing | Tree-shakeable, no globals, ESM/CJS support, smaller bundles |
| Real-time shadows (ShadowMap) | AccumulativeShadows with temporal rendering | 2023-2024 | Raycast-quality shadows at fraction of performance cost, temporal spreading |
| dat.gui for controls | leva | 2021-2024 | React-first API, declarative hooks, better TypeScript support |
| Manual HDRI loading | Environment component with presets | 2022-ongoing | One-line realistic lighting, automatic PBR integration, performance optimized |
| KTX2 texture compression | KTX2 + new spark.js (WebGPU) | Jan 2026 | Real-time GPU texture compression, ship standard images, efficient VRAM usage |

**Deprecated/outdated:**
- **react-three-fiber v7-8**: Now on v9 with React 19 support (Jan 2026)
- **Manual Draco decoder setup**: gltfjsx `--transform` handles automatically
- **Fixed viewport Canvas**: react-three-next introduced View component for multi-canvas efficiency (2024)
- **WebGL-only rendering**: WebGPU now standard with automatic fallback (Sept 2025)

## Open Questions

1. **Which perfume bottle models to use?**
   - What we know: Multiple sources offer perfume bottle GLB/GLTF models (Sketchfab, CGTrader, BlenderKit)
   - What's unclear: Whether to commission custom models matching exact Aquad'or products, use generic bottles, or hybrid approach
   - Recommendation: Start with 1-2 generic high-quality perfume bottle models from Sketchfab (many are free), customize with textures/labels. Validate performance/bundle size before commissioning custom models.

2. **Texture compression format: KTX2 vs WebP?**
   - What we know: WebP = smaller file size, KTX2 = better VRAM usage, spark.js (2026) enables real-time GPU compression
   - What's unclear: Which format best balances download size vs runtime performance for this project
   - Recommendation: Use gltfjsx `--transform` which outputs WebP-compressed textures by default. Monitor VRAM usage in Chrome DevTools. Consider KTX2 only if VRAM becomes bottleneck on mobile.

3. **Mobile disable threshold?**
   - What we know: Mobile GPUs ~5x weaker, target <100 draw calls, disable shadows on mobile
   - What's unclear: Should 3D be disabled entirely on low-end devices (<2GB RAM), or just quality degradation?
   - Recommendation: Use `<PerformanceMonitor>` to auto-adjust quality. Provide 2D fallback images with "View in 3D (requires recent device)" opt-in button for very low-end devices.

4. **Custom perfume builder 3D integration scope?**
   - What we know: Phase requires "3D product visualization in custom perfume builder interface"
   - What's unclear: Full 3D builder with draggable note particles, or just 3D preview of final bottle with colored liquid?
   - Recommendation: MVP = 3D bottle preview with liquid color matching selected heart note. Defer draggable 3D note selection to future phase (likely requires significant R&D).

## Sources

### Primary (HIGH confidence)
- React Three Fiber official docs: https://r3f.docs.pmnd.rs/
- drei GitHub repository: https://github.com/pmndrs/drei
- drei official docs: https://drei.docs.pmnd.rs/
- react-three-next starter: https://github.com/pmndrs/react-three-next
- gltfjsx repository: https://github.com/pmndrs/gltfjsx
- Next.js Lazy Loading docs: https://nextjs.org/docs/app/guides/lazy-loading
- React Three Fiber Performance Pitfalls: https://r3f.docs.pmnd.rs/advanced/pitfalls
- React Three Fiber Loading Models tutorial: https://r3f.docs.pmnd.rs/tutorials/loading-models
- Three.js official releases: https://github.com/mrdoob/three.js/releases

### Secondary (MEDIUM confidence)
- [React Three Fiber bundle size discussion](https://github.com/pmndrs/react-three-fiber/discussions/812)
- [Next.js code splitting guide](https://web.dev/articles/code-splitting-with-dynamic-imports-in-nextjs)
- [React Three Fiber vs Three.js in 2026](https://graffersid.com/react-three-fiber-vs-three-js/)
- [3D Product Grid with R3F - Codrops Feb 2026](https://tympanus.net/codrops/2026/02/24/from-flat-to-spatial-creating-a-3d-product-grid-with-react-three-fiber/)
- [WebGL for 3D Graphics 2026](https://618media.com/en/blog/webgl-for-3d-graphics-in-web-design/)
- [Three.js 100 Performance Tips 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [glTF Transform documentation](https://gltf-transform.dev/)
- [OptimizeGLB compressor](https://optimizeglb.com/)
- [WebGPU texture formats 2026](https://www.ludicon.com/castano/blog/2026/01/choosing-texture-formats-for-webgpu-applications/)

### Tertiary (LOW confidence - for validation)
- [Spline vs Three.js comparison](https://aircada.com/blog/three-js-vs-spline) - Bundle size specifics not found
- [model-viewer vs R3F NPM trends](https://npmtrends.com/@google/model-viewer-vs-@react-three/fiber-vs-x3dom) - Download stats only, no technical comparison
- Three.js forum discussions on mobile performance - Anecdotal, needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, npm stats, widespread adoption verified
- Architecture: HIGH - Official starters, docs, recent 2026 examples found
- Pitfalls: HIGH - Official pitfalls docs, forum consensus on common issues
- Bundle optimization: MEDIUM - Strategies verified, but specific size impact needs testing
- Mobile performance: MEDIUM - General guidance verified, device-specific thresholds need testing

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days - stable ecosystem, but WebGPU adoption evolving)
