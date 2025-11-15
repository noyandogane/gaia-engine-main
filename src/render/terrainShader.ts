import { ShaderMaterial, Uniform } from 'three'

export const terrainVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const terrainFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  uniform float uSeed;
  uniform float uScale;
  uniform float uPersistence;
  uniform float uLacunarity;
  uniform int uOctaves;
  uniform float uWaterLevel;
  uniform float uBeachLevel;
  uniform float uPlainsLevel;
  uniform float uHillsLevel;
  uniform bool uShowTemperatureOverlay;
  uniform float uAxialTilt;
  uniform float uAlbedo;
  uniform float uGreenhouseMultiplier;
  uniform float uCurrentTime;

  // Simple pseudo-random function
  float random(vec3 st) {
    return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
  }

  // Calculate latitude from position
  float getLatitude(vec3 position) {
    return asin(position.y) * 180.0 / 3.14159265;
  }

  // Calculate solar declination angle
  float calculateSolarDeclination(float axialTilt, float dayOfYear) {
    float tiltRadians = axialTilt * 3.14159265 / 180.0;
    float dayAngle = 2.0 * 3.14159265 * dayOfYear / 365.0;
    return tiltRadians * sin(dayAngle);
  }

  // Calculate daily solar radiation
  float calculateDailySolarRadiation(float latitude, float axialTilt, float dayOfYear) {
    float declination = calculateSolarDeclination(axialTilt, dayOfYear);
    float latRadians = latitude * 3.14159265 / 180.0;
    
    float cosHourAngle = -tan(latRadians) * tan(declination);
    
    // Polar day/night conditions
    if (cosHourAngle <= -1.0) {
      // Polar day - simplified calculation
      return 1361.0 * (sin(latRadians) * sin(declination) + 
             0.64 * cos(latRadians) * cos(declination));
    }
    
    if (cosHourAngle >= 1.0) {
      // Polar night
      return 0.0;
    }
    
    float hourAngle = acos(cosHourAngle);
    float dailyRadiation = (1361.0 / 3.14159265) *
      (hourAngle * sin(latRadians) * sin(declination) +
       cos(latRadians) * cos(declination) * sin(hourAngle));
    
    return max(0.0, dailyRadiation);
  }

  // Calculate effective temperature
  float calculateEffectiveTemperature(float solarRadiation, float albedo, float greenhouseMultiplier) {
    float absorbedRadiation = solarRadiation * (1.0 - albedo);
    return pow((absorbedRadiation * greenhouseMultiplier) / (4.0 * 5.67e-8), 0.25);
  }

  // Get temperature color
  vec3 getTemperatureColor(float tempCelsius) {
    if (tempCelsius < -50.0) return vec3(0.0, 0.0, 0.5); // Navy
    if (tempCelsius < -20.0) return vec3(0.0, 0.5, 1.0); // Light blue
    if (tempCelsius < -10.0) return vec3(0.0, 1.0, 1.0); // Cyan
    if (tempCelsius < 0.0) return vec3(0.0, 1.0, 0.5); // Green-blue
    if (tempCelsius < 10.0) return vec3(0.0, 1.0, 0.0); // Green
    if (tempCelsius < 20.0) return vec3(0.5, 1.0, 0.0); // Yellow-green
    if (tempCelsius < 30.0) return vec3(1.0, 1.0, 0.0); // Yellow
    if (tempCelsius < 40.0) return vec3(1.0, 0.5, 0.0); // Orange
    if (tempCelsius < 50.0) return vec3(1.0, 0.0, 0.0); // Red
    return vec3(0.5, 0.0, 0.0); // Dark red
  }

  // Perlin-like noise
  float noise(vec3 p) {
    vec3 pi = floor(p);
    vec3 pf = fract(p);
    pf = pf * pf * (3.0 - 2.0 * pf);

    float n = pi.x + pi.y * 57.0 + pi.z * 113.0;
    float a = random(vec3(n) + uSeed);
    float b = random(vec3(n + 1.0) + uSeed);
    float c = random(vec3(n + 57.0) + uSeed);
    float d = random(vec3(n + 58.0) + uSeed);

    float ab = mix(a, b, pf.x);
    float cd = mix(c, d, pf.x);

    return mix(ab, cd, pf.y);
  }

  // Fractional Brownian Motion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 6; i++) {
      if (i >= uOctaves) break;
      value += noise(p * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= uPersistence;
      frequency *= uLacunarity;
    }

    return value / maxValue;
  }

  vec3 getBiomeColor(float height) {
    if (height < uWaterLevel) {
      return vec3(0.1, 0.2, 0.4);
    }

    if (height < uBeachLevel) {
      float t = (height - uWaterLevel) / (uBeachLevel - uWaterLevel);
      return mix(
        vec3(0.1, 0.3, 0.1),
        vec3(1.0, 0.8, 0.3),
        t
      );
    }

    if (height < uPlainsLevel) {
      float t = (height - uBeachLevel) / (uPlainsLevel - uBeachLevel);
      return mix(
        vec3(1.0, 0.8, 0.3),
        vec3(0.8, 0.9, 0.4),
        t
      );
    }

    if (height < uHillsLevel) {
      float t = (height - uPlainsLevel) / (uHillsLevel - uPlainsLevel);
      return mix(
        vec3(0.8, 0.9, 0.4),
        vec3(0.6, 0.7, 0.5),
        t
      );
    }

    float t = (height - uHillsLevel) / (1.0 - uHillsLevel);
    return mix(
      vec3(0.6, 0.7, 0.5),
      vec3(0.9, 0.9, 0.9),
      t
    );
  }

  void main() {
    vec3 p = normalize(vPosition);

    float height = fbm(p * uScale);
    height = (height + 1.0) / 2.0;

    vec3 color = getBiomeColor(height);

    // Apply temperature overlay if enabled
    if (uShowTemperatureOverlay) {
      float latitude = getLatitude(p);
      float solarRadiation = calculateDailySolarRadiation(latitude, uAxialTilt, uCurrentTime);
      float tempKelvin = calculateEffectiveTemperature(solarRadiation, uAlbedo, uGreenhouseMultiplier);
      float tempCelsius = tempKelvin - 273.15;
      
      vec3 tempColor = getTemperatureColor(tempCelsius);
      
      // Blend temperature with terrain colors
      color = mix(color, tempColor, 0.7);
    }

    // Simple directional lighting
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(vNormal, light), 0.3);

    color *= diffuse;

    gl_FragColor = vec4(color, 1.0);
  }
`

export function createTerrainMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: {
      uSeed: new Uniform(12345),
      uScale: new Uniform(0.5),
      uPersistence: new Uniform(0.5),
      uLacunarity: new Uniform(2.0),
      uOctaves: new Uniform(6),
      uWaterLevel: new Uniform(0.4),
      uBeachLevel: new Uniform(0.42),
      uPlainsLevel: new Uniform(0.55),
      uHillsLevel: new Uniform(0.75),
      uShowTemperatureOverlay: new Uniform(false),
      uAxialTilt: new Uniform(23.5),
      uAlbedo: new Uniform(0.3),
      uGreenhouseMultiplier: new Uniform(1.0),
      uCurrentTime: new Uniform(0.0),
    },
  })
}
