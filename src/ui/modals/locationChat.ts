import { ai } from '../../api/gemini';
import * as AppState from '../../state';

export function openLocationChat(locationIndex: number) {
  const location = AppState.popUps[locationIndex];
  if (!location) return;
  AppState.DOM.locationChatTitle.textContent = `AI Explorer: ${location.name}`;
  AppState.DOM.locationChatMessagesContainer.innerHTML = '';
  AppState.DOM.locationChatModal.classList.remove('hidden');
  AppState.DOM.locationChatInput.focus();

  const systemInstruction = `You are a friendly, concise tour guide for ${location.name}. Answer questions about this specific place that the user wants to know.`;
  const chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
  AppState.setActiveLocationChat(chat);
  addMessageToLocationChat(`Hi! What would you like to know about ${location.name}?`, 'ai');
}

export function closeLocationChat() {
  AppState.DOM.locationChatModal.classList.add('hidden');
  AppState.setActiveLocationChat(null);
}

function addMessageToLocationChat(text: string, sender: 'user' | 'ai') {
  const messageElement = document.createElement('div');
  messageElement.className = `chat-message ${sender}`;
  messageElement.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
  AppState.DOM.locationChatMessagesContainer.appendChild(messageElement);
  AppState.DOM.locationChatMessagesContainer.scrollTop = AppState.DOM.locationChatMessagesContainer.scrollHeight;
  return messageElement;
}

export async function sendLocationChatMessage() {
  const messageText = AppState.DOM.locationChatInput.value.trim();
  if (!messageText || !AppState.activeLocationChat) return;
  addMessageToLocationChat(messageText, 'user');
  AppState.DOM.locationChatInput.value = '';
  AppState.DOM.locationChatInput.style.height = 'auto';
  AppState.DOM.locationChatInput.disabled = true;
  AppState.DOM.locationChatSendButton.disabled = true;

  try {
    const responseStream = await AppState.activeLocationChat.sendMessageStream({ message: messageText });
    const aiMessageElement = addMessageToLocationChat('', 'ai');
    const bubble = aiMessageElement.querySelector('.bubble');
    let fullResponse = '';
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullResponse += chunk.text;
        bubble.innerHTML = fullResponse.replace(/\n/g, '<br>');
        AppState.DOM.locationChatMessagesContainer.scrollTop = AppState.DOM.locationChatMessagesContainer.scrollHeight;
      }
    }
  } catch(e) {
    console.error("Chat error:", e);
    addMessageToLocationChat("Sorry, I encountered an error.", 'ai');
  } finally {
    AppState.DOM.locationChatInput.disabled = false;
    AppState.DOM.locationChatSendButton.disabled = false;
    AppState.DOM.locationChatInput.focus();
  }
}