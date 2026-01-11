//this file only exists to check which gemini models I can use with my api key:).

import dotenv from 'dotenv'
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  try {
    console.log("🔍 Fetching available models...");
    const response = await fetch(URL);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error:", data.error.message);
      return;
    }

    // Filter only models that can generate content (chat/vision)
    const availableModels = data.models.filter(m => 
      m.supportedGenerationMethods.includes("generateContent")
    );

    console.log(`\n✅ Found ${availableModels.length} models you can use:\n`);

    availableModels.forEach(model => {
      console.log(`Name: \x1b[32m${model.name.replace('models/', '')}\x1b[0m`);
      console.log(`Description: ${model.description}`);
      console.log(`---`);
    });

  } catch (error) {
    console.error("Network Error:", error);
  }
}

listModels();