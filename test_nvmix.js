const https = require('https');

const apiKey = 'nvx_sk_h_zloNX3uvipD4hrftLFQIP1ThynFfpnj8';
const payload = JSON.stringify({
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  messages: [{ role: 'user', content: 'how are you?' }],
  max_tokens: 100
});

const options = {
  hostname: 'api.nvmix.com',
  path: '/v1/chat/completions',
  method: 'POST',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Calling Nvmix API...');
const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response Body:', data);
    try {
      const parsed = JSON.parse(data);
      const reply = parsed?.choices?.[0]?.message?.content;
      console.log('\n=== AI REPLY ===');
      console.log(reply || 'NO REPLY IN RESPONSE');
    } catch(e) {
      console.log('Could not parse JSON response');
    }
  });
});

req.on('error', (e) => console.error('Request Error:', e.message));
req.on('timeout', () => { console.error('Request timed out after 12s'); req.destroy(); });
req.write(payload);
req.end();
