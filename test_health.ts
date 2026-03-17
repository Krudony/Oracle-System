try {
  const response = await fetch('http://localhost:47778/api/health');
  if (response.ok) {
    const data = await response.json();
    console.log('Server is HEALTHY:', JSON.stringify(data, null, 2));
  } else {
    console.log('Server responded with error status:', response.status);
  }
} catch (e) {
  console.log('Could not connect to server:', e.message);
}
