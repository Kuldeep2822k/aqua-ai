import { Download, Filter, MapPin, Activity, Droplet, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const monitoringPoints = [
  { id: 1, name: 'Yamuna River, Delhi', lat: 28.7041, lng: 77.1025, status: 'critical', param: 'High BOD: >5.8 mg/L', state: 'Delhi', lastUpdate: '2h ago', ph: 7.2, temp: 28 },
  { id: 2, name: 'Ganga River, Varanasi', lat: 25.3176, lng: 82.9739, status: 'critical', param: 'Heavy Metals: >0.18 mg/L Lead', state: 'Uttar Pradesh', lastUpdate: '1h ago', ph: 7.5, temp: 26 },
  { id: 3, name: 'Godavari River, Nashik', lat: 19.9975, lng: 73.7898, status: 'warning', param: 'TDS: 750 ppm', state: 'Maharashtra', lastUpdate: '3h ago', ph: 7.8, temp: 29 },
  { id: 4, name: 'Krishna River, Vijayawada', lat: 16.5062, lng: 80.6480, status: 'warning', param: 'TDS: 800 ppm', state: 'Andhra Pradesh', lastUpdate: '2h ago', ph: 7.6, temp: 30 },
  { id: 5, name: 'Cauvery River, Mettur', lat: 11.7961, lng: 77.8008, status: 'good', param: 'All parameters normal', state: 'Tamil Nadu', lastUpdate: '1h ago', ph: 7.4, temp: 27 },
  { id: 6, name: 'Brahmaputra River, Guwahati', lat: 26.1445, lng: 91.7362, status: 'good', param: 'All parameters normal', state: 'Assam', lastUpdate: '4h ago', ph: 7.3, temp: 25 },
  { id: 7, name: 'Narmada River, Jabalpur', lat: 23.1815, lng: 79.9864, status: 'warning', param: 'pH: 8.5', state: 'Madhya Pradesh', lastUpdate: '2h ago', ph: 8.5, temp: 28 },
  { id: 8, name: 'Mumbai Coastal Waters', lat: 19.0760, lng: 72.8777, status: 'warning', param: 'Fecal Coliform high', state: 'Maharashtra', lastUpdate: '1h ago', ph: 7.9, temp: 29 },
  { id: 9, name: 'Chennai Marina Beach', lat: 13.0827, lng: 80.2707, status: 'good', param: 'All parameters normal', state: 'Tamil Nadu', lastUpdate: '3h ago', ph: 7.5, temp: 28 },
  { id: 10, name: 'Hooghly River, Kolkata', lat: 22.5726, lng: 88.3639, status: 'warning', param: 'Turbidity: 45 NTU', state: 'West Bengal', lastUpdate: '2h ago', ph: 7.7, temp: 27 },
  { id: 11, name: 'Sabarmati River, Ahmedabad', lat: 23.0225, lng: 72.5714, status: 'warning', param: 'DO: 3.2 mg/L', state: 'Gujarat', lastUpdate: '1h ago', ph: 7.4, temp: 31 },
  { id: 12, name: 'Musi River, Hyderabad', lat: 17.3850, lng: 78.4867, status: 'critical', param: 'High BOD: >6.5 mg/L', state: 'Telangana', lastUpdate: '30m ago', ph: 7.1, temp: 29 },
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

function latLngToMercator(lat: number, lng: number, zoom: number, width: number, height: number) {
  const scale = 256 * Math.pow(2, zoom);
  const worldX = (lng + 180) / 360 * scale;
  const worldY = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale;
  
  const centerLat = 20.5937;
  const centerLng = 78.9629;
  const centerWorldX = (centerLng + 180) / 360 * scale;
  const centerWorldY = (1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * scale;
  
  const x = (worldX - centerWorldX) + width / 2;
  const y = (worldY - centerWorldY) + height / 2;
  
  return { x, y };
}

export function MapViewPage() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
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

    const zoom = 5;
    const centerLat = 20.5937;
    const centerLng = 78.9629;
    
    const scale = Math.pow(2, zoom);
    const tileX = Math.floor((centerLng + 180) / 360 * scale);
    const tileY = Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * scale);
    
    const tileSize = 256;
    const numTilesX = Math.ceil(dimensions.width / tileSize) + 2;
    const numTilesY = Math.ceil(dimensions.height / tileSize) + 2;
    
    let loadedCount = 0;
    const totalTiles = numTilesX * numTilesY;

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

  const filteredPoints = monitoringPoints.filter(point => {
    return filterStatus === 'all' || point.status === filterStatus;
  });

  const selectedData = selectedPoint ? monitoringPoints.find(p => p.id === selectedPoint) : null;

  return (
    <main className="h-[calc(100vh-73px)] flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-green-950/30 transition-colors duration-200">
      {/* Top Stats Bar */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-4 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Interactive Map</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time water quality monitoring across India</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{monitoringPoints.filter(p => p.status === 'critical').length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Critical</span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{monitoringPoints.filter(p => p.status === 'warning').length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Warning</span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{monitoringPoints.filter(p => p.status === 'good').length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Good</span>
              </div>
            </div>

            <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2 bg-white/50 dark:bg-gray-800/50">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Map Container */}
        <div ref={containerRef} className="flex-1 relative bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          
          {!tilesLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Loading map...</div>
              </div>
            </div>
          )}

          {dimensions.width > 0 && filteredPoints.map((point) => {
            const pos = latLngToMercator(point.lat, point.lng, 5, dimensions.width, dimensions.height);
            const isSelected = selectedPoint === point.id;
            
            return (
              <div
                key={point.id}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => setSelectedPoint(point.id)}
              >
                <div className="relative cursor-pointer group">
                  <div 
                    className={`w-5 h-5 ${statusBgColors[point.status as keyof typeof statusBgColors]} rounded-full border-2 border-white dark:border-gray-800 shadow-xl hover:scale-150 transition-all duration-300 z-10 relative ${isSelected ? 'scale-150 ring-4 ring-white/50' : ''}`}
                  ></div>
                  <div 
                    className={`absolute inset-0 ${statusBgColors[point.status as keyof typeof statusBgColors]} rounded-full animate-ping opacity-75`}
                  ></div>
                </div>
              </div>
            );
          })}

          {/* Floating Filter Panel */}
          <div className="absolute top-6 left-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[1000] transition-colors duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'all' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Locations ({monitoringPoints.length})
              </button>
              <button
                onClick={() => setFilterStatus('critical')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'critical' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Critical ({monitoringPoints.filter(p => p.status === 'critical').length})
              </button>
              <button
                onClick={() => setFilterStatus('warning')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'warning' 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Warning ({monitoringPoints.filter(p => p.status === 'warning').length})
              </button>
              <button
                onClick={() => setFilterStatus('good')}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  filterStatus === 'good' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Good ({monitoringPoints.filter(p => p.status === 'good').length})
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[1000] transition-colors duration-200">
            <div className="text-xs font-semibold mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wide">Legend</div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">Good Quality</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">All parameters normal</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg"></div>
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">Warning</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Minor issues detected</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg"></div>
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">Critical</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Immediate action needed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attribution */}
          <div className="absolute bottom-6 right-6 text-xs text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 rounded-lg z-[1000] shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-colors duration-200">
            © OpenStreetMap contributors
          </div>
        </div>

        {/* Right Panel - Location Details */}
        {selectedData && (
          <div className="w-[400px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl transition-colors duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedData.name}</h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedData.state}</p>
                </div>
                <button 
                  onClick={() => setSelectedPoint(null)}
                  className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusBgColors[selectedData.status as keyof typeof statusBgColors]} text-white shadow-lg`}>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{statusLabels[selectedData.status as keyof typeof statusLabels]}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Main Issue */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Primary Issue</div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-sm text-red-900 dark:text-red-300 font-medium">{selectedData.param}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Water Parameters</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">pH Level</span>
                      </div>
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{selectedData.ph}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Temp</span>
                      </div>
                      <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{selectedData.temp}°C</div>
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Location Details</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Latitude</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedData.lat.toFixed(4)}°</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Longitude</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedData.lng.toFixed(4)}°</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedData.lastUpdate}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium">
                    View Full Analytics
                  </button>
                  <button className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium">
                    Download Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
