"use strict";

const mapPopupOverlay = function () {
    // popup overlay
    const container = document.getElementById("popup");
    const content = document.getElementById("popup-content");
    const closer = document.getElementById("popup-closer");

    const overlay = new ol.Overlay({
        element: container,
        autoPan: {
            animation: {
                duration: 250,
            },
        },
    });

    const closerOnClick = () => {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    }
    closer.onclick = closerOnClick;

    return { content, closer, overlay, closerOnClick }
}();