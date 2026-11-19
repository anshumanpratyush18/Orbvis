export const hologramVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uGlitch;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;

    vec3 pos = position;
    if (uGlitch > 0.05) {
      float glitchOffset = sin(pos.y * 30.0 + uTime * 60.0) * 0.08 * uGlitch;
      pos.x += glitchOffset;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const hologramFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uGlitch;
  uniform vec3 uColor;
  uniform float uScanY;

  void main() {
    // Holographic scanlines
    float scanline = sin(vPosition.y * 80.0 + uTime * 10.0) * 0.5 + 0.5;
    scanline = pow(scanline, 1.5);

    // Fresnel rim light for holographic edge glow
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float rim = 1.0 - abs(dot(vNormal, viewDir));
    rim = pow(rim, 2.2);

    // Active laser scanning beam
    float scanDist = abs(vPosition.y - uScanY);
    float laserBeam = smoothstep(0.12, 0.0, scanDist) * 1.8;

    // Flicker
    float flicker = sin(uTime * 45.0) * 0.04 + 0.96;

    // Glitch dropouts
    float glitchMask = 1.0;
    if (uGlitch > 0.1) {
      glitchMask = step(0.15, fract(vPosition.y * 12.0 + uTime * 30.0));
    }

    vec3 baseColor = uColor;
    baseColor += vec3(0.4, 0.8, 1.0) * rim * 1.4;
    baseColor += vec3(0.6, 1.0, 1.0) * laserBeam;

    float alpha = (rim * 0.85 + scanline * 0.35 + laserBeam * 0.8 + 0.1) * uOpacity * flicker * glitchMask;

    gl_FragColor = vec4(baseColor, clamp(alpha, 0.0, 0.95));
  }
`;
