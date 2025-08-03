



import {
  initMainChat,
} from './api/gemini';
import { initMap } from './api/googleMaps';
import { initializeEventListeners } from './events';
import { checkShowWelcomeModal } from './ui/modals/preferences';
import { clearMapData, setLeg, setPin } from './ui/map';
import {
  DOM,
  mainChat,
  isPlannerMode,
  isEventsMode,
  isFirstSearch,
  setIsFirstSearch,
  userPreferences,
  popUps,
  itinerary,
} from './state';
import { updateLayouts } from './ui/layout';
import { createLocationCards, highlightCard } from './ui/cards';
import {
  calculateAndDisplayTotalDuration,
  renderDiary,
  showDiary,
} from './ui/diary';
import { hideStreetView } from './ui/tour';
import { closeLocationChat } from './ui/modals/locationChat';
import { fetchEvents } from './api/events';

async function findLocations(prompt: string) {
  let finalPrompt = prompt;
  const preferencesContext = userPreferences
    ? `The user has provided their travel preferences. Use these to tailor your suggestions. Preferences: ${userPreferences}. `
    : '';

  if (isPlannerMode) {
    const transportCheckboxes =
      document.querySelectorAll<HTMLInputElement>(
        '#transport-selector input:checked',
      );
    const selectedTransport =
      Array.from(transportCheckboxes)
        .map((cb) => cb.value)
        .join(', ') || 'any';
    const mealBudget = DOM.mealBudgetSlider.value;
    finalPrompt = `${preferencesContext}Plan a day trip for: "${prompt}". The user prefers to travel by ${selectedTransport}. Their meal budget is around $${mealBudget} per person.`;
  } else {
    finalPrompt = `${preferencesContext}Based on their query "${prompt}", suggest some relevant places.`;
  }

  const response = await mainChat.sendMessageStream({
    message: finalPrompt,
  });

  let hasLocationResults = false;
  for await (const chunk of response) {
    const fns = chunk.functionCalls ?? [];
    for (const fn of fns) {
      if (fn.name === 'location') {
        await setPin(fn.args);
        hasLocationResults = true;
      }
      if (fn.name === 'line') {
        await setLeg(fn.args);
        hasLocationResults = true;
      }
    }
  }
  return hasLocationResults;
}


export async function sendMainChatMessage() {
  const prompt = DOM.promptInput.value;
  if (!prompt.trim()) return;

  DOM.spinner.classList.remove('hidden');
  DOM.errorMessage.innerHTML = '';
  clearMapData();
  if (DOM.playTourButton) DOM.playTourButton.disabled = true;

  try {
    const promises: Promise<any>[] = [findLocations(prompt)];
    if(isEventsMode) {
      promises.push(fetchEvents(prompt));
    }

    const results = await Promise.all(promises);
    const hasAnyResults = results.some(result => result);

    if (isFirstSearch) {
      DOM.leftPanel.classList.remove('visible');
      updateLayouts();
      setIsFirstSearch(false);
    }

    if (!hasAnyResults) {
      throw new Error('Could not generate any results. Try a different prompt.');
    }

    if (isPlannerMode && itinerary.length > 0) {
      itinerary.sort(
        (a, b) =>
          (a.sequence || Infinity) - (b.sequence || Infinity) ||
          (a.time || '').localeCompare(b.time || ''),
      );
      calculateAndDisplayTotalDuration();
      renderDiary();
      showDiary();
      if (DOM.playTourButton) DOM.playTourButton.disabled = false;
    }
    
    // Sort all popups by sequence if in planner mode, otherwise leave as is
    if (isPlannerMode) {
      popUps.sort((a,b) => (a.sequence || Infinity) - (b.sequence || Infinity));
    }

    createLocationCards();
    if (popUps.length > 0) highlightCard(0);
  } catch (e) {
    DOM.errorMessage.innerHTML = e.message;
    console.error('Error generating content:', e);
  } finally {
    DOM.generateButton.classList.remove('loading');
    DOM.spinner.classList.add('hidden');
  }
}

export function restart() {
  clearMapData();
  initMainChat();
  DOM.promptInput.value = '';
  if (!DOM.leftPanel.classList.contains('visible')) {
    DOM.leftPanel.classList.add('visible');
    updateLayouts();
  }
  setIsFirstSearch(true);
}

// App Initialization
async function main() {
  await initMap();
  initMainChat();
  initializeEventListeners();
  checkShowWelcomeModal();
}

main();