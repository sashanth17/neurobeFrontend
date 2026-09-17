import { FlaskConical } from "lucide-react";

interface Experiment { id: number; title: string; hours: number; }

interface LabExperimentsSummaryProps {
  experiments?: Experiment[];
}

const DEFAULT_EXPERIMENTS: Experiment[] = [
  { id: 1, title: "Network Cable Crimping, Twisted-Pair Pinouts, and Ethernet Link Setup", hours: 3 },
  { id: 2, title: "Packet Capture and Frame Header Dissection using Wireshark", hours: 3 },
  { id: 3, title: "CRC Error Detection and Stop-and-Wait ARQ Protocol Simulation", hours: 3 },
  { id: 4, title: "CSMA/CD Channel Collision and Backoff Algorithm Simulation in C", hours: 3 },
  { id: 5, title: "IP Subnetting, VLSM Design, and Static Routing Table Configuration", hours: 3 },
  { id: 6, title: "Dijkstra Link-State Routing Algorithm Implementation in Python/C", hours: 3 },
  { id: 7, title: "Distance Vector Routing Simulation with Counting to Infinity Prevention", hours: 3 },
  { id: 8, title: "TCP Socket Programming for Multi-Client Chat Server and File Transfer", hours: 3 },
  { id: 9, title: "UDP Socket Programming for DNS Query Resolver and NTP Time Fetcher", hours: 3 },
  { id: 10, title: "HTTP/HTTPS Traffic Analysis and Secure TLS Handshake Inspection", hours: 3 },
];

const LabExperimentsSummary = ({ experiments = DEFAULT_EXPERIMENTS }: LabExperimentsSummaryProps) => {
  const totalHours = experiments.reduce((s, e) => s + e.hours, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-color2-l flex h-8 w-8 items-center justify-center rounded-lg dark:bg-purple-900/20">
          <FlaskConical className="text-color2 h-4.5 w-4.5" />
        </div>
          <h3 className="text-lg font-bold text-color  dark:text-white">Lab Experiments</h3>
        </div>
        <span className="text-sm font-semibold text-[#000] dark:text-gray-300">
          {experiments.length} Experiments • {totalHours} Hours
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {experiments.map((exp) => (
          <div key={exp.id} className="flex items-center gap-3 rounded-xl border border-primary2 bg-primary3 px-3 py-2.5 dark:border-gray-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-color2 text-xs font-bold text-white dark:bg-purple-900/20">
              {exp.id}
            </span>
            <span className="flex-1 text-sm text-[#000] dark:text-gray-300">{exp.title}</span>
            <span className="shrink-0 rounded-md border px-2 py-0.5 text-xs border-primary2  font-semibold text-pri dark:border-gray-600">
              {exp.hours} hrs
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabExperimentsSummary;
