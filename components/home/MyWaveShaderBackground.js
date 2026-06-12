import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform float time;

mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main(void) {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
  float t = time * 0.1;

  uv += vec2(sin(uv.y * 4.0 + t * 2.0), cos(uv.x * 4.0 + t * 2.0)) * 0.1;
  uv = rotate2d(t * 0.25) * uv;

  float intensity = 0.0;
  float lineWidth = 0.02;

  for (int i = 0; i < 7; i++) {
    float i_float = float(i);
    float wave = sin(t * 2.0 + i_float * 0.5) * 0.5 + 0.5;
    intensity += lineWidth / abs(wave - length(uv) + sin(uv.x + uv.y) * 0.1);
  }

  vec3 color1 = vec3(0.0, 0.5, 1.0);
  vec3 color2 = vec3(1.0, 0.2, 0.5);
  vec3 baseColor = mix(color1, color2, sin(length(uv) * 2.0 - t) * 0.5 + 0.5);
  vec3 finalColor = baseColor * intensity;
  finalColor += (random(uv + t) - 0.5) * 0.08;

  float alpha = clamp(intensity * 0.92, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log || 'Shader compile failed');
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(log || 'Program link failed');
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

export default function MyWaveShaderBackground({ isPlaying = false }) {
  const cleanupRef = useRef(null);
  const playingRef = useRef(isPlaying);

  playingRef.current = isPlaying;

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    },
    []
  );

  const onContextCreate = useCallback((gl) => {
    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, 'position');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const resolutionLoc = gl.getUniformLocation(program, 'resolution');

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let time = 1;
    let alive = true;
    let rafId = null;

    const render = () => {
      if (!alive) return;

      const speed = playingRef.current ? 0.08 : 0.05;
      time += speed;

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLoc, time);
      gl.uniform2f(resolutionLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.endFrameEXP();

      rafId = requestAnimationFrame(render);
    };

    render();

    cleanupRef.current = () => {
      alive = false;
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <GLView
      style={styles.gl}
      onContextCreate={onContextCreate}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  gl: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
