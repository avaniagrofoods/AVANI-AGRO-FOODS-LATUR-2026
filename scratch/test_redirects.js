// Check non-www redirect to www
async function checkRedirects() {
  console.log('Testing Canonical & Non-WWW Redirection:');
  const urls = [
    'https://avaniagrofoods.com/',
    'https://www.avaniagrofoods.com/'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      console.log(`${url} -> HTTP ${res.status}, Location: ${res.headers.get('location') || '(none)'}`);
    } catch (e) {
      console.log(`${url} -> Fetch notice: ${e.message}`);
    }
  }
}

checkRedirects();
