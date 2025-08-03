

import { ai } from './gemini';
import { setEventPin } from '../ui/map';
import { userPreferences } from '../state';

/**
 * A description of the desired JSON schema for events.
 */
const eventSchemaDescription = `
  An array of event objects. Each object must have these properties:
  - name: The official name of the event. (string, required)
  - description: A brief, engaging description of the event. (string, required)
  - lat: The latitude of the event location. (number, required)
  - lng: The longitude of the event location. (number, required)
  - address: The physical address of the event. (string)
  - date: The date and time of the event (e.g., "October 31, 2024 at 8:00 PM"). (string)
  - imageUrl: A publicly accessible URL for a high-quality image of the event. (string)
`;

export async function fetchEvents(prompt: string): Promise<boolean> {
  let rawText: string | undefined;
  try {
    const preferencesContext = userPreferences
      ? `The user has provided travel preferences: ${userPreferences}. Use these to help select relevant events.`
      : '';

    const finalPrompt = `
      A user is looking for events related to: "${prompt}".
      ${preferencesContext}
      Your task is to:
      1. Use Google Search to find UPCOMING local events relevant to the user's query. The events MUST be happening in the future from today's date.
      2. From the search results, identify the most interesting events. DO NOT include events that have already passed.
      3. For each event, extract the required information. Do NOT include a "link" property in the JSON objects.
      
      Return your response as ONLY a JSON array inside a markdown code block. The JSON must conform to this schema:
      ${eventSchemaDescription}

      Example:
      \`\`\`json
      [
        {
          "name": "Example Concert",
          "description": "An amazing concert.",
          "lat": 40.7128,
          "lng": -74.0060,
          "address": "123 Music Lane, New York, NY",
          "date": "November 15, 2024 at 8:00 PM",
          "imageUrl": "https://example.com/image.jpg"
        }
      ]
      \`\`\`

      If no relevant events are found from your search, return an empty array: \`\`\`json
[]
\`\`\`
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    rawText = response.text;
    if (!rawText) {
      console.warn('Event search returned no text.');
      return false;
    }

    // Extract JSON from markdown code block
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch || !jsonMatch[1]) {
      console.warn('Could not find a JSON code block in the event search response.', { text: rawText });
      return false;
    }

    const jsonText = jsonMatch[1].trim();
    if (!jsonText) {
      return false;
    }

    const events = JSON.parse(jsonText);

    if (Array.isArray(events) && events.length > 0) {
      for (const event of events) {
        if (event.name && event.description && event.lat && event.lng) {
          await setEventPin(event);
        }
      }
      return true;
    }
  } catch (e) {
    console.error('Failed to fetch or parse events from Google Search:', e);
    if (e instanceof SyntaxError) {
      console.error('Raw text from API that failed to parse:', rawText);
    }
  }
  return false;
}