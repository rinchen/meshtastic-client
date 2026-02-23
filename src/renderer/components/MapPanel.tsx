import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { MeshNode } from "../lib/types";
import RefreshButton from "./RefreshButton";

// Fix for default markers not showing in bundled apps
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  nodes: Map<number, MeshNode>;
  onRefresh: () => Promise<void>;
  isConnected: boolean;
}

// Default center: Longmont, CO (same as Joey's original)
const DEFAULT_CENTER: [number, number] = [40.1672, -105.1019];
const DEFAULT_ZOOM = 12;

// Fix 4: Re-center map when nodes change
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center[0], center[1], map]);
  return null;
}

export default function MapPanel({ nodes, onRefresh, isConnected }: Props) {
  const nodesWithPosition = Array.from(nodes.values()).filter(
    (n) => n.latitude !== 0 && n.longitude !== 0
  );

  // Center on nodes if we have positions, otherwise default
  const center: [number, number] =
    nodesWithPosition.length > 0
      ? [nodesWithPosition[0].latitude, nodesWithPosition[0].longitude]
      : DEFAULT_CENTER;

  function formatTime(ts: number): string {
    if (!ts) return "Never";
    return new Date(ts).toLocaleString();
  }

  return (
    <div className="h-full min-h-[500px] rounded-lg overflow-hidden border border-gray-700 relative">
      {/* Refresh button overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-gray-900/70 rounded-full">
        <RefreshButton onRefresh={onRefresh} disabled={!isConnected} />
      </div>

      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
      >
        <MapUpdater center={center} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {nodesWithPosition.map((node) => (
          <Marker
            key={node.node_id}
            position={[node.latitude, node.longitude]}
          >
            <Popup>
              <div className="text-gray-900 text-sm space-y-1">
                <div className="font-bold">
                  {node.long_name || `!${node.node_id.toString(16)}`}
                </div>
                {node.short_name && (
                  <div className="text-gray-600">{node.short_name}</div>
                )}
                {node.battery > 0 && <div>Battery: {node.battery}%</div>}
                {node.snr !== 0 && (
                  <div>SNR: {node.snr.toFixed(1)} dB</div>
                )}
                <div>Last heard: {formatTime(node.last_heard)}</div>
                <div className="text-xs text-gray-500">
                  {node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {nodesWithPosition.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/80 px-4 py-2 rounded-lg text-gray-400 text-sm">
            No nodes with GPS positions yet
          </div>
        </div>
      )}
    </div>
  );
}
