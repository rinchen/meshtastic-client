import { useState } from "react";

interface Props {
  onSetConfig: (config: unknown) => Promise<void>;
  onCommit: () => Promise<void>;
  isConnected: boolean;
}

const REGIONS = [
  { value: 0, label: "Unset" },
  { value: 1, label: "US" },
  { value: 2, label: "EU_433" },
  { value: 3, label: "EU_868" },
  { value: 4, label: "CN" },
  { value: 5, label: "JP" },
  { value: 6, label: "ANZ" },
  { value: 7, label: "KR" },
  { value: 8, label: "TW" },
  { value: 9, label: "RU" },
  { value: 10, label: "IN" },
  { value: 11, label: "NZ_865" },
  { value: 12, label: "TH" },
  { value: 13, label: "UA_433" },
  { value: 14, label: "UA_868" },
  { value: 15, label: "MY_433" },
  { value: 16, label: "MY_919" },
  { value: 17, label: "SG_923" },
  { value: 18, label: "LORA_24" },
];

const MODEM_PRESETS = [
  { value: 0, label: "Long Fast" },
  { value: 1, label: "Long Slow" },
  { value: 2, label: "Long Moderate" },
  { value: 3, label: "Short Fast" },
  { value: 4, label: "Short Slow" },
  { value: 5, label: "Medium Fast" },
  { value: 6, label: "Medium Slow" },
];

const DEVICE_ROLES = [
  { value: 0, label: "Client", description: "Normal client mode" },
  { value: 1, label: "Client Mute", description: "Client that does not transmit" },
  { value: 2, label: "Router", description: "Dedicated router/repeater" },
  { value: 3, label: "Router Client", description: "Router + client mode" },
  { value: 5, label: "Tracker", description: "GPS tracker only" },
  { value: 6, label: "Sensor", description: "Telemetry sensor node" },
  { value: 7, label: "TAK", description: "TAK-enabled device" },
  { value: 8, label: "Client Hidden", description: "Client, hidden from node list" },
  { value: 9, label: "Lost and Found", description: "Broadcasts position for recovery" },
  { value: 10, label: "TAK Tracker", description: "TAK tracker mode" },
];

const DISPLAY_UNITS = [
  { value: 0, label: "Metric" },
  { value: 1, label: "Imperial" },
];

/** Reusable select component */
function ConfigSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  description,
}: {
  label: string;
  value: number;
  options: Array<{ value: number; label: string; description?: string }>;
  onChange: (val: number) => void;
  disabled: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full px-3 py-2 bg-gray-700 rounded-lg text-gray-200 border border-gray-600 focus:border-green-500 focus:outline-none disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}

/** Reusable toggle switch */
function ConfigToggle({
  label,
  checked,
  onChange,
  disabled,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-400">{label}</label>
        <button
          onClick={() => onChange(!checked)}
          disabled={disabled}
          className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
            checked ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}

/** Reusable number input */
function ConfigNumber({
  label,
  value,
  onChange,
  disabled,
  min,
  max,
  unit,
  description,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          disabled={disabled}
          className="w-28 px-3 py-2 bg-gray-700 rounded-lg text-gray-200 border border-gray-600 focus:border-green-500 focus:outline-none disabled:opacity-50"
        />
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}

/** Collapsible section wrapper */
function ConfigSection({
  title,
  children,
  onApply,
  applying,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onApply: () => void;
  applying: boolean;
  disabled: boolean;
}) {
  return (
    <details className="group bg-gray-800/50 rounded-lg border border-gray-700">
      <summary className="px-4 py-3 cursor-pointer text-gray-200 font-medium flex items-center justify-between hover:bg-gray-800 rounded-lg transition-colors">
        <span>{title}</span>
        <svg
          className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 space-y-4">
        {children}
        <button
          onClick={onApply}
          disabled={disabled || applying}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {applying ? "Applying..." : `Apply ${title}`}
        </button>
      </div>
    </details>
  );
}

export default function ConfigPanel({
  onSetConfig,
  onCommit,
  isConnected,
}: Props) {
  // ─── LoRa settings ────────────────────────────────────────────
  const [region, setRegion] = useState(1);
  const [modemPreset, setModemPreset] = useState(0);
  const [hopLimit, setHopLimit] = useState(3);

  // ─── Device settings ──────────────────────────────────────────
  const [deviceRole, setDeviceRole] = useState(0);

  // ─── Position settings ────────────────────────────────────────
  const [positionBroadcastSecs, setPositionBroadcastSecs] = useState(900);
  const [gpsUpdateInterval, setGpsUpdateInterval] = useState(120);
  const [fixedPosition, setFixedPosition] = useState(false);

  // ─── Power settings ───────────────────────────────────────────
  const [isPowerSaving, setIsPowerSaving] = useState(false);

  // ─── Bluetooth settings ───────────────────────────────────────
  const [btEnabled, setBtEnabled] = useState(true);
  const [btFixedPin, setBtFixedPin] = useState(123456);

  // ─── Display settings ─────────────────────────────────────────
  const [screenOnSecs, setScreenOnSecs] = useState(60);
  const [displayUnits, setDisplayUnits] = useState(0);

  // ─── Shared state ─────────────────────────────────────────────
  const [status, setStatus] = useState<string | null>(null);
  const [applyingSection, setApplyingSection] = useState<string | null>(null);

  const disabled = !isConnected;

  const applyConfig = async (
    section: string,
    configCase: string,
    configValue: Record<string, unknown>
  ) => {
    if (!isConnected) return;
    setApplyingSection(section);
    setStatus(`Applying ${section}...`);
    try {
      await onSetConfig({
        payloadVariant: {
          case: configCase,
          value: configValue,
        },
      });
      await onCommit();
      setStatus(`${section} applied successfully!`);
    } catch (err) {
      setStatus(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setApplyingSection(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">
        Device Configuration
      </h2>

      {!isConnected && (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg text-sm">
          Connect to a device to modify configuration.
        </div>
      )}

      {/* ═══ LoRa / Radio ═══ */}
      <ConfigSection
        title="LoRa / Radio"
        onApply={() =>
          applyConfig("LoRa", "lora", {
            region,
            modemPreset,
            usePreset: true,
            hopLimit,
          })
        }
        applying={applyingSection === "LoRa"}
        disabled={disabled}
      >
        <ConfigSelect
          label="Region"
          value={region}
          options={REGIONS}
          onChange={setRegion}
          disabled={disabled || applyingSection !== null}
        />
        <ConfigSelect
          label="Modem Preset"
          value={modemPreset}
          options={MODEM_PRESETS}
          onChange={setModemPreset}
          disabled={disabled || applyingSection !== null}
        />
        <div className="space-y-1">
          <label className="text-sm text-gray-400">Hop Limit</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={7}
              value={hopLimit}
              onChange={(e) => setHopLimit(Number(e.target.value))}
              disabled={disabled || applyingSection !== null}
              className="flex-1 accent-green-500 disabled:opacity-50"
            />
            <span className="text-gray-200 font-mono text-lg w-6 text-center">
              {hopLimit}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Number of times a message can be relayed (1–7). Higher = more
            reach, more airtime. Default: 3.
          </p>
        </div>
      </ConfigSection>

      {/* ═══ Device Role ═══ */}
      <ConfigSection
        title="Device Role"
        onApply={() => applyConfig("Device", "device", { role: deviceRole })}
        applying={applyingSection === "Device"}
        disabled={disabled}
      >
        <ConfigSelect
          label="Role"
          value={deviceRole}
          options={DEVICE_ROLES}
          onChange={setDeviceRole}
          disabled={disabled || applyingSection !== null}
          description={
            DEVICE_ROLES.find((r) => r.value === deviceRole)?.description
          }
        />
      </ConfigSection>

      {/* ═══ Position / GPS ═══ */}
      <ConfigSection
        title="Position / GPS"
        onApply={() =>
          applyConfig("Position", "position", {
            positionBroadcastSecs,
            gpsUpdateInterval,
            fixedPosition,
          })
        }
        applying={applyingSection === "Position"}
        disabled={disabled}
      >
        <ConfigNumber
          label="Position Broadcast Interval"
          value={positionBroadcastSecs}
          onChange={setPositionBroadcastSecs}
          disabled={disabled || applyingSection !== null}
          min={0}
          max={86400}
          unit="seconds"
          description="How often to broadcast position. 0 = use default (900s). Set higher to conserve airtime."
        />
        <ConfigNumber
          label="GPS Update Interval"
          value={gpsUpdateInterval}
          onChange={setGpsUpdateInterval}
          disabled={disabled || applyingSection !== null}
          min={0}
          max={86400}
          unit="seconds"
          description="How often to poll the GPS module. 0 = use default."
        />
        <ConfigToggle
          label="Fixed Position"
          checked={fixedPosition}
          onChange={setFixedPosition}
          disabled={disabled || applyingSection !== null}
          description="When enabled, the device will use a manually-set position instead of GPS."
        />
      </ConfigSection>

      {/* ═══ Power ═══ */}
      <ConfigSection
        title="Power"
        onApply={() =>
          applyConfig("Power", "power", { isPowerSaving })
        }
        applying={applyingSection === "Power"}
        disabled={disabled}
      >
        <ConfigToggle
          label="Power Saving Mode"
          checked={isPowerSaving}
          onChange={setIsPowerSaving}
          disabled={disabled || applyingSection !== null}
          description="Enable low-power mode. Reduces responsiveness but significantly extends battery life."
        />
      </ConfigSection>

      {/* ═══ Bluetooth ═══ */}
      <ConfigSection
        title="Bluetooth"
        onApply={() =>
          applyConfig("Bluetooth", "bluetooth", {
            enabled: btEnabled,
            fixedPin: btFixedPin,
          })
        }
        applying={applyingSection === "Bluetooth"}
        disabled={disabled}
      >
        <ConfigToggle
          label="Bluetooth Enabled"
          checked={btEnabled}
          onChange={setBtEnabled}
          disabled={disabled || applyingSection !== null}
          description="Toggle Bluetooth radio on the device."
        />
        <ConfigNumber
          label="Pairing PIN"
          value={btFixedPin}
          onChange={setBtFixedPin}
          disabled={disabled || applyingSection !== null || !btEnabled}
          min={100000}
          max={999999}
          description="6-digit fixed PIN for Bluetooth pairing. Default: 123456."
        />
      </ConfigSection>

      {/* ═══ Display ═══ */}
      <ConfigSection
        title="Display"
        onApply={() =>
          applyConfig("Display", "display", {
            screenOnSecs,
            units: displayUnits,
          })
        }
        applying={applyingSection === "Display"}
        disabled={disabled}
      >
        <ConfigNumber
          label="Screen On Duration"
          value={screenOnSecs}
          onChange={setScreenOnSecs}
          disabled={disabled || applyingSection !== null}
          min={0}
          max={3600}
          unit="seconds"
          description="How long the screen stays on after activity. 0 = always on."
        />
        <ConfigSelect
          label="Display Units"
          value={displayUnits}
          options={DISPLAY_UNITS}
          onChange={setDisplayUnits}
          disabled={disabled || applyingSection !== null}
        />
      </ConfigSection>

      {/* Status */}
      {status && (
        <div
          className={`px-4 py-2 rounded-lg text-sm ${
            status.includes("Failed")
              ? "bg-red-900/50 border border-red-700 text-red-300"
              : status.includes("success")
              ? "bg-green-900/50 border border-green-700 text-green-300"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          {status}
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-500 space-y-1">
        <p>
          Changes are written to the device's flash memory and persist across
          reboots.
        </p>
        <p>
          The device may briefly restart after applying new LoRa or device
          settings.
        </p>
      </div>
    </div>
  );
}
