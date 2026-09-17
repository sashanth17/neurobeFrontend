import { useState } from "react";
import { PlusCircle, SquarePen } from "lucide-react";

interface Experiment {
  id: number;
  title: string;
  hours: number;
}

const INITIAL_EXPERIMENTS: Experiment[] = [
  { id: 1, title: "Network Cable Crimping, Twisted-Pair Pinouts, and Ethernet Link Setup", hours: 3 },
  { id: 2, title: "Packet Capture and Frame Header Dissection using Wireshark", hours: 3 },
  { id: 3, title: "CRC Error Detection and Stop-and-Wait ARQ Protocol Simulation", hours: 3 },
  { id: 4, title: "Subnet Design and IP Address Allocation for a Multi-Department Network", hours: 3 },
  { id: 5, title: "Static and Dynamic Routing Configuration using Cisco Packet Tracer", hours: 3 },
  { id: 6, title: "TCP Three-Way Handshake and Flow Control Analysis", hours: 3 },
  { id: 7, title: "DNS Resolution and HTTP Request-Response Cycle Observation", hours: 3 },
  { id: 8, title: "RSA Encryption and Decryption Implementation", hours: 3 },
  { id: 9, title: "Firewall Rule Configuration and Intrusion Detection Simulation", hours: 3 },
  { id: 10, title: "Network Performance Benchmarking using iPerf and Ping Tools", hours: 3 },
];

const LabExperiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>(INITIAL_EXPERIMENTS);

  const addExperiment = () => {
    setExperiments((prev) => [
      ...prev,
      { id: prev.length + 1, title: "New Experiment", hours: 3 },
    ]);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary2 text-xs font-bold text-color2 mt-0.5">4</span>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#000] dark:text-white">Lab Experiments</h3>
            <p className="text-xs text-[#000] mt-0.5">Hands-on laboratory experiments and practical exercises extracted from the syllabus.</p>
          </div>
        </div>
        <button
          onClick={addExperiment}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-color2-l px-3 py-1.5 text-sm font-semibold text-orange hover:bg-primary2 self-center"
        >
          <PlusCircle className="h-4 w-4" /> Add Experiment
        </button>
      </div>

      {/* Experiment list */}
      <div className="space-y-3">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
          >
            <span className="flex bg-light-yellow h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-yellow text-sm font-bold text-amber-500">
              {exp.id}
            </span>
            <span className="flex-1 text-sm text-[#000] dark:text-gray-300">{exp.title}</span>
            <span className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-sm font-bold text-[#000] dark:border-gray-600 dark:text-gray-300">
              {exp.hours} <span className="text-xs font-normal text-[#000]">hrs</span>
            </span>
            <button className="text-gray-400 hover:text-color2">
              <SquarePen className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabExperiments;
