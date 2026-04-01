import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LogoIntro3D({ onComplete }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Create VIT logo group
    const logoGroup = new THREE.Group();

    // Create 3D VIT letters using boxes for clean geometry
    const letterGeometry = new THREE.BoxGeometry(1, 1.5, 0.3);
    const letterMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      specular: 0x444444,
      shininess: 30
    });

    // V letter (left)
    const vLetter = new THREE.Mesh(letterGeometry, letterMaterial);
    vLetter.position.set(-2.5, 0, 0);
    vLetter.scale.set(1, 1.2, 1);
    // Custom shape for V by using scaled boxes
    const vShape = new THREE.Group();
    const vPart1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.3), letterMaterial);
    vPart1.position.set(-0.3, 0, 0);
    const vPart2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.3), letterMaterial);
    vPart2.position.set(0.3, 0, 0);
    const vPart3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.3), letterMaterial);
    vPart3.position.set(-0.8, 0.3, 0);
    vPart3.rotation.z = Math.PI / 6;
    const vPart4 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.3), letterMaterial);
    vPart4.position.set(0.8, 0.3, 0);
    vPart4.rotation.z = -Math.PI / 6;
    vShape.add(vPart1, vPart2, vPart3, vPart4);
    vShape.position.set(-1.5, 0, 0);

    // I letter (middle)
    const iLetter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.3), letterMaterial);
    iLetter.position.set(0, 0, 0);

    // T letter (right)
    const tLetter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.3), letterMaterial);
    tLetter.position.set(1.5, 0.5, 0);
    const tStem = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.3, 0.3), letterMaterial);
    tStem.position.set(1.5, -0.3, 0);

    logoGroup.add(vShape, iLetter, tLetter, tStem);

    // Pulse wave rings around the logo
    const rings = [];
    const ringGeometry = new THREE.TorusGeometry(2.5, 0.05, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.z = -i * 0.5;
      ring.scale.set(1 + i * 0.2, 1 + i * 0.2, 1);
      rings.push(ring);
      logoGroup.add(ring);
    }

    // Center "PULSE" text in 3D
    const pulseGroup = new THREE.Group();
    const pulseMaterial = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.3
    });

    // Create P U L S E with small boxes
    const createLetter = (char, xPos) => {
      const letter = new THREE.Group();
      const width = 0.3;
      const height = 0.5;

      switch(char.toUpperCase()) {
        case 'P':
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1), pulseMaterial));
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1), pulseMaterial));
          letter.children[0].position.set(0, height/4, 0);
          letter.children[1].position.set(width*0.5, height/4, 0);
          letter.children[1].scale.y = 0.5;
          break;
        case 'U':
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1), pulseMaterial));
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1), pulseMaterial));
          letter.children[0].position.set(-width*0.3, 0, 0);
          letter.children[1].position.set(width*0.3, 0, 0);
          break;
        case 'L':
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width*1.2, height, 0.1), pulseMaterial));
          break;
        case 'S':
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width, height*0.3, 0.1), pulseMaterial));
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width, height*0.3, 0.1), pulseMaterial));
          letter.children[0].position.y = height*0.3;
          letter.children[1].position.set(width*0.5, -height*0.15, 0);
          letter.children[1].rotation.z = Math.PI / 4;
          break;
        case 'E':
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width*1.2, height, 0.1), pulseMaterial));
          letter.add(new THREE.Mesh(new THREE.BoxGeometry(width*0.5, height*0.25, 0.1), pulseMaterial));
          letter.children[1].position.set(-width*0.25, height*0.3, 0);
          letter.children[1].scale.x = 1.5;
          break;
      }
      letter.position.x = xPos;
      return letter;
    };

    const pulseChars = ['P', 'U', 'L', 'S', 'E'];
    pulseChars.forEach((char, i) => {
      const letter = createLetter(char, (i - 2) * 0.8);
      pulseGroup.add(letter);
    });
    pulseGroup.position.set(0, -2.5, 0);
    logoGroup.add(pulseGroup);

    scene.add(logoGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x2563eb, 1, 10);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x2563eb,
      transparent: true,
      opacity: 0.8
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Animation
    const clock = new THREE.Clock();
    let animationProgress = 0;
    const animationDuration = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Opening animation
      if (animationProgress < 1) {
        animationProgress = Math.min(elapsed / animationDuration, 1);
        const easeOut = 1 - Math.pow(1 - animationProgress, 3);

        logoGroup.scale.set(easeOut, easeOut, easeOut);
        logoGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.1;
      } else {
        // Idle animation
        logoGroup.rotation.y += 0.005;
        logoGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.05;
      }

      // Ring animations
      rings.forEach((ring, i) => {
        ring.rotation.z = elapsed * (0.5 + i * 0.2);
        ring.scale.setScalar(1 + Math.sin(elapsed * 2 + i) * 0.1);
      });

      // Pulse animation
      pulseGroup.position.y = -2.5 + Math.sin(elapsed * 3) * 0.1;

      // Particles rotation
      particlesMesh.rotation.y = elapsed * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Complete callback
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      // Cleanup Three.js resources
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [onComplete]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#ffffff',
        transition: 'opacity 1.5s ease-out'
      }}
    />
  );
}
