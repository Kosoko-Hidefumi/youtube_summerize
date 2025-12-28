async function test() {
  console.log('Testing Vercel API...');
  
  try {
    const response = await fetch('https://backend-nine-silk-38.vercel.app/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: 'dQw4w9WgXcQ', summaryLength: 'short' })
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

test();

