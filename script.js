document.getElementById('saveCollection').addEventListener('click', async () => {
  const title = document.getElementById('pageTitle').value;
  const collectionName = document.getElementById('collectionName').value;
  const manifestUrls = Array.from(document.querySelectorAll('#gallery .card img')).map(img => img.src.split('/full/')[0] + '/info.json');

  if (!collectionName) {
    alert('Please enter a collection name');
    return;
  }

  const collection = {
    title,
    manifests: manifestUrls
  };

  try {
    const response = await fetch('https://iiif-backend.vercel.app/saveCollection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ collectionName, collection }),
      mode: 'cors' // Ensure CORS mode is set
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save collection');
    }

    const result = await response.json();
    alert('Collection saved successfully!');
  } catch (error) {
    console.error('Error saving collection:', error);
    alert('Failed to save collection. Check console for details.');
  }
});
