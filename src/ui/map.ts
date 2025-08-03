
import * as AppState from '../state';
import { addToDiary, hideDiary } from './diary';
import { hideStreetView } from './tour';
import { closeLocationChat } from './modals/locationChat';
import { stopCurrentAudio } from './audio';

const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');

export async function setPin(args: any) {
  const point = {lat: Number(args.lat), lng: Number(args.lng)};
  AppState.points.push(point);
  AppState.bounds.extend(point);

  const marker = new AdvancedMarkerElement({ map: AppState.map, position: point, title: args.name });
  AppState.markers.push(marker);
  AppState.map.panTo(point);
  AppState.map.fitBounds(AppState.bounds);

  const content = document.createElement('div');
  let timeInfo = '';
  if (args.time) {
    timeInfo = `<div style="margin-top: 4px; font-size: 12px; color: var(--md-sys-color-primary);">
                  <i class="fas fa-clock"></i> ${args.time}
                  ${args.duration ? ` • ${args.duration}` : ''}
                </div>`;
  }
  content.innerHTML = `<b>${args.name}</b><br/>${args.description}${timeInfo}`;
  const popup = new window.Popup(new google.maps.LatLng(point.lat, point.lng), content);

  const {data} = await AppState.streetViewService.getPanorama({
    location: point,
    radius: 50,
    source: google.maps.StreetViewSource.OUTDOOR,
  }).catch(() => ({data: null}));
  const streetViewAvailable = !!(data && data.location && data.location.latLng);

  const locationInfo = {
    type: 'location' as const,
    name: args.name, description: args.description,
    position: new google.maps.LatLng(point.lat, point.lng),
    popup, content, time: args.time, duration: args.duration,
    sequence: args.sequence, imageUrl: args.imageUrl,
    openingTime: args.openingTime, closingTime: args.closingTime,
    price: args.price, streetViewAvailable,
  };
  AppState.popUps.push(locationInfo);
  if (AppState.isPlannerMode && args.time) {
     addToDiary(AppState.popUps.length - 1);
  }
}

export async function setEventPin(args: any) {
  const point = {lat: Number(args.lat), lng: Number(args.lng)};
  AppState.points.push(point);
  AppState.bounds.extend(point);

  const pinElement = new PinElement({
    background: 'var(--md-sys-color-tertiary)',
    borderColor: '#fff',
    glyphColor: '#fff',
  });
  const marker = new AdvancedMarkerElement({
    map: AppState.map,
    position: point,
    title: args.name,
    content: pinElement.element,
  });
  
  AppState.markers.push(marker);
  AppState.map.panTo(point);
  AppState.map.fitBounds(AppState.bounds);

  const content = document.createElement('div');
  content.innerHTML = `<b>${args.name}</b><br/>${args.description}`;
  const popup = new window.Popup(new google.maps.LatLng(point.lat, point.lng), content);

  const {data} = await AppState.streetViewService.getPanorama({
    location: point,
    radius: 50,
    source: google.maps.StreetViewSource.OUTDOOR,
  }).catch(() => ({data: null}));
  const streetViewAvailable = !!(data && data.location && data.location.latLng);

  const eventInfo = {
    type: 'event' as const,
    name: args.name,
    description: args.description,
    position: new google.maps.LatLng(point.lat, point.lng),
    popup,
    content,
    imageUrl: args.imageUrl,
    eventDate: args.date,
    address: args.address,
    streetViewAvailable,
  };
  AppState.popUps.push(eventInfo);
}


export async function setLeg(args: any) {
  const start = {lat: Number(args.start.lat), lng: Number(args.start.lng)};
  const end = {lat: Number(args.end.lat), lng: Number(args.end.lng)};
  AppState.points.push(start, end);
  AppState.bounds.extend(start);
  AppState.bounds.extend(end);
  AppState.map.fitBounds(AppState.bounds);

  const poly = new google.maps.Polyline({strokeOpacity: 0.0, strokeWeight: 3, map: AppState.map});
  const geodesicPoly = new google.maps.Polyline({
    strokeColor: AppState.isPlannerMode ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-tertiary)',
    strokeOpacity: 1.0, strokeWeight: AppState.isPlannerMode ? 4 : 3, map: AppState.map,
  });

  if (AppState.isPlannerMode) {
    geodesicPoly.setOptions({ icons: [{ icon: {path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3}, offset: '0', repeat: '15px' }]});
  }

  const path = [start, end];
  poly.setPath(path);
  geodesicPoly.setPath(path);
  AppState.lines.push({ poly, geodesicPoly, name: args.name, transport: args.transport, travelTime: args.travelTime });
}


export function clearMapData() {
  AppState.points.length = 0;
  AppState.setBounds(new google.maps.LatLngBounds());
  AppState.itinerary.length = 0;
  Object.keys(AppState.travelDiary).forEach(key => delete AppState.travelDiary[key]);
  stopCurrentAudio();

  AppState.markers.forEach((marker) => marker.setMap(null));
  AppState.markers.length = 0;

  AppState.lines.forEach((line) => {
    line.poly.setMap(null);
    line.geodesicPoly.setMap(null);
  });
  AppState.lines.length = 0;

  AppState.popUps.forEach((popup) => {
    popup.popup.setMap(null);
    if (popup.content && popup.content.remove) popup.content.remove();
  });
  AppState.popUps.length = 0;

  if (AppState.DOM.cardContainer) AppState.DOM.cardContainer.innerHTML = '';
  if (AppState.DOM.carouselIndicators) AppState.DOM.carouselIndicators.innerHTML = '';
  if (AppState.DOM.cardCarousel) AppState.DOM.cardCarousel.style.display = 'none';
  if (AppState.DOM.diaryEntries) AppState.DOM.diaryEntries.innerHTML = '';
  if (AppState.DOM.totalDurationEl) AppState.DOM.totalDurationEl.innerText = '';
  if (AppState.DOM.diaryContainer) hideDiary();
  if (AppState.DOM.playTourButton) AppState.DOM.playTourButton.disabled = true;
  hideStreetView();
  closeLocationChat();
}
