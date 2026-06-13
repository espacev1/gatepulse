import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import * as THREE from 'three'
import './HeroSection.css'

/* ── Node data for the orbital network ─────────────────── */
const NODES = [
  { label: 'Hackathons',       color: '#D4AF37', angle: 0 },
  { label: 'Workshops',        color: '#0057D8', angle: Math.PI * 2 / 7 },
  { label: 'Events',           color: '#00CFFF', angle: Math.PI * 4 / 7 },
  { label: 'Student Clubs',    color: '#8B5CF6', angle: Math.PI * 6 / 7 },
  { label: 'Sports',           color: '#10B981', angle: Math.PI * 8 / 7 },
  { label: 'Innovation Labs',  color: '#F59E0B', angle: Math.PI * 10 / 7 },
  { label: 'Research Programs',color: '#EF4444', angle: Math.PI * 12 / 7 },
]

/* ── 3D Scene ────────────────────────────────────────────── */
function buildScene(canvas) {
  const W = canvas.clientWidth
  const H = canvas.clientHeight

  /* renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  /* scene */
  const scene = new THREE.Scene()

  /* camera */
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500)
  camera.position.set(0, 0, 9)

  /* ── lights ──────────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0x0a0a30, 3))

  const blue1 = new THREE.PointLight(0x003B8E, 120, 30)
  blue1.position.set(-4, 3, 5)
  scene.add(blue1)

  const blue2 = new THREE.PointLight(0x0057D8, 80, 20)
  blue2.position.set(5, -2, 4)
  scene.add(blue2)

  const gold = new THREE.PointLight(0xD4AF37, 40, 15)
  gold.position.set(0, 4, 2)
  scene.add(gold)

  /* ── Central sphere ──────────────────────────────────── */
  const coreGeo = new THREE.IcosahedronGeometry(1.1, 6)
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x001433,
    metalness: 0.9,
    roughness: 0.1,
    emissive: new THREE.Color(0x002266),
    emissiveIntensity: 0.5,
  })
  const coreMesh = new THREE.Mesh(coreGeo, coreMat)
  scene.add(coreMesh)

  /* Outer glow shell */
  const glowGeo = new THREE.IcosahedronGeometry(1.35, 4)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x0057D8,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  })
  const glowMesh = new THREE.Mesh(glowGeo, glowMat)
  scene.add(glowMesh)

  /* Wireframe shell */
  const wireGeo = new THREE.IcosahedronGeometry(1.42, 2)
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x0057D8,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  })
  scene.add(new THREE.Mesh(wireGeo, wireMat))

  /* ── Orbital ring ────────────────────────────────────── */
  const ringGeo = new THREE.TorusGeometry(3.2, 0.008, 8, 120)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x0057D8, transparent: true, opacity: 0.25 })
  const ringMesh = new THREE.Mesh(ringGeo, ringMat)
  ringMesh.rotation.x = Math.PI / 4
  scene.add(ringMesh)

  /* Tilted ring 2 */
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.004, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.12 })
  )
  ring2.rotation.x = -Math.PI / 3.5
  ring2.rotation.z = Math.PI / 6
  scene.add(ring2)

  /* ── Node orbs + labels ──────────────────────────────── */
  const ORBIT_R = 3.2
  const orbGroup = new THREE.Group()
  scene.add(orbGroup)

  const nodeObjects = NODES.map((n) => {
    const x = ORBIT_R * Math.cos(n.angle)
    const y = ORBIT_R * Math.sin(n.angle) * 0.45
    const z = ORBIT_R * Math.sin(n.angle) * 0.6

    /* orb */
    const geo = new THREE.SphereGeometry(0.16, 16, 16)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(n.color),
      emissive: new THREE.Color(n.color),
      emissiveIntensity: 1.2,
      metalness: 0.6,
      roughness: 0.2,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y, z)
    orbGroup.add(mesh)

    /* energy line from center to node */
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(n.color),
      transparent: true,
      opacity: 0.25,
    })
    orbGroup.add(new THREE.Line(lineGeo, lineMat))

    return { mesh, mat, color: n.color }
  })

  /* ── Particle field ──────────────────────────────────── */
  const PARTICLE_COUNT = 1800
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 28
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14
  }
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pMat = new THREE.PointsMaterial({
    color: 0x4488dd,
    size: 0.025,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  })
  const particles = new THREE.Points(pGeo, pMat)
  scene.add(particles)

  /* ── Mouse parallax ──────────────────────────────────── */
  const mouse = { x: 0, y: 0 }
  const onMouseMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('mousemove', onMouseMove)

  /* ── Resize ──────────────────────────────────────────── */
  const onResize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  /* ── Animation loop ──────────────────────────────────── */
  let frame = 0
  let raf
  const animate = () => {
    raf = requestAnimationFrame(animate)
    frame += 0.005

    /* rotate the whole orbital group */
    orbGroup.rotation.y = frame * 0.5
    orbGroup.rotation.x = Math.sin(frame * 0.3) * 0.06

    /* pulse core */
    const s = 1 + Math.sin(frame * 2) * 0.025
    coreMesh.scale.setScalar(s)
    glowMesh.scale.setScalar(s + 0.06)

    /* wireframe slow rotate */
    wireGeo.userData; // just reference to avoid lint
    coreMesh.rotation.y -= 0.003
    coreMesh.rotation.z += 0.001

    /* particles drift */
    particles.rotation.y = frame * 0.04
    particles.rotation.x = frame * 0.02

    /* rings breathe */
    ringMesh.rotation.z = frame * 0.08
    ring2.rotation.y    = -frame * 0.06

    /* node orb glow pulse */
    nodeObjects.forEach(({ mat }, idx) => {
      mat.emissiveIntensity = 0.8 + Math.sin(frame * 2 + idx) * 0.6
    })

    /* parallax camera */
    camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.04
    camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
  }
  animate()

  /* ── Cleanup fn ──────────────────────────────────────── */
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', onResize)
    renderer.dispose()
  }
}

/* ── React Component ─────────────────────────────────────── */
export default function HeroSection({ onExplore, onEnter }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const cleanup = buildScene(canvasRef.current)
    return cleanup
  }, [])

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    show: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }
    }),
  }

  return (
    <section className="vp-hero" id="hero">
      {/* 3D canvas */}
      <canvas ref={canvasRef} className="vp-hero__canvas" />

      {/* Floating glass panels */}
      <div className="vp-hero__panels" aria-hidden="true">
        <div className="vp-panel vp-panel--tl">
          <div className="vp-panel__label">Upcoming</div>
          <div className="vp-panel__value">Hackathon</div>
          <div className="vp-panel__sub">Nexus 2026 · 36 hrs</div>
        </div>

        <div className="vp-panel vp-panel--tr">
          <div className="vp-panel__label">Workshop Seats</div>
          <div className="vp-panel__value">87<span style={{ fontSize: '1rem', opacity: 0.5 }}>/120</span></div>
          <div className="vp-panel__sub">Filling fast</div>
        </div>

        <div className="vp-panel vp-panel--bl">
          <div className="vp-panel__label"><span className="vp-panel__dot"></span>Live Events</div>
          <div className="vp-panel__value">3</div>
          <div className="vp-panel__sub">Happening now</div>
        </div>

        <div className="vp-panel vp-panel--br">
          <div className="vp-panel__label">Student Clubs</div>
          <div className="vp-panel__value">24</div>
          <div className="vp-panel__sub">Active communities</div>
        </div>
      </div>

      {/* Central content */}
      <div className="vp-hero__content">
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={0}
        >
          <span className="vp-hero__eyebrow">
            <span className="vp-hero__eyebrow-dot" />
            Vishnu Institute of Technology · VIT Bhimavaram
          </span>
        </motion.div>

        <motion.h1 className="vp-hero__title" variants={fadeUp} initial="hidden" animate="show" custom={1}>
          <span className="vp-hero__title-gradient">THE DIGITAL<br />HEARTBEAT<br />OF VIT</span>
        </motion.h1>

        <motion.p className="vp-hero__subtitle-line" variants={fadeUp} initial="hidden" animate="show" custom={2}>
          One intelligent platform connecting events, innovation,<br />
          communities, opportunities, and student achievements.
        </motion.p>

        <motion.div className="vp-hero__ctas" variants={fadeUp} initial="hidden" animate="show" custom={3}>
          <button className="vp-hero__btn vp-hero__btn--primary" onClick={onExplore}>
            Explore Events <ArrowRight size={16} />
          </button>
          <button className="vp-hero__btn vp-hero__btn--secondary" onClick={onEnter}>
            Enter VIT Pulse <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <div className="vp-hero__scroll" onClick={onExplore} aria-label="Scroll down">
        <span className="vp-hero__scroll-label">Scroll</span>
        <div className="vp-hero__scroll-track">
          <div className="vp-hero__scroll-dot" />
        </div>
      </div>
    </section>
  )
}
