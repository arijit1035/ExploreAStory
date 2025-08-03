import * as AppState from '../state';

export function showStreetView(position: google.maps.LatLng, index: number) {
  if (!AppState.DOM.streetViewContainer || !AppState.panorama) return;
  AppState.setCurrentStreetViewLocationIndex(index);
  if (AppState.DOM.tourControls) AppState.DOM.tourControls.classList.add('hidden');
  AppState.panorama.setPosition(position);
  AppState.DOM.streetViewContainer.classList.remove('hidden');
  setTimeout(() => AppState.panorama.setVisible(true), 100);
}

export function hideStreetView() {
  if (!AppState.DOM.streetViewContainer || !AppState.panorama) return;
  AppState.panorama.setVisible(false);
  AppState.DOM.streetViewContainer.classList.add('hidden');
  AppState.setCurrentStreetViewLocationIndex(null);
}

export function startTour() {
  if (AppState.itinerary.length < 1) return;
  AppState.setIsTourActive(true);
  AppState.setCurrentTourIndex(0);
  showStreetView(AppState.itinerary[0].position, 0);
  AppState.DOM.tourControls.classList.remove('hidden');
  updateTourStep();
  playTour();
}

export function endTour() {
  AppState.setIsTourActive(false);
  pauseTour();
  AppState.DOM.tourControls.classList.add('hidden');
  hideStreetView();
}

export function updateTourStep() {
  if (!AppState.isTourActive || !AppState.itinerary[AppState.currentTourIndex]) return;
  const location = AppState.itinerary[AppState.currentTourIndex];
  AppState.panorama.setPosition(location.position);
  AppState.DOM.tourLocationName.textContent = `${AppState.currentTourIndex + 1}. ${location.name}`;
  AppState.DOM.tourProgressBar.style.width = `${((AppState.currentTourIndex + 1) / AppState.itinerary.length) * 100}%`;
  AppState.DOM.tourPrevButton.disabled = AppState.currentTourIndex === 0;
  AppState.DOM.tourNextButton.disabled = AppState.currentTourIndex === AppState.itinerary.length - 1;
}

export function advanceTour(direction: number) {
  pauseTour();
  const newIndex = AppState.currentTourIndex + direction;
  if (newIndex >= 0 && newIndex < AppState.itinerary.length) {
    AppState.setCurrentTourIndex(newIndex);
    updateTourStep();
  }
}

export function toggleTourPlayback() {
  if (AppState.tourPlaybackInterval) pauseTour();
  else {
    if (AppState.currentTourIndex === AppState.itinerary.length - 1) AppState.setCurrentTourIndex(0);
    updateTourStep();
    playTour();
  }
}

export function playTour() {
  if (AppState.tourPlaybackInterval) clearInterval(AppState.tourPlaybackInterval);
  AppState.DOM.tourPlayPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
  const interval = window.setInterval(() => {
    if (AppState.currentTourIndex + 1 < AppState.itinerary.length) {
      AppState.setCurrentTourIndex(AppState.currentTourIndex + 1);
      updateTourStep();
    } else {
      pauseTour();
    }
  }, AppState.TOUR_INTERVAL_SECONDS * 1000);
  AppState.setTourPlaybackInterval(interval);
}

export function pauseTour() {
  if (AppState.tourPlaybackInterval) clearInterval(AppState.tourPlaybackInterval);
  AppState.setTourPlaybackInterval(null);
  AppState.DOM.tourPlayPauseButton.innerHTML = '<i class="fas fa-play"></i>';
}
