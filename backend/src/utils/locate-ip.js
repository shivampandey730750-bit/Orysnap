async function locateIP() {
  const ip = '2406:da1a:314:7101:1d8:2e07:2cf9:44d';
  console.log(`Querying IP location for ${ip}...`);
  try {
    const res = await fetch(`https://freeipapi.com/api/json/${ip}`);
    const data = await res.json();
    console.log('Location Data:', data);
  } catch (err) {
    console.error('Failed to locate IP:', err.message);
  }
}

locateIP();
