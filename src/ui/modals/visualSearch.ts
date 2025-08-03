import { ai } from '../../api/gemini';
import * as AppState from '../../state';
import { addScanToDiary, showDiary } from '../diary';

export async function openVisualSearch(locationIndex: number) {
  const location = AppState.popUps[locationIndex];
  if (!location) return;
  
  AppState.setCurrentStreetViewLocationIndex(locationIndex);
  AppState.DOM.visualSearchModal.classList.remove('hidden');
  AppState.DOM.visualSearchInner.classList.remove('results-mode');
  AppState.DOM.visualSearchResults.innerHTML = '';
  AppState.DOM.visualSearchSpinner.classList.add('hidden');
  AppState.DOM.visualSearchCaptureButton.disabled = false;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    AppState.setVisualSearchStream(stream);
    AppState.DOM.visualSearchVideo.srcObject = stream;
  } catch (err) {
    console.error('Error accessing camera:', err);
    AppState.DOM.visualSearchResults.innerHTML = '<p>Could not access camera. Please ensure permissions are granted.</p>';
  }
}

export function closeVisualSearch() {
  AppState.DOM.visualSearchModal.classList.add('hidden');
  if (AppState.visualSearchStream) {
    AppState.visualSearchStream.getTracks().forEach(track => track.stop());
    AppState.setVisualSearchStream(null);
  }
  AppState.DOM.visualSearchVideo.srcObject = null;
}

export async function captureAndAnalyzeImage() {
  if (AppState.currentStreetViewLocationIndex === null) return;
  const location = AppState.popUps[AppState.currentStreetViewLocationIndex];
  if (!location) return;

  AppState.DOM.visualSearchSpinner.classList.remove('hidden');
  AppState.DOM.visualSearchCaptureButton.disabled = true;

  const context = AppState.DOM.visualSearchCanvas.getContext('2d');
  AppState.DOM.visualSearchCanvas.width = AppState.DOM.visualSearchVideo.videoWidth;
  AppState.DOM.visualSearchCanvas.height = AppState.DOM.visualSearchVideo.videoHeight;
  context.drawImage(AppState.DOM.visualSearchVideo, 0, 0, AppState.DOM.visualSearchCanvas.width, AppState.DOM.visualSearchCanvas.height);

  const base64Data = AppState.DOM.visualSearchCanvas.toDataURL('image/jpeg');
  
  if (AppState.visualSearchStream) {
    AppState.visualSearchStream.getTracks().forEach(track => track.stop());
    AppState.setVisualSearchStream(null);
  }
  AppState.DOM.visualSearchVideo.srcObject = null;

  try {
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data.split(',')[1] } };
    const textPart = { text: `I am currently at ${location.name}. What is in this image? Provide a short and sweet description about it, including its history, any interesting details, or a wild fact if available. The description is for a travel diary.` };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    const description = response.text;
    
    AppState.DOM.visualSearchSpinner.classList.add('hidden');
    AppState.DOM.visualSearchInner.classList.add('results-mode');
    AppState.DOM.visualSearchResults.innerHTML = `
      <img src="${base64Data}" alt="Captured image" class="scanned-image-preview">
      <p>${description}</p>
      <div class="visual-search-results-actions">
        <button id="add-scan-to-diary-btn" class="action-button">Add to Diary & Close</button>
      </div>
    `;

    document.getElementById('add-scan-to-diary-btn')?.addEventListener('click', () => {
      addScanToDiary(AppState.currentStreetViewLocationIndex, base64Data, description);
      showDiary();
      closeVisualSearch();
    }, { once: true });

  } catch (e) {
    console.error('Visual search failed:', e);
    AppState.DOM.visualSearchSpinner.classList.add('hidden');
    AppState.DOM.visualSearchInner.classList.add('results-mode');
    AppState.DOM.visualSearchResults.innerHTML = `<p>Sorry, I could not identify what is in the image. You can close this window and try again.</p>`;
  }
}