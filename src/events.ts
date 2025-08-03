import { restart, sendMainChatMessage } from './main';
import { DOM, setPlannerMode, setEventsMode, activeCardIndex, popUps, itinerary, map } from './state';
import { navigateCards, highlightCard } from './ui/cards';
import { updateLayouts } from './ui/layout';
import { initMainChat } from './api/gemini';
import {
  hideDiary,
  renderDiary,
  showDiary,
  exportDiary,
  updateNoteInDiary,
} from './ui/diary';
import { hideStreetView, endTour, startTour, advanceTour, toggleTourPlayback, showStreetView } from './ui/tour';
import { handlePreferencesSubmit, showPreferencesModal, initializePreferenceFormListeners } from './ui/modals/preferences';
import { closeLocationChat, openLocationChat, sendLocationChatMessage } from './ui/modals/locationChat';
import { openVisualSearch, closeVisualSearch, captureAndAnalyzeImage } from './ui/modals/visualSearch';
import { generateAndPlayAudioTour, toggleAudioPlayback, playAudioTour } from './ui/audio';
import { addToDiary } from './ui/diary';
import * as AppState from './state';

function handleActionButtons(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownTrigger = target.closest('.action-dropdown > .action-button');
  const actionItem = target.closest('.dropdown-item') || target.closest('.audio-play-pause-button') || target.closest('.add-to-diary-button') || target.closest('a.action-button');

  if (dropdownTrigger) {
    const parent = dropdownTrigger.parentElement;
    const currentlyOpen = document.querySelector('.action-dropdown.show-menu');
    if (currentlyOpen && currentlyOpen !== parent) {
      currentlyOpen.classList.remove('show-menu');
    }
    parent?.classList.toggle('show-menu');
    return;
  }
  
  if (!actionItem) return;

  const card = actionItem.closest('.location-card') || actionItem.closest('.diary-content');
  const indexStr = card?.getAttribute('data-index') || actionItem.getAttribute('data-index');
  if (indexStr === null) return;
  
  const index = parseInt(indexStr, 10);
  const popup = AppState.popUps[index];
  if (!popup) return;


  if (actionItem.classList.contains('chat-action-button')) {
    openLocationChat(index);
  } else if (actionItem.classList.contains('street-view-action-button')) {
    showStreetView(popUps[index].position, index);
  } else if (actionItem.classList.contains('scan-action-button')) {
    openVisualSearch(index);
  } else if (actionItem.classList.contains('add-to-diary-button')) {
    addToDiary(index);
  } else if (actionItem.classList.contains('audio-tour-action-button')) {
    const length = actionItem.getAttribute('data-length') as 'short' | 'medium' | 'long';
    generateAndPlayAudioTour(index, length);
  } else if (actionItem.classList.contains('audio-play-pause-button')) {
    toggleAudioPlayback();
  }
  
  // Close menu after action
  actionItem.closest('.action-dropdown')?.classList.remove('show-menu');
}


export function initializeEventListeners() {
  DOM.promptInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      DOM.generateButton.classList.add('loading');
      setTimeout(() => {
        sendMainChatMessage();
        DOM.promptInput.value = '';
        DOM.promptInput.style.height = 'auto';
      }, 10);
    }
  });

  DOM.generateButton.addEventListener('click', (e) => {
    const buttonEl = e.currentTarget as HTMLButtonElement;
    buttonEl.classList.add('loading');
    setTimeout(() => sendMainChatMessage(), 10);
  });

  DOM.resetButton.addEventListener('click', restart);
  if (DOM.prevCardButton) DOM.prevCardButton.addEventListener('click', () => navigateCards(-1));
  if (DOM.nextCardButton) DOM.nextCardButton.addEventListener('click', () => navigateCards(1));

  DOM.menuToggleButton.addEventListener('click', () => {
      DOM.leftPanel.classList.toggle('visible');
      updateLayouts();
  });

  if (DOM.plannerModeToggle) {
    DOM.plannerModeToggle.addEventListener('change', () => {
      setPlannerMode(DOM.plannerModeToggle.checked);
      DOM.preferencesPanel.style.display = AppState.isPlannerMode ? 'flex' : 'none';
      DOM.promptInput.placeholder = AppState.isPlannerMode ? "Plan a day in... (e.g. 'One day in Paris')" : 'Explore places, history, events...';
      if (!AppState.isPlannerMode && DOM.diaryContainer) hideDiary();
      initMainChat();
    });
  }
  
  if (DOM.eventsModeToggle) {
    DOM.eventsModeToggle.addEventListener('change', () => {
      setEventsMode(DOM.eventsModeToggle.checked);
    });
  }

  if(DOM.mealBudgetSlider) {
    DOM.mealBudgetSlider.addEventListener('input', (e) => {
        if(DOM.mealBudgetValue) DOM.mealBudgetValue.textContent = `$${(e.target as HTMLInputElement).value}`;
    });
  }

  if (DOM.closeDiaryButton) DOM.closeDiaryButton.addEventListener('click', hideDiary);
  if (DOM.positionDiaryButton) {
    DOM.positionDiaryButton.addEventListener('click', () => {
      if (!DOM.leftPanel.classList.contains('visible')) {
          DOM.diaryContainer.classList.toggle('left');
          updateLayouts();
      } else if (DOM.diaryContainer.classList.contains('left')) {
          DOM.diaryContainer.classList.remove('left');
          updateLayouts();
      }
    });
  }

  if (DOM.openDiaryButton) {
    DOM.openDiaryButton.addEventListener('click', () => {
      if (DOM.diaryContainer.classList.contains('visible')) {
        hideDiary();
        return;
      }
      renderDiary();
      showDiary();
    });
  }

  if (DOM.mapOverlay) DOM.mapOverlay.addEventListener('click', hideDiary);
  if (DOM.exportDiaryButton) DOM.exportDiaryButton.addEventListener('click', exportDiary);
  if (DOM.closeStreetViewButton) DOM.closeStreetViewButton.addEventListener('click', () => AppState.isTourActive ? endTour() : hideStreetView());

  document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-dropdown') && !target.closest('a.action-button')) {
          document.querySelectorAll('.action-dropdown.show-menu').forEach(menu => {
              menu.classList.remove('show-menu');
          });
      }
  });

  DOM.cardContainer.addEventListener('click', handleActionButtons);

  DOM.diaryEntries.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const content = target.closest('.diary-content');
    if (content && !content.classList.contains('transport')) {
      const popupIndexStr = content.getAttribute('data-popup-index');
      if (popupIndexStr) {
          const popupIndex = parseInt(popupIndexStr, 10);
          if (popupIndex !== -1 && popUps[popupIndex]) {
              highlightCard(popupIndex);
              map.panTo(popUps[popupIndex].position);
          }
      }
    }
  });

  DOM.diaryEntries.addEventListener('input', (e) => {
    const target = e.target as HTMLTextAreaElement;
    if (target.classList.contains('diary-note-input')) {
        updateNoteInDiary(target.dataset.locationName, target.value);
    }
  });

  DOM.diaryEntries.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      if (target.classList.contains('play-tour-from-diary')) {
        const locationName = target.dataset.locationName;
        const tourLength = target.dataset.tourLength as 'short' | 'medium' | 'long';
        const locationIndex = popUps.findIndex(p => p.name === locationName);
        const tourData = AppState.travelDiary[locationName]?.audioTours.find(t => t.length === tourLength);
        if (locationIndex !== -1 && tourData) {
            playAudioTour(tourData.text, locationIndex);
        }
      }
  });

  if (DOM.preferencesForm) {
    DOM.preferencesForm.addEventListener('submit', handlePreferencesSubmit);
    initializePreferenceFormListeners();
  }
  if (DOM.skipPreferencesButton) DOM.skipPreferencesButton.addEventListener('click', () => DOM.welcomeModal.classList.add('hidden'));
  if (DOM.changePreferencesButton) DOM.changePreferencesButton.addEventListener('click', showPreferencesModal);

  DOM.closeLocationChatButton.addEventListener('click', closeLocationChat);
  DOM.locationChatSendButton.addEventListener('click', sendLocationChatMessage);
  DOM.locationChatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendLocationChatMessage(); }});
  DOM.locationChatInput.addEventListener('input', () => { DOM.locationChatInput.style.height = 'auto'; DOM.locationChatInput.style.height = `${DOM.locationChatInput.scrollHeight}px`; });

  if (DOM.playTourButton) DOM.playTourButton.addEventListener('click', startTour);
  if (DOM.tourPrevButton) DOM.tourPrevButton.addEventListener('click', () => advanceTour(-1));
  if (DOM.tourNextButton) DOM.tourNextButton.addEventListener('click', () => advanceTour(1));
  if (DOM.tourPlayPauseButton) DOM.tourPlayPauseButton.addEventListener('click', toggleTourPlayback);

  DOM.closeVisualSearchButton.addEventListener('click', closeVisualSearch);
  DOM.visualSearchCaptureButton.addEventListener('click', captureAndAnalyzeImage);

  DOM.promptInput.addEventListener('input', () => { DOM.promptInput.style.height = 'auto'; DOM.promptInput.style.height = `${DOM.promptInput.scrollHeight}px`; });

}