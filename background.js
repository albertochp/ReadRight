chrome.runtime.onInstalled.addListener(function() {
  // Add listeners or perform setup tasks here

  // Listener for the browser action
  chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['contentScript.js']
    });
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "applyStyles") {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['contentScript.js']
        });
      } else {
        console.error('No active tab found.');
      }
    });
  } else if (request.action === "fetchOpenAI") {
    fetchOpenAI(request.content)
      .then(response => {
        const cleanedResponse = response
        if (sender.tab && sender.tab.id) {
          chrome.tabs.sendMessage(sender.tab.id, {action: "displayResult", data: cleanedResponse});
        }
      })
      .catch(error => {
        console.error('Error in fetchOpenAI:', error);
        if (sender.tab && sender.tab.id) {
          chrome.tabs.sendMessage(sender.tab.id, {action: "displayError", error: error.toString()});
        }
      });
    return true; // Keep the messaging channel open for sendResponse
  }
});



// Async function to fetch from OpenAI API
async function fetchOpenAI(textContent) {
  console.log("in OpenAI API call"); 
  console.log("content", textContent)
  try {
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer Token'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-instruct",
        prompt: "Please create a detailed outline of the content I am going to send you in HTML. It should have 1 main heading, and a few (maximum 5) subheadings with a short description (if not provided by the content I have sent you, use your knowledge). DO NOT SEND an introduction or conclusion to your message, just the outline in HTML format. Limit your answer to 2500 characters. Content:"  + textContent,
        temperature: 0.8,
        max_tokens: 1024,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });
    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No choices returned from OpenAI.');
    }
    console.log(data.choices[0].text)
    return data.choices[0].text;
  } catch (error) {
    console.error('Error fetching from OpenAI:', error);
    throw error; // Rethrow the error to handle it in the .catch() block
  }
}

