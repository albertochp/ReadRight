// popup.js

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get({
    'lineHeight': '1.5',
    'fontChoice': 'Arial',
    'textEmphasis': 'on'
  }, function(preferences) {
    document.getElementById('spacing' + preferences.lineHeight.replace('.', '_')).checked = true;
    document.getElementById('font' + preferences.fontChoice).checked = true;
    document.getElementById('emphasis' + preferences.textEmphasis.charAt(0).toUpperCase() + preferences.textEmphasis.slice(1)).checked = true;
  });

  
  var generateOutlineButton = document.getElementById('generateOutlineButton');
  var applyChangesButton = document.getElementById('applyChangesButton');
  
  generateOutlineButton.addEventListener('click', function() {
      console.log('Generate Outline button clicked');
      document.getElementById('outlineHeading').style.visibility = 'visible'; // This line should be here
      // Send a message to the content script to retrieve the HTML and process it
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "fetchHTML"});
      });
  }, false);

  applyChangesButton.addEventListener('click', savePreferences, false);
});


// Listen for messages from the content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "updatePopup") {
    // Find the element in your popup where you want to display the HTML content
    const displayArea = document.getElementById('displayArea'); // Make sure you have an element with this ID in your popup.html

    // Update the display area with the received HTML content
    // Ensure to sanitize the HTML content if necessary to prevent XSS attacks
    displayArea.innerHTML = message.htmlContent;
  }
});


function savePreferences() {
  console.log('Saving preferences...');
  // Retrieve user preferences
  const lineHeight = document.querySelector('input[name="line-spacing"]:checked').value;
  const fontChoice = document.querySelector('input[name="font"]:checked').value;
  const textEmphasis = document.querySelector('input[name="text-emphasis"]:checked').value;

  // Save the preferences using the chrome.storage API
  chrome.storage.sync.set({
      'lineHeight': lineHeight,
      'fontChoice': fontChoice,
      'textEmphasis': textEmphasis
  }, function() {
      console.log('Preferences saved.');
      // After saving preferences, send a message to apply styles
      chrome.runtime.sendMessage({ action: "applyStyles" });
  });
}
