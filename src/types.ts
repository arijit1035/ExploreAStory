
declare global {
  namespace google {
    namespace maps {
      function importLibrary(library: string): Promise<any>;

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      class LatLngBounds {
        constructor(sw?: LatLng | null, ne?: LatLng | null);
        extend(point: LatLng | { lat: number; lng: number }): LatLngBounds;
        getCenter(): LatLng;
      }

      class Map {
          constructor(mapDiv: HTMLElement | null, opts?: any);
          panTo(position: LatLng | { lat: number, lng: number }): void;
          fitBounds(bounds: LatLngBounds): void;
      }

      class OverlayView {
        constructor();
        static preventMapHitsAndGesturesFrom(element: HTMLElement): void;
        getPanes(): { floatPane: HTMLElement };
        getProjection(): { fromLatLngToDivPixel(latLng: LatLng): { x: number; y: number; } | null; };
        setMap(map: Map | null): void;
        onAdd(): void;
        onRemove(): void;
        draw(): void;
      }

      class StreetViewService {
        constructor();
        getPanorama(request: { location?: LatLng | { lat: number, lng: number }; radius?: number; source?: StreetViewSource; }, callback?: (data: any, status: any) => void): Promise<{data: { location: { latLng: LatLng }}}>;
      }

      class StreetViewPanorama {
        constructor(container: HTMLElement | null, opts?: any);
        setPosition(latLng: LatLng): void;
        setVisible(visible: boolean): void;
      }
      
      interface PolylineOptions {
        strokeOpacity?: number;
        strokeWeight?: number;
        map?: Map;
        strokeColor?: string;
        icons?: any[];
        path?: (LatLng | { lat: number; lng: number })[];
      }
      
      class Polyline {
        constructor(opts?: PolylineOptions);
        setMap(map: Map | null): void;
        setPath(path: (LatLng | { lat: number; lng: number })[]): void;
        setOptions(options: PolylineOptions): void;
      }

      enum StreetViewSource {
        DEFAULT,
        OUTDOOR,
      }

      namespace marker {
        class PinElement {
          constructor(options?: any);
          element: HTMLElement;
        }
        class AdvancedMarkerElement {
          constructor(options?: any);
          setMap(map: Map | null): void;
        }
      }
    }
  }

  interface Window {
    Popup: new (
      position: google.maps.LatLng,
      content: HTMLElement,
    ) => google.maps.OverlayView & {
      position: google.maps.LatLng;
      containerDiv: HTMLDivElement;
    };
  }
}

// TYPES
export interface Point { lat: number; lng: number; }
export interface Line {
  poly: google.maps.Polyline;
  geodesicPoly: google.maps.Polyline;
  name: string;
  transport?: string;
  travelTime?: string;
}
export interface PopUp {
  type: 'location' | 'event';
  name: string;
  description: string;
  position: google.maps.LatLng;
  popup: google.maps.OverlayView;
  content: HTMLElement;
  imageUrl?: string;
  streetViewAvailable: boolean;

  // Location-specific
  time?: string;
  duration?: string;
  sequence?: number;
  openingTime?: string;
  closingTime?: string;
  price?: string;

  // Event-specific
  eventDate?: string;
  address?: string;
}
export interface ItineraryItem extends PopUp {}
export interface DiaryData {
  notes: string;
  scans: { image: string, description: string }[];
  audioTours: { length: 'short' | 'medium' | 'long', text: string }[];
}


// This export ensures the file is treated as a module
export {};
