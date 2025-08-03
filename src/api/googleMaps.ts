import { DOM, setBounds, setMap, setPanorama, setPreferredVoice, setStreetViewService } from '../state';
import { updateLayouts } from '../ui/layout';

const {Map} = await google.maps.importLibrary('maps');
const {LatLngBounds} = await google.maps.importLibrary('core');
const {StreetViewService} = await google.maps.importLibrary('streetView');

export async function initMap() {
  setBounds(new google.maps.LatLngBounds());

  const mapInstance = new Map(document.getElementById('map'), {
    center: {lat: 0, lng: 0},
    zoom: 2,
    mapId: '4504f8b37365c3d0', // Custom map ID for styling
    gestureHandling: 'greedy', // Allows easy map interaction on all devices
    zoomControl: false,
    cameraControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
  });
  setMap(mapInstance);

  setStreetViewService(new StreetViewService());
  setPanorama(new google.maps.StreetViewPanorama(DOM.streetViewPanoramaEl, {
    addressControl: false,
    showRoadLabels: false,
    zoomControl: false,
    fullscreenControl: false,
    panControl: false,
    enableCloseButton: false,
  }));

  // Define a custom Popup class extending Google Maps OverlayView.
  window.Popup = class Popup extends google.maps.OverlayView {
    position: google.maps.LatLng;
    containerDiv: HTMLDivElement;
    constructor(position, content) {
      super();
      this.position = position;
      content.classList.add('popup-bubble');

      this.containerDiv = document.createElement('div');
      this.containerDiv.classList.add('popup-container');
      this.containerDiv.appendChild(content);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
    }
    onAdd() { this.getPanes().floatPane.appendChild(this.containerDiv); }
    onRemove() {
      if (this.containerDiv.parentElement) {
        this.containerDiv.parentElement.removeChild(this.containerDiv);
      }
    }
    draw() {
      const divPosition = this.getProjection()?.fromLatLngToDivPixel(this.position);
      if (!divPosition) return;
      const display = Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ? 'block' : 'none';
      if (display === 'block') {
        this.containerDiv.style.left = divPosition.x + 'px';
        this.containerDiv.style.top = divPosition.y + 'px';
      }
      if (this.containerDiv.style.display !== display) {
        this.containerDiv.style.display = display;
      }
    }
  };
  
  // Attempt to select a better speech synthesis voice
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer Google voices first
    let voice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || null;
    // Fallback to any English voice
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('en')) || null;
    }
    setPreferredVoice(voice);
  };

  DOM.leftPanel.classList.add('visible');
  updateLayouts();
}
