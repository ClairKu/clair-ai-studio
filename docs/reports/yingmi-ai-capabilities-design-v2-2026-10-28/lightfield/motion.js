/* Lightfield material study: image-based refraction and light, no external runtime. */
(function () {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero#top');
  const stage = document.querySelector('.hero-art-motion');
  const poster = stage && stage.querySelector('img');
  if (!hero || !stage || !poster) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const css = document.createElement('style');
  css.textContent = `
    .hero-art-motion{position:relative}
    .hero-art-motion>canvas.lightfield-surface{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0;transition:opacity .65s ease}
    .hero-art-motion>img{transition:opacity .65s ease}
    html[data-motion="on"] .hero-art-motion[data-material="ready"]>canvas.lightfield-surface{opacity:1}
    html[data-motion="on"] .hero-art-motion[data-material="ready"]>img{opacity:0}
    .hero-art-motion[data-material="fallback"]>img{opacity:1!important;transition:none!important}
    .hero-art-motion[data-material="fallback"]>canvas{opacity:0!important;transition:none!important}
    html[data-motion="off"] .hero-art-motion>canvas.lightfield-surface{opacity:0;transition:none}
    html[data-motion="off"] .hero-art-motion>img{opacity:1;transition:none}
    @media(prefers-reduced-motion:reduce){.hero-art-motion>canvas.lightfield-surface{display:none!important}.hero-art-motion>img{opacity:1!important;transition:none!important}}
    @media print{.hero-art-motion>canvas.lightfield-surface{display:none!important}.hero-art-motion>img{opacity:1!important;transition:none!important}}
  `;
  document.head.appendChild(css);
  const canvas = document.createElement('canvas');
  canvas.className = 'lightfield-surface';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  stage.appendChild(canvas);
  let gl, program, texture, buffer, locations;
  let initialized = false, lost = false, failed = false, visible = true, printing = false;
  let raf = 0, lastPaint = 0, phase = 0, previousFrame = 0, frames = 0;
  let width = 0, height = 0, fitX = 1, fitY = 1;
  let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
  let heroRect = null;
  const vertex = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
  `;
  const fragment = `
    precision highp float;
    uniform sampler2D u_image;
    uniform vec2 u_fit;
    uniform vec2 u_texel;
    uniform vec2 u_pointer;
    uniform float u_time;
    varying vec2 v_uv;
    void main(){
      vec2 uv=(v_uv-.5)/u_fit+.5;
      if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.);return;}
      vec3 original=texture2D(u_image,uv).rgb;
      float high=max(max(original.r,original.g),original.b);
      float low=min(min(original.r,original.g),original.b);
      float cobalt=smoothstep(.04,.3,high-low)*smoothstep(.03,.35,original.b-original.r);
      float luma=dot(original,vec3(.2126,.7152,.0722));
      float material=max(cobalt,(1.-smoothstep(.72,.965,luma))*.7);
      float waveA=sin(uv.x*6.5+uv.y*3.0-u_time*.42);
      float waveB=sin(uv.y*8.2-uv.x*2.8+u_time*.31);
      vec2 shift=vec2(waveA*1.7,waveB*1.25)*u_texel*material;
      vec3 color=texture2D(u_image,clamp(uv+shift,vec2(.001),vec2(.999))).rgb;
      vec2 center=vec2(.55+sin(u_time*.16)*.2+u_pointer.x*.065,.56+cos(u_time*.13)*.16-u_pointer.y*.05);
      vec2 d=(uv-center)*vec2(1.25,.9);
      float light=exp(-dot(d,d)*13.0);
      float sheen=(.55+.45*sin(uv.x*4.8-uv.y*3.4+u_time*.36))*light;
      color+=vec3(.74,.87,1.)*sheen*material*.047;
      color=mix(color,color*vec3(.997,1.,1.004),cobalt*light*.35);
      float edgeX=smoothstep(0.,.025,uv.x)*(1.-smoothstep(.975,1.,uv.x));
      float edgeY=smoothstep(0.,.045,uv.y)*(1.-smoothstep(.955,1.,uv.y));
      float alpha=edgeX*edgeY;
      gl_FragColor=vec4(clamp(color,0.,1.)*alpha,alpha);
    }
  `;
  function setState(value) {
    if (stage.dataset.materialState !== value) stage.dataset.materialState = value;
  }
  function eligible() {
    return root.dataset.motion === 'on' && !reduced.matches && !document.hidden &&
      root.dataset.motionVisibility !== 'hidden' && visible &&
      root.dataset.heroActive !== 'false' && !printing && !lost && !failed;
  }
  function cancel() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    previousFrame = 0;
  }
  function fallback() {
    failed = true;
    cancel();
    stage.dataset.material = 'fallback';
    setState('fallback');
    canvas.hidden = true;
    if (gl && !lost) {
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    }
  }
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('Material shader unavailable');
    }
    return shader;
  }
  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    heroRect = hero.getBoundingClientRect();
    if (!width || !height || !poster.naturalWidth) return;
    const ratio = Math.min(window.devicePixelRatio || 1, fine.matches ? 1.5 : 1.25);
    const nextW = Math.max(1, Math.round(width * ratio));
    const nextH = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
    }
    const imageAspect = poster.naturalWidth / poster.naturalHeight;
    const stageAspect = width / height;
    fitX = stageAspect > imageAspect ? imageAspect / stageAspect : 1;
    fitY = stageAspect > imageAspect ? 1 : stageAspect / imageAspect;
    if (gl && initialized && !lost) gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function init() {
    if (initialized || failed || lost || !poster.complete || !poster.naturalWidth) return;
    try {
      gl = canvas.getContext('webgl', {
        alpha:true, premultipliedAlpha:true, antialias:false, depth:false, stencil:false,
        preserveDrawingBuffer:false, powerPreference:'low-power', failIfMajorPerformanceCaveat:true
      });
      if (!gl) return fallback();
      const vert = compile(gl.VERTEX_SHADER, vertex);
      const frag = compile(gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram();
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Material program unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      locations = {};
      for (const name of ['u_image','u_fit','u_texel','u_pointer','u_time']) locations[name] = gl.getUniformLocation(program, name);
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // Native image downsampling is smoother than one-level WebGL minification.
      // A power-of-two backing texture enables trilinear mipmaps in WebGL 1.
      const backing = document.createElement('canvas');
      const nextPower = n => Math.min(2048, Math.pow(2, Math.ceil(Math.log2(n))));
      backing.width = nextPower(poster.naturalWidth);
      backing.height = nextPower(poster.naturalHeight);
      const ctx = backing.getContext('2d', {alpha:false});
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(poster, 0, 0, backing.width, backing.height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backing);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        canvas.dataset.textureSampling = 'trilinear-mipmap';
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);
        canvas.dataset.textureSampling = 'bilinear-fallback';
      }
      gl.uniform1i(locations.u_image, 0);
      gl.uniform2f(locations.u_texel, 1 / poster.naturalWidth, 1 / poster.naturalHeight);
      gl.clearColor(0,0,0,0);
      initialized = true;
      resize();
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Material setup unavailable');
    } catch (_) { fallback(); }
  }
  function draw(now) {
    raf = 0;
    if (!eligible()) return update();
    const frameInterval = fine.matches ? 1000 / 30 : 1000 / 24;
    if (now - lastPaint < frameInterval) { raf = requestAnimationFrame(draw); return; }
    const delta = previousFrame ? Math.min((now - previousFrame) / 1000, .08) : 0;
    phase += delta;
    previousFrame = now;
    lastPaint = now;
    smoothX += (pointerX - smoothX) * .06;
    smoothY += (pointerY - smoothY) * .06;
    try {
      gl.useProgram(program);
      gl.uniform2f(locations.u_fit, fitX, fitY);
      gl.uniform2f(locations.u_pointer, smoothX, smoothY);
      gl.uniform1f(locations.u_time, phase);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!frames && gl.getError() !== gl.NO_ERROR) throw new Error('Material draw unavailable');
      frames++;
      if (stage.dataset.material !== 'ready') stage.dataset.material = 'ready';
      if (frames === 1 || frames % 45 === 0) canvas.dataset.renderedFrames = String(frames);
      setState('running');
    } catch (_) { return fallback(); }
    raf = requestAnimationFrame(draw);
  }
  function update() {
    if (!eligible()) {
      cancel();
      setState(failed ? 'fallback' : printing ? 'print' : reduced.matches ? 'reduced' :
        root.dataset.motion !== 'on' ? 'paused' : document.hidden ? 'hidden' : 'offscreen');
      return;
    }
    init();
    if (!initialized || failed) return;
    if (!raf) raf = requestAnimationFrame(draw);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize, {passive:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) heroRect = hero.getBoundingClientRect();
      update();
    }, {threshold:0}).observe(hero);
  }
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || !eligible() || !heroRect) return;
    pointerX = Math.max(-1, Math.min(1, (event.clientX - heroRect.left) / heroRect.width * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, (event.clientY - heroRect.top) / heroRect.height * 2 - 1));
  }, {passive:true});
  hero.addEventListener('pointerleave', () => {pointerX=0;pointerY=0;}, {passive:true});
  // Refresh the cached pointer geometry on scroll, never read layout in the render loop.
  let geometryFrame = 0;
  window.addEventListener('scroll', () => {
    if (!visible || !fine.matches || geometryFrame) return;
    geometryFrame = requestAnimationFrame(() => {geometryFrame=0;heroRect=hero.getBoundingClientRect();});
  }, {passive:true});
  new MutationObserver(update).observe(root, {attributes:true,attributeFilter:['data-motion','data-hero-active','data-motion-visibility']});
  window.addEventListener('lightfieldmotionchange', update);
  document.addEventListener('visibilitychange', update);
  if (reduced.addEventListener) reduced.addEventListener('change', update);
  else reduced.addListener(update);
  poster.addEventListener('load', () => {resize();update();}, {once:true});
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();lost=true;cancel();stage.dataset.material='fallback';setState('context-lost');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost=false;initialized=false;frames=0;stage.removeAttribute('data-material');update();
  });
  window.addEventListener('beforeprint', () => {printing=true;update();});
  window.addEventListener('afterprint', () => {printing=false;resize();update();});
  window.addEventListener('pagehide', cancel);
  window.addEventListener('pageshow', update);
  resize();
  update();
})();
