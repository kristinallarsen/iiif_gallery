let viewer;

document.addEventListener('DOMContentLoaded', () => {
  viewer = OpenSeadragon({
    id: 'viewer',
    prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.0.0/images/',
    tileSources: []
  });
});

// Utility function to get metadata value by label
function getMetadataValue(metadata, label) {
  const item = metadata.find((item) => item.label === label);
  return item ? item.value : null;
}

// Function to add a IIIF manifest to the gallery
async function addManifestToGallery(manifestUrl) {
  try {
    const response = await fetch(manifestUrl);

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const manifest = await response.json();

    if (!manifest.sequences || !manifest.sequences[0].canvases) {
      throw new Error('Manifest does not contain sequences or canvases in the expected format.');
    }

    const canvasItems = manifest.sequences[0].canvases;
    const gallery = document.getElementById('gallery');

    canvasItems.forEach(canvas => {
      const imageService = canvas.images[0].resource.service;

      if (!imageService || !imageService['@id']) {
        console.error('Image service is missing or does not contain an @id field:', canvas);
        return;
      }

      const imageUrl = `${imageService['@id']}/full/!200,200/0/default.jpg`;
      const highResUrl = `${imageService['@id']}/info.json`;

      const metadata = canvas.metadata || [];
      const title = getMetadataValue(metadata, 'Title') || getMetadataValue(metadata, 'Short Title') || 'No title';
      const author = getMetadataValue(metadata, 'Author') || 'Unknown author';
      const date = getMetadataValue(metadata, 'Date') || 'No date';
      const attribution = manifest.attribution || 'Unknown institution';

      const card = document.createElement('div');
      card.className = 'card';

      const img = document.createElement('img');
      img.src = imageUrl;

      img.addEventListener('click', () => {
        viewer.open(highResUrl);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'x';
      deleteBtn.addEventListener('click', () => {
        const shouldRemove = confirm('Do you want to remove this image from the gallery?');
        if (shouldRemove) {
          card.remove();
        }
      });

      const titleEl = document.createElement('p');
      titleEl.textContent = `Title: ${title}`;

      const authorEl = document.createElement('p');
      authorEl.textContent = `Author: ${author}`;

      const dateEl = document.createElement('p');
      dateEl.textContent = `Date: ${date}`;

      const attributionEl = document.createElement('p');
      attributionEl.textContent = `Institution: ${attribution}`;

      card.appendChild(deleteBtn);
      card.appendChild(img);
      card.appendChild(titleEl);
      card.appendChild(authorEl);
      card.appendChild(dateEl);
      card.appendChild(attributionEl);
      gallery.appendChild(card);
    });

  } catch (error) {
    console.error('Error fetching IIIF Manifest:', error);
    alert(`There was an error fetching the IIIF Manifest: ${error.message}`);
  }
}

// Event listener to add manifest URLs to the gallery
document.getElementById('addManifest').addEventListener('click', async () => {
  const manifestUrls = document.getElementById('manifestUrl').value.split(',').map(url => url.trim());
  if (!manifestUrls.length) {
    alert('Please enter one or more IIIF Manifest URLs');
    return;
  }

  for (const manifestUrl of manifestUrls) {
    if (manifestUrl) {
      await addManifestToGallery(manifestUrl);
    }
  }
});

// Event listener to save the collection
document.getElementById('saveCollection').addEventListener('click', async () => {
  const title = document.getElementById('pageTitle').value;
  const collectionName = document.getElementById('collectionName').value;
  const manifestUrls = Array.from(document.querySelectorAll('#gallery .card img')).map(img => img.src.split('/full/')[0] + '/info.json');

  if (!collectionName || !manifestUrls.length) {
    alert('Please enter a collection name and add at least one item to the gallery');
    return;
  }

  const collection = {
    title,
    manifests: manifestUrls // Ensure this contains all the necessary manifests
  };

  console.log('Collection being sent:', collection); // Add logging for debugging

  try {
    const response = await fetch('https://iiif-backend.vercel.app/saveCollection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        collection: {
          collectionName,  // Include collectionName inside the collection object
          ...collection // Add any other relevant data
        }
      }),
      mode: 'cors' // Ensure CORS mode is set
    });

    if (!response.ok) {
      throw new Error('Failed to save collection');
    }

    alert('Collection saved successfully!');
  } catch (error) {
    console.error('Error saving collection:', error);
    alert('Failed to save collection. Check console for details.');
  }
});
