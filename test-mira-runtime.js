import { fetch } from 'undici';
import fs from 'fs';

// Simulate the Eliza runtime
class MockRuntime {
  constructor(character) {
    this.character = character;
  }

  getSetting(key) {
    // Check in secrets first
    if (this.character.secrets && this.character.secrets[key]) {
      return this.character.secrets[key];
    }

    // Then check in settings
    if (this.character.settings && this.character.settings[key]) {
      return this.character.settings[key];
    }

    // Then check in settings.secrets
    if (
      this.character.settings &&
      this.character.settings.secrets &&
      this.character.settings.secrets[key]
    ) {
      return this.character.settings.secrets[key];
    }

    return null;
  }
}

async function testMiraRuntime() {
  try {
    console.log('Testing Mira API with simulated runtime...');

    // Load the character.json file
    const characterJson = JSON.parse(fs.readFileSync('character.json', 'utf8'));
    console.log('Loaded character:', JSON.stringify(characterJson, null, 2));

    // Create a mock runtime
    const runtime = new MockRuntime(characterJson);

    // Get the API key from the runtime
    const apiKey = runtime.getSetting('MIRA_API_KEY');
    const model = runtime.getSetting('MIRA_MODEL') || 'llama-3.1-8b-instruct';
    const prompt = 'Hello, how are you?';

    console.log(`Using model: ${model}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`);
    console.log(`API Key format: ${apiKey && apiKey.startsWith('sk-mira-') ? 'Valid' : 'Invalid'}`);
    console.log(`API Key length: ${apiKey ? apiKey.length : 0}`);

    if (!apiKey) {
      throw new Error('Mira API key not configured');
    }

    // Make a request to the Mira API
    const response = await fetch('https://api.mira.network/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries([...response.headers]));

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Mira API error: ${response.status} ${response.statusText}`;

      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = `Mira API error: ${errorData.message || response.statusText}`;
        } else {
          const textResponse = await response.text();
          console.error('Non-JSON error response:', textResponse);
          errorMessage = `Mira API error: ${response.status} ${response.statusText} - Received non-JSON response`;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }

      throw new Error(errorMessage);
    }

    // Try to parse the response as JSON
    try {
      const textResponse = await response.text();
      console.log('Raw response:', textResponse);

      const data = JSON.parse(textResponse);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (data.data && data.data.choices && data.data.choices[0] && data.data.choices[0].message) {
        console.log('Response content:', data.data.choices[0].message.content);
      } else {
        console.log('Unexpected response format:', data);
      }

      console.log('Test completed successfully!');
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error(`Error parsing Mira API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error testing Mira API:', error);
  }
}

testMiraRuntime();
