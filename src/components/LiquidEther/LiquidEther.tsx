import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'
import './LiquidEther.css'

type LiquidEtherProps = {
  colors?: string[]
  mouseForce?: number
  cursorSize?: number
  resolution?: number
  autoDemo?: boolean
  autoSpeed?: number
  autoIntensity?: number
  autoResumeDelay?: number
  className?: string
  style?: CSSProperties
}

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec2 uPointerVelocity;
  uniform float uTime;
  uniform float uMouseForce;
  uniform float uCursorSize;
  uniform float uAutoIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec2 vUv;

  float softCircle(vec2 uv, vec2 center, float radius) {
    float dist = length((uv - center) * vec2(uResolution.x / uResolution.y, 1.0));
    return smoothstep(radius, 0.0, dist);
  }

  float field(vec2 p) {
    float a = sin((p.x * 7.2) + uTime * 0.62);
    float b = sin((p.y * 8.5) - uTime * 0.48);
    float c = sin((p.x + p.y) * 5.8 + uTime * 0.36);
    float d = sin(length(p - 0.5) * 13.0 - uTime * 0.7);
    return (a + b + c + d) * 0.25;
  }

  void main() {
    vec2 uv = vUv;
    vec2 pointer = uPointer;
    float speed = length(uPointerVelocity);
    float brush = softCircle(uv, pointer, uCursorSize / max(uResolution.x, uResolution.y));
    vec2 flow = normalize(uPointerVelocity + vec2(0.0001)) * brush * speed * uMouseForce * 0.004;
    vec2 warped = uv - flow;

    float f1 = field(warped + vec2(sin(uTime * 0.12), cos(uTime * 0.1)) * 0.04);
    float f2 = field(warped * 1.7 - vec2(0.22, 0.18));
    float veins = smoothstep(0.28, 0.9, abs(f1 + f2 * 0.55));
    float pulse = softCircle(uv, pointer, 0.34) * clamp(speed * 3.2 + uAutoIntensity * 0.08, 0.08, 1.0);

    vec3 color = mix(uColorA, uColorB, veins);
    color = mix(color, uColorC, pulse);
    float alpha = clamp((veins * 0.34 + pulse * 0.46) * 0.82, 0.0, 0.82);
    alpha *= smoothstep(0.02, 0.16, uv.x) * smoothstep(0.98, 0.84, uv.x);
    alpha *= smoothstep(0.02, 0.16, uv.y) * smoothstep(0.98, 0.84, uv.y);

    gl_FragColor = vec4(color, alpha);
  }
`

function hexToColor(value: string) {
  return new THREE.Color(value)
}

export default function LiquidEther({
  colors = ['#3b0506', '#e52c30', '#ff7a5c'],
  mouseForce = 18,
  cursorSize = 120,
  resolution = 0.72,
  autoDemo = true,
  autoSpeed = 0.48,
  autoIntensity = 1.7,
  autoResumeDelay = 1200,
  className = '',
  style = {},
}: LiquidEtherProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const pointerRef = useRef(new THREE.Vector2(0.5, 0.5))
  const velocityRef = useRef(new THREE.Vector2(0, 0))
  const lastPointerRef = useRef(new THREE.Vector2(0.5, 0.5))
  const lastInteractionRef = useRef(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' })
    } catch {
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'liquid-ether-canvas'
    mount.appendChild(renderer.domElement)

    const palette = [
      hexToColor(colors[0] ?? '#3b0506'),
      hexToColor(colors[1] ?? colors[0] ?? '#e52c30'),
      hexToColor(colors[2] ?? colors[1] ?? '#ff7a5c'),
    ]

    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: pointerRef.current },
      uPointerVelocity: { value: velocityRef.current },
      uTime: { value: 0 },
      uMouseForce: { value: mouseForce },
      uCursorSize: { value: cursorSize },
      uAutoIntensity: { value: autoIntensity },
      uColorA: { value: palette[0] },
      uColorB: { value: palette[1] },
      uColorC: { value: palette[2] },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    let width = 1
    let height = 1
    let raf = 0
    let visible = true
    const clock = new THREE.Clock()

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      renderer.setPixelRatio(pixelRatio * resolution)
      renderer.setSize(width, height, false)
      uniforms.uResolution.value.set(width, height)
    }

    const setPointerFromEvent = (clientX: number, clientY: number) => {
      const rect = mount.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return

      const x = (clientX - rect.left) / rect.width
      const y = 1 - (clientY - rect.top) / rect.height
      pointerRef.current.set(x, y)
      velocityRef.current.subVectors(pointerRef.current, lastPointerRef.current)
      lastPointerRef.current.copy(pointerRef.current)
      lastInteractionRef.current = performance.now()
    }

    const handlePointerMove = (event: PointerEvent) => setPointerFromEvent(event.clientX, event.clientY)
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) setPointerFromEvent(touch.clientX, touch.clientY)
    }

    const render = () => {
      if (!visible) return
      const elapsed = clock.getElapsedTime()
      uniforms.uTime.value = elapsed
      uniforms.uMouseForce.value = mouseForce
      uniforms.uCursorSize.value = cursorSize
      uniforms.uAutoIntensity.value = autoIntensity

      const idle = performance.now() - lastInteractionRef.current
      if (autoDemo && idle > autoResumeDelay) {
        const ax = 0.5 + Math.sin(elapsed * autoSpeed) * 0.28 + Math.sin(elapsed * autoSpeed * 0.43) * 0.08
        const ay = 0.5 + Math.cos(elapsed * autoSpeed * 0.8) * 0.22
        pointerRef.current.lerp(new THREE.Vector2(ax, ay), 0.025)
        velocityRef.current.lerp(new THREE.Vector2(Math.sin(elapsed) * 0.018, Math.cos(elapsed * 0.9) * 0.018), 0.08)
      } else {
        velocityRef.current.multiplyScalar(0.9)
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting)
        if (visible && !raf) {
          clock.start()
          raf = requestAnimationFrame(render)
        } else if (!visible && raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      },
      { threshold: [0, 0.05] },
    )
    intersectionObserver.observe(mount)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('touchmove', handleTouchMove)
      mount.removeChild(renderer.domElement)
      mesh.geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [autoDemo, autoIntensity, autoResumeDelay, autoSpeed, colors, cursorSize, mouseForce, resolution])

  return <div className={`liquid-ether-container ${className}`} ref={mountRef} style={style} aria-hidden="true" />
}
