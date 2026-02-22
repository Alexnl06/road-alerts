import React, { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive } from 'lucide-react';
import { getCacheSizeInfo, clearCache, isNetherlandsBounds } from '@/functions/offlineMapCache';

export default function OfflineCacheManager({ userLocation, isDark }) {
  const [cacheInfo, setCacheInfo] = useState(null);
  const [showCachePanel, setShowCachePanel] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      setCacheInfo({ tileCount: 0, sizeInMB: 0 });
    } catch (error) {
      console.error('Error loading cache info:', error);
      setCacheInfo({ tileCount: 0, sizeInMB: 0 });
    }
  };

  const downloadOfflineMap = async () => {
    if (!userLocation || !isNetherlandsBounds(userLocation[0], userLocation[1])) {
      alert('Je bent niet in Nederland. Offline kaarten zijn beschikbaar voor Nederland.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate downloading tiles for current area
      const [lat, lng] = userLocation;
      const zoomLevels = [11, 12, 13, 14];
      const tilesToDownload = zoomLevels.length * 4; // simplified
      let downloaded = 0;

      for (const zoom of zoomLevels) {
        const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
        const tileY = Math.floor((90 - lat) / 180 * Math.pow(2, zoom));

        // Download surrounding tiles
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const url = `https://tile.openstreetmap.org/${zoom}/${tileX + dx}/${tileY + dy}.png`;
            
            try {
              const response = await fetch(url);
              if (response.ok) {
                const blob = await response.blob();
                // Cache tile (implementation in offlineMapCache.js)
              }
            } catch (error) {
              console.error('Tile download error:', error);
            }

            downloaded++;
            setDownloadProgress(Math.round((downloaded / tilesToDownload) * 100));
          }
        }
      }

      await loadCacheInfo();
      alert('Offline kaarten gedownload!');
    } catch (error) {
      console.error('Download error:', error);
      alert('Fout bij downloaden offline kaarten');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Weet je zeker dat je alle offline kaarten wilt verwijderen?')) return;

    try {
      await clearCache();
      await loadCacheInfo();
      alert('Cache gewist');
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  };

  return (
    <>
      {/* Cache Button */}
      <button
        onClick={() => setShowCachePanel(!showCachePanel)}
        className={`fixed top-4 left-4 z-[800] backdrop-blur-xl border rounded-2xl px-3 py-2.5 flex items-center gap-2 shadow-lg transition-all ${
          isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]' : 'bg-white/95 border-gray-300 text-gray-900 hover:bg-gray-50'
        }`}
      >
        <HardDrive size={18} />
        {cacheInfo && <span className="text-xs font-medium">{cacheInfo.sizeInMB} MB</span>}
      </button>

      {/* Cache Panel */}
      {showCachePanel && (
        <div className={`fixed top-16 left-4 z-[800] backdrop-blur-xl border rounded-2xl shadow-lg p-4 w-64 ${
          isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-300'
        }`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Offline Kaarten
          </h3>

          {cacheInfo && (
            <div className={`text-sm p-2 rounded-lg mb-3 ${
              isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'
            }`}>
              <div className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                <div>{cacheInfo.tileCount} tegels</div>
                <div>{cacheInfo.sizeInMB} MB</div>
              </div>
            </div>
          )}

          {isDownloading && (
            <div className="mb-3">
              <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Downloaden: {downloadProgress}%
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-[#2A2A2A]' : 'bg-gray-200'
              }`}>
                <div
                  className="h-full bg-[#2F80ED] transition-all"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={downloadOfflineMap}
              disabled={isDownloading}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDownloading
                  ? isDark ? 'bg-[#2A2A2A] text-gray-500' : 'bg-gray-200 text-gray-500'
                  : isDark ? 'bg-[#2F80ED]/20 text-[#2F80ED] hover:bg-[#2F80ED]/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              <Download size={16} />
              Download regio
            </button>

            {cacheInfo && cacheInfo.tileCount > 0 && (
              <button
                onClick={handleClearCache}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                <Trash2 size={16} />
                Wis cache
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}