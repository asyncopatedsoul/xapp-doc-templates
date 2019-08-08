import fetch from 'node-fetch'; // remove for prod

// Wait for ShowpadLib
function waitForShowpadLib() {
  return new Promise((resolve, reject) => {
    if (window.ShowpadLib) {
      resolve();
    } else {
      const timer = setTimeout(() => {
        reject(new Error("ShowpadLib timed out."))
      }, 2000);
      window.onShowpadLibLoaded = () => {
        clearTimeout(timer);
        resolve();
      }
    }
  });
}
// Get config.json
function getConfigJson() {
  return new Promise((resolve, reject) => {
    const url = decodeURIComponent(window.frameElement.src.split('configUrl=')[1]).split('&')[0];
    fetch(url)
      .then((data) => {
        return data.json();
      })
      .then(resolve)
      .catch(reject);
  });
}
// Fetch by tags
function getAssetsByTags(tagArray) {
  return new Promise((resolve, reject) => {
    if (!window.ShowpadLib.getAssetsByTags(tagArray, (assets) => {
      if (assets) {
        resolve(assets);
      } else {
        reject(new Error('Something went wrong while fetching assets by tag.'));
      }
    })) {
      reject(new Error('Something went wrong while fetching assets by tag.'));
    }
  });
}
// Get thumbnails
function getThumbnailImage(asset, size) {
  return window.ShowpadLib.getAssetPreviewUrl(asset.id, asset.slug, size || 1000);
}
// Download
function saveLocally(blob, name) {
  const downloadA = document.createElement('a');
  document.body.appendChild(downloadA);
  downloadA.style = "display: none";
  const url = window.URL.createObjectURL(blob);
  downloadA.href = url;
  downloadA.download = name;
  downloadA.click();
  window.URL.revokeObjectURL(url);
}
// or send to My Files
function saveToMyFiles(blob, name) {
  return new Promise((resolve, reject) => {
    const upload = {
      file: blob,
      filename: name
    };
    const statusEmitter = window.ShowpadLib.upload(upload);
    statusEmitter.on('success', (data) => {
      resolve(data.asset.id);
    });
    statusEmitter.on('failed', (error) => {
      reject(error);
    });
  })
}

function getApiConfig() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Showpad API config timed out'));
    }, 5000);
    window.ShowpadLib.getShowpadApi((data) => {
      if (data.error === null) {
        window.clearTimeout(timer);
        resolve(data);
      } else {
        reject(data.error);
      }
    });
  });
};

function getAssetById(id, apiConfig) {
  return new Promise((resolve, reject) => {
    fetch(`${apiConfig.url}/api/v3/assets/${id}.json`, {
      method: 'GET',
      withCredentials: true,
      credentials: 'include',
      headers: {
        'Authorization' : `Bearer ${apiConfig.accessToken}`
      }
    })
    .then((resp) => {
      console.log(resp);
      return resp.json();
    })
    .then(resolve)
    .catch(reject);
  });
};


export default {waitForShowpadLib, getConfigJson, getAssetsByTags, getThumbnailImage, saveLocally, saveToMyFiles, getApiConfig, getAssetById};