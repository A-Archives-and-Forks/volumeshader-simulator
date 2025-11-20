import { showToast } from './Utils.js';

export class Raymarcher {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = null;
        this.isRendering = true;
        this.rotationSpeed = 50;
        this.hasHWA = true;

        // WebGL State
        this.vertshader = null;
        this.fragshader = null;
        this.shaderProgram = null;
        this.locations = {};

        // Camera State
        this.len = 2.6;
        this.ang1 = 2.8;
        this.ang2 = 0.4;
        this.cenx = 0.0;
        this.ceny = 0.0;
        this.cenz = 0.0;
        this.cx = 0;
        this.cy = 0;

        // Mouse/Touch State
        this.md = 0;
        this.mx = 0;
        this.my = 0;
        this.mx1 = 0;
        this.my1 = 0;
        this.lasttimen = 0;
        this.ml = 0;
        this.mr = 0;
        this.mm = 0;

        // FPS Counter State
        this.frameCount = 0;
        this.totalFrames = 0;
        this.fps = 0;
        this.fpsLastUpdate = performance.now();
        this.renderStartTime = performance.now();
        this.frameTimes = [];
        this.maxSamples = 600;
        this.lastFrameTimestamp = performance.now();

        this.fpsCounterElement = document.getElementById("fpsCounter");

        // Constants
        this.FSHADER_SOURCE_BASE = `#version 100
#define PI 3.14159265358979324
#define M_L 0.3819660113
#define M_R 0.6180339887
#define MAXR 8
#define SOLVER 8
precision highp float;
float kernal(vec3 ver);
uniform vec3 right, forward, up, origin;
varying vec3 dir, localdir;
uniform float len;
vec3 ver;
int sign;
float v, v1, v2;
float r1, r2, r3, r4, m1, m2, m3, m4;
vec3 n, reflect;
const float step = 0.002;
vec3 color;
void main() {
   color.r=0.0;
   color.g=0.0;
   color.b=0.0;
   sign=0;
   v1 = kernal(origin + dir * (step*len));
   v2 = kernal(origin);
   for (int k = 2; k < 1002; k++) {
      ver = origin + dir * (step*len*float(k));
      v = kernal(ver);
      if (v > 0.0 && v1 < 0.0) {
         r1 = step * len*float(k - 1);
         r2 = step * len*float(k);
         m1 = kernal(origin + dir * r1);
         m2 = kernal(origin + dir * r2);
         for (int l = 0; l < SOLVER; l++) {
            r3 = r1 * 0.5 + r2 * 0.5;
            m3 = kernal(origin + dir * r3);
            if (m3 > 0.0) {
               r2 = r3;
               m2 = m3;
            }
            else {
               r1 = r3;
               m1 = m3;
            }
         }
         if (r3 < 2.0 * len) {
               sign=1;
            break;
         }
      }
      if (v < v1&&v1>v2&&v1 < 0.0 && (v1*2.0 > v || v1 * 2.0 > v2)) {
         r1 = step * len*float(k - 2);
         r2 = step * len*(float(k) - 2.0 + 2.0*M_L);
         r3 = step * len*(float(k) - 2.0 + 2.0*M_R);
         r4 = step * len*float(k);
         m2 = kernal(origin + dir * r2);
         m3 = kernal(origin + dir * r3);
         for (int l = 0; l < MAXR; l++) {
            if (m2 > m3) {
               r4 = r3;
               r3 = r2;
               r2 = r4 * M_L + r1 * M_R;
               m3 = m2;
               m2 = kernal(origin + dir * r2);
            }
            else {
               r1 = r2;
               r2 = r3;
               r3 = r4 * M_R + r1 * M_L;
               m2 = m3;
               m3 = kernal(origin + dir * r3);
            }
         }
         if (m2 > 0.0) {
            r1 = step * len*float(k - 2);
            r2 = r2;
            m1 = kernal(origin + dir * r1);
            m2 = kernal(origin + dir * r2);
            for (int l = 0; l < SOLVER; l++) {
               r3 = r1 * 0.5 + r2 * 0.5;
               m3 = kernal(origin + dir * r3);
               if (m3 > 0.0) {
                  r2 = r3;
                  m2 = m3;
               }
               else {
                  r1 = r3;
                  m1 = m3;
               }
            }
            if (r3 < 2.0 * len&&r3> step*len) {
                   sign=1;
               break;
            }
         }
         else if (m3 > 0.0) {
            r1 = step * len*float(k - 2);
            r2 = r3;
            m1 = kernal(origin + dir * r1);
            m2 = kernal(origin + dir * r2);
            for (int l = 0; l < SOLVER; l++) {
               r3 = r1 * 0.5 + r2 * 0.5;
               m3 = kernal(origin + dir * r3);
               if (m3 > 0.0) {
                  r2 = r3;
                  m2 = m3;
               }
               else {
                  r1 = r3;
                  m1 = m3;
               }
            }
            if (r3 < 2.0 * len&&r3> step*len) {
                   sign=1;
               break;
            }
         }
      }
      v2 = v1;
      v1 = v;
   }
   if (sign==1) {
      ver = origin + dir*r3 ;
      r1=ver.x*ver.x+ver.y*ver.y+ver.z*ver.z;
      n.x = kernal(ver - right * (r3*0.00025)) - kernal(ver + right * (r3*0.00025));
      n.y = kernal(ver - up * (r3*0.00025)) - kernal(ver + up * (r3*0.00025));
      n.z = kernal(ver + forward * (r3*0.00025)) - kernal(ver - forward * (r3*0.00025));
      r3 = n.x*n.x+n.y*n.y+n.z*n.z;
      n = n * (1.0 / sqrt(r3));
      ver = localdir;
      r3 = ver.x*ver.x+ver.y*ver.y+ver.z*ver.z;
      ver = ver * (1.0 / sqrt(r3));
      reflect = n * (-2.0*dot(ver, n)) + ver;
      r3 = reflect.x*0.276+reflect.y*0.920+reflect.z*0.276;
      r4 = n.x*0.276+n.y*0.920+n.z*0.276;
      r3 = max(0.0,r3);
      r3 = r3 * r3*r3*r3;
      r3 = r3 * 0.45 + r4 * 0.25 + 0.3;
      n.x = sin(r1*10.0)*0.5+0.5;
      n.y = sin(r1*10.0+2.05)*0.5+0.5;
      n.z = sin(r1*10.0-2.05)*0.5+0.5;
      color = n*r3;
   }
   gl_FragColor = vec4(color.x, color.y, color.z, 1.0);
}`;
        this.DEFAULT_KERNEL = `float boxDist(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0));
}
  
float kernal(vec3 ver) {
    return 0.0000001 - boxDist(ver, vec3(1.0));
}`;
    }

    init(hasHWA) {
        this.hasHWA = hasHWA;
        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            showToast("WebGL is not supported by your browser!", "error", 10000);
            return false;
        }

        const positions = [-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0];
        const VSHADER_SOURCE =
            `#version 100
            precision highp float;
            attribute vec4 position;
            varying vec3 dir, localdir;
            uniform vec3 right, forward, up, origin;
            uniform float x,y;
            void main() {
               gl_Position = position; 
               dir = forward + right * position.x*x + up * position.y*y;
               localdir.x = position.x*x;
               localdir.y = position.y*y;
               localdir.z = -1.0;
            } `;

        this.vertshader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.fragshader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.shaderProgram = this.gl.createProgram();

        this.gl.shaderSource(this.vertshader, VSHADER_SOURCE);
        this.gl.compileShader(this.vertshader);

        // Initial compile with default kernel
        this.gl.shaderSource(this.fragshader, this.FSHADER_SOURCE_BASE + this.DEFAULT_KERNEL);
        this.gl.compileShader(this.fragshader);

        this.gl.attachShader(this.shaderProgram, this.vertshader);
        this.gl.attachShader(this.shaderProgram, this.fragshader);
        this.gl.linkProgram(this.shaderProgram);
        this.gl.useProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            console.error("Initial shader compile failed:", this.gl.getShaderInfoLog(this.fragshader), this.gl.getProgramInfoLog(this.shaderProgram));
            return false;
        }

        // Get Uniform/Attrib Locations
        this.locations.position = this.gl.getAttribLocation(this.shaderProgram, 'position');
        this.locations.right = this.gl.getUniformLocation(this.shaderProgram, 'right');
        this.locations.forward = this.gl.getUniformLocation(this.shaderProgram, 'forward');
        this.locations.up = this.gl.getUniformLocation(this.shaderProgram, 'up');
        this.locations.origin = this.gl.getUniformLocation(this.shaderProgram, 'origin');
        this.locations.x = this.gl.getUniformLocation(this.shaderProgram, 'x');
        this.locations.y = this.gl.getUniformLocation(this.shaderProgram, 'y');
        this.locations.len = this.gl.getUniformLocation(this.shaderProgram, 'len');

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.locations.position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.locations.position);

        this.initCanvasControls();
        this.resizeCanvas();
        this.startRenderLoop();

        return true;
    }

    applyKernel(kernelCode) {
        if (!this.hasHWA) {
            showToast("Cannot apply shader: Hardware Acceleration is disabled.", "error");
            return { success: false };
        }

        this.gl.shaderSource(this.fragshader, this.FSHADER_SOURCE_BASE + kernelCode);
        this.gl.compileShader(this.fragshader);
        const infof = this.gl.getShaderInfoLog(this.fragshader);

        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(this.shaderProgram);
            return { success: false, error: infof + info };
        } else {
            // Re-bind uniforms as program changed
            this.locations.position = this.gl.getAttribLocation(this.shaderProgram, 'position');
            this.locations.right = this.gl.getUniformLocation(this.shaderProgram, 'right');
            this.locations.forward = this.gl.getUniformLocation(this.shaderProgram, 'forward');
            this.locations.up = this.gl.getUniformLocation(this.shaderProgram, 'up');
            this.locations.origin = this.gl.getUniformLocation(this.shaderProgram, 'origin');
            this.locations.x = this.gl.getUniformLocation(this.shaderProgram, 'x');
            this.locations.y = this.gl.getUniformLocation(this.shaderProgram, 'y');
            this.locations.len = this.gl.getUniformLocation(this.shaderProgram, 'len');

            // Reset FPS counters
            this.totalFrames = 0;
            this.renderStartTime = performance.now();
            this.frameTimes = [];

            return { success: true };
        }
    }

    resizeCanvas() {
        console.log("Resizing canvas");
        const renderArea = this.canvas.parentElement;
        this.cx = renderArea.clientWidth;
        this.cy = renderArea.clientHeight;
        if (this.cy === 0) return;

        const baseHeight = 1024;
        const aspectRatio = this.cx / this.cy;

        const bufferWidth = Math.round(baseHeight * aspectRatio);
        const bufferHeight = baseHeight;

        this.canvas.width = bufferWidth;
        this.canvas.height = bufferHeight;

        this.canvas.style.width = `${this.cx}px`;
        this.canvas.style.height = `${this.cy}px`;

        this.gl.viewport(0, 0, bufferWidth, bufferHeight);
    }

    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTimestamp;
        this.lastFrameTimestamp = now;

        this.frameTimes.push(delta);
        if (this.frameTimes.length > this.maxSamples) {
            this.frameTimes.shift();
        }

        this.frameCount++;
        this.totalFrames++;

        const elapsed = now - this.fpsLastUpdate;

        if (elapsed >= 500) { // Update counter twice a second
            this.fps = Math.round((this.frameCount * 1000) / elapsed);

            const totalTime = (now - this.renderStartTime) / 1000;
            const avgFps = Math.round(this.totalFrames / totalTime);

            // 1% Low FPS
            const sorted = [...this.frameTimes].sort((a, b) => b - a); // longest frame times first
            const onePercentIndex = Math.floor(sorted.length * 0.01);
            const onePercentLow = sorted[onePercentIndex] || sorted[sorted.length - 1] || 1;
            const onePercentFps = Math.round(1000 / onePercentLow);

            if (this.fpsCounterElement) {
                this.fpsCounterElement.innerHTML = `FPS: <span>${this.fps}</span> | Avg: <span>${avgFps}</span> | 1% Low: <span>${onePercentFps}</span>`;
            }

            this.fpsLastUpdate = now;
            this.frameCount = 0;
        }
    }

    draw() {
        this.updateFPS();
        if (!this.isRendering) return;

        if (this.isRendering && this.rotationSpeed > 0) {
            this.ang1 += this.rotationSpeed / 5000;
        }

        this.gl.uniform1f(this.locations.x, this.cx * 2.0 / (this.cx + this.cy));
        this.gl.uniform1f(this.locations.y, this.cy * 2.0 / (this.cx + this.cy));
        this.gl.uniform1f(this.locations.len, this.len);
        this.gl.uniform3f(this.locations.origin, this.len * Math.cos(this.ang1) * Math.cos(this.ang2) + this.cenx, this.len * Math.sin(this.ang2) + this.ceny, this.len * Math.sin(this.ang1) * Math.cos(this.ang2) + this.cenz);
        this.gl.uniform3f(this.locations.right, Math.sin(this.ang1), 0, -Math.cos(this.ang1));
        this.gl.uniform3f(this.locations.up, -Math.sin(this.ang2) * Math.cos(this.ang1), Math.cos(this.ang2), -Math.sin(this.ang2) * Math.sin(this.ang1));
        this.gl.uniform3f(this.locations.forward, -Math.cos(this.ang1) * Math.cos(this.ang2), -Math.sin(this.ang2), -Math.sin(this.ang1) * Math.cos(this.ang2));
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        this.gl.finish();
    }

    startRenderLoop() {
        const loop = () => {
            this.draw();
            window.requestAnimationFrame(loop);
        };
        window.requestAnimationFrame(loop);
    }

    initCanvasControls() {
        // --- Mouse Controls ---
        this.canvas.addEventListener("mousedown", (ev) => {
            const oEvent = ev || event;
            if (oEvent.button == 0) { // Left-click
                this.ml = 1;
                this.mm = 0;
                if (this.isRendering) this.tempRotationSpeed = this.rotationSpeed; // Store speed
                if (this.isRendering) this.rotationSpeed = 0; // Stop rotation
            }
            if (oEvent.button == 2) { // Right-click
                this.mr = 1;
                this.mm = 0;
            }
            this.mx = oEvent.clientX;
            this.my = oEvent.clientY;
        }, false);

        this.canvas.addEventListener("mouseup", (ev) => {
            const oEvent = ev || event;
            if (oEvent.button == 0) {
                this.ml = 0;
                if (this.isRendering && this.tempRotationSpeed !== undefined) this.rotationSpeed = this.tempRotationSpeed; // Resume
            }
            if (oEvent.button == 2) {
                this.mr = 0;
            }
        }, false);

        this.canvas.addEventListener("mousemove", (ev) => {
            const oEvent = ev || event;
            if (this.ml == 1) { // Rotate
                this.ang1 += (oEvent.clientX - this.mx) * 0.002;
                this.ang2 += (oEvent.clientY - this.my) * 0.002;
                if (oEvent.clientX != this.mx || oEvent.clientY != this.my) this.mm = 1;
            }
            if (this.mr == 1) { // Pan
                const l = this.len * 4.0 / (this.cx + this.cy);
                this.cenx += l * (-(oEvent.clientX - this.mx) * Math.sin(this.ang1) - (oEvent.clientY - this.my) * Math.sin(this.ang2) * Math.cos(this.ang1));
                this.ceny += l * ((oEvent.clientY - this.my) * Math.cos(this.ang2));
                this.cenz += l * ((oEvent.clientX - this.mx) * Math.cos(this.ang1) - (oEvent.clientY - this.my) * Math.sin(this.ang2) * Math.sin(this.ang1));
                if (oEvent.clientX != this.mx || oEvent.clientY != this.my) this.mm = 1;
            }
            this.mx = oEvent.clientX;
            this.my = oEvent.clientY;
        }, false);

        this.canvas.addEventListener("wheel", (ev) => { // Zoom
            ev.preventDefault();
            const oEvent = ev || event;
            this.len *= Math.exp(0.001 * oEvent.deltaY);
        }, false);

        // Prevent context menu on right-click drag
        document.oncontextmenu = (event) => {
            if (this.mm == 1) event.preventDefault();
        };

        // --- Touch Controls ---
        this.canvas.addEventListener("touchstart", (ev) => {
            ev.preventDefault();
            const n = ev.touches.length;
            if (n == 1) { // Rotate
                if (this.isRendering) this.tempRotationSpeed = this.rotationSpeed;
                if (this.isRendering) this.rotationSpeed = 0;
                const oEvent = ev.touches[0];
                this.mx = oEvent.clientX;
                this.my = oEvent.clientY;
            } else if (n == 2) { // Pan/Zoom
                const oEvent = ev.touches[0];
                const oEvent1 = ev.touches[1];
                this.mx = oEvent.clientX;
                this.my = oEvent.clientY;
                this.mx1 = oEvent1.clientX;
                this.my1 = oEvent1.clientY;
            }
            this.lasttimen = n;
        }, { passive: false });

        this.canvas.addEventListener("touchend", (ev) => {
            ev.preventDefault();
            if (this.isRendering && this.lasttimen == 1 && ev.touches.length == 0) {
                if (this.tempRotationSpeed !== undefined) this.rotationSpeed = this.tempRotationSpeed;
            }
            const n = ev.touches.length;
            if (n == 1) {
                const oEvent = ev.touches[0];
                this.mx = oEvent.clientX;
                this.my = oEvent.clientY;
            } else if (n == 2) {
                const oEvent = ev.touches[0];
                const oEvent1 = ev.touches[1];
                this.mx = oEvent.clientX;
                this.my = oEvent.clientY;
                this.mx1 = oEvent1.clientX;
                this.my1 = oEvent1.clientY;
            }
            this.lasttimen = n;
        }, { passive: false });

        this.canvas.addEventListener("touchmove", (ev) => {
            ev.preventDefault();
            const n = ev.touches.length;
            if (n == 1 && this.lasttimen == 1) { // Rotate
                const oEvent = ev.touches[0];
                this.ang1 += (oEvent.clientX - this.mx) * 0.002;
                this.ang2 += (oEvent.clientY - this.my) * 0.002;
                this.mx = oEvent.clientX;
                this.my = oEvent.clientY;
            } else if (n == 2) {
                const oEvent = ev.touches[0];
                const oEvent1 = ev.touches[1];

                // Pan
                const l = this.len * 2.0 / (this.cx + this.cy);
                this.cenx += l * (-(oEvent.clientX + oEvent1.clientX - this.mx - this.mx1) * Math.sin(this.ang1) - (oEvent.clientY + oEvent1.clientY - this.my - this.my1) * Math.sin(this.ang2) * Math.cos(this.ang1));
                this.ceny += l * ((oEvent.clientY + oEvent1.clientY - this.my - this.my1) * Math.cos(this.ang2));
                this.cenz += l * ((oEvent.clientX + oEvent1.clientX - this.mx - this.mx1) * Math.cos(this.ang1) - (oEvent.clientY + oEvent1.clientY - this.my - this.my1) * Math.sin(this.ang2) * Math.sin(this.ang1));

                // Zoom
                const l1 = Math.sqrt((this.mx - this.mx1) * (this.mx - this.mx1) + (this.my - this.my1) * (this.my - this.my1) + 1.0);
                this.mx = oEvent.clientX;
                this.my = oEvent.clientY;
                this.mx1 = oEvent1.clientX;
                this.my1 = oEvent1.clientY;
                const l2 = Math.sqrt((this.mx - this.mx1) * (this.mx - this.mx1) + (this.my - this.my1) * (this.my - this.my1) + 1.0);
                this.len *= l1 / l2;
            }
            this.lasttimen = n;
        }, { passive: false });
    }
}
