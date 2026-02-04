import { Download, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const monitoringPoints = [
  { id: 1, name: 'Yamuna River, Delhi', lat: 28.7041, lng: 77.1025, status: 'critical', param: 'High BOD: >5.8 mg/L' },
  { id: 2, name: 'Ganga River, Varanasi', lat: 25.3176, lng: 82.9739, status: 'critical', param: 'Heavy Metals: >0.18 mg/L Lead' },
  { id: 3, name: 'Godavari River, Nashik', lat: 19.9975, lng: 73.7898, status: 'warning', param: 'TDS: 750 ppm' },
  { id: 4, name: 'Krishna River, Vijayawada', lat: 16.5062, lng: 80.6480, status: 'warning', param: 'TDS: 800 ppm' },
  { id: 5, name: 'Cauvery River, Mettur', lat: 11.7961, lng: 77.8008, status: 'good', param: 'All parameters normal' },
  { id: 6, name: 'Brahmaputra River, Guwahati', lat: 26.1445, lng: 91.7362, status: 'good', param: 'All parameters normal' },
  { id: 7, name: 'Narmada River, Jabalpur', lat: 23.1815, lng: 79.9864, status: 'warning', param: 'pH: 8.5' },
  { id: 8, name: 'Mumbai Coastal Waters', lat: 19.0760, lng: 72.8777, status: 'warning', param: 'Fecal Coliform high' },
  { id: 9, name: 'Chennai Marina Beach', lat: 13.0827, lng: 80.2707, status: 'good', param: 'All parameters normal' },
  { id: 10, name: 'Hooghly River, Kolkata', lat: 22.5726, lng: 88.3639, status: 'warning', param: 'Turbidity: 45 NTU' },
  { id: 11, name: 'Sabarmati River, Ahmedabad', lat: 23.0225, lng: 72.5714, status: 'warning', param: 'DO: 3.2 mg/L' },
  { id: 12, name: 'Musi River, Hyderabad', lat: 17.3850, lng: 78.4867, status: 'critical', param: 'High BOD: >6.5 mg/L' },
];

const statusBgColors = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-500',
  good: 'bg-green-500'
};

const statusLabels = {
  critical: 'Critical',
  warning: 'Warning',
  good: 'Good'
};

// Web Mercator projection
function latLngToMercator(lat: number, lng: number, zoom: number, width: number, height: number) {
  const scale = 256 * Math.pow(2, zoom);
  const worldX = (lng + 180) / 360 * scale;
  const worldY = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale;
  
  // Center on India (20.5937, 78.9629)
  const centerLat = 20.5937;
  const centerLng = 78.9629;
  const centerWorldX = (centerLng + 180) / 360 * scale;
  const centerWorldY = (1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * scale;
  
  const x = (worldX - centerWorldX) + width / 2;
  const y = (worldY - centerWorldY) + height / 2;
  
  return { x, y };
}

export function MapView() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tilesLoaded, setTilesLoaded] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Draw map tiles
    const zoom = 5;
    const centerLat = 20.5937;
    const centerLng = 78.9629;
    
    // Calculate tile coordinates
    const scale = Math.pow(2, zoom);
    const tileX = Math.floor((centerLng + 180) / 360 * scale);
    const tileY = Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * scale);
    
    const tileSize = 256;
    const numTilesX = Math.ceil(dimensions.width / tileSize) + 2;
    const numTilesY = Math.ceil(dimensions.height / tileSize) + 2;
    
    let loadedCount = 0;
    const totalTiles = numTilesX * numTilesY;

    // Load and draw tiles
    for (let dx = -Math.floor(numTilesX / 2); dx < Math.ceil(numTilesX / 2); dx++) {
      for (let dy = -Math.floor(numTilesY / 2); dy < Math.ceil(numTilesY / 2); dy++) {
        const tx = tileX + dx;
        const ty = tileY + dy;
        
        if (tx < 0 || ty < 0 || tx >= scale || ty >= scale) continue;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const x = dimensions.width / 2 + dx * tileSize;
          const y = dimensions.height / 2 + dy * tileSize;
          ctx.drawImage(img, x, y, tileSize, tileSize);
          
          loadedCount++;
          if (loadedCount >= totalTiles - 4) {
            setTilesLoaded(true);
          }
        };
        img.src = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
      }
    }
  }, [dimensions]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-full transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Water Quality Map - India</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors duration-200">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="px-3 py-1.5 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors duration-200">
            <ImageIcon className="w-4 h-4" />
            Export Map
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
        {/* Canvas for map tiles */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        
        {/* Loading indicator */}
        {!tilesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading map...</div>
          </div>
        )}

        {/* Monitoring points overlay */}
        {dimensions.width > 0 && monitoringPoints.map((point) => {
          const pos = latLngToMercator(point.lat, point.lng, 5, dimensions.width, dimensions.height);
          
          return (
            <div
              key={point.id}
              className="absolute"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
              onMouseEnter={() => setSelectedPoint(point.id)}
              onMouseLeave={() => setSelectedPoint(null)}
            >
              {/* Marker */}
              <div className="relative cursor-pointer">
                <div 
                  className={`w-6 h-6 ${statusBgColors[point.status as keyof typeof statusBgColors]} rounded-full border-2 border-white dark:border-gray-800 shadow-lg hover:scale-125 transition-transform z-10 relative`}
                ></div>
                <div 
                  className={`absolute inset-0 ${statusBgColors[point.status as keyof typeof statusBgColors]} rounded-full animate-ping opacity-75`}
                ></div>
                
                {/* Tooltip */}
                {selectedPoint === point.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl whitespace-nowrap z-50 border border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-sm mb-1 text-gray-900 dark:text-white">{point.name}</div>
                    <div className="text-xs mb-1">
                      <span 
                        className={`inline-block px-2 py-0.5 rounded text-white ${statusBgColors[point.status as keyof typeof statusBgColors]}`}
                      >
                        {statusLabels[point.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{point.param}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Lat: {point.lat.toFixed(4)}, Lng: {point.lng.toFixed(4)}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg z-[1000] border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Water Quality Status</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Good ({monitoringPoints.filter(p => p.status === 'good').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Warning ({monitoringPoints.filter(p => p.status === 'warning').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Critical ({monitoringPoints.filter(p => p.status === 'critical').length})</span>
            </div>
          </div>
        </div>

        {/* Attribution */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded z-[1000]">
          © OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}
