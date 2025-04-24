import { fetch } from 'undici';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Mira API configuration
const apiKey = 'sk-mira-3db7f5199996b5e465b14399a46ec6b9cfa83c42806b491c';
const model = 'llama-3.1-8b-instruct';

// Function to generate text using Mira API
async function generateText(prompt) {
  try {
    console.log(`\nSending request to Mira API...`);
    console.log(`Model: ${model}`);
    console.log(`Prompt: ${prompt}`);

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

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Mira API error: ${response.status} ${response.statusText}`;

      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = `Mira API error: ${errorData.message || response.statusText}`;
        } else {
          const textResponse = await response.text();
          console.error('Non-JSON error response:', textResponse.substring(0, 200));
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
      console.log('Raw response:', textResponse.substring(0, 200) + '...');

      const data = JSON.parse(textResponse);

      if (data.data && data.data.choices && data.data.choices[0] && data.data.choices[0].message) {
        return data.data.choices[0].message.content;
      } else {
        console.log('Unexpected response format:', data);
        return 'Error: Unexpected response format from Mira API';
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return `Error parsing Mira API response: ${parseError.message}`;
    }
  } catch (error) {
    console.error('Error generating text:', error);
    return `Error: ${error.message}`;
  }
}

// Main function
async function main() {
  console.log('=== Simple Mira CLI Test ===');
  console.log('Type your message and press Enter. Type "exit" to quit.');

  // Start the conversation loop
  const askQuestion = () => {
    rl.question('\nYou: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      const response = await generateText(input);
      console.log(`\nAssistant: ${response}`);

      // Continue the conversation
      askQuestion();
    });
  };

  // Start the conversation
  askQuestion();
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
