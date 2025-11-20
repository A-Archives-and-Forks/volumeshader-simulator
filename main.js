import { Raymarcher } from './js/Raymarcher.js';
import { UIManager } from './js/UIManager.js';
import { checkHWA, detectMobile } from './js/Utils.js';

window.onload = function () {
    const isMobile = detectMobile();
    const hasHWA = checkHWA();

    // Restore saved panel width
    const panel = document.getElementById("right-panel");
    const savedWidth = localStorage.getItem('panelWidth');
    if (savedWidth && !isMobile && panel) {
        panel.style.width = savedWidth;
    }

    const raymarcher = new Raymarcher('c1');
    if (raymarcher.init(hasHWA)) {
        const uiManager = new UIManager(raymarcher);
        uiManager.init();
    }
};