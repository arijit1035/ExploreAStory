export function parseDurationToMinutes(durationStr: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  let totalMinutes = 0;
  const hoursMatch = durationStr.match(/(\d+(\.\d+)?)\s*hour/);
  if (hoursMatch) totalMinutes += parseFloat(hoursMatch[1]) * 60;
  const minsMatch = durationStr.match(/(\d+)\s*(min|minute)/);
  if (minsMatch) totalMinutes += parseInt(minsMatch[1], 10);
  return totalMinutes;
}

export function getTransportIcon(transportType: string): string {
  const type = (transportType || '').toLowerCase();
  if (type.includes('walk')) return 'walking';
  if (type.includes('car') || type.includes('driv')) return 'car-side';
  if (type.includes('bus') || type.includes('transit')) return 'bus-alt';
  if (type.includes('train') || type.includes('subway')) return 'train';
  if (type.includes('bike') || type.includes('cycl')) return 'bicycle';
  if (type.includes('taxi')) return 'taxi';
  if (type.includes('boat') || type.includes('ferry')) return 'ship';
  if (type.includes('plane')) return 'plane-departure';
  return 'route';
}

export function getPlaceholderImage(locationName: string): string {
  let hash = 0;
  for (let i = 0; i < locationName.length; i++) hash = locationName.charCodeAt(i) + ((hash << 5) - hash);
  const hue = hash % 360;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="hsl(${hue}, 60%, 50%)" /><text x="150" y="95" font-family="sans-serif" font-size="72" fill="white" text-anchor="middle" dominant-baseline="middle">${(locationName.charAt(0) || '?').toUpperCase()}</text></svg>`)}`;
}

export function createTicketLink(price: string, name: string): string {
    if (price && price.toLowerCase() !== 'free' && !price.includes('€0') && !price.includes('$0')) {
        return ` &bull; <a href="https://www.google.com/search?q=tickets+for+${encodeURIComponent(name)}" target="_blank" class="ticket-link">Search for tickets <i class="fas fa-external-link-alt fa-xs"></i></a>`;
    }
    return '';
}
