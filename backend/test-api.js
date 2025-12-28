require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key:', apiKey ? apiKey.substring(0, 15) + '...' : 'NOT SET');
  
  if (!apiKey) {
    console.log('ERROR: API key not found in .env file');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    console.log('Testing API...');
    const result = await model.generateContent('Say "Hello" in Japanese');
    const response = await result.response;
    console.log('SUCCESS! Response:', response.text());
  } catch (error) {
    console.log('ERROR:', error.message);
  }
}

test();

