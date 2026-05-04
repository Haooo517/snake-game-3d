var VSHADER_SOURCE_ENVCUBE = `
  attribute vec4 a_Position;
  varying vec4 v_Position;
  void main() {
    v_Position = a_Position;
    gl_Position = a_Position;
  }
`;

var FSHADER_SOURCE_ENVCUBE = `
  precision mediump float;
  uniform samplerCube u_envCubeMap;
  uniform mat4 u_viewDirectionProjectionInverse;
  varying vec4 v_Position;
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_Position;
    gl_FragColor = textureCube(u_envCubeMap, normalize(t.xyz / t.w));
  }
`;

var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz;
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_ViewPosition;
    uniform vec3 u_LightPosition;
    uniform samplerCube u_envCubeMap;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
      vec3 normal = normalize(v_Normal);
      vec3 lightDir = normalize(u_LightPosition - v_PositionInWorld);
      vec3 viewDir = normalize(u_ViewPosition - v_PositionInWorld);
      vec3 ambient = vec3(0.2);
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = diff * vec3(1.5, 1.5, 1.5);
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
      vec3 specular = spec * vec3(1.5);
      vec3 lighting = ambient + diffuse + specular;

      float ratio = 1.00 / 1.1; //glass
      vec3 R = refract(-viewDir, normal, ratio);
      vec3 envColor = textureCube(u_envCubeMap, R).rgb;
      vec3 finalColor = lighting * envColor * 0.3;
      gl_FragColor = vec4(finalColor, 1.0);
    }
`;

var VSHADER_SOURCE_BORDER = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_modelMatrix;
  uniform mat4 u_normalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  attribute vec2 a_TexCoord;
  varying vec2 v_TexCoord;
  void main(){
      gl_Position = u_MvpMatrix * a_Position;
      v_PositionInWorld = vec3(u_modelMatrix * a_Position);
      v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
      v_TexCoord = a_TexCoord;
  }
`;

var FSHADER_SOURCE_BORDER = `
  precision mediump float;
  uniform vec3 u_ViewPosition;
  uniform samplerCube u_envCubeMap;
  uniform sampler2D u_NormalMap;
  uniform sampler2D u_ColorMap;
  uniform vec4 u_BaseColor;
  uniform float u_ReflectRatio;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  varying vec2 v_TexCoord;

  void main(){
    vec3 normal = texture2D(u_NormalMap, v_TexCoord).rgb;
    normal = normalize(normal * 2.0 - 1.0);

    vec3 V = normalize(u_ViewPosition - v_PositionInWorld);
    vec3 N = normalize(normal);
    vec3 R = reflect(-V, N);

    vec3 reflected = textureCube(u_envCubeMap, R).rgb;

    vec3 texColor = texture2D(u_ColorMap, v_TexCoord).rgb;
    vec3 base = texColor * u_BaseColor.rgb;

    vec3 color = mix(base, reflected, u_ReflectRatio);
    gl_FragColor = vec4(color, u_BaseColor.a);
  }
`;

var VSHADER_SOURCE_PLAIN = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_modelMatrix;
  uniform mat4 u_normalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main(){
      gl_Position = u_MvpMatrix * a_Position;
      v_PositionInWorld = vec3(u_modelMatrix * a_Position);
      v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
  }
`;

var FSHADER_SOURCE_PLAIN = `
  precision mediump float;
  uniform vec3 u_LightPosition;
  uniform vec3 u_ViewPosition;
  uniform samplerCube u_envCubeMap;
  uniform vec4 u_BaseColor;
  uniform float u_ReflectRatio;
  uniform float u_Emissive;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;

  void main(){
    vec3 N = normalize(v_Normal);
    vec3 L = normalize(u_LightPosition - v_PositionInWorld);
    vec3 V = normalize(u_ViewPosition - v_PositionInWorld);
    vec3 R = reflect(-V, N);

    float diff = max(dot(N, L), 0.0);
    vec3 reflectDir = reflect(-L, N);
    float spec = pow(max(dot(V, reflectDir), 0.0), 24.0);

    vec3 reflected = textureCube(u_envCubeMap, R).rgb;
    vec3 base = u_BaseColor.rgb;
    vec3 lit = base * (0.35 + 0.65 * diff) + vec3(spec) * 0.6;
    vec3 color = mix(lit, reflected, u_ReflectRatio);
    color = mix(color, base, u_Emissive);
    gl_FragColor = vec4(color, u_BaseColor.a);
  }
`;

var VSHADER_SOURCE_LIGHT = `
  attribute vec4 a_Position;
  uniform mat4 u_MvpMatrix;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
  }
`;

var FSHADER_SOURCE_LIGHT = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
  }
`;

function compileShader(gl, vShaderText, fShaderText){
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    gl.compileShader(vertexShader)

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader error');
        var message = gl.getShaderInfoLog(vertexShader);
        console.log(message);
    }
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader error');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

function initAttributeVariable(gl, a_attribute, buffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

// ============================================================
//  Globals
// ============================================================
var lightPosition = new Vector3([0, 7, 7]);
var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var nVertex;
var cameraX = 0, cameraY = 0, cameraZ = 0;
var radius = 10.0;
var cubeMapTex;
var normalMapTex;
var stoneColorTex;
var objComponents = [];
var quadObj;
var gridTileObj;
var rotateAngle = 0;
var borderTransforms = [];
var headObjComponents = [];
var bodyObjComponents = [];
var tailObjComponents = [];
var eyeObjComponents = [];
var gridTransforms = [];
var turnObjComponents = [];
var sphereObjComponents = [];   // for round food + particles
var appleObjComponents = [];    // legacy ref
var gridColors = [];

// snake
var snakePos = [ [0, 0], [0, 1], [0, 2] ];
var snakeSize = 0.5;
var snakeDirection = 270;
var headTransform = new Matrix4();
var tailTransform = new Matrix4();
var eyeLeftTransform = new Matrix4();
var eyeRightTransform = new Matrix4();
var segmentDraws = []; // ordered list: { transform, components, ratio }

// food
let applePos = [2, 0];
var appleAngle = 0;
var foodColor = [1.0, 0.0, 0.0, 1.0];
var selectedFoodModel = 'apple';

// bonus food
var bonusFood = null;       // { pos:[x,y], life, maxLife }
var bonusFoodCooldown = 0;  // frames since last bonus

// particles
var particles = [];

// game state
var gameStarted = false;
var gameStat = 'none';      // none | ingame | pause | lose
var gamePaused = false;
var gameLoopId = null;
var turned = false;
var score = 0;
var best = 0;
var isFirstPerson = false;
var difficulty = 'normal';
var soundEnabled = true;
var audioCtx = null;
var pauseTextTime = null;
var loseTimeoutId = null;

// shader programs (assigned in main)
var program, programEnvCube, programBorder, programPlain, programLight;

const gridSquareVertices = new Float32Array([
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0,
  -0.5,  0.5, 0.0,
  -0.5,  0.5, 0.0,
   0.5, -0.5, 0.0,
   0.5,  0.5, 0.0
]);

const gridSquareNormals = new Float32Array([
  0, 0, 1,  0, 0, 1,  0, 0, 1,
  0, 0, 1,  0, 0, 1,  0, 0, 1
]);

// ============================================================
//  Main
// ============================================================
async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    var quad = new Float32Array(
      [
        -1, -1, 1,
         1, -1, 1,
        -1,  1, 1,
        -1,  1, 1,
         1, -1, 1,
         1,  1, 1
      ]);

    programEnvCube = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);
    programEnvCube.a_Position = gl.getAttribLocation(programEnvCube, 'a_Position');
    programEnvCube.u_envCubeMap = gl.getUniformLocation(programEnvCube, 'u_envCubeMap');
    programEnvCube.u_viewDirectionProjectionInverse = gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse');

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_envCubeMap = gl.getUniformLocation(program, 'u_envCubeMap');

    programBorder = compileShader(gl, VSHADER_SOURCE_BORDER, FSHADER_SOURCE_BORDER);
    programBorder.a_Position = gl.getAttribLocation(programBorder, 'a_Position');
    programBorder.a_Normal = gl.getAttribLocation(programBorder, 'a_Normal');
    programBorder.a_TexCoord = gl.getAttribLocation(programBorder, 'a_TexCoord');
    programBorder.u_MvpMatrix = gl.getUniformLocation(programBorder, 'u_MvpMatrix');
    programBorder.u_modelMatrix = gl.getUniformLocation(programBorder, 'u_modelMatrix');
    programBorder.u_normalMatrix = gl.getUniformLocation(programBorder, 'u_normalMatrix');
    programBorder.u_ViewPosition = gl.getUniformLocation(programBorder, 'u_ViewPosition');
    programBorder.u_envCubeMap = gl.getUniformLocation(programBorder, 'u_envCubeMap');
    programBorder.u_NormalMap = gl.getUniformLocation(programBorder, 'u_NormalMap');
    programBorder.u_ColorMap = gl.getUniformLocation(programBorder, 'u_ColorMap');
    programBorder.u_BaseColor = gl.getUniformLocation(programBorder, 'u_BaseColor');
    programBorder.u_ReflectRatio = gl.getUniformLocation(programBorder, 'u_ReflectRatio');

    programPlain = compileShader(gl, VSHADER_SOURCE_PLAIN, FSHADER_SOURCE_PLAIN);
    programPlain.a_Position = gl.getAttribLocation(programPlain, 'a_Position');
    programPlain.a_Normal = gl.getAttribLocation(programPlain, 'a_Normal');
    programPlain.u_MvpMatrix = gl.getUniformLocation(programPlain, 'u_MvpMatrix');
    programPlain.u_modelMatrix = gl.getUniformLocation(programPlain, 'u_modelMatrix');
    programPlain.u_normalMatrix = gl.getUniformLocation(programPlain, 'u_normalMatrix');
    programPlain.u_ViewPosition = gl.getUniformLocation(programPlain, 'u_ViewPosition');
    programPlain.u_LightPosition = gl.getUniformLocation(programPlain, 'u_LightPosition');
    programPlain.u_envCubeMap = gl.getUniformLocation(programPlain, 'u_envCubeMap');
    programPlain.u_BaseColor = gl.getUniformLocation(programPlain, 'u_BaseColor');
    programPlain.u_ReflectRatio = gl.getUniformLocation(programPlain, 'u_ReflectRatio');
    programPlain.u_Emissive = gl.getUniformLocation(programPlain, 'u_Emissive');

    programLight = compileShader(gl, VSHADER_SOURCE_LIGHT, FSHADER_SOURCE_LIGHT);
    programLight.a_Position = gl.getAttribLocation(programLight, 'a_Position');
    programLight.u_MvpMatrix = gl.getUniformLocation(programLight, 'u_MvpMatrix');

    let response, text, obj;

    response = await fetch('cube.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      objComponents.push(initVertexBufferForLaterUse(gl,
        obj.geometries[i].data.position, obj.geometries[i].data.normal, obj.geometries[i].data.texcoord));
    }

    let borderOffset = 5;
    let cubeSize = 0.5;
    for(let i = -borderOffset; i <= borderOffset; i++){
      for(let j = -borderOffset; j <= borderOffset; j++){
        if(i === -borderOffset || i === borderOffset || j === -borderOffset || j === borderOffset){
          let model = new Matrix4().setTranslate(i, j, -1.5).scale(cubeSize, cubeSize, cubeSize);
          borderTransforms.push(model);
        }
      }
    }

    response = await fetch('head.obj');
    obj = parseOBJ(await response.text());
    for (let i = 0; i < obj.geometries.length; i++) {
      let o = initVertexBufferForLaterUse(gl,
        obj.geometries[i].data.position, obj.geometries[i].data.normal, obj.geometries[i].data.texcoord);
      headObjComponents.push(o);
      tailObjComponents.push(o);
    }

    response = await fetch('body.obj');
    obj = parseOBJ(await response.text());
    for (let i = 0; i < obj.geometries.length; i++) {
      bodyObjComponents.push(initVertexBufferForLaterUse(gl,
        obj.geometries[i].data.position, obj.geometries[i].data.normal, obj.geometries[i].data.texcoord));
    }

    response = await fetch('turn.obj');
    obj = parseOBJ(await response.text());
    for (let i = 0; i < obj.geometries.length; i++) {
      turnObjComponents.push(initVertexBufferForLaterUse(gl,
        obj.geometries[i].data.position, obj.geometries[i].data.normal, obj.geometries[i].data.texcoord));
    }

    response = await fetch('sphere.obj');
    obj = parseOBJ(await response.text());
    for (let i = 0; i < obj.geometries.length; i++) {
      let o = initVertexBufferForLaterUse(gl,
        obj.geometries[i].data.position, obj.geometries[i].data.normal, obj.geometries[i].data.texcoord);
      eyeObjComponents.push(o);
      sphereObjComponents.push(o);
    }

    // food still uses cube as fallback for apple-stem etc.
    appleObjComponents = objComponents;

    const gridTexCoords = new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]);
    gridTileObj = initVertexBufferForLaterUse(gl, gridSquareVertices, gridSquareNormals, gridTexCoords);

    let gridSize = 9;
    let spacing = 1.0;
    let zPos = -1.5;
    let offset = -(gridSize - 1) / 2;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        let tx = (x + offset) * spacing;
        let ty = (y + offset) * spacing;
        let transform = new Matrix4().setTranslate(tx, ty, zPos).scale(0.95, 0.95, 0.1);
        gridTransforms.push(transform);
        let isWhite = (x + y) % 2 == 0;
        gridColors.push(isWhite ? [1.0, 1.0, 1.0, 0.6] : [0.7, 0.7, 0.7, 0.6]);
      }
    }

    cubeMapTex = initCubeTexture("px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png", 8192, 8192);
    quadObj = initVertexBufferForLaterUse(gl, quad);

    normalMapTex = gl.createTexture();
    var normalImage = new Image();
    normalImage.onload = function(){
      gl.bindTexture(gl.TEXTURE_2D, normalMapTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, normalImage);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    normalImage.src = "normalMap.jpg";

    stoneColorTex = gl.createTexture();
    var stoneColorImg = new Image();
    stoneColorImg.onload = function(){
      gl.bindTexture(gl.TEXTURE_2D, stoneColorTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, stoneColorImg);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    stoneColorImg.src = "colorMap.jpg";

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    updateSnakeTransforms();
    setOverlay('start', '3D SNAKE', 'Press <b>ENTER</b> to start');
    document.getElementById('gamePrompt').innerHTML = 'Ready when you are.';
    draw();

    canvas.onmousedown = function(ev){ if (!isFirstPerson) mouseDown(ev); };
    canvas.onmousemove = function(ev){ if (!isFirstPerson) mouseMove(ev); };
    canvas.onmouseup   = function(ev){ if (!isFirstPerson) mouseUp(ev); };
    document.onkeydown = function(ev){ keydown(ev); };

    document.getElementById('foodSelector').addEventListener('change', (e) => {
      if (e.target.name === 'foodModel') {
        selectedFoodModel = e.target.value;
        updateFoodColor();
        draw();
      }
    });

    document.querySelectorAll('input[name="difficulty"]').forEach(r => {
      r.addEventListener('change', e => {
        if (gameStat === 'ingame' || gameStat === 'pause') {
          // revert if game running
          document.querySelector(`input[name="difficulty"][value="${difficulty}"]`).checked = true;
          return;
        }
        difficulty = e.target.value;
      });
    });

    document.getElementById('soundBtn').addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      document.getElementById('soundBtn').textContent = soundEnabled ? '🔊 ON' : '🔇 OFF';
      if (soundEnabled) ensureAudio();
    });

    var tick = function () {
      rotateAngle += 0.25;
      appleAngle += 1;
      updateParticles();
      updateBonusFood();
      draw();
      requestAnimationFrame(tick);
    };
    tick();
}

// ============================================================
//  Audio (Web Audio API — synthesized, no asset files)
// ============================================================
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { console.warn('Web Audio not supported'); }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type='sine', vol=0.18, slideTo=null) {
  if (!soundEnabled || !audioCtx) return;
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playEatSound() {
  playTone(523.25, 0.07, 'triangle');           // C5
  setTimeout(() => playTone(783.99, 0.10, 'triangle'), 60); // G5
}
function playGameOverSound() {
  playTone(330, 0.18, 'sawtooth', 0.18);
  setTimeout(() => playTone(247, 0.18, 'sawtooth', 0.18), 180);
  setTimeout(() => playTone(165, 0.35, 'sawtooth', 0.18, 80), 360);
}
function playStartSound() {
  playTone(440, 0.08, 'square', 0.12);
  setTimeout(() => playTone(660, 0.08, 'square', 0.12), 80);
  setTimeout(() => playTone(880, 0.14, 'square', 0.12), 160);
}
function playPauseSound() { playTone(220, 0.12, 'square', 0.15, 110); }
function playResumeSound(){ playTone(220, 0.12, 'square', 0.15, 440); }
function playTurnSound() { playTone(900, 0.025, 'square', 0.06); }
function playBonusSound() {
  playTone(880, 0.08, 'triangle', 0.15);
  setTimeout(() => playTone(1175, 0.08, 'triangle', 0.15), 80);
  setTimeout(() => playTone(1568, 0.16, 'triangle', 0.18), 160);
}
function playUnlockSound() {
  playTone(523, 0.06, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.06, 'sine', 0.12), 70);
  setTimeout(() => playTone(784, 0.12, 'sine', 0.14), 140);
}

// ============================================================
//  Overlay
// ============================================================
function setOverlay(state, title, subtitle, hint) {
  const el = document.getElementById('overlay');
  if (!el) return;
  el.classList.remove('hidden');
  el.className = 'state-' + state;  // start | pause | lose
  document.getElementById('overlayTitle').innerHTML = title;
  document.getElementById('overlaySubtitle').innerHTML = subtitle || '';
  document.getElementById('overlayHint').innerHTML = hint || 'Arrow Keys to control · R to switch view · P to pause';
  if (state === 'start' || state === 'lose') {
    document.getElementById('overlayTitle').classList.add('pulse');
  } else {
    document.getElementById('overlayTitle').classList.remove('pulse');
  }
}
function hideOverlay() {
  const el = document.getElementById('overlay');
  if (el) el.classList.add('hidden');
}

// ============================================================
//  Snake transforms
// ============================================================
function updateFoodColor() {
  switch(selectedFoodModel) {
    case 'apple':  foodColor = [1.0, 0.10, 0.10, 1.0]; break;
    case 'orange': foodColor = [1.0, 0.55, 0.10, 1.0]; break;
    case 'grape':  foodColor = [0.55, 0.20, 0.75, 1.0]; break;
    case 'lemon':  foodColor = [1.0, 0.95, 0.15, 1.0]; break;
    case 'melon':  foodColor = [0.45, 0.85, 0.40, 1.0]; break;
    case 'peach':  foodColor = [1.0, 0.65, 0.65, 1.0]; break;
    default:       foodColor = [1.0, 0.10, 0.10, 1.0];
  }
}

function updateSnakeTransforms() {
  let head = snakePos[0];
  let tail = snakePos[snakePos.length - 1];

  headTransform = new Matrix4()
    .setTranslate(head[0], head[1], -1.5)
    .rotate(snakeDirection - 180, 0, 0, 1)
    .scale(snakeSize, snakeSize, snakeSize);

  segmentDraws = [];
  let total = snakePos.length;
  // head segment first (ratio 0)
  segmentDraws.push({ transform: headTransform, components: headObjComponents, ratio: 0 });

  for (let i = 1; i < snakePos.length - 1; i++) {
    let [prevX, prevY] = snakePos[i - 1];
    let [currX, currY] = snakePos[i];
    let [nextX, nextY] = snakePos[i + 1];

    let dx1 = currX - prevX;
    let dy1 = currY - prevY;
    let dx2 = nextX - currX;
    let dy2 = nextY - currY;

    let isTurn = (dx1 !== dx2 || dy1 !== dy2);
    let transform;
    let components;

    if (isTurn) {
      if ((dx1 === 1 && dy2 === 1)|| (dy1 === -1 && dx2 === -1)) {
        transform = new Matrix4().setTranslate(currX, currY, -1.5).rotate(90, 0, 0, 1).rotate(90, 1, 0, 0);
      } else if ((dx1 === 1 && dy2 === -1) || (dy1 === 1 && dx2 === -1)) {
        transform = new Matrix4().setTranslate(currX, currY, -1.5).rotate(180, 0, 0, 1).rotate(90, 1, 0, 0);
      } else if ((dx1 === -1 && dy2 === -1) || (dy1 === 1 && dx2 === 1) ) {
        transform = new Matrix4().setTranslate(currX, currY, -1.5).rotate(270, 0, 0, 1).rotate(90, 1, 0, 0);
      } else {
        transform = new Matrix4().setTranslate(currX, currY, -1.5).rotate(0, 0, 0, 1).rotate(90, 1, 0, 0);
      }
      transform.scale(snakeSize, snakeSize, snakeSize);
      components = turnObjComponents;
    } else {
      let direction = (dx1 === 0 && dy1 === 1) ? 90 :
                      (dx1 === 0 && dy1 === -1) ? 270 :
                      (dx1 === 1 && dy1 === 0) ? 0 : 180;
      transform = new Matrix4()
        .setTranslate(currX, currY, -1.5)
        .rotate(direction, 0, 0, 1)
        .scale(snakeSize, snakeSize, snakeSize);
      components = bodyObjComponents;
    }
    segmentDraws.push({ transform, components, ratio: i / Math.max(1, total - 1) });
  }

  let tailDirection = 0;
  if (snakePos.length >= 2) {
    let [prevX, prevY] = snakePos[snakePos.length - 2];
    let [tailX, tailY] = tail;
    let dx = tailX - prevX;
    let dy = tailY - prevY;
    if (dx === 1) tailDirection = 180;
    else if (dx === -1) tailDirection = 0;
    else if (dy === 1) tailDirection = 270;
    else if (dy === -1) tailDirection = 90;
  }
  tailTransform = new Matrix4()
    .setTranslate(tail[0], tail[1], -1.5)
    .rotate(tailDirection, 0, 0, 1)
    .scale(snakeSize, snakeSize, snakeSize);
  segmentDraws.push({ transform: tailTransform, components: tailObjComponents, ratio: 1 });

  eyeLeftTransform = new Matrix4(headTransform)
    .multiply(new Matrix4().setTranslate(0, -0.5, 1).scale(0.4, 0.4, 0.4));
  eyeRightTransform = new Matrix4(headTransform)
    .multiply(new Matrix4().setTranslate(0, 0.5, 1).scale(0.4, 0.4, 0.4));
}

// gradient color from head (bright green) to tail (dark teal)
function snakeColorAt(ratio) {
  let r = 0.10 + 0.05 * ratio;
  let g = 0.85 - 0.45 * ratio;
  let b = 0.15 + 0.40 * ratio;
  return [r, g, b, 1.0];
}

// ============================================================
//  Particles & bonus food
// ============================================================
function spawnParticles(x, y, z, color, count=18, speedScale=1.0) {
  for (let i = 0; i < count; i++) {
    let theta = Math.random() * 2 * Math.PI;
    let phi = Math.acos(2 * Math.random() - 1);
    let s = (0.04 + Math.random() * 0.06) * speedScale;
    particles.push({
      x, y, z,
      vx: s * Math.sin(phi) * Math.cos(theta),
      vy: s * Math.sin(phi) * Math.sin(theta),
      vz: s * Math.cos(phi) * 0.5 + 0.06,
      life: 0,
      maxLife: 35 + Math.random() * 25,
      color: color.slice(),
      size: 0.06 + Math.random() * 0.04
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;
    p.vz -= 0.004; // gravity
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life++;
    return p.life < p.maxLife;
  });
}

function updateBonusFood() {
  if (gameStat !== 'ingame') return;
  bonusFoodCooldown++;
  if (!bonusFood && bonusFoodCooldown > 360 && Math.random() < 0.005) {
    let pos;
    let attempts = 0;
    do {
      pos = [Math.floor(Math.random() * 9) - 4, Math.floor(Math.random() * 9) - 4];
      attempts++;
      if (attempts > 50) return;
    } while (snakePos.some(p => p[0] === pos[0] && p[1] === pos[1]) ||
             (pos[0] === applePos[0] && pos[1] === applePos[1]));
    bonusFood = { pos, life: 0, maxLife: 540 }; // ~9s @ 60fps
    bonusFoodCooldown = 0;
    playUnlockSound();
  }
  if (bonusFood) {
    bonusFood.life++;
    if (bonusFood.life >= bonusFood.maxLife) {
      bonusFood = null;
    }
  }
}

// ============================================================
//  Drawing
// ============================================================
function draw(){
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.05, 0.05, 0.1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 30);

  if (isFirstPerson) {
    let head = snakePos[0];
    let offsetHeight = 0.8;
    let offsetBack = 0.3;
    let dirRad = snakeDirection * Math.PI / 180;
    let dirVec = [Math.cos(dirRad), Math.sin(dirRad)];
    cameraX = head[0] - dirVec[0] * offsetBack;
    cameraY = head[1] - dirVec[1] * offsetBack;
    cameraZ = offsetHeight;
    let lookAtX = head[0] + dirVec[0];
    let lookAtY = head[1] + dirVec[1];
    let lookAtZ = 0;
    viewMatrix.setLookAt(cameraX, cameraY, cameraZ, lookAtX, lookAtY, lookAtZ, 0, 0, 1);
  } else {
    var radX = angleX * Math.PI / 180;
    var radY = angleY * Math.PI / 180;
    if (radY > Math.PI / 2) radY = Math.PI / 2;
    if (radY < -Math.PI / 2) radY = -Math.PI / 2;
    cameraX = radius * Math.cos(radY) * Math.sin(radX);
    cameraY = radius * Math.sin(radY);
    cameraZ = radius * Math.cos(radY) * Math.cos(radX);
    viewMatrix.setLookAt(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
  }

  // light cube indicator
  let lightModelMatrix = new Matrix4()
    .setTranslate(lightPosition.elements[0], lightPosition.elements[1], lightPosition.elements[2])
    .scale(0.1, 0.1, 0.1);
  let lightMvpMatrix = new Matrix4(projMatrix).multiply(viewMatrix).multiply(lightModelMatrix);
  gl.useProgram(programLight);
  gl.uniformMatrix4fv(programLight.u_MvpMatrix, false, lightMvpMatrix.elements);
  initAttributeVariable(gl, programLight.a_Position, objComponents[0].vertexBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, objComponents[0].numVertices);

  // skybox
  var viewMatrixRotationOnly = new Matrix4();
  viewMatrixRotationOnly.set(viewMatrix);
  viewMatrixRotationOnly.elements[12] = 0;
  viewMatrixRotationOnly.elements[13] = 0;
  viewMatrixRotationOnly.elements[14] = 0;
  var vpFromCameraRotationOnly = new Matrix4();
  vpFromCameraRotationOnly.set(projMatrix).multiply(viewMatrixRotationOnly);
  var vpFromCameraInverse = vpFromCameraRotationOnly.invert();

  gl.useProgram(programEnvCube);
  gl.depthFunc(gl.LEQUAL);
  gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, false, vpFromCameraInverse.elements);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniform1i(programEnvCube.u_envCubeMap, 0);
  initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);

  // border
  var borderColor = [1.0, 0.5, 0.0, 1.0];
  if (gameStat === 'ingame') borderColor = [0.0, 0.8, 0.2, 1.0];
  else if (gameStat === 'lose') borderColor = [0.85, 0.15, 0.15, 1.0];
  else if (gameStat === 'pause') borderColor = [1.0, 0.85, 0.0, 1.0];

  gl.useProgram(programBorder);
  gl.depthFunc(gl.LESS);
  gl.uniform3f(programBorder.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1i(programBorder.u_envCubeMap, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, normalMapTex);
  gl.uniform1i(programBorder.u_NormalMap, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, stoneColorTex);
  gl.uniform1i(programBorder.u_ColorMap, 2);
  gl.uniform4f(programBorder.u_BaseColor, borderColor[0], borderColor[1], borderColor[2], borderColor[3]);
  gl.uniform1f(programBorder.u_ReflectRatio, 0.1);

  for (let i = 0; i < borderTransforms.length; i++) {
    let mm = new Matrix4(borderTransforms[i]);
    let mvp = new Matrix4(projMatrix).multiply(viewMatrix).multiply(mm);
    let nm = new Matrix4().setInverseOf(mm).transpose();
    gl.uniformMatrix4fv(programBorder.u_MvpMatrix, false, mvp.elements);
    gl.uniformMatrix4fv(programBorder.u_modelMatrix, false, mm.elements);
    gl.uniformMatrix4fv(programBorder.u_normalMatrix, false, nm.elements);
    initAttributeVariable(gl, programBorder.a_Position, objComponents[0].vertexBuffer);
    initAttributeVariable(gl, programBorder.a_Normal, objComponents[0].normalBuffer);
    initAttributeVariable(gl, programBorder.a_TexCoord, objComponents[0].texCoordBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, objComponents[0].numVertices);
  }

  // ground tiles
  for (let i = 0; i < gridTransforms.length; i++) {
    let mm = new Matrix4(gridTransforms[i]);
    let mvp = new Matrix4(projMatrix).multiply(viewMatrix).multiply(mm);
    let nm = new Matrix4().setInverseOf(mm).transpose();

    gl.useProgram(programPlain);
    gl.uniformMatrix4fv(programPlain.u_MvpMatrix, false, mvp.elements);
    gl.uniformMatrix4fv(programPlain.u_modelMatrix, false, mm.elements);
    gl.uniformMatrix4fv(programPlain.u_normalMatrix, false, nm.elements);
    gl.uniform3f(programPlain.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform3fv(programPlain.u_LightPosition, lightPosition.elements);
    gl.uniform1i(programPlain.u_envCubeMap, 0);
    gl.uniform1f(programPlain.u_ReflectRatio, 0.1);
    gl.uniform1f(programPlain.u_Emissive, 0.0);
    let color = gridColors[i];
    gl.uniform4f(programPlain.u_BaseColor, color[0], color[1], color[2], color[3]);
    initAttributeVariable(gl, programPlain.a_Position, gridTileObj.vertexBuffer);
    initAttributeVariable(gl, programPlain.a_Normal, gridTileObj.normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, gridTileObj.numVertices);
  }

  // helper: draw any obj with arbitrary transform/color
  function drawObj(transform, components, color, reflect=0.4, emissive=0.0) {
    gl.useProgram(programPlain);
    gl.uniform3f(programPlain.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform3fv(programPlain.u_LightPosition, lightPosition.elements);
    gl.uniform4f(programPlain.u_BaseColor, color[0], color[1], color[2], color[3]);
    gl.uniform1f(programPlain.u_ReflectRatio, reflect);
    gl.uniform1f(programPlain.u_Emissive, emissive);

    let mm = new Matrix4(transform);
    let mvp = new Matrix4(projMatrix).multiply(viewMatrix).multiply(mm);
    let nm = new Matrix4().setInverseOf(mm).transpose();
    gl.uniformMatrix4fv(programPlain.u_MvpMatrix, false, mvp.elements);
    gl.uniformMatrix4fv(programPlain.u_modelMatrix, false, mm.elements);
    gl.uniformMatrix4fv(programPlain.u_normalMatrix, false, nm.elements);

    for (let i = 0; i < components.length; i++) {
      initAttributeVariable(gl, programPlain.a_Position, components[i].vertexBuffer);
      initAttributeVariable(gl, programPlain.a_Normal, components[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, components[i].numVertices);
    }
  }

  // snake (gradient)
  for (let i = 0; i < segmentDraws.length; i++) {
    let s = segmentDraws[i];
    drawObj(s.transform, s.components, snakeColorAt(s.ratio), 0.35);
  }

  // eyes (skip in 1st person — they'd block the camera)
  if (!isFirstPerson) {
    drawObj(eyeLeftTransform, eyeObjComponents, [0.05, 0.05, 0.05, 1], 0.2);
    drawObj(eyeRightTransform, eyeObjComponents, [0.05, 0.05, 0.05, 1], 0.2);
  }

  // food
  drawFood(applePos[0], applePos[1], -1.5, appleAngle, selectedFoodModel, foodColor, drawObj);

  // bonus food (golden, pulses + glows)
  if (bonusFood) {
    let pulse = 0.85 + 0.15 * Math.sin(bonusFood.life * 0.18);
    let almostGone = bonusFood.life > bonusFood.maxLife - 120;
    let blink = almostGone ? (Math.floor(bonusFood.life / 6) % 2) : 1;
    if (blink) {
      let bonusTransform = new Matrix4()
        .setTranslate(bonusFood.pos[0], bonusFood.pos[1], -1.4 + 0.06 * Math.sin(bonusFood.life * 0.08))
        .rotate(bonusFood.life * 2, 0, 1, 0)
        .scale(0.32 * pulse, 0.32 * pulse, 0.32 * pulse);
      drawObj(bonusTransform, sphereObjComponents, [1.0, 0.85, 0.1, 1.0], 0.55, 0.25);

      // a faint floating star ring (small cubes orbit)
      for (let k = 0; k < 4; k++) {
        let a = bonusFood.life * 0.12 + k * Math.PI / 2;
        let rx = bonusFood.pos[0] + Math.cos(a) * 0.45;
        let ry = bonusFood.pos[1] + Math.sin(a) * 0.45;
        let rz = -1.35 + Math.sin(bonusFood.life * 0.1 + k) * 0.06;
        let t = new Matrix4().setTranslate(rx, ry, rz).scale(0.05, 0.05, 0.05);
        drawObj(t, objComponents, [1.0, 0.95, 0.5, 1.0], 0.0, 0.6);
      }
    }
  }

  // particles
  for (let p of particles) {
    let alpha = 1 - (p.life / p.maxLife);
    let scale = p.size * (1 - p.life / p.maxLife * 0.4);
    let t = new Matrix4().setTranslate(p.x, p.y, p.z).scale(scale, scale, scale);
    drawObj(t, sphereObjComponents, [p.color[0], p.color[1], p.color[2], alpha], 0.2, 0.4);
  }

  // HUD
  document.getElementById('score').innerHTML = score;
  document.getElementById('best').innerHTML = best;
  unlockFoodOptions();
}

function unlockFoodOptions() {
  const tiers = [['orange',5], ['grape',10], ['lemon',20], ['melon',30], ['peach',50]];
  for (const [name, threshold] of tiers) {
    const el = document.querySelector(`input[name="foodModel"][value="${name}"]`);
    if (el && el.disabled && score >= threshold) {
      el.disabled = false;
      playUnlockSound();
    }
  }
}

// ============================================================
//  Food shapes (each fruit has its own visual)
// ============================================================
function drawFood(cx, cy, cz, angle, type, color, draw) {
  const bob = Math.sin(angle * 0.05) * 0.05;

  if (type === 'apple') {
    // red sphere body + small green stem on top
    let body = new Matrix4().setTranslate(cx, cy, cz + bob).rotate(angle, 0, 1, 0).scale(0.27, 0.27, 0.27);
    draw(body, sphereObjComponents, color, 0.5);
    let stem = new Matrix4().setTranslate(cx, cy, cz + 0.32 + bob).rotate(angle, 0, 1, 0).scale(0.04, 0.04, 0.12);
    draw(stem, objComponents, [0.35, 0.6, 0.2, 1.0], 0.05);
    let leaf = new Matrix4().setTranslate(cx + 0.08, cy, cz + 0.36 + bob).rotate(angle, 0, 1, 0).rotate(35, 0, 0, 1).scale(0.08, 0.04, 0.02);
    draw(leaf, objComponents, [0.4, 0.75, 0.3, 1.0], 0.1);
  } else if (type === 'orange') {
    let body = new Matrix4().setTranslate(cx, cy, cz + bob).rotate(angle, 0, 1, 0).scale(0.30, 0.30, 0.30);
    draw(body, sphereObjComponents, color, 0.35);
    let leaf = new Matrix4().setTranslate(cx, cy, cz + 0.34 + bob).rotate(angle, 0, 1, 0).scale(0.10, 0.05, 0.03);
    draw(leaf, objComponents, [0.3, 0.65, 0.2, 1.0], 0.1);
  } else if (type === 'grape') {
    // cluster of small purple spheres
    const cluster = [
      [ 0.00,  0.00,  0.10, 0.13],
      [ 0.13,  0.05, -0.02, 0.12],
      [-0.13,  0.05, -0.02, 0.12],
      [ 0.00,  0.13, -0.05, 0.12],
      [ 0.00, -0.13, -0.05, 0.12],
      [ 0.07,  0.00, -0.15, 0.10],
      [-0.07,  0.00, -0.15, 0.10],
    ];
    for (const [dx, dy, dz, s] of cluster) {
      let m = new Matrix4().setTranslate(cx + dx, cy + dy, cz + dz + bob)
                .rotate(angle, 0, 1, 0).scale(s, s, s);
      draw(m, sphereObjComponents, color, 0.4);
    }
    let stem = new Matrix4().setTranslate(cx, cy, cz + 0.30 + bob).scale(0.04, 0.04, 0.08);
    draw(stem, objComponents, [0.3, 0.55, 0.2, 1.0], 0.05);
  } else if (type === 'lemon') {
    // ellipsoid (stretched along x), rotates
    let body = new Matrix4().setTranslate(cx, cy, cz + bob).rotate(angle, 0, 0, 1).scale(0.36, 0.20, 0.20);
    draw(body, sphereObjComponents, color, 0.35);
  } else if (type === 'melon') {
    // big green sphere with subtle stripes (just a slightly translucent thin cube ring)
    let body = new Matrix4().setTranslate(cx, cy, cz + bob).rotate(angle, 0, 1, 0).scale(0.36, 0.36, 0.36);
    draw(body, sphereObjComponents, color, 0.35);
    // dark stripes by drawing thin elongated cubes wrapped on top
    for (let k = 0; k < 4; k++) {
      let stripeAngle = angle + k * 90;
      let s = new Matrix4().setTranslate(cx, cy, cz + bob)
                .rotate(stripeAngle, 0, 0, 1).scale(0.02, 0.36, 0.36);
      draw(s, objComponents, [0.15, 0.45, 0.20, 1.0], 0.05);
    }
  } else if (type === 'peach') {
    // pink double-sphere (cleft)
    let left = new Matrix4().setTranslate(cx - 0.07, cy, cz + bob).rotate(angle, 0, 1, 0).scale(0.22, 0.22, 0.22);
    draw(left, sphereObjComponents, color, 0.4);
    let right = new Matrix4().setTranslate(cx + 0.07, cy, cz + bob).rotate(angle, 0, 1, 0).scale(0.22, 0.22, 0.22);
    draw(right, sphereObjComponents, color, 0.4);
    let leaf = new Matrix4().setTranslate(cx, cy, cz + 0.28 + bob).rotate(angle, 0, 1, 0).scale(0.08, 0.04, 0.02);
    draw(leaf, objComponents, [0.4, 0.7, 0.3, 1.0], 0.1);
  } else {
    // fallback cube
    let body = new Matrix4().setTranslate(cx, cy, cz + bob).rotate(angle, 0, 1, 0).scale(0.22, 0.22, 0.22);
    draw(body, objComponents, color, 0.4);
  }
}

// ============================================================
//  parseOBJ (unchanged)
// ============================================================
function parseOBJ(text) {
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  const objVertexData = [objPositions, objTexcoords, objNormals];
  let webglVertexData = [[], [], []];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    if (geometry && geometry.data.position.length) geometry = undefined;
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [position, texcoord, normal];
      geometry = {
        object, groups, material,
        data: { position, texcoord, normal },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) return;
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) { objPositions.push(parts.map(parseFloat)); },
    vn(parts) { objNormals.push(parts.map(parseFloat)); },
    vt(parts) { objTexcoords.push(parts.map(parseFloat)); },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,
    mtllib(parts, unparsedArgs) { materialLibs.push(unparsedArgs); },
    usemtl(parts, unparsedArgs) { material = unparsedArgs; newGeometry(); },
    g(parts) { groups = parts; newGeometry(); },
    o(parts, unparsedArgs) { object = unparsedArgs; newGeometry(); },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) continue;
    const m = keywordRE.exec(line);
    if (!m) continue;
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return { geometries, materialLibs };
}

// ============================================================
//  Mouse
// ============================================================
function mouseDown(ev){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}
function mouseUp(ev){ mouseDragging = false; }
function mouseMove(ev){
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height;
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);
        angleX += dx;
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;
}

function initCubeTexture(posXName, negXName, posYName, negYName, posZName, negZName, imgWidth, imgHeight) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, fName: posXName },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, fName: negXName },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, fName: posYName },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, fName: negYName },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, fName: posZName },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, fName: negZName },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, fName} = faceInfo;
    gl.texImage2D(target, 0, gl.RGBA, imgWidth, imgHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    var image = new Image();
    image.onload = function(){
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    };
    image.src = fName;
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  return texture;
}

// ============================================================
//  Game loop
// ============================================================
function getStepDelay() {
  let base, accel, floor;
  if (difficulty === 'easy')      { base = 700; accel = 3; floor = 200; }
  else if (difficulty === 'hard') { base = 280; accel = 6; floor = 90;  }
  else                            { base = 500; accel = 5; floor = 140; }
  return Math.max(floor, base - score * accel);
}

function startGame() {
  if (gameLoopId !== null) return;
  const step = () => {
    if (gameStat !== 'ingame') { gameLoopId = null; return; }
    if (gamePaused) { gameLoopId = setTimeout(step, 100); return; }

    let [headX, headY] = snakePos[0];
    let newHead;
    let dir = ((snakeDirection % 360) + 360) % 360;
    if (dir === 0) newHead = [headX + 1, headY];
    else if (dir === 90) newHead = [headX, headY + 1];
    else if (dir === 180) newHead = [headX - 1, headY];
    else if (dir === 270) newHead = [headX, headY - 1];
    turned = false;

    // wall hit
    if (newHead[0] < -4 || newHead[0] > 4 || newHead[1] < -4 || newHead[1] > 4) {
      return endGame('wall');
    }
    // self hit
    if (snakePos.some((pos, i) => i !== snakePos.length - 1 && pos[0] === newHead[0] && pos[1] === newHead[1])) {
      return endGame('self');
    }

    snakePos.unshift(newHead);

    let ate = false;
    // bonus food
    if (bonusFood && newHead[0] === bonusFood.pos[0] && newHead[1] === bonusFood.pos[1]) {
      score += 5;
      spawnParticles(bonusFood.pos[0], bonusFood.pos[1], -1.4, [1.0, 0.85, 0.1, 1.0], 30, 1.4);
      playBonusSound();
      bonusFood = null;
      ate = true;
    }
    // regular food
    else if (newHead[0] === applePos[0] && newHead[1] === applePos[1]) {
      score += 1;
      spawnParticles(applePos[0], applePos[1], -1.4, foodColor, 18, 1.0);
      playEatSound();
      // respawn apple
      let attempts = 0;
      do {
        applePos = [Math.floor(Math.random() * 9 - 4), Math.floor(Math.random() * 9 - 4)];
        attempts++;
      } while ((snakePos.some(p => p[0] === applePos[0] && p[1] === applePos[1]) ||
                (bonusFood && applePos[0] === bonusFood.pos[0] && applePos[1] === bonusFood.pos[1])) && attempts < 100);
      ate = true;
    }
    if (!ate) snakePos.pop();

    updateSnakeTransforms();
    gameLoopId = setTimeout(step, getStepDelay());
  };
  gameLoopId = setTimeout(step, getStepDelay());
}

function endGame(reason) {
  if (gameLoopId) { clearTimeout(gameLoopId); gameLoopId = null; }
  if (score > best) best = score;
  gameStat = 'lose';
  playGameOverSound();

  // big death burst
  let head = snakePos[0];
  spawnParticles(head[0], head[1], -1.3, [1.0, 0.3, 0.3, 1.0], 40, 1.5);

  setOverlay('lose', '💀 GAME OVER',
    `Score: <span style="color:#d4ff77;">${score}</span> &nbsp;·&nbsp; Best: <span style="color:#ffb74d;">${best}</span>`,
    'Press <b>ENTER</b> to play again');
  document.getElementById('gamePrompt').innerHTML = '';

  // clear pause text scheduling so it doesn't override
  if (pauseTextTime) { clearTimeout(pauseTextTime); pauseTextTime = null; }

  loseTimeoutId = setTimeout(() => {
    snakePos = [[0, 0], [0, 1], [0, 2]];
    snakeDirection = 270;
    applePos = [2, 0];
    bonusFood = null;
    bonusFoodCooldown = 0;
    score = 0;
    gameStat = 'none';
    gameStarted = false;
    updateSnakeTransforms();
    setOverlay('start', '3D SNAKE', 'Press <b>ENTER</b> to start');
    document.getElementById('gamePrompt').innerHTML = 'Ready when you are.';
  }, 1800);
}

// ============================================================
//  Keyboard
// ============================================================
function keydown(ev){
  ensureAudio();

  // Pause toggle
  if((ev.key === 'p' || ev.key === 'P') && gameStarted && gameStat !== 'lose') {
    gamePaused = !gamePaused;
    if (gamePaused) {
      document.getElementById('gamePrompt').innerHTML = '⏸️ Paused';
      if (pauseTextTime) { clearTimeout(pauseTextTime); pauseTextTime = null; }
      gameStat = 'pause';
      setOverlay('pause', '⏸ PAUSED', 'Press <b>P</b> to resume', '');
      playPauseSound();
    } else {
      gameStat = 'ingame';
      hideOverlay();
      document.getElementById('gamePrompt').innerHTML = '▶️ Resumed';
      playResumeSound();
      if (pauseTextTime) clearTimeout(pauseTextTime);
      pauseTextTime = setTimeout(() => {
        if (gameStat === 'ingame') {
          document.getElementById('gamePrompt').innerHTML = '🐍 Eating...';
        }
        pauseTextTime = null;
      }, 1500);
    }
    return;
  }

  // Toggle 1st/3rd person
  if(ev.key === 'r' || ev.key === 'R'){
    isFirstPerson = !isFirstPerson;
    return;
  }

  // Camera zoom (3rd person)
  if (!isFirstPerson) {
    if(ev.key === 'w' || ev.key === 'W') radius -= 0.3;
    else if(ev.key === 's' || ev.key === 'S') radius += 0.3;
    if(radius < 1.0) radius = 1.0;
    if(radius > 20.0) radius = 20.0;
  }

  // Start game
  if (!gameStarted && ev.key === 'Enter' && gameStat !== 'lose') {
    if (loseTimeoutId) { clearTimeout(loseTimeoutId); loseTimeoutId = null; }
    gameStarted = true;
    gameStat = 'ingame';
    hideOverlay();
    document.getElementById('gamePrompt').innerHTML = '🐍 Eating...';
    playStartSound();
    startGame();
    return;
  }
  if (!gameStarted || gamePaused || gameStat !== 'ingame') return;

  // Movement
  if(isFirstPerson) {
    if (ev.key === 'ArrowLeft' && !turned) {
      snakeDirection = (snakeDirection + 90) % 360;
      turned = true;
      playTurnSound();
    } else if (ev.key === 'ArrowRight' && !turned) {
      snakeDirection = (snakeDirection + 270) % 360;
      turned = true;
      playTurnSound();
    }
  } else {
    if (ev.key === 'ArrowUp' && snakeDirection !== 270 && !turned) {
      snakeDirection = 90; turned = true; playTurnSound();
    } else if (ev.key === 'ArrowDown' && snakeDirection !== 90 && !turned) {
      snakeDirection = 270; turned = true; playTurnSound();
    } else if (ev.key === 'ArrowLeft' && snakeDirection !== 0 && !turned) {
      snakeDirection = 180; turned = true; playTurnSound();
    } else if (ev.key === 'ArrowRight' && snakeDirection !== 180 && !turned) {
      snakeDirection = 0; turned = true; playTurnSound();
    }
  }
}
