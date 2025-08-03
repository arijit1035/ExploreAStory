import * as AppState from '../state';
import { updateLayouts } from './layout';
import { parseDurationToMinutes, getTransportIcon, createTicketLink } from '../utils';
import { playAudioTour } from './audio';
import { createLocationCards, highlightCard } from './cards';

export function showDiary() {
  if (AppState.DOM.diaryContainer) {
    AppState.DOM.diaryContainer.style.display = 'block';
    setTimeout(() => {
      AppState.DOM.diaryContainer.classList.add('visible');
      if (window.innerWidth > 768) {
        updateLayouts();
      } else {
        AppState.DOM.mapOverlay.classList.add('visible');
      }
    }, 10);
  }
}

export function hideDiary() {
  if (AppState.DOM.diaryContainer) {
    AppState.DOM.diaryContainer.classList.remove('visible');
    AppState.DOM.mapOverlay.classList.remove('visible');
    updateLayouts();
    setTimeout(() => {
      AppState.DOM.diaryContainer.style.display = 'none';
    }, 300);
  }
}

export function calculateAndDisplayTotalDuration() {
  if (!AppState.DOM.totalDurationEl) return;
  let totalMinutes = AppState.itinerary.reduce((sum, item) => sum + parseDurationToMinutes(item.duration), 0);
  totalMinutes += AppState.lines.reduce((sum, line) => sum + parseDurationToMinutes(line.travelTime), 0);

  if (totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let durationText = 'Total: ';
    if (hours > 0) durationText += `${hours}h `;
    if (minutes > 0) durationText += `${minutes}m`;
    AppState.DOM.totalDurationEl.textContent = durationText.trim();
  } else {
    AppState.DOM.totalDurationEl.textContent = '';
  }
}

export function renderDiary() {
    const { diaryEntries, totalDurationEl, playTourButton } = AppState.DOM;
    if (!diaryEntries) return;
    diaryEntries.innerHTML = '';
    if (AppState.itinerary.length === 0) {
        diaryEntries.innerHTML = `<div class="diary-empty-state"><i class="fas fa-map-marked-alt"></i><h4>Your Diary is Empty</h4><p>Use "Auto-plan Itinerary" or add places from the map to start your diary.</p></div>`;
        if (totalDurationEl) totalDurationEl.textContent = '';
        if (playTourButton) playTourButton.disabled = true;
        return;
    }
    
    if(playTourButton) playTourButton.disabled = AppState.itinerary.length < 2;

    AppState.itinerary.forEach((item, index) => {
        const diaryData = AppState.travelDiary[item.name] || { notes: '', scans: [], audioTours: [] };
        const diaryItem = document.createElement('div');
        diaryItem.className = 'diary-item';
        const timeDisplay = item.time || 'Flexible';

        let detailsHtml = '';
        if (item.openingTime || item.price) {
            detailsHtml += '<div class="diary-details">';
            if (item.openingTime) detailsHtml += `<div class="diary-detail-item"><i class="fas fa-clock"></i> ${item.openingTime} - ${item.closingTime || 'N/A'}</div>`;
            if (item.price) detailsHtml += `<div class="diary-detail-item"><i class="fas fa-dollar-sign"></i> ${item.price}${createTicketLink(item.price, item.name)}</div>`;
            detailsHtml += '</div>';
        }

        const originalPopUpIndex = AppState.popUps.findIndex(p => p.name === item.name);

        diaryItem.innerHTML = `
            <div class="diary-time">${timeDisplay}</div>
            <div class="diary-connector"><div class="diary-dot"></div><div class="diary-line"></div></div>
            <div class="diary-content" data-index="${index}" data-popup-index="${originalPopUpIndex}">
                <div class="diary-title">${item.name}</div>
                <div class="diary-description">${item.description}</div>
                ${detailsHtml}
                ${item.duration ? `<div class="diary-duration">${item.duration}</div>` : ''}
                
                <div class="diary-section diary-notes">
                    <h4 class="diary-section-title">My Notes</h4>
                    <textarea class="diary-note-input" placeholder="Add your notes here..." data-location-name="${item.name}">${diaryData.notes}</textarea>
                </div>

                ${diaryData.scans.length > 0 ? `
                <div class="diary-section diary-scans">
                    <h4 class="diary-section-title">My Scans</h4>
                    <div class="diary-scans-grid">
                        ${diaryData.scans.map(scan => `<div class="scan-item" data-description="${scan.description}"><img src="${scan.image}" alt="Scanned image"></div>`).join('')}
                    </div>
                </div>` : ''}

                ${diaryData.audioTours.length > 0 ? `
                <div class="diary-section diary-audiotours">
                    <h4 class="diary-section-title">Audio Tours</h4>
                    <div class="diary-audiotour-list">
                        ${diaryData.audioTours.map(tour => `<button class="play-tour-from-diary" data-location-name="${item.name}" data-tour-length="${tour.length}">Play ${tour.length} tour</button>`).join('')}
                    </div>
                </div>` : ''}
            </div>`;
        diaryEntries.appendChild(diaryItem);
    });
    insertTransportItemsInDiary();
}

function insertTransportItemsInDiary() {
    if (AppState.lines.length === 0 || !AppState.isPlannerMode) return;
    const diaryItems = AppState.DOM.diaryEntries.querySelectorAll('.diary-item');
    for (let i = 0; i < diaryItems.length - 1; i++) {
      const currentItem = AppState.itinerary[i];
      const nextItem = AppState.itinerary[i + 1];
      const connectingLine = AppState.lines.find(line => line.name.includes(currentItem.name) || line.name.includes(nextItem.name));
      if (connectingLine && (connectingLine.transport || connectingLine.travelTime)) {
        const transportItem = document.createElement('div');
        transportItem.className = 'diary-item transport-item';
        transportItem.innerHTML = `
          <div class="diary-time"></div>
          <div class="diary-connector"><div class="diary-dot" style="background-color: #999;"></div><div class="diary-line"></div></div>
          <div class="diary-content transport">
            <div class="diary-title"><i class="fas fa-${getTransportIcon(connectingLine.transport || 'travel')}"></i> ${connectingLine.transport || 'Travel'}</div>
            <div class="diary-description">${connectingLine.name}</div>
            ${connectingLine.travelTime ? `<div class="diary-duration">${connectingLine.travelTime}</div>` : ''}
          </div>`;
        diaryItems[i].after(transportItem);
      }
    }
}

export function highlightDiaryItem(cardIndex: number) {
  if (!AppState.DOM.diaryEntries) return;
  const diaryItems = AppState.DOM.diaryEntries.querySelectorAll('.diary-content:not(.transport)');
  diaryItems.forEach(item => item.classList.remove('active'));
  const location = AppState.popUps[cardIndex];
  if (!location) return;
  for (const item of diaryItems) {
    if (item.querySelector('.diary-title')?.textContent === location.name) {
      item.classList.add('active');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      break;
    }
  }
}

export function exportDiary() {
    if (!AppState.itinerary.length) return;
    let content = `# My Travel Diary\n\n${AppState.DOM.totalDurationEl?.textContent || ''}\n\n`;
    AppState.itinerary.forEach((item, index) => {
        const diaryData = AppState.travelDiary[item.name] || { notes: '', scans: [], audioTours: [] };
        content += `## ${index + 1}. ${item.name}\nTime: ${item.time || 'Flexible'}\n`;
        if (item.duration) content += `Duration: ${item.duration}\n`;
        if (item.openingTime) content += `Hours: ${item.openingTime} - ${item.closingTime || 'N/A'}\n`;
        if (item.price) content += `Price: ${item.price}\n`;
        content += `\n${item.description}\n\n`;

        if (diaryData.notes) content += `### My Notes\n${diaryData.notes}\n\n`;
        if (diaryData.scans.length > 0) {
            content += '### My Scans\n';
            diaryData.scans.forEach(scan => {
                content += `- Image scan: ${scan.description}\n`;
            });
            content += '\n';
        }
        if (diaryData.audioTours.length > 0) {
            content += '### Audio Tours\n';
            diaryData.audioTours.forEach(tour => {
                content += `#### ${tour.length.charAt(0).toUpperCase() + tour.length.slice(1)} Tour Script\n${tour.text}\n\n`;
            });
        }

        if (index < AppState.itinerary.length - 1) {
            const next = AppState.itinerary[index + 1];
            const line = AppState.lines.find(l => l.name.includes(item.name) || l.name.includes(next.name));
            if (line) content += `### Travel to ${next.name}\nMethod: ${line.transport || 'N/A'}\nTime: ${line.travelTime || 'N/A'}\n\n`;
        }
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type: 'text/plain;charset=utf-8'}));
    a.download = 'travel-diary.txt';
    a.click();
    URL.revokeObjectURL(a.href);
}


// --- DIARY DATA FUNCTIONS ---
export function addToDiary(locationIndex: number) {
    const location = AppState.popUps[locationIndex];
    if (!location) return;

    if (!AppState.itinerary.some(item => item.name === location.name)) {
        AppState.itinerary.push(location);
        if (AppState.isPlannerMode) {
            AppState.itinerary.sort((a, b) => (a.sequence || Infinity) - (b.sequence || Infinity));
        }
    }

    if (!AppState.travelDiary[location.name]) {
        AppState.travelDiary[location.name] = { notes: '', scans: [], audioTours: [] };
    }
    
    createLocationCards();
    renderDiary();
    const currentCard = AppState.DOM.cardContainer.querySelector(`.location-card[data-index="${locationIndex}"]`);
    if(currentCard) {
        highlightCard(locationIndex);
    }
}

export function addScanToDiary(locationIndex: number, image: string, description: string) {
    const location = AppState.popUps[locationIndex];
    if (!location) return;
    addToDiary(locationIndex);
    AppState.travelDiary[location.name].scans.push({ image, description });
    renderDiary();
}

export function addAudioTourToDiary(locationIndex: number, length: 'short'|'medium'|'long', text: string) {
    const location = AppState.popUps[locationIndex];
    if (!location) return;
    addToDiary(locationIndex);
    if (!AppState.travelDiary[location.name].audioTours.some(t => t.length === length)) {
        AppState.travelDiary[location.name].audioTours.push({ length, text });
    }
    renderDiary();
}

export function updateNoteInDiary(locationName: string, text: string) {
    if (AppState.travelDiary[locationName]) {
        AppState.travelDiary[locationName].notes = text;
    }
}
