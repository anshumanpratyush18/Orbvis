export const orbVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uIntensity;
  uniform float uRadius;

  // Simple pseudo 3D noise
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;

    vec3 pos = position;
    float n = noise(pos * 3.0 + vec3(0.0, 0.0, uTime * 2.0));
    float pulse = sin(uTime * 4.0 + pos.y * 5.0) * 0.05 * uIntensity;
    pos += normal * (n * 0.15 * uIntensity + pulse);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const orbFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA; // Red
  uniform vec3 uColorB; // Blue

  void main() {
    // View vector in camera space
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.8);
    
    // Animated energy wave bands
    float wave = sin(vPosition.y * 12.0 - uTime * 6.0) * 0.5 + 0.5;
    float plasma = sin(vPosition.x * 10.0 + uTime * 4.0) * cos(vPosition.z * 10.0 - uTime * 3.0);
    
    // Core color blending between electric blue and glowing red
    vec3 color = mix(uColorA, uColorB, clamp(wave + plasma * 0.4, 0.0, 1.0));
    color += vec3(0.3, 0.6, 1.0) * fresnel * 1.5;

    // Center brightness
    float centerGlow = pow(clamp(dot(vNormal, viewDir), 0.0, 1.0), 4.0);
    color += vec3(1.0, 0.9, 0.7) * centerGlow * 0.6 * uIntensity;

    float alpha = clamp(fresnel * 1.2 * uIntensity + 0.15 + centerGlow * 0.3, 0.0, 0.98);
    gl_FragColor = vec4(color * uIntensity, alpha);
  }
`;
