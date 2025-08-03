import { DOM, map, bounds } from '../state';

export function updateLayouts() {
    const leftPanelWidth = DOM.leftPanel.classList.contains('visible') ? 360 : 0;
    const diaryVisible = DOM.diaryContainer.classList.contains('visible');
    const diaryOnLeft = DOM.diaryContainer.classList.contains('left');
    let diaryWidthLeft = 0;
    let diaryWidthRight = 0;

    if (diaryVisible) {
        if (diaryOnLeft) diaryWidthLeft = 360;
        else diaryWidthRight = 360;
    }

    // Main control panel and left diary can't be open at the same time. Main panel wins.
    const finalLeftOffset = Math.max(leftPanelWidth, diaryWidthLeft);

    DOM.mapContainer.style.left = `${finalLeftOffset}px`;
    DOM.mapContainer.style.width = `calc(100% - ${finalLeftOffset}px - ${diaryWidthRight}px)`;

    setTimeout(() => {
        if (map && bounds?.getCenter()) {
            map.fitBounds(bounds);
        }
        window.dispatchEvent(new Event('resize'));
    }, 350); // After CSS transition
}
