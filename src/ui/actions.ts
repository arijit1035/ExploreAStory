
import * as AppState from '../state';

export function createActionsHtml(index: number, streetViewAvailable?: boolean, inDiary?: boolean): string {
    const popup = AppState.popUps[index];
    if (!popup) return '';

    if (popup.type === 'event') {
        const searchQuery = encodeURIComponent(`${popup.name} ${popup.address || ''}`);
        const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
        const eventLinkButton = `<a href="${googleSearchUrl}" target="_blank" rel="noopener noreferrer" class="action-button event-link-button"><i class="fas fa-search"></i> View Event</a>`;

        const addToDiaryButton = (!AppState.itinerary.some(item => item.name === popup.name))
            ? `<button class="action-button add-to-diary-button" data-index="${index}"><i class="fas fa-plus"></i> To Diary</button>`
            : '';
        return `<div class="card-main-actions">${eventLinkButton}${addToDiaryButton}</div>`;
    }

    // Default 'location' type
    const aiExploreMenu = `
        <div class="action-dropdown">
            <button class="action-button"><i class="fas fa-robot"></i> AI Explore</button>
            <div class="dropdown-menu">
                <a class="dropdown-item chat-action-button" data-index="${index}"><i class="fas fa-comments"></i> Chat about this place</a>
                <div class="dropdown-divider"></div>
                <div class="dropdown-sub-header">Generate Audio Tour</div>
                <div class="audio-tour-options">
                    <a class="dropdown-item audio-tour-action-button" data-index="${index}" data-length="short">Short</a>
                    <a class="dropdown-item audio-tour-action-button" data-index="${index}" data-length="medium">Medium</a>
                    <a class="dropdown-item audio-tour-action-button" data-index="${index}" data-length="long">Long</a>
                </div>
            </div>
        </div>`;

    const tourMenu = `
        <div class="action-dropdown">
            <button class="action-button"><i class="fas fa-map-marked-alt"></i> Visual Tour</button>
            <div class="dropdown-menu">
                ${streetViewAvailable ? `<a class="dropdown-item street-view-action-button" data-index="${index}"><i class="fas fa-street-view"></i> 360° View</a>` : ''}
                <a class="dropdown-item scan-action-button" data-index="${index}"><i class="fas fa-camera"></i> Scan Landmark</a>
            </div>
        </div>`;
    
    const addToDiaryButton = (!AppState.isPlannerMode && !inDiary)
        ? `<button class="action-button add-to-diary-button" data-index="${index}"><i class="fas fa-plus"></i> To Diary</button>`
        : '';
    
    return `<div class="card-main-actions">${aiExploreMenu}${tourMenu}${addToDiaryButton}</div>`;
}
