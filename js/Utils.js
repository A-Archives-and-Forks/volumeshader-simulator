
export const defaultPresets = {
    "Very Simple Box": `float boxDist(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0));
}
  
float kernal(vec3 ver) {
    return 0.0000001 - boxDist(ver, vec3(1.0));
}`,
    "Very Simple": `float boxDist(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0));
}

float kernal(vec3 ver) {
    return 1.0 - boxDist(ver, vec3(1.0));
}`,
    "Simple": `float boxDist(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0));
}

float kernal(vec3 ver) {
    vec3 a = ver;
    float b = 0.0;
    for (int i = 0; i < 2; i++) {
        b = dot(a, a);
        if (b > 36.0) break;
        a = a * clamp(1.1 - b * 0.04, 0.6, 1.1) + ver * 0.25;
    }
    return 1.0 - boxDist(a, vec3(1.0));
}`,
    "Base": `float kernal(vec3 ver) {
    vec3 a;
    float b,c,d,e;
    a=ver;
    for(int i=0;i<5;i++){
        b=length(a);
        c=atan(a.y,a.x)*8.0;
        e=1.0/b;
        d=acos(a.z/b)*8.0;
        b=pow(b,8.0);
        a=vec3(b*sin(d)*cos(c),b*sin(d)*sin(c),b*cos(d))+ver;
        if(b>6.0){
            break;
        }
    }   
    return 4.0-a.x*a.x-a.y*a.y-a.z*a.z;
}`,
    "Hard Fractal": `float kernal(vec3 ver) {
    vec3 a = ver;
    float b, c, d, e, f, g;
  
    for (int i = 0; i < 25; i++) {
        b = length(a) + 0.001;
        c = atan(a.y, a.x) * 12.0 + sin(a.z * 5.0);
        d = acos(clamp(a.z / b, -1.0, 1.0)) * 12.0 + cos(a.x * 5.0);
        e = min(pow(b, 4.0 + sin(float(i)) * 0.5), 20.0);
        f = sin(c * 0.5 + sin(d * 0.25 + cos(b * 2.0)));
        g = cos(d * 0.5 + cos(c * 0.25 + sin(b * 2.0)));
  
        a = vec3(
            e * sin(d) * cos(c) + f * 0.1,
            e * sin(d) * sin(c) + g * 0.1,
            e * cos(d) + f * g * 0.05
        ) + ver * (0.3 + 0.3 * sin(float(i)));
  
        if (e > 10.0) break;
    }
  
    float dist = 4.0 - dot(a, a);
    return dist;
}`,
    "Extreme Fractal": `float kernal(vec3 ver) {
    vec3 a = ver;
    float b, c, d, e, f, g, h;
  
    for (int i = 0; i < 80; i++) {
        b = length(a) + 0.0001;
        c = atan(a.y, a.x) * 24.0 + sin(a.z * 9.0 + cos(b * 2.0));
        d = acos(clamp(a.z / b, -1.0, 1.0)) * 24.0 + cos(a.x * 9.0 + sin(b * 3.0));
  
        e = pow(b, 9.0 + sin(float(i * 2)) * 1.5);
  
        f = sin(c * 1.5 + sin(d * 0.75 + cos(b * 3.0)));
        g = cos(d * 1.5 + cos(c * 0.75 + sin(b * 3.0)));
  
        h = sin(dot(a, a) * 5.0 + float(i) * 0.25);
  
        a = vec3(
            e * sin(d) * cos(c) + f * g * h * 0.4,
            e * sin(d) * sin(c) + f * g * h * 0.4,
            e * cos(d) + f * g * h * 0.4
        ) + ver * (0.8 + 0.6 * sin(float(i) + dot(ver, a)));
    }
  
    float dist = 0.5 - dot(a, a);
    float sparkle = sin(dot(a, a) * 20.0) * 0.1;
    return dist + sparkle;
}`
};

/**
 * Shows a toast notification.
 * @param {string} message The message to display.
 * @param {'info' | 'success' | 'error'} type The type of toast.
 * @param {number} duration How long to show the toast (in ms).
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    if (type === 'success') {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Animate out
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

/**
 * Creates a debounced version of a function.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 */
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Checks for WebGL Hardware Acceleration.
 */
export function checkHWA() {
    let hasHWA = false;
    try {
        const test = (force) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: force });
            ctx.moveTo(0, 0);
            ctx.lineTo(120, 121);
            ctx.stroke();
            return ctx.getImageData(0, 0, 200, 200).data.join();
        };
        hasHWA = test(true) !== test(false);
    } catch (e) {
        hasHWA = false; // Failed to test, assume no HWA
    }
    if (!hasHWA) {
        showToast("Hardware Acceleration is disabled. Performance may be affected.", "error", 5000);
    }
    return hasHWA;
}

/**
 * Detects if the user is on a mobile device.
 */
export function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Gets presets from localStorage.
 */
export function getPresets() {
    let presets;
    try {
        presets = JSON.parse(localStorage.getItem("presets"));
    } catch (e) {
        presets = null;
    }
    
    if (!presets || typeof presets !== 'object' || Array.isArray(presets)) {
        presets = defaultPresets;
        setPresets(presets);
    }
    
    // Ensure default presets are always there
    let needsUpdate = false;
    for (const key in defaultPresets) {
        if (!presets[key]) {
            presets[key] = defaultPresets[key];
            needsUpdate = true;
        }
    }
    if (needsUpdate) {
        setPresets(presets);
    }
    
    return presets;
}

/**
 * Saves presets to localStorage.
 * @param {object} presets The presets object to save.
 */
export function setPresets(presets) {
    try {
        localStorage.setItem("presets", JSON.stringify(presets));
    } catch (e) {
        showToast("Error saving presets. Storage may be full.", "error");
    }
}
