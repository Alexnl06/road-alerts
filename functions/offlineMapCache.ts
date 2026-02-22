// Offline map tile caching for Netherlands
const DB_NAME = 'RoadAlertsOfflineDB';
const STORE_NAME = 'tiles';
const NETHERLANDS_BOUNDS = {
  north: 53.5,
  south: 50.7,
  east: 7.3,
  west: 3.4
};

let db = null;

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
}

export async function cacheMapTile(url, blob) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.put({
      url,
      blob,
      timestamp: Date.now()
    });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getTileCached(url) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    
    request.onsuccess = () => {
      resolve(request.result?.blob || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getCacheSizeInfo() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const tiles = request.result;
      const size = tiles.reduce((acc, tile) => acc + tile.blob.size, 0);
      resolve({
        tileCount: tiles.length,
        sizeInMB: (size / 1024 / 1024).toFixed(2)
      });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearCache() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function isNetherlandsBounds(lat, lng) {
  return lat >= NETHERLANDS_BOUNDS.south && 
         lat <= NETHERLANDS_BOUNDS.north && 
         lng >= NETHERLANDS_BOUNDS.west && 
         lng <= NETHERLANDS_BOUNDS.east;
}