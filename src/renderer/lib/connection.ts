import { MeshDevice } from "@meshtastic/core";
import { TransportWebBluetooth } from "@meshtastic/transport-web-bluetooth";
import { TransportWebSerial } from "@meshtastic/transport-web-serial";
import { TransportHTTP } from "@meshtastic/transport-http";
import type { ConnectionType } from "./types";

/**
 * Create a connection to a Meshtastic device.
 *
 * BLE: Triggers Chromium's navigator.bluetooth.requestDevice() which
 *   Electron intercepts via select-bluetooth-device. The main process
 *   sends the device list to the renderer for user selection.
 *
 * Serial: Triggers navigator.serial.requestPort() which Electron
 *   intercepts via select-serial-port. Same flow as BLE.
 *
 * HTTP: Connects directly to a WiFi-enabled Meshtastic node.
 */
export async function createConnection(
  type: ConnectionType,
  httpAddress?: string
): Promise<MeshDevice> {
  let transport: { toDevice: WritableStream; fromDevice: ReadableStream; disconnect?: () => Promise<void> };

  switch (type) {
    case "ble":
      transport = await TransportWebBluetooth.create();
      break;

    case "serial":
      transport = await TransportWebSerial.create(115200);
      break;

    case "http": {
      if (!httpAddress) throw new Error("HTTP address required");
      // TransportHTTP.create() expects a raw hostname/IP, not a full URL.
      // It constructs http:// or https:// internally based on the tls flag.
      // Strip protocol if the user provided one.
      let host = httpAddress.trim();
      const useTls = host.startsWith("https://");
      host = host.replace(/^https?:\/\//, "");
      // Strip trailing slashes
      host = host.replace(/\/+$/, "");
      transport = await TransportHTTP.create(host, useTls);
      break;
    }

    default:
      throw new Error(`Unknown connection type: ${type}`);
  }

  const device = new MeshDevice(transport as any);

  // Request device configuration after connection
  device.configure();

  return device;
}

/**
 * Safely disconnect from a device, handling transports that may not
 * have a disconnect() method (e.g. TransportWebBluetooth).
 */
export async function safeDisconnect(device: MeshDevice): Promise<void> {
  try {
    // MeshDevice.disconnect() calls transport.toDevice.close() and
    // transport.disconnect(). BLE transport doesn't have disconnect(),
    // so we catch and ignore that specific error.
    await device.disconnect();
  } catch (err) {
    // If the transport doesn't have disconnect(), that's OK.
    // Also handle already-closed streams.
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("disconnect is not a function") ||
      msg.includes("not a function") ||
      msg.includes("already been closed") ||
      msg.includes("locked")
    ) {
      // Expected for BLE transport — clean up manually
      device.complete();
    } else {
      console.warn("Disconnect error:", err);
    }
  }
}
