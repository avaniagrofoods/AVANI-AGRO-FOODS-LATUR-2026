import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/RESEND_API_KEY=["']?([^"'\r\n]+)/)[1].trim();

async function checkEvent() {
  const emailId = '01a1ecd0-a879-7190-a6dd-f3737033fe18';
  const getRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: { 'Authorization': `Bearer ${key}` }
  });
  const getData = await getRes.json();
  console.log('ID:', getData.id);
  console.log('To:', getData.to);
  console.log('Last Event:', getData.last_event);
  console.log('Message ID:', getData.message_id);
}

checkEvent();
