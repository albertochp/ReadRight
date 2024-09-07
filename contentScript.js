  
function loadRobotoFont() {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css?family=Roboto&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

if (document.readyState === "loading") {
  // The document is still loading, wait for the DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', loadRobotoFont);
} else {
  // The document is already loaded, safe to manipulate the DOM
  loadRobotoFont();
}


function applyDefaultStyles() {
  const defaultPreferences = {
    lineHeight: '1.5',
    fontChoice: 'Arial',
    textEmphasis: 'on'
  };

  applyStyles(defaultPreferences);
}

// Check storage and apply stored or default styles
chrome.storage.sync.get({
  lineHeight: '1.5',
  fontChoice: 'Arial',
  textEmphasis: 'on'
}, function(preferences) {
  if (preferences.lineHeight && preferences.fontChoice && preferences.textEmphasis) {
    // Preferences are set, apply them
    applyStyles(preferences);
  } else {
    // Preferences are not set or incomplete, apply defaults and set them in storage
    applyDefaultStyles();
    chrome.storage.sync.set({
      lineHeight: '1.5',
      fontChoice: 'Arial',
      textEmphasis: 'on'
    });
  }
});



// Function to retrieve preferences and apply styles
function applyStyles(preferences) {
  // Iterate over all elements within the body to apply line height and font family
  const allElements = document.querySelectorAll('body, body *');

  allElements.forEach(el => {
    el.style.lineHeight = preferences.lineHeight;
    el.style.fontFamily = preferences.fontChoice;
  });

  // Apply or revert text emphasis based on preference
  if (preferences.textEmphasis === 'on') {
    // Target italic and underlined elements
    const italicElements = document.querySelectorAll('i, em, [style*="font-style: italic"]');
    const underlinedElements = document.querySelectorAll('[style*="text-decoration: underline"]');

    // Combine the NodeList objects into an array to handle them together
    const emphasisElements = [...italicElements, ...underlinedElements];

    emphasisElements.forEach(el => {
      el.style.fontWeight = 'bold'; // Apply bold font weight for emphasis
    });
  } else {
    // Revert to original styles for all elements if emphasis is off
    // This might need adjustment based on the original styles of the page
    const emphasisElements = document.querySelectorAll('[style*="font-weight: bold"]');
    emphasisElements.forEach(el => {
      // Only revert elements that were specifically targeted by the extension
      if (el.tagName === 'I' || el.tagName === 'EM' || el.style.textDecoration.includes('underline') || el.style.fontStyle.includes('italic')) {
        el.style.removeProperty('font-weight');
      }
    });
  }
}

if (!window.myExtensionContentScriptInjected) {
    window.myExtensionContentScriptInjected = true;
  // Listener for messages from the popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "fetchHTML") {
      console.log('Message received from popup in content script');
      const content = getRelevantContent(); // Make sure this function exists and is correctly getting content
      console.log('content', content);
      chrome.runtime.sendMessage({action: "fetchOpenAI", content: content}, function(response) {
        console.log('Message sent to background script', response);
      });
    }
  });

  // Listen for responses from background.js
  chrome.runtime.onMessage.addListener(function(response, sender, sendResponse) {
    if (response.action === "displayResult") {
      // Clean the response data of any newline characters
      const cleanedData = response.data.replace(/\n/g, '');
      
      // Send the cleaned data to popup.js to display it
      chrome.runtime.sendMessage({action: "updatePopup", htmlContent: cleanedData});
    }
  });




  // In your contentScript.js, you might add a function like this:
  function getRelevantContent() {
    // Get all headings in the page
    console.log('inGetRel');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log(headings);

    return Array.from(headings).map(heading => {
      // Use Node.textContent to get the text content of the heading and its descendants
      return heading.textContent.trim();
    }).join('\n');
  }


}