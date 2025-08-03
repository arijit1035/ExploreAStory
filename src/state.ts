import { Chat } from "@google/genai";
import { Point, Line, PopUp, ItineraryItem, DiaryData } from './types';

// STATE
export let map: google.maps.Map;
export const setMap = (m: google.maps.Map) => map = m;

export let points: Point[] = [];
export let markers: google.maps.marker.AdvancedMarkerElement[] = [];
export let lines: Line[] = [];
export let popUps: PopUp[] = [];
export let itinerary: ItineraryItem[] = [];
export let travelDiary: { [key: string]: DiaryData } = {};

export let bounds: google.maps.LatLngBounds;
export const setBounds = (b: google.maps.LatLngBounds) => bounds = b;

export let activeCardIndex: number = 0;
export const setActiveCardIndex = (i: number) => activeCardIndex = i;

export let isPlannerMode: boolean = false;
export const setPlannerMode = (b: boolean) => isPlannerMode = b;

export let isEventsMode: boolean = false;
export const setEventsMode = (b: boolean) => isEventsMode = b;

export let streetViewService: google.maps.StreetViewService;
export const setStreetViewService = (s: google.maps.StreetViewService) => streetViewService = s;

export let panorama: google.maps.StreetViewPanorama;
export const setPanorama = (p: google.maps.StreetViewPanorama) => panorama = p;

export let mainChat: Chat | null = null;
export const setMainChat = (c: Chat) => mainChat = c;

export let activeLocationChat: Chat | null = null;
export const setActiveLocationChat = (c: Chat | null) => activeLocationChat = c;

export let currentSpeechUtterance: SpeechSynthesisUtterance | null = null;
export const setCurrentSpeechUtterance = (u: SpeechSynthesisUtterance | null) => currentSpeechUtterance = u;

export let preferredVoice: SpeechSynthesisVoice | null = null;
export const setPreferredVoice = (v: SpeechSynthesisVoice | null) => preferredVoice = v;

export let currentlyPlayingAudioIndex: number | null = null;
export const setCurrentlyPlayingAudioIndex = (i: number | null) => currentlyPlayingAudioIndex = i;

export let visualSearchStream: MediaStream | null = null;
export const setVisualSearchStream = (s: MediaStream | null) => visualSearchStream = s;

export let currentStreetViewLocationIndex: number | null = null;
export const setCurrentStreetViewLocationIndex = (i: number | null) => currentStreetViewLocationIndex = i;

export let userPreferences: string = '';
export const setUserPreferences = (p: string) => userPreferences = p;

export let isFirstSearch: boolean = true;
export const setIsFirstSearch = (b: boolean) => isFirstSearch = b;

export let isTourActive: boolean = false;
export const setIsTourActive = (b: boolean) => isTourActive = b;

export let currentTourIndex: number = 0;
export const setCurrentTourIndex = (i: number) => currentTourIndex = i;

export let tourPlaybackInterval: number | null = null;
export const setTourPlaybackInterval = (i: number | null) => tourPlaybackInterval = i;
export const TOUR_INTERVAL_SECONDS = 7;

// DOM
export const DOM = {
    leftPanel: document.querySelector('#left-panel') as HTMLDivElement,
    menuToggleButton: document.querySelector('#menu-toggle-button') as HTMLButtonElement,
    generateButton: document.querySelector('#main-chat-send') as HTMLButtonElement,
    resetButton: document.querySelector('#reset') as HTMLButtonElement,
    openDiaryButton: document.querySelector('#open-diary-button') as HTMLButtonElement,
    cardContainer: document.querySelector('#card-container') as HTMLDivElement,
    carouselIndicators: document.querySelector('#carousel-indicators') as HTMLDivElement,
    prevCardButton: document.querySelector('#prev-card') as HTMLButtonElement,
    nextCardButton: document.querySelector('#next-card') as HTMLButtonElement,
    cardCarousel: document.querySelector('.card-carousel') as HTMLDivElement,
    plannerModeToggle: document.querySelector('#planner-mode-toggle') as HTMLInputElement,
    eventsModeToggle: document.querySelector('#events-mode-toggle') as HTMLInputElement,
    preferencesPanel: document.querySelector('#preferences-panel') as HTMLDivElement,
    mealBudgetSlider: document.querySelector('#meal-budget-slider') as HTMLInputElement,
    mealBudgetValue: document.querySelector('#meal-budget-value') as HTMLSpanElement,
    diaryContainer: document.querySelector('#diary-container') as HTMLDivElement,
    diaryEntries: document.querySelector('#diary-entries') as HTMLDivElement,
    closeDiaryButton: document.querySelector('#close-diary') as HTMLButtonElement,
    exportDiaryButton: document.querySelector('#export-diary') as HTMLButtonElement,
    positionDiaryButton: document.querySelector('#position-diary') as HTMLButtonElement,
    mapContainer: document.querySelector('#map-container') as HTMLDivElement,
    mapOverlay: document.querySelector('#map-overlay') as HTMLElement,
    spinner: document.querySelector('#spinner') as HTMLElement,
    errorMessage: document.querySelector('#error-message') as HTMLElement,
    streetViewContainer: document.querySelector('#street-view-container') as HTMLDivElement,
    closeStreetViewButton: document.querySelector('#close-street-view') as HTMLButtonElement,
    streetViewPanoramaEl: document.querySelector('#street-view-panorama') as HTMLDivElement,
    totalDurationEl: document.querySelector('#total-duration') as HTMLSpanElement,
    locationChatModal: document.querySelector('#location-chat-modal') as HTMLDivElement,
    locationChatTitle: document.querySelector('#location-chat-title') as HTMLHeadingElement,
    closeLocationChatButton: document.querySelector('#close-location-chat') as HTMLButtonElement,
    locationChatMessagesContainer: document.querySelector('#location-chat-messages') as HTMLDivElement,
    locationChatInput: document.querySelector('#location-chat-input') as HTMLTextAreaElement,
    locationChatSendButton: document.querySelector('#location-chat-send') as HTMLButtonElement,
    playTourButton: document.querySelector('#play-tour') as HTMLButtonElement,
    tourControls: document.querySelector('#tour-controls') as HTMLDivElement,
    tourProgressBar: document.querySelector('#tour-progress-bar') as HTMLDivElement,
    tourLocationName: document.querySelector('#tour-location-name') as HTMLSpanElement,
    tourPrevButton: document.querySelector('#tour-prev') as HTMLButtonElement,
    tourNextButton: document.querySelector('#tour-next') as HTMLButtonElement,
    tourPlayPauseButton: document.querySelector('#tour-play-pause') as HTMLButtonElement,
    visualSearchModal: document.querySelector('#visual-search-modal') as HTMLDivElement,
    closeVisualSearchButton: document.querySelector('#close-visual-search') as HTMLButtonElement,
    visualSearchVideo: document.querySelector('#visual-search-video') as HTMLVideoElement,
    visualSearchCanvas: document.querySelector('#visual-search-canvas') as HTMLCanvasElement,
    visualSearchCaptureButton: document.querySelector('#visual-search-capture') as HTMLButtonElement,
    visualSearchSpinner: document.querySelector('#visual-search-spinner') as HTMLDivElement,
    visualSearchResults: document.querySelector('#visual-search-results') as HTMLDivElement,
    visualSearchInner: document.querySelector('.visual-search-inner') as HTMLDivElement,
    welcomeModal: document.querySelector('#welcome-modal') as HTMLDivElement,
    preferencesForm: document.querySelector('#preferences-form') as HTMLFormElement,
    skipPreferencesButton: document.querySelector('#skip-preferences') as HTMLButtonElement,
    changePreferencesButton: document.querySelector('#change-preferences-button') as HTMLButtonElement,
    promptInput: document.querySelector('#main-chat-input') as HTMLTextAreaElement,
};