import * as AppState from '../state';
import { getPlaceholderImage, createTicketLink } from '../utils';
import { createActionsHtml } from './actions';
import { highlightDiaryItem } from './diary';


export function createLocationCards() {
  const { cardContainer, carouselIndicators, cardCarousel } = AppState.DOM;
  if (!cardContainer || !carouselIndicators || AppState.popUps.length === 0) return;
  cardContainer.innerHTML = '';
  carouselIndicators.innerHTML = '';
  cardCarousel.style.display = 'block';

  AppState.popUps.forEach((location, index) => {
    const card = document.createElement('div');
    card.className = 'location-card';
    card.setAttribute('data-index', index.toString());

    const placeholderUrl = getPlaceholderImage(location.name);
    const imageUrl = location.imageUrl || placeholderUrl;
    
    let cardInnerHtml = '';

    if (location.type === 'event') {
        let detailsHtml = '<div class="card-details">';
        if (location.eventDate) detailsHtml += `<div class="card-detail-item"><i class="fas fa-calendar-alt"></i> ${location.eventDate}</div>`;
        if (location.address) detailsHtml += `<div class="card-detail-item"><i class="fas fa-map-marker-alt"></i> ${location.address}</div>`;
        detailsHtml += '</div>';

        cardInnerHtml = `
          <div class="card-image-container">
            <img src="${imageUrl}" class="card-image" alt="${location.name}" onerror="this.onerror=null;this.src='${placeholderUrl}';">
            <div class="card-event-badge">Event</div>
          </div>
          <div class="card-body">
            <div class="card-content">
              <h3 class="card-title">${location.name}</h3>
              <p class="card-description">${location.description}</p>
              ${detailsHtml}
            </div>
            <div class="card-actions">
              ${createActionsHtml(index)}
              <div class="audio-playback-container" id="audio-playback-${index}"></div>
            </div>
          </div>
        `;
    } else { // It's a 'location'
        if (AppState.isPlannerMode) card.classList.add('day-planner-card');
        const inDiary = AppState.itinerary.some(item => item.name === location.name);
        let detailsHtml = '';
        if (location.openingTime || location.price) {
          detailsHtml += '<div class="card-details">';
          if (location.openingTime) detailsHtml += `<div class="card-detail-item"><i class="fas fa-clock"></i> ${location.openingTime} - ${location.closingTime || 'N/A'}</div>`;
          if (location.price) detailsHtml += `<div class="card-detail-item"><i class="fas fa-dollar-sign"></i> ${location.price}${createTicketLink(location.price, location.name)}</div>`;
          detailsHtml += '</div>';
        }
        cardInnerHtml = `
          <div class="card-image-container">
            <img src="${imageUrl}" class="card-image" alt="${location.name}" onerror="this.onerror=null;this.src='${placeholderUrl}';">
            ${AppState.isPlannerMode && location.sequence ? `<div class="card-sequence-badge">${location.sequence}</div>` : ''}
          </div>
          <div class="card-body">
            <div class="card-content">
              <h3 class="card-title">${location.name}</h3>
              <p class="card-description">${location.description}</p>
              ${detailsHtml}
              ${AppState.isPlannerMode && (location.time || location.duration) ? `
                <div class="card-planner-details">
                    ${location.time ? `<span><i class="fas fa-clock"></i> ${location.time}</span>` : ''}
                    ${location.duration ? `<span><i class="fas fa-hourglass-half"></i> ${location.duration}</span>` : ''}
                </div>` : ''}
            </div>
            <div class="card-actions">
              ${createActionsHtml(index, location.streetViewAvailable, inDiary)}
              <div class="audio-playback-container" id="audio-playback-${index}"></div>
            </div>
          </div>
        `;
    }

    card.innerHTML = cardInnerHtml;

    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.action-button') || target.closest('.dropdown-item') || target.closest('.action-dropdown') || target.closest('a')) return;
      highlightCard(index);
      AppState.map.panTo(location.position);
      if (AppState.isPlannerMode && AppState.DOM.diaryEntries) highlightDiaryItem(index);
    });
    cardContainer.appendChild(card);

    const dot = document.createElement('div');
    dot.className = 'carousel-dot';
    carouselIndicators.appendChild(dot);
  });
  if (cardCarousel && AppState.popUps.length > 0) cardCarousel.style.display = 'block';
}

export function highlightCard(index: number) {
  AppState.setActiveCardIndex(index);
  const cards = AppState.DOM.cardContainer?.querySelectorAll('.location-card');
  if (!cards) return;

  cards.forEach(card => card.classList.remove('card-active'));
  if (cards[index]) {
    cards[index].classList.add('card-active');
    const cardElement = cards[index] as HTMLElement;
    AppState.DOM.cardContainer.scrollTo({ left: cardElement.offsetLeft - AppState.DOM.cardContainer.offsetWidth / 2 + cardElement.offsetWidth / 2, behavior: 'smooth' });
  }

  AppState.DOM.carouselIndicators?.querySelectorAll('.carousel-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
  AppState.popUps.forEach((p, i) => p.popup.setMap(i === index ? AppState.map : null));
  if (AppState.isPlannerMode) highlightDiaryItem(index);
}

export function navigateCards(direction: number) {
  const newIndex = AppState.activeCardIndex + direction;
  if (newIndex >= 0 && newIndex < AppState.popUps.length) {
    highlightCard(newIndex);
    AppState.map.panTo(AppState.popUps[newIndex].position);
  }
}