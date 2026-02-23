import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TelemetryPoint } from "../lib/types";
import RefreshButton from "./RefreshButton";

interface Props {
  telemetry: TelemetryPoint[];
  onRefresh: () => Promise<void>;
  isConnected: boolean;
}

export default function TelemetryPanel({ telemetry, onRefresh, isConnected }: Props) {
  const chartData = telemetry.map((t, i) => ({
    index: i,
    time: new Date(t.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    battery: t.batteryLevel,
    voltage: t.voltage,
    snr: t.snr,
    rssi: t.rssi,
  }));

  const hasBatteryData = chartData.some(
    (d) => d.battery !== undefined || d.voltage !== undefined
  );
  const hasSignalData = chartData.some(
    (d) => d.snr !== undefined || d.rssi !== undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-200">Telemetry</h2>
        <RefreshButton onRefresh={onRefresh} disabled={!isConnected} minimumAnimationMs={3000} />
      </div>

      {telemetry.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No telemetry data yet. Connect to a device to see real-time metrics.
        </div>
      ) : (
        <>
          {/* Battery / Voltage Chart */}
          {hasBatteryData && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Battery & Voltage
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="battery"
                    domain={[0, 100]}
                    stroke="#3b82f6"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "%",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#3b82f6" },
                    }}
                  />
                  <YAxis
                    yAxisId="voltage"
                    orientation="right"
                    domain={[3.0, 4.5]}
                    stroke="#8b5cf6"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "V",
                      angle: 90,
                      position: "insideRight",
                      style: { fill: "#8b5cf6" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="battery"
                    type="monotone"
                    dataKey="battery"
                    name="Battery %"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    yAxisId="voltage"
                    type="monotone"
                    dataKey="voltage"
                    name="Voltage"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Signal Quality Chart */}
          {hasSignalData && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Signal Quality
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="snr"
                    stroke="#ef4444"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "dB",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#ef4444" },
                    }}
                  />
                  <YAxis
                    yAxisId="rssi"
                    orientation="right"
                    stroke="#f97316"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "dBm",
                      angle: 90,
                      position: "insideRight",
                      style: { fill: "#f97316" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="snr"
                    type="monotone"
                    dataKey="snr"
                    name="SNR"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    yAxisId="rssi"
                    type="monotone"
                    dataKey="rssi"
                    name="RSSI"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="text-xs text-gray-600 text-center">
            Showing last {telemetry.length} data points (max 50)
          </div>
        </>
      )}
    </div>
  );
}
