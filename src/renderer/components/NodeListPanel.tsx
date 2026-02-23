import type { MeshNode } from "../lib/types";
import RefreshButton from "./RefreshButton";

interface Props {
  nodes: Map<number, MeshNode>;
  onRequestPosition: (nodeNum: number) => Promise<void>;
  onTraceRoute: (nodeNum: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  onNodeClick: (node: MeshNode) => void;
  isConnected: boolean;
}

export default function NodeListPanel({
  nodes,
  onRequestPosition,
  onTraceRoute,
  onRefresh,
  onNodeClick,
  isConnected,
}: Props) {
  const nodeList = Array.from(nodes.values()).sort(
    (a, b) => b.last_heard - a.last_heard
  );

  function formatTime(ts: number): string {
    if (!ts) return "Never";
    const diff = Date.now() - ts;
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  function formatCoord(val: number): string {
    return val === 0 ? "-" : val.toFixed(4);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-200">
          Node Database ({nodeList.length})
        </h2>
        <RefreshButton onRefresh={onRefresh} disabled={!isConnected} />
      </div>

      <div className="overflow-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-400 text-left sticky top-0 z-10">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Long Name</th>
              <th className="px-3 py-2">Short</th>
              <th className="px-3 py-2 text-right">SNR</th>
              <th className="px-3 py-2 text-right">Battery</th>
              <th className="px-3 py-2">Last Heard</th>
              <th className="px-3 py-2 text-right">Lat</th>
              <th className="px-3 py-2 text-right">Lon</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {nodeList.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center text-gray-500 py-8"
                >
                  No nodes discovered yet. Connect to a device to see the mesh
                  network.
                </td>
              </tr>
            ) : (
              nodeList.map((node, idx) => (
                <tr
                  key={node.node_id}
                  onClick={() => onNodeClick(node)}
                  className={`cursor-pointer hover:bg-gray-700/50 transition-colors ${
                    idx % 2 === 1 ? "bg-gray-800/30" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">
                    !{node.node_id.toString(16)}
                  </td>
                  <td className="px-3 py-2 text-gray-200">
                    {node.long_name || "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-300">
                    {node.short_name || "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">
                    {node.snr ? `${node.snr.toFixed(1)} dB` : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {node.battery > 0 && (
                        <div className="w-10 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              node.battery > 50
                                ? "bg-green-500"
                                : node.battery > 20
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(node.battery, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                      <span
                        className={
                          node.battery > 50
                            ? "text-green-400"
                            : node.battery > 20
                            ? "text-yellow-400"
                            : node.battery > 0
                            ? "text-red-400"
                            : "text-gray-500"
                        }
                      >
                        {node.battery > 0 ? `${node.battery}%` : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {formatTime(node.last_heard)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-400">
                    {formatCoord(node.latitude)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-400">
                    {formatCoord(node.longitude)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestPosition(node.node_id);
                        }}
                        disabled={!isConnected}
                        title="Request Position"
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
                      >
                        Pos
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceRoute(node.node_id);
                        }}
                        disabled={!isConnected}
                        title="Trace Route"
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
                      >
                        Route
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
