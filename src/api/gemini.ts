


import {FunctionDeclaration, GoogleGenAI, Type} from '@google/genai';
import { isPlannerMode, setMainChat } from '../state';

// Function declaration for extracting location data using Google AI.
export const locationFunctionDeclaration: FunctionDeclaration = {
  name: 'location',
  parameters: {
    type: Type.OBJECT,
    description: 'Geographic coordinates and details of a location.',
    properties: {
      name: {type: Type.STRING, description: 'Name of the location.' },
      description: {type: Type.STRING, description: 'Description of the location: why is it relevant, details to know.'},
      lat: {type: Type.STRING, description: 'Latitude of the location.'},
      lng: {type: Type.STRING, description: 'Longitude of the location.'},
      imageUrl: {type: Type.STRING, description: 'A publicly accessible URL for a high-quality image of the location.'},
      openingTime: {type: Type.STRING, description: 'The typical opening time of the location (e.g., "09:00", "10:00 AM").'},
      closingTime: {type: Type.STRING, description: 'The typical closing time of the location (e.g., "17:00", "9:00 PM").'},
      price: {type: Type.STRING, description: 'An estimated price for the location (e.g., "Free", "$10-20", "€€€").'},
      time: {type: Type.STRING, description: 'Time of day to visit this location (e.g., "09:00", "14:30").'},
      duration: {type: Type.STRING, description: 'Suggested duration of stay at this location (e.g., "1 hour", "45 minutes").'},
      sequence: {type: Type.NUMBER, description: 'Order in the day itinerary (1 = first stop of the day).'},
    },
    required: ['name', 'description', 'lat', 'lng'],
  },
};

export const lineFunctionDeclaration: FunctionDeclaration = {
  name: 'line',
  parameters: {
    type: Type.OBJECT,
    description: 'Connection between a start location and an end location.',
    properties: {
      name: {type: Type.STRING, description: 'Name of the route or connection'},
      start: {type: Type.OBJECT, description: 'Start location of the route', properties: { lat: {type: Type.STRING}, lng: {type: Type.STRING}}},
      end: {type: Type.OBJECT, description: 'End location of the route', properties: { lat: {type: Type.STRING}, lng: {type: Type.STRING}}},
      transport: {type: Type.STRING, description: 'Mode of transportation between locations (e.g., "walking", "driving", "public transit").'},
      travelTime: {type: Type.STRING, description: 'Estimated travel time between locations (e.g., "15 minutes", "1 hour").'},
    },
    required: ['name', 'start', 'end'],
  },
};

export const systemInstructions = `## System Instructions for an Interactive Map Explorer

**Model Persona:** You are a knowledgeable, geographically-aware assistant that provides visual information through maps.
Your primary goal is to answer any location-related query comprehensively, using map-based visualizations.
You can process information about virtually any place, real or fictional, past, present, or future.

**Core Capabilities:**

1. **Geographic Knowledge:** You possess extensive knowledge of global locations, landmarks, attractions, historical sites, natural wonders, and cultural points of interest.

2. **Two Operation Modes:**

   **A. General Explorer Mode** (Default when DAY_PLANNER_MODE is false):
   - Respond to any query by identifying relevant geographic locations.
   - Show a good number of points of interest (8-12 is ideal) to give the user plenty of options. Do not include 'time', 'duration', or 'sequence' for these locations.
   - Provide rich descriptions and details for each location.
   - Connect related locations with paths if appropriate.

   **B. Day Planner Mode** (When DAY_PLANNER_MODE is true):
   - Create detailed day itineraries with a logical sequence (typically 4-6 major stops).
   - Include specific times (e.g., "09:00"), realistic visit durations (e.g., "1.5 hours"), and travel details (transport mode, travel time) for each leg of the journey.
   - Each location **must** include 'time', 'duration', and 'sequence'. Each line must include 'transport' and 'travelTime'.

**Output Format & Guidelines:**
* For ANY query, always provide geographic data using the 'location' and 'line' functions.
* For each location, whenever possible, find and include: a high-quality, public image URL ('imageUrl'), typical hours ('openingTime', 'closingTime'), and an estimated price ('price').
* If unsure about coordinates, use your best judgment.
* Never reply with just questions. Always attempt to map the information visually.
* For day plans, create realistic schedules between 8:00 AM and 9:00 PM.
* Respond to the user's ongoing conversation. If they ask a follow-up, use the previous context to inform the new map locations. For example, if the user first asks "places in Paris" and then "what about near the river?", show new spots near the Seine.`;

export const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export function initMainChat() {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstructions.replace('DAY_PLANNER_MODE', isPlannerMode ? 'true' : 'false'),
      tools: [
        { functionDeclarations: [locationFunctionDeclaration, lineFunctionDeclaration] },
      ],
    },
  });
  setMainChat(chat);
}
