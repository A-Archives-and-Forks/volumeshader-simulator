import { showToast, debounce, getPresets, setPresets, defaultPresets } from './Utils.js';

export class UIManager {
    constructor(raymarcher) {
        this.raymarcher = raymarcher;
        this.monacoEditor = null;
        this.currentKernel = "";
        this.autoApplyTimeout = null;

        // DOM Elements
        this.toggleRenderBtn = document.getElementById("toggleRender");
        this.renderIcon = document.getElementById("render-icon");
        this.renderText = document.getElementById("render-text");
        this.presetList = document.getElementById("presetList");
        this.savePresetBtn = document.getElementById("savePresetBtn");
        this.deletePresetBtn = document.getElementById("deletePresetBtn");
        this.speedSlider = document.getElementById("rotationSpeed");
        this.speedValue = document.getElementById("speedValue");
        this.panel = document.getElementById("right-panel");
        this.togglePanelBtn = document.getElementById("togglePanelBtn");
        this.applyBtn = document.getElementById("apply");
        this.cancelBtn = document.getElementById("cancel");
        this.errorConsole = document.getElementById("error-console");
        this.autoApplyCheckbox = document.getElementById("autoApply");
        this.resizeHandle = document.querySelector('.resize-handle');

        // Modals
        this.saveModal = document.getElementById("saveModal");
        this.deleteModal = document.getElementById("deleteModal");
        this.helpModal = document.getElementById("helpModal");
        this.presetNameInput = document.getElementById("presetNameInput");
        this.presetToDeleteName = document.getElementById("presetToDeleteName");

        // New Feature Buttons (will be added to index.html)
        this.screenshotBtn = document.getElementById("screenshotBtn");
        this.shareBtn = document.getElementById("shareBtn");
    }

    init() {
        this.initMonaco();
        this.initEventListeners();
        this.updatePresetList();
        this.updateRenderButtonState();
    }

    initMonaco() {
        if (typeof require === 'undefined') {
            setTimeout(() => this.initMonaco(), 100);
            return;
        }

        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], (monaco) => {
            monaco.languages.register({ id: 'glsl' });
            this.setupMonacoLanguage(monaco);

            this.monacoEditor = monaco.editor.create(document.getElementById('editor-container'), {
                value: this.raymarcher.DEFAULT_KERNEL,
                language: 'glsl',
                theme: 'glsl-theme',
                automaticLayout: true,
                minimap: { enabled: false },
                roundedSelection: true,
                scrollBeyondLastLine: false,
            });

            this.currentKernel = this.raymarcher.DEFAULT_KERNEL;

            this.monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyQ, () => {
                this.applyKernel();
            });

            this.monacoEditor.onDidChangeModelContent(() => {
                if (this.autoApplyCheckbox.checked) {
                    if (this.autoApplyTimeout) clearTimeout(this.autoApplyTimeout);
                    this.autoApplyTimeout = setTimeout(() => this.applyKernel(), 750);
                }
            });

            // Enable buttons now that editor is ready
            this.applyBtn.disabled = false;
            this.cancelBtn.disabled = false;
            this.savePresetBtn.disabled = false;
            this.deletePresetBtn.disabled = false;
            this.presetList.disabled = false;
            this.autoApplyCheckbox.disabled = false;

            // Check for shared code in URL
            this.checkUrlForSharedCode();
        });
    }

    setupMonacoLanguage(monaco) {
        monaco.languages.setLanguageConfiguration('glsl', {
            comments: {
                lineComment: '//',
                blockComment: ['/*', '*/']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"', notIn: ['string'] },
                { open: "'", close: "'", notIn: ['string', 'comment'] }
            ]
        });

        monaco.languages.setMonarchTokensProvider('glsl', {
            keywords: [
                'for', 'if', 'else', 'while', 'do', 'return', 'break', 'continue', 'struct',
                'const', 'uniform', 'varying', 'attribute', 'layout', 'in', 'out', 'inout',
                'precision', 'highp', 'mediump', 'lowp', 'discard'
            ],
            types: [
                'void', 'bool', 'int', 'uint', 'float', 'double',
                'vec2', 'vec3', 'vec4', 'bvec2', 'bvec3', 'bvec4',
                'ivec2', 'ivec3', 'ivec4', 'uvec2', 'uvec3', 'uvec4',
                'mat2', 'mat3', 'mat4', 'mat2x2', 'mat2x3', 'mat2x4',
                'mat3x2', 'mat3x3', 'mat3x4', 'mat4x2', 'mat4x3', 'mat4x4',
                'mat3x2', 'mat3x3', 'mat3x4', 'mat4x2', 'mat4x3', 'mat4x4',
                'sampler2D', 'samplerCube', 'sampler3D', 'sampler2DShadow'
            ],
            builtInFunctions: [
                'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
                'pow', 'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt',
                'abs', 'sign', 'floor', 'ceil', 'fract', 'mod', 'min', 'max', 'clamp', 'mix', 'step', 'smoothstep',
                'length', 'distance', 'dot', 'cross', 'normalize', 'faceforward', 'reflect', 'refract',
                'matrixCompMult', 'outerProduct', 'transpose', 'determinant', 'inverse',
                'lessThan', 'lessThanEqual', 'greaterThan', 'greaterThanEqual', 'equal', 'notEqual', 'any', 'all', 'not',
                'texture2D', 'textureCube', 'texture', 'textureProj', 'textureLod', 'textureOffset', 'texelFetch'
            ],
            builtInVariables: [
                'gl_Position', 'gl_FragColor', 'gl_FragCoord', 'gl_PointCoord', 'gl_PointSize', 'gl_FragData',
                'gl_FrontFacing', 'gl_VertexID', 'gl_InstanceID'
            ],
            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--',
                '+', '-', '*', '/', '&', '|', '^', '%', '<<', '>>', '+=', '-=', '*=', '/=',
                '&=', '|=', '^=', '%=', '<<=', '>>='
            ],
            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            tokenizer: {
                root: [
                    [/[a-zA-Z_]\w*(?=\s*\()/, 'entity.name.function'],
                    [/[a-zA-Z_]\w*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@types': 'type.identifier',
                            '@builtInFunctions': 'keyword.function',
                            '@builtInVariables': 'variable.predefined',
                            '@default': 'identifier'
                        }
                    }],
                    { include: '@whitespace' },
                    [/^#\s*[a-zA-Z_]\w*/, 'keyword.directive'],
                    [/[{}()\[\]]/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/\d+/, 'number'],
                    [/[;,]/, 'delimiter'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                ],
                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],
                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],
                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                ],
            }
        });

        monaco.editor.defineTheme('glsl-theme', {
            base: 'vs-dark',
            inherit: true,
            colors: {
                'editor.background': '#1E1E1E',
                'editor.foreground': '#D4D4D4',
                'editorCursor.foreground': '#A7A7A7',
                'editor.lineHighlightBackground': '#2A2A2A',
                'editor.selectionBackground': '#062F4A',
                'editorWidget.background': '#252526',
                'editorWidget.border': '#454545',
                'editorHoverWidget.background': '#252526',
                'editorHoverWidget.border': '#454545'
            },
            rules: [
                { token: 'keyword.function', foreground: 'DCDCAA' },
                { token: 'entity.name.function', foreground: 'DCDCAA' },
                { token: 'identifier', foreground: '9CDCFE' },
                { token: 'type.identifier', foreground: '4EC9B0' },
                { token: 'variable.predefined', foreground: 'C586C0' }
            ]
        });
    }

    applyKernel() {
        this.applyBtn.classList.remove("is-success", "is-error");
        this.applyBtn.classList.add("is-loading");
        this.applyBtn.disabled = true;

        setTimeout(() => {
            const kernelCode = this.monacoEditor.getValue();
            const result = this.raymarcher.applyKernel(kernelCode);

            if (result.success) {
                this.errorConsole.classList.remove("visible");
                this.currentKernel = kernelCode;
                showToast("Shader applied successfully!", "success");
                this.applyBtn.classList.remove("is-loading");
                this.applyBtn.classList.add("is-success");
                this.applyBtn.disabled = false;
                setTimeout(() => {
                    this.applyBtn.classList.remove("is-success");
                }, 1500);
            } else {
                this.errorConsole.textContent = result.error;
                this.errorConsole.classList.add("visible");
                showToast("Shader failed to compile!", "error");
                this.applyBtn.classList.remove("is-loading");
                this.applyBtn.classList.add("is-error");
                this.applyBtn.disabled = false;
            }
        }, 50);
    }

    updateRenderButtonState() {
        const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

        if (this.raymarcher.isRendering) {
            this.renderText.textContent = "Pause Rendering";
            this.renderIcon.innerHTML = pauseIcon;
        } else {
            this.renderText.textContent = "Start Rendering";
            this.renderIcon.innerHTML = playIcon;
        }
    }

    updatePresetList() {
        const presets = getPresets();
        this.presetList.innerHTML = `<option disabled selected>Select a preset to apply</option>`;
        for (const name in presets) {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            this.presetList.appendChild(option);
        }
    }

    initEventListeners() {
        // Panel Collapse
        let old_width;
        this.togglePanelBtn.addEventListener("click", () => {
            this.panel.style.transition = 'none';
            this.panel.classList.toggle("collapsed");
            let collapsed = this.panel.classList.contains("collapsed");
            if (collapsed) { old_width = this.panel.style.width; }

            this.togglePanelBtn.classList.toggle("collapsed", collapsed);
            this.resizeHandle.style.display = collapsed ? "none" : "block";
            this.panel.style.width = collapsed ? "0" : old_width;

            this.raymarcher.resizeCanvas();
        });

        // Panel Resize (Desktop)
        const handle = document.querySelector('.resize-handle');
        if (handle) {
            handle.addEventListener('mousedown', (e) => {
                if (this.panel.classList.contains('collapsed')) { return; }

                e.preventDefault();
                document.body.classList.add('is-resizing');
                this.panel.style.transition = 'none';
                const startX = e.clientX;
                const startWidth = parseInt(window.getComputedStyle(this.panel).width, 10);

                const doDrag = (e) => {
                    const targetWidth = startWidth - (e.clientX - startX);
                    const minWidth = 300;
                    const maxWidth = window.innerWidth * 0.9;
                    this.panel.style.width = `${Math.max(minWidth, Math.min(targetWidth, maxWidth))}px`;
                    this.raymarcher.resizeCanvas();
                };
                const stopDrag = () => {
                    document.body.classList.remove('is-resizing');
                    localStorage.setItem('panelWidth', this.panel.style.width);
                    document.removeEventListener('mousemove', doDrag);
                    document.removeEventListener('mouseup', stopDrag);
                    this.raymarcher.resizeCanvas();
                };
                document.addEventListener('mousemove', doDrag);
                document.addEventListener('mouseup', stopDrag);
            });
        }

        // Render Toggle
        this.toggleRenderBtn.addEventListener("click", () => {
            this.raymarcher.isRendering = !this.raymarcher.isRendering;
            this.updateRenderButtonState();
        });

        // Rotation Slider
        this.speedSlider.addEventListener("input", () => {
            this.raymarcher.rotationSpeed = parseInt(this.speedSlider.value, 10);
            this.speedValue.textContent = this.raymarcher.rotationSpeed;
        });

        // Shader Buttons
        this.applyBtn.addEventListener("click", () => this.applyKernel());
        this.cancelBtn.addEventListener("click", () => {
            this.monacoEditor.setValue(this.currentKernel);
            this.errorConsole.classList.remove("visible");
            showToast("Editor reset to last applied kernel.", "info");
        });

        // Preset Controls
        this.presetList.addEventListener("change", () => {
            const name = this.presetList.value;
            const presets = getPresets();
            if (presets[name]) {
                this.monacoEditor.setValue(presets[name]);
                if (this.autoApplyCheckbox.checked) {
                    this.applyKernel();
                } else {
                    showToast("Preset loaded into editor. Hit 'Apply'.", "info");
                }
            }
        });

        // Modal Triggers
        this.savePresetBtn.addEventListener("click", () => {
            this.presetNameInput.value = "";
            this.saveModal.classList.add("visible");
            this.presetNameInput.focus();
        });

        this.deletePresetBtn.addEventListener("click", () => {
            const name = this.presetList.value;
            if (!name || this.presetList.selectedIndex === 0) {
                showToast("Select a preset to delete first.", "error");
                return;
            }
            this.presetToDeleteName.textContent = name;
            this.deleteModal.classList.add("visible");
        });

        document.getElementById("helpBtn").addEventListener("click", () => {
            this.helpModal.classList.add("visible");
        });

        // Modal Close Buttons
        document.getElementById("cancelSaveBtn").addEventListener("click", () => this.saveModal.classList.remove("visible"));
        document.getElementById("cancelDeleteBtn").addEventListener("click", () => this.deleteModal.classList.remove("visible"));
        document.getElementById("closeHelpBtn").addEventListener("click", () => this.helpModal.classList.remove("visible"));

        // Modal Confirm Actions
        document.getElementById("confirmSaveBtn").addEventListener("click", () => {
            const name = this.presetNameInput.value.trim();
            if (!name) {
                showToast("Please enter a preset name.", "error");
                return;
            }
            const presets = getPresets();
            presets[name] = this.monacoEditor.getValue();
            setPresets(presets);
            this.updatePresetList();
            this.presetList.value = name;
            showToast(`Preset "${name}" saved!`, "success");
            this.saveModal.classList.remove("visible");
        });

        document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
            const name = this.presetList.value;
            const presets = getPresets();
            if (presets[name]) {
                delete presets[name];
                setPresets(presets);
                this.updatePresetList();
                this.monacoEditor.setValue(this.raymarcher.DEFAULT_KERNEL);
                showToast(`Preset "${name}" deleted.`, "success");
            } else {
                showToast("Could not find preset to delete.", "error");
            }
            this.deleteModal.classList.remove("visible");
        });

        // Window Resize
        window.addEventListener("resize", debounce(() => this.raymarcher.resizeCanvas(), 100));

        // Screenshot
        if (this.screenshotBtn) {
            this.screenshotBtn.addEventListener("click", () => {
                const canvas = this.raymarcher.canvas;
                // We need to render once to ensure the buffer is fresh and not cleared if preserveDrawingBuffer is false
                // But usually webgl clears after composite. 
                // To capture properly, we might need to draw immediately then capture.
                this.raymarcher.draw();
                const dataUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `raymarcher-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
                showToast("Screenshot saved!", "success");
            });
        }

        // Share
        if (this.shareBtn) {
            this.shareBtn.addEventListener("click", () => {
                const code = this.monacoEditor.getValue();
                const encoded = encodeURIComponent(btoa(code));
                const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;
                navigator.clipboard.writeText(url).then(() => {
                    showToast("Shareable URL copied to clipboard!", "success");
                }).catch(() => {
                    showToast("Failed to copy URL.", "error");
                });
            });
        }
    }

    checkUrlForSharedCode() {
        const params = new URLSearchParams(window.location.search);
        const encodedCode = params.get('code');
        if (encodedCode) {
            try {
                const code = atob(decodeURIComponent(encodedCode));
                this.monacoEditor.setValue(code);
                this.applyKernel();
                showToast("Shared shader loaded!", "success");
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
                showToast("Failed to load shared shader.", "error");
            }
        }
    }
}
