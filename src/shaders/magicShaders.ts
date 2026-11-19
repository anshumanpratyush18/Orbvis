export const magicRuneVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const magicRuneFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  void main() {
    // Polar coordinates from center (0.5, 0.5)
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;
    float a = atan(c.y, c.x);

    // Multi-arm sacred geometry
    float arms = sin(a * 8.0 + uTime * 2.0);
    float spokes = sin(a * 16.0 - uTime * 3.0);
    float ringPattern = sin(r * 40.0 - uTime * 4.0);

    float glyphs = step(0.65, arms * spokes) * step(r, 0.95) * step(0.3, r);
    float border = smoothstep(0.04, 0.0, abs(r - 0.9)) + smoothstep(0.04, 0.0, abs(r - 0.6)) + smoothstep(0.03, 0.0, abs(r - 0.3));

    vec3 col = uColor * (border * 1.5 + glyphs * 2.0 + 0.1);
    float alpha = (border * 0.9 + glyphs * 0.85) * uIntensity;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;
