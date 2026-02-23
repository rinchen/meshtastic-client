import { useState, useEffect, useCallback } from "react";
import type {
  ConnectionType,
  DeviceState,
  BluetoothDevice,
  SerialPortInfo,
} from "../lib/types";

/** Inline SVG icon for each connection type */
function ConnectionIcon({ type }: { type: ConnectionType }) {
  const cls = "w-5 h-5 shrink-0";
  switch (type) {
    case "ble":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l6 5-6 5M12 2l5 5-5 5 5 5-5 5V2z" />
        </svg>
      );
    case "serial":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      );
    case "http":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
        </svg>
      );
  }
}

interface Props {
  state: DeviceState;
  onConnect: (type: ConnectionType, httpAddress?: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export default function ConnectionPanel({
  state,
  onConnect,
  onDisconnect,
}: Props) {
  const [connectionType, setConnectionType] = useState<ConnectionType>("ble");
  const [httpAddress, setHttpAddress] = useState("meshtastic.local");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // ─── BLE device picker state ──────────────────────────────────
  const [bleDevices, setBleDevices] = useState<BluetoothDevice[]>([]);
  const [showBlePicker, setShowBlePicker] = useState(false);

  // ─── Serial port picker state ─────────────────────────────────
  const [serialPorts, setSerialPorts] = useState<SerialPortInfo[]>([]);
  const [showSerialPicker, setShowSerialPicker] = useState(false);

  // Listen for BLE devices discovered by main process
  useEffect(() => {
    const cleanup = window.electronAPI.onBluetoothDevicesDiscovered(
      (devices) => {
        setBleDevices(devices);
        setShowBlePicker(true);
      }
    );
    return cleanup;
  }, []);

  // Listen for serial ports discovered by main process
  useEffect(() => {
    const cleanup = window.electronAPI.onSerialPortsDiscovered((ports) => {
      setSerialPorts(ports);
      setShowSerialPicker(true);
    });
    return cleanup;
  }, []);

  const handleConnect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    setBleDevices([]);
    setSerialPorts([]);
    setShowBlePicker(false);
    setShowSerialPicker(false);
    try {
      await onConnect(connectionType, httpAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
      setShowBlePicker(false);
      setShowSerialPicker(false);
    }
  }, [connectionType, httpAddress, onConnect]);

  const handleSelectBleDevice = useCallback((deviceId: string) => {
    window.electronAPI.selectBluetoothDevice(deviceId);
    setShowBlePicker(false);
  }, []);

  const handleCancelBle = useCallback(() => {
    window.electronAPI.cancelBluetoothSelection();
    setShowBlePicker(false);
    setConnecting(false);
  }, []);

  const handleSelectSerialPort = useCallback((portId: string) => {
    window.electronAPI.selectSerialPort(portId);
    setShowSerialPicker(false);
  }, []);

  const handleCancelSerial = useCallback(() => {
    window.electronAPI.cancelSerialSelection();
    setShowSerialPicker(false);
    setConnecting(false);
  }, []);

  const isConnected =
    state.status === "connected" || state.status === "configured";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-gray-200">
        Device Connection
      </h2>

      {/* Connection type selector */}
      <div className="space-y-3">
        <label className="text-sm text-gray-400">Connection Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(["ble", "serial", "http"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setConnectionType(type)}
              disabled={isConnected || connecting}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                connectionType === type
                  ? "bg-green-600 text-white ring-2 ring-green-400"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } disabled:opacity-50`}
            >
              <ConnectionIcon type={type} />
              {type === "ble" && "Bluetooth"}
              {type === "serial" && "USB Serial"}
              {type === "http" && "WiFi/HTTP"}
            </button>
          ))}
        </div>
      </div>

      {/* HTTP address input */}
      {connectionType === "http" && (
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Device Address</label>
          <input
            type="text"
            value={httpAddress}
            onChange={(e) => setHttpAddress(e.target.value)}
            disabled={isConnected || connecting}
            placeholder="meshtastic.local or 192.168.1.x"
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-gray-200 border border-gray-600 focus:border-green-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500">
            Enter hostname or IP address (without http://)
          </p>
        </div>
      )}

      {/* Connection hints */}
      <div className="text-sm text-gray-500 bg-gray-800 rounded-lg p-3 space-y-1">
        {connectionType === "ble" && (
          <>
            <p>
              Ensure your Meshtastic device has Bluetooth enabled and is in
              range.
            </p>
            <p>
              Click Connect to scan — a device picker will appear with
              discovered Meshtastic devices.
            </p>
          </>
        )}
        {connectionType === "serial" && (
          <>
            <p>Connect your Meshtastic device via USB cable.</p>
            <p>
              Click Connect — a port picker will appear with available serial
              ports.
            </p>
          </>
        )}
        {connectionType === "http" && (
          <p>
            Enter the IP address or hostname of a WiFi-connected Meshtastic
            node. The device must have WiFi enabled in its config.
          </p>
        )}
      </div>

      {/* ─── BLE Device Picker ──────────────────────────────────── */}
      {showBlePicker && (
        <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          <div className="px-4 py-2 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-200">
              Select Bluetooth Device
            </span>
            <span className="text-xs text-gray-400">
              {bleDevices.length} found
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {bleDevices.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm animate-pulse">
                Scanning for Meshtastic devices...
              </div>
            ) : (
              bleDevices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => handleSelectBleDevice(device.deviceId)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                >
                  <div className="text-sm text-gray-200">
                    {device.deviceName}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {device.deviceId}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-600">
            <button
              onClick={handleCancelBle}
              className="w-full px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Serial Port Picker ─────────────────────────────────── */}
      {showSerialPicker && (
        <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          <div className="px-4 py-2 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-200">
              Select Serial Port
            </span>
            <span className="text-xs text-gray-400">
              {serialPorts.length} found
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {serialPorts.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No serial ports found. Ensure your device is plugged in.
              </div>
            ) : (
              serialPorts.map((port) => (
                <button
                  key={port.portId}
                  onClick={() => handleSelectSerialPort(port.portId)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                >
                  <div className="text-sm text-gray-200">
                    {port.displayName}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {port.portName}
                    {port.vendorId && ` (VID: ${port.vendorId})`}
                    {port.productId && ` PID: ${port.productId}`}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-600">
            <button
              onClick={handleCancelSerial}
              className="w-full px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Connect / Disconnect button */}
      <div className="flex gap-3">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            {connecting
              ? showBlePicker || showSerialPicker
                ? "Select a device..."
                : "Connecting..."
              : "Connect"}
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Status details */}
      {isConnected && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Status</span>
            <span className="text-green-400 capitalize">{state.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Connection</span>
            <span className="text-gray-200 uppercase">
              {state.connectionType}
            </span>
          </div>
          {state.myNodeNum > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">My Node</span>
              <span className="text-gray-200">
                !{state.myNodeNum.toString(16)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
