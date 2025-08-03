import * as AppState from '../../state';

export function showPreferencesModal() {
  if (AppState.DOM.welcomeModal) AppState.DOM.welcomeModal.classList.remove('hidden');
}

function hidePreferencesModal() {
  if (AppState.DOM.welcomeModal) AppState.DOM.welcomeModal.classList.add('hidden');
}

export function initializePreferenceFormListeners() {
  const form = AppState.DOM.preferencesForm;
  if (!form) return;

  // Find all the new integrated "Other" labels
  const otherInputLabels = form.querySelectorAll<HTMLLabelElement>('label.other-input-label');

  otherInputLabels.forEach(label => {
    const textInput = label.querySelector<HTMLInputElement>('input[type="text"]');
    const otherOptionInput = label.querySelector<HTMLInputElement>('input[type="radio"], input[type="checkbox"]');

    if (!textInput || !otherOptionInput) return;

    // When user interacts with the text field, programmatically select the "Other" option
    const selectOtherOption = () => {
      if (!otherOptionInput.checked) {
        otherOptionInput.checked = true;
      }
    };
    textInput.addEventListener('focus', selectOtherOption);
    textInput.addEventListener('input', selectOtherOption);

    // This part is for RADIO groups only. If a user selects a different standard radio button,
    // we should clear the text from the "Other" input in that same group.
    if (otherOptionInput.type === 'radio') {
      const groupName = otherOptionInput.name;
      const allRadiosInGroup = form.querySelectorAll<HTMLInputElement>(`input[name="${groupName}"][type="radio"]`);

      allRadiosInGroup.forEach(radio => {
        // We are interested in changes to OTHER radios, not the "Other" one itself
        if (radio !== otherOptionInput) {
          radio.addEventListener('change', () => {
            // If another radio is checked, clear the text input for "Other"
            if (radio.checked) {
              textInput.value = '';
            }
          });
        }
      });
    }
  });
}


export function handlePreferencesSubmit(e: Event) {
  e.preventDefault();
  const formData = new FormData(AppState.DOM.preferencesForm);
  const preferences: { [key: string]: string[] } = {};
  
  // Directly process form data into a structured object
  const questionKeys = ['vibe', 'priority', 'gem', 'evening', 'souvenir', 'story', 'path', 'pace', 'budget', 'companion'];
  
  questionKeys.forEach(key => {
    const values = formData.getAll(key) as string[];
    const otherTextInputName = `${key}_other`;
    
    if (values.length > 0) {
      const otherValue = formData.get(otherTextInputName)?.toString().trim();
      // If 'Other' is selected (checked) and the corresponding text input has a value,
      // replace 'Other' with that value.
      if (values.includes('Other') && otherValue) {
        preferences[key] = values.map(v => v === 'Other' ? otherValue : v).filter(v => v);
      } else {
        // Otherwise, just filter out the 'Other' value if it was checked with no text.
        preferences[key] = values.filter(v => v !== 'Other');
      }
    }
  });

  // Now build the prompt string
  let prefParts: string[] = [];
  if (preferences.vibe?.length) prefParts.push(`their ideal vibe is: ${preferences.vibe.join(', ')}.`);
  if (preferences.priority?.length) prefParts.push(`their top priority in a new place is: ${preferences.priority[0]}.`);
  if (preferences.gem?.length) prefParts.push(`they're most excited to find a hidden gem like: ${preferences.gem[0]}.`);
  if (preferences.evening?.length) prefParts.push(`in the evening, they like: ${preferences.evening[0]}.`);
  if (preferences.souvenir?.length) prefParts.push(`for souvenirs, they prefer: ${preferences.souvenir[0]}.`);
  if (preferences.story?.length) prefParts.push(`they are interested in stories about: ${preferences.story[0]}.`);
  if (preferences.path?.length) prefParts.push(`they are willing to go this far off the beaten path: ${preferences.path[0]}.`);
  if (preferences.pace?.length) prefParts.push(`their ideal pace is: ${preferences.pace[0]}.`);
  if (preferences.budget?.length) prefParts.push(`their budget style is: ${preferences.budget[0]}.`);
  if (preferences.companion?.length) prefParts.push(`they typically travel with: ${preferences.companion[0]}.`);
  
  AppState.setUserPreferences(prefParts.join(' '));
  
  hidePreferencesModal();
  localStorage.setItem('preferencesSubmitted', 'true');
  
  if (!AppState.DOM.promptInput.value) {
    AppState.DOM.promptInput.placeholder = "Great! Now, where do you want to go?";
  }
}

export function checkShowWelcomeModal() {
  if (localStorage.getItem('preferencesSubmitted') !== 'true') {
    showPreferencesModal();
  }
}