import { ai } from '../api/gemini';
import * as AppState from '../state';
import { addAudioTourToDiary } from './diary';

export function stopCurrentAudio() {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    if (AppState.currentSpeechUtterance) {
        AppState.currentSpeechUtterance.onend = null;
        AppState.setCurrentSpeechUtterance(null);
    }
    if (AppState.currentlyPlayingAudioIndex !== null) {
        updateAudioPlaybackUI(AppState.currentlyPlayingAudioIndex, 'idle');
        AppState.setCurrentlyPlayingAudioIndex(null);
    }
}

export function toggleAudioPlayback() {
    if (!AppState.currentSpeechUtterance) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
    } else {
        window.speechSynthesis.resume();
    }
}

export function updateAudioPlaybackUI(index: number, state: 'loading' | 'playing' | 'paused' | 'idle') {
    const playbackContainer = document.getElementById(`audio-playback-${index}`);
    if (!playbackContainer) return;

    switch (state) {
        case 'loading':
            playbackContainer.innerHTML = `<button class="action-button" disabled><i class="fas fa-spinner fa-spin"></i> Generating...</button>`;
            break;
        case 'playing':
            playbackContainer.innerHTML = `
                <button class="action-button audio-play-pause-button" data-index="${index}"><i class="fas fa-pause"></i></button>
                <div class="audio-progress-bar-container"><div class="audio-progress-bar"></div></div>`;
            break;
        case 'paused':
            playbackContainer.innerHTML = `
                <button class="action-button audio-play-pause-button" data-index="${index}"><i class="fas fa-play"></i></button>
                <div class="audio-progress-bar-container"><div class="audio-progress-bar"></div></div>`;
            break;
        case 'idle':
            playbackContainer.innerHTML = '';
            break;
    }
}

export function playAudioTour(tourText: string, locationIndex: number) {
    stopCurrentAudio();
    if (!tourText) return;

    const utterance = new SpeechSynthesisUtterance(tourText);
    if (AppState.preferredVoice) {
      utterance.voice = AppState.preferredVoice;
    }
    AppState.setCurrentSpeechUtterance(utterance);
    AppState.setCurrentlyPlayingAudioIndex(locationIndex);
    
    utterance.onstart = () => {
        updateAudioPlaybackUI(locationIndex, 'playing');
    };
    utterance.onpause = (event) => {
        updateAudioPlaybackUI(locationIndex, 'paused');
        const progressBar = document.querySelector(`#audio-playback-${locationIndex} .audio-progress-bar`) as HTMLDivElement;
        if (progressBar) {
            const progress = (event.charIndex) / (event.utterance.text.length || 1);
            progressBar.style.width = `${progress * 100}%`;
        }
    };
    utterance.onresume = () => {
        updateAudioPlaybackUI(locationIndex, 'playing');
    };
    utterance.onboundary = (event) => {
        if (event.name === 'word') {
             const progressBar = document.querySelector(`#audio-playback-${locationIndex} .audio-progress-bar`) as HTMLDivElement;
             if (progressBar) {
                const progress = (event.charIndex + event.charLength) / tourText.length;
                progressBar.style.width = `${progress * 100}%`;
             }
        }
    };
    utterance.onend = () => {
        updateAudioPlaybackUI(locationIndex, 'idle');
        AppState.setCurrentSpeechUtterance(null);
        AppState.setCurrentlyPlayingAudioIndex(null);
    };
    window.speechSynthesis.speak(utterance);
}

export async function generateAndPlayAudioTour(locationIndex: number, length: 'short' | 'medium' | 'long') {
    stopCurrentAudio();
    const location = AppState.popUps[locationIndex];
    if (!location) return;

    AppState.setCurrentlyPlayingAudioIndex(locationIndex);
    updateAudioPlaybackUI(locationIndex, 'loading');

    try {
        const prompt = `Create a ${length} audio tour script for a tourist visiting ${location.name}. The location is described as: ${location.description}. The script should be engaging, informative, and suitable for listening. Do not include any special formatting, just the plain text to be spoken.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const tourText = response.text;

        if (tourText) {
            addAudioTourToDiary(locationIndex, length, tourText);
            playAudioTour(tourText, locationIndex);
        } else {
             updateAudioPlaybackUI(locationIndex, 'idle');
        }
    } catch (e) {
        console.error('Audio tour generation failed:', e);
        AppState.DOM.errorMessage.innerHTML = 'Could not generate audio tour.';
        updateAudioPlaybackUI(locationIndex, 'idle');
    }
}