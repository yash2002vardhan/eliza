import { fetch } from 'undici';

async function testMiraAPIFormat() {
  try {
    console.log('Testing Mira API format...');

    // Get the API key from the character.json file
    const apiKey = 'sk-mira-3db7f5199996b5e465b14399a46ec6b9cfa83c42806b491c';
    const model = 'llama-3.1-8b-instruct';
    const prompt = 'Hello, how are you?';

    console.log(`Using model: ${model}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`API Key format: ${apiKey.startsWith('sk-mira-') ? 'Valid' : 'Invalid'}`);
    console.log(`API Key length: ${apiKey.length}`);

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

testMiraAPIFormat();
