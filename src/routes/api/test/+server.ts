import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const OLLAMA_API_URL = 'http://localhost:11434/api/generate'; // or /api/chat
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2:latest'; // Fallback to a reliable model

/**
 * Test Ollama API with a simple prompt
 */
async function testOllama() {
  const testPrompt = "Why is the sky blue? Answer in one sentence.";

  try {
    console.log(`Testing Ollama with model: ${OLLAMA_MODEL}...`);

    // Using /api/generate (simpler)
    const response = await axios.post(OLLAMA_API_URL, {
      model: OLLAMA_MODEL,
      prompt: testPrompt,
      stream: false,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000, // 30s timeout
    });

    console.log('✅ Success! Ollama response:');
    console.log(response.data);

    if (response.data.done && !response.data.response) {
      console.warn('⚠️ Warning: Empty response. Model may not be loaded correctly.');
    }

  } catch (error) {
    console.error('❌ Ollama test failed:');
    if (axios.isAxiosError(error)) {
      console.error(`HTTP Error: ${error.response?.status}`, error.response?.data);
    } else {
      console.error(error);
    }
  }
}

/**
 * Verify Ollama is running by checking the API root
 */
async function checkOllamaRunning() {
  try {
    const response = await axios.get('http://localhost:11434');
    console.log('🔌 Ollama service is running:', response.status === 200);
  } catch (error) {
    console.error('Ollama is NOT running or unreachable:', error);
  }
}

// Run tests
(async () => {
  await checkOllamaRunning();
  await testOllama();
})();