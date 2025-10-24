console.log("Email Writer Extension - Content Script Loaded");


function createAIButton() {
  const button = document.createElement('div');
  button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
  button.style.marginRight = '8px';
  button.innerHTML = 'AI Reply';
  button.setAttribute('role', 'button');
  button.setAttribute('data-tooltip', 'Generate AI Reply');
  return button;
}


function createToneSelector() {
  const select = document.createElement('select');
  select.className = 'ai-tone-selector';
  select.style.marginRight = '8px';
  select.style.padding = '5px';
  select.style.borderRadius = '4px';
  select.style.border = '1px solid #ccc';
  select.style.background = '#fff';
  select.style.fontSize = '14px';

  const tones = ['Professional', 'Casual', 'Friendly'];
  tones.forEach(tone => {
    const option = document.createElement('option');
    option.value = tone.toLowerCase();
    option.textContent = tone;
    select.appendChild(option);
  });

  return select;
}


function getEmailContent() {
  const selectors = ['.h7', '.a3s.aiL', '.gmail_quote', '[role="presentation"]'];
  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) return content.innerText.trim();
  }
  return '';
}


function findComposeToolbar() {
  const selectors = ['.btC', '.aDh', '[role="toolbar"]', '.gU.Up'];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) return toolbar;
  }
  return null;
}


function injectButton() {
  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }

  // Avoid toolbars to appear duplicates
  if (toolbar.querySelector('.ai-reply-button') || toolbar.querySelector('.ai-tone-selector')) {
    console.log("AI toolkit already exists, skipping injection...");
    return;
  }

  console.log("Injecting AI Reply toolkit...");

  // Create UI elements
  const toneSelector = createToneSelector();
  const button = createAIButton();
  button.classList.add('ai-reply-button');

  // Handle AI generation
  button.addEventListener('click', async () => {
    try {
      button.innerHTML = 'Generating...';
      button.disabled = true;

      const emailContent = getEmailContent();
      const selectedTone = toneSelector.value || 'professional';

      const response = await fetch('http://localhost:8080/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent, tone: selectedTone })
      });

      if (!response.ok) throw new Error('API request failed');

      const generatedReply = await response.text();
      const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
      if (composeBox) {
        composeBox.focus();
        document.execCommand('insertText', false, generatedReply);
      } else {
        console.error('Compose box not found');
      }

    } catch (error) {
      console.error(error);
      alert('Failed to generate reply');
    } finally {
      button.innerHTML = 'AI Reply';
      button.disabled = false;
    }
  });

  // Inject elements
  toolbar.insertBefore(button, toolbar.firstChild);
  toolbar.insertBefore(toneSelector, button);
}

//  Observe Gmail DOM changes and inject toolkit when needed 
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(node =>
      node.nodeType === Node.ELEMENT_NODE &&
      (node.matches('.aDh, .btC, [role="dialog"]') ||
        node.querySelector('.aDh, .btC, [role="dialog"]'))
    );

    if (hasComposeElements) {
      console.log("Compose window detected");
      setTimeout(() => injectButton(), 500);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

console.log("AI Reply MutationObserver active.");
