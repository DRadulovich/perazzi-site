// Derived from PavelDoGreat/WebGL-Fluid-Simulation (MIT License).
// See: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

type FluidSmokeOptions = Readonly<{
  baseColor?: [number, number, number];
  colorJitter?: number;
}>;

type FluidSmokeHandle = {
  start: () => void;
  stop: () => void;
  resize: (width: number, height: number, dpr?: number) => void;
  setPointer: (x: number, y: number, dx: number, dy: number, down: boolean) => void;
  destroy: () => void;
};

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;
type FBO = [WebGLTexture, WebGLFramebuffer, number];
type DoubleFBO = {
  read: FBO;
  write: FBO;
  swap: () => void;
};

type FormatInfo = Readonly<{
  internalFormat: number;
  format: number;
}>;

type WebGLExtensions = Readonly<{
  formatRGBA: FormatInfo;
  formatRG: FormatInfo;
  formatR: FormatInfo;
  halfFloatTexType: number;
  supportLinearFiltering: boolean;
  isWebGL2: boolean;
}>;

type WebGLContextResult = Readonly<{
  gl: GLContext;
  ext: WebGLExtensions;
}>;

const createNoopHandle = (): FluidSmokeHandle => ({
  start: () => undefined,
  stop: () => undefined,
  resize: () => undefined,
  setPointer: () => undefined,
  destroy: () => undefined,
});

const createRandom = () => {
  const buffer = new Uint32Array(16);
  let index = buffer.length;
  return () => {
    if (!globalThis.crypto?.getRandomValues) {
      return 0.5;
    }
    if (index >= buffer.length) {
      globalThis.crypto.getRandomValues(buffer);
      index = 0;
    }
    const value = buffer[index];
    index += 1;
    return value / 4294967296;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isWebGL2Context = (context: GLContext): context is WebGL2RenderingContext =>
  "texStorage2D" in context;

const getWebGLContext = (canvas: HTMLCanvasElement): WebGLContextResult | null => {
  const params: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  };

  let gl: GLContext | null = canvas.getContext("webgl2", params);

  if (!gl) {
    const webglContext = canvas.getContext("webgl", params);
    const experimentalContext = canvas.getContext("experimental-webgl", params) as
      | WebGLRenderingContext
      | null;
    gl = webglContext ?? experimentalContext;
  }

  if (!gl) return null;

  let isWebGL2 = false;
  let halfFloatTexType: number | null = null;
  let supportLinearFiltering = false;
  let formatRGBA: FormatInfo | null = null;
  let formatRG: FormatInfo | null = null;
  let formatR: FormatInfo | null = null;

  if (isWebGL2Context(gl)) {
    isWebGL2 = true;
    gl.getExtension("EXT_color_buffer_float");
    supportLinearFiltering = Boolean(gl.getExtension("OES_texture_float_linear"));
    halfFloatTexType = gl.HALF_FLOAT;
    formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
    formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
    formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
  } else {
    const halfFloat = gl.getExtension("OES_texture_half_float");
    supportLinearFiltering = Boolean(gl.getExtension("OES_texture_half_float_linear"));
    halfFloatTexType = halfFloat?.HALF_FLOAT_OES ?? null;
    if (halfFloatTexType) {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = formatRGBA;
      formatR = formatRGBA;
    }
  }

  if (!halfFloatTexType || !formatRGBA || !formatRG || !formatR) return null;

  return {
    gl,
    ext: {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering,
      isWebGL2,
    },
  };
};

const supportRenderTextureFormat = (
  gl: GLContext,
  internalFormat: number,
  format: number,
  type: number,
) => {
  const texture = gl.createTexture();
  if (!texture) return false;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  if (!fbo) return false;

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
};

const getSupportedFormat = (
  gl: GLContext,
  internalFormat: number,
  format: number,
  type: number,
): FormatInfo | null => {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    if (isWebGL2Context(gl)) {
      if (internalFormat === gl.R16F) {
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      }
      if (internalFormat === gl.RG16F) {
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
      }
    }
    return null;
  }
  return { internalFormat, format };
};

class GLProgram {
  public uniforms: Record<string, WebGLUniformLocation | null> = {};
  public program: WebGLProgram;

  public constructor(gl: GLContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create WebGL program.");
    this.program = program;

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.bindAttribLocation(this.program, 0, "aPosition");
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(String(gl.getProgramInfoLog(this.program)));
    }

    const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i += 1) {
      const info = gl.getActiveUniform(this.program, i);
      if (!info) continue;
      this.uniforms[info.name] = gl.getUniformLocation(this.program, info.name);
    }
  }

  public bind(gl: GLContext) {
    gl.useProgram(this.program);
  }
}

const compileShader = (gl: GLContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(String(gl.getShaderInfoLog(shader)));
  }

  return shader;
};

export const createFluidSmoke = (
  canvas: HTMLCanvasElement,
  options: FluidSmokeOptions = {},
): FluidSmokeHandle => {
  const context = getWebGLContext(canvas);
  if (!context) return createNoopHandle();

  const { gl, ext } = context;
  const randomFloat = createRandom();

  const baseColor: [number, number, number] = options.baseColor ?? [0, 0, 0];
  const colorJitter = options.colorJitter ?? 0.2;

  const config = {
    TEXTURE_DOWNSAMPLE: 2,
    DENSITY_DISSIPATION: 0.99,
    VELOCITY_DISSIPATION: 0.999,
    PRESSURE_DISSIPATION: 0.95,
    PRESSURE_ITERATIONS: 40,
    CURL: 40,
    SPLAT_RADIUS: 0.01,
    COLOR_SCALE: 0.15,
  };

  gl.clearColor(0, 0, 0, 0);

  const baseVertexShader = compileShader(gl, gl.VERTEX_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `);

  const clearShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
      gl_FragColor = value * texture2D(uTexture, vUv);
    }
  `);

  const displayShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
      vec3 color = texture2D(uTexture, vUv).rgb;
      float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
      gl_FragColor = vec4(color, alpha);
    }
  `);

  const splatShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
    }
  `);

  const advectionManualFilteringShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (in sampler2D sam, in vec2 p) {
      vec4 st;
      st.xy = floor(p - 0.5) + 0.5;
      st.zw = st.xy + 1.0;
      vec4 uv = st * texelSize.xyxy;
      vec4 a = texture2D(sam, uv.xy);
      vec4 b = texture2D(sam, uv.zy);
      vec4 c = texture2D(sam, uv.xw);
      vec4 d = texture2D(sam, uv.zw);
      vec2 f = p - st.xy;
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main () {
      vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
      gl_FragColor = dissipation * bilerp(uSource, coord);
      gl_FragColor.a = 1.0;
    }
  `);

  const advectionShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;

    void main () {
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      gl_FragColor = dissipation * texture2D(uSource, coord);
      gl_FragColor.a = 1.0;
    }
  `);

  const divergenceShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;

    vec2 sampleVelocity (in vec2 uv) {
      vec2 multiplier = vec2(1.0, 1.0);
      if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
      if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
      if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
      if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
      return multiplier * texture2D(uVelocity, uv).xy;
    }

    void main () {
      float L = sampleVelocity(vL).x;
      float R = sampleVelocity(vR).x;
      float T = sampleVelocity(vT).y;
      float B = sampleVelocity(vB).y;
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `);

  const curlShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
    }
  `);

  const vorticityShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = vec2(abs(T) - abs(B), 0.0);
      force *= 1.0 / length(force + 0.00001) * curl * C;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
  `);

  const pressureShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    vec2 boundary (in vec2 uv) {
      uv = min(max(uv, 0.0), 1.0);
      return uv;
    }

    void main () {
      float L = texture2D(uPressure, boundary(vL)).x;
      float R = texture2D(uPressure, boundary(vR)).x;
      float T = texture2D(uPressure, boundary(vT)).x;
      float B = texture2D(uPressure, boundary(vB)).x;
      float C = texture2D(uPressure, vUv).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `);

  const gradientSubtractShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    vec2 boundary (in vec2 uv) {
      uv = min(max(uv, 0.0), 1.0);
      return uv;
    }

    void main () {
      float L = texture2D(uPressure, boundary(vL)).x;
      float R = texture2D(uPressure, boundary(vR)).x;
      float T = texture2D(uPressure, boundary(vT)).x;
      float B = texture2D(uPressure, boundary(vB)).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `);

  const clearProgram = new GLProgram(gl, baseVertexShader, clearShader);
  const displayProgram = new GLProgram(gl, baseVertexShader, displayShader);
  const splatProgram = new GLProgram(gl, baseVertexShader, splatShader);
  const advectionProgram = new GLProgram(
    gl,
    baseVertexShader,
    ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader,
  );
  const divergenceProgram = new GLProgram(gl, baseVertexShader, divergenceShader);
  const curlProgram = new GLProgram(gl, baseVertexShader, curlShader);
  const vorticityProgram = new GLProgram(gl, baseVertexShader, vorticityShader);
  const pressureProgram = new GLProgram(gl, baseVertexShader, pressureShader);
  const gradientSubtractProgram = new GLProgram(gl, baseVertexShader, gradientSubtractShader);

  const blit = (() => {
    const buffer = gl.createBuffer();
    const elementBuffer = gl.createBuffer();
    if (!buffer || !elementBuffer) {
      throw new Error("Unable to create WebGL buffers.");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (destination: WebGLFramebuffer | null) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  })();

  let textureWidth = 0;
  let textureHeight = 0;
  let density: DoubleFBO;
  let velocity: DoubleFBO;
  let divergence: FBO;
  let curl: FBO;
  let pressure: DoubleFBO;

  const createFBO = (
    texId: number,
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): FBO => {
    gl.activeTexture(gl.TEXTURE0 + texId);
    const texture = gl.createTexture();
    if (!texture) throw new Error("Unable to create texture.");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("Unable to create framebuffer.");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return [texture, fbo, texId];
  };

  const createDoubleFBO = (
    texId: number,
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): DoubleFBO => {
    let fbo1 = createFBO(texId, width, height, internalFormat, format, type, param);
    let fbo2 = createFBO(texId + 1, width, height, internalFormat, format, type, param);
    return {
      get read() {
        return fbo1;
      },
      get write() {
        return fbo2;
      },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  };

  const initFramebuffers = () => {
    textureWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
    textureHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;

    density = createDoubleFBO(
      2,
      textureWidth,
      textureHeight,
      ext.formatRGBA.internalFormat,
      ext.formatRGBA.format,
      ext.halfFloatTexType,
      ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST,
    );
    velocity = createDoubleFBO(
      0,
      textureWidth,
      textureHeight,
      ext.formatRG.internalFormat,
      ext.formatRG.format,
      ext.halfFloatTexType,
      ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST,
    );
    divergence = createFBO(
      4,
      textureWidth,
      textureHeight,
      ext.formatR.internalFormat,
      ext.formatR.format,
      ext.halfFloatTexType,
      gl.NEAREST,
    );
    curl = createFBO(
      5,
      textureWidth,
      textureHeight,
      ext.formatR.internalFormat,
      ext.formatR.format,
      ext.halfFloatTexType,
      gl.NEAREST,
    );
    pressure = createDoubleFBO(
      6,
      textureWidth,
      textureHeight,
      ext.formatR.internalFormat,
      ext.formatR.format,
      ext.halfFloatTexType,
      gl.NEAREST,
    );
  };

  const pointer = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    down: false,
    moved: false,
    color: [...baseColor] as [number, number, number],
  };

  const updatePointerColor = () => {
    const jitter = (randomFloat() - 0.5) * colorJitter;
    pointer.color = [
      clamp(baseColor[0] + jitter, 0, 1),
      clamp(baseColor[1] + jitter, 0, 1),
      clamp(baseColor[2] + jitter, 0, 1),
    ];
  };

  const resize = (width: number, height: number, dpr = 1) => {
    const resolvedDpr = Math.min(dpr, 2);
    canvas.width = Math.max(1, Math.floor(width * resolvedDpr));
    canvas.height = Math.max(1, Math.floor(height * resolvedDpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    initFramebuffers();
  };

  const splat = (x: number, y: number, dx: number, dy: number) => {
    splatProgram.bind(gl);
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read[2]);
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1 - y / canvas.height);
    gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1);
    gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
    blit(velocity.write[1]);
    velocity.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, density.read[2]);
    gl.uniform3f(
      splatProgram.uniforms.color,
      pointer.color[0] * config.COLOR_SCALE,
      pointer.color[1] * config.COLOR_SCALE,
      pointer.color[2] * config.COLOR_SCALE,
    );
    blit(density.write[1]);
    density.swap();
  };

  let rafId: number | null = null;
  let lastTime = globalThis.performance?.now() ?? Date.now();
  let running = false;

  const update = (time: number) => {
    if (!running) return;

    const dt = Math.min((time - lastTime) / 1000, 0.016);
    lastTime = time;

    gl.viewport(0, 0, textureWidth, textureHeight);

    if (pointer.moved) {
      splat(pointer.x, pointer.y, pointer.dx, pointer.dy);
      pointer.moved = false;
    }

    advectionProgram.bind(gl);
    gl.uniform2f(advectionProgram.uniforms.texelSize, 1 / textureWidth, 1 / textureHeight);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read[2]);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write[1]);
    velocity.swap();

    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);
    gl.uniform1i(advectionProgram.uniforms.uSource, density.read[2]);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(density.write[1]);
    density.swap();

    curlProgram.bind(gl);
    gl.uniform2f(curlProgram.uniforms.texelSize, 1 / textureWidth, 1 / textureHeight);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read[2]);
    blit(curl[1]);

    vorticityProgram.bind(gl);
    gl.uniform2f(vorticityProgram.uniforms.texelSize, 1 / textureWidth, 1 / textureHeight);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read[2]);
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl[2]);
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write[1]);
    velocity.swap();

    divergenceProgram.bind(gl);
    gl.uniform2f(divergenceProgram.uniforms.texelSize, 1 / textureWidth, 1 / textureHeight);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read[2]);
    blit(divergence[1]);

    clearProgram.bind(gl);
    let pressureTexId = pressure.read[2];
    gl.activeTexture(gl.TEXTURE0 + pressureTexId);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
    gl.uniform1i(clearProgram.uniforms.uTexture, pressureTexId);
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
    blit(pressure.write[1]);
    pressure.swap();

    pressureProgram.bind(gl);
    gl.uniform2f(pressureProgram.uniforms.texelSize, 1 / textureWidth, 1 / textureHeight);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence[2]);
    pressureTexId = pressure.read[2];
    gl.uniform1i(pressureProgram.uniforms.uPressure, pressureTexId);
    gl.activeTexture(gl.TEXTURE0 + pressureTexId);
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i += 1) {
      gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
      blit(pressure.write[1]);
      pressure.swap();
    }

    gradientSubtractProgram.bind(gl);
    gl.uniform2f(
      gradientSubtractProgram.uniforms.texelSize,
      1 / textureWidth,
      1 / textureHeight,
    );
    gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read[2]);
    gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read[2]);
    blit(velocity.write[1]);
    velocity.swap();

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    displayProgram.bind(gl);
    gl.uniform1i(displayProgram.uniforms.uTexture, density.read[2]);
    blit(null);

    rafId = globalThis.requestAnimationFrame(update);
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTime = globalThis.performance?.now() ?? Date.now();
    rafId = globalThis.requestAnimationFrame(update);
  };

  const stop = () => {
    running = false;
    if (rafId !== null) {
      globalThis.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const setPointer = (x: number, y: number, dx: number, dy: number, down: boolean) => {
    pointer.x = x;
    pointer.y = y;
    pointer.dx = dx;
    pointer.dy = dy;
    pointer.down = down;
    pointer.moved = down;
    if (down) {
      updatePointerColor();
    }
  };

  const destroy = () => {
    stop();
    const loseContext = gl.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
  };

  initFramebuffers();

  return {
    start,
    stop,
    resize,
    setPointer,
    destroy,
  };
};
