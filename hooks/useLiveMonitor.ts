/**
 * hooks/useLiveMonitor.ts
 * ──────────────────────────────────────────────────────────────────────────
 * WebSocket hook for instructor live monitor.
 * Connects to: ws://host/ws/test/monitor?test_id={id}&token={jwt}
 *
 * Usage:
 *   const { isConnected, studentStats, kpis, sendEndTest } = useLiveMonitor(testId);
 */
import { useEffect, useRef, useState, useCallback } from "react";

export interface StudentStat {
  student_email: string;
  answered: number;
  correct: number;
  incorrect: number;
  score_pct: number;
  tab_switch_count: number;
  flagged: boolean;
  status: "active" | "submitted" | "offline" | "idle" | "Flagged";
}

export interface QuestionStat {
  question_id: string;
  correct_count: number;
  incorrect_count: number;
  correct_pct: number;
}

export interface LiveKPIs {
  connected: number;
  submitted: number;
  totalEnrolled: number;
  avgScore: number;
  completionPct: number;
}

interface UseLiveMonitorReturn {
  isConnected: boolean;
  studentStats: StudentStat[];
  questionStats: QuestionStat[];
  kpis: LiveKPIs;
  lastEvent: any;
  sendEndTest: (reason?: string) => void;
  requestSnapshot: () => void;
  disconnect: () => void;
}

const WS_BASE = (() => {
  if (typeof window === "undefined") return "ws://localhost:8080";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  if (process.env.NEXT_PUBLIC_WS_HOST) {
    return `${proto}//${process.env.NEXT_PUBLIC_WS_HOST}`;
  }
  const hostname = window.location.hostname || "localhost";
  return `${proto}//${hostname}:8080`;
})();

const MAX_BACKOFF_MS = 30000;

export function useLiveMonitor(
  testId: string | null | undefined,
  token?: string | null
): UseLiveMonitorReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);
  const mountedRef = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [kpis, setKpis] = useState<LiveKPIs>({
    connected: 0,
    submitted: 0,
    totalEnrolled: 0,
    avgScore: 0,
    completionPct: 0,
  });

  const updateStudentStat = useCallback((patch: Partial<StudentStat> & { student_email: string }) => {
    setStudentStats((prev) => {
      const idx = prev.findIndex((s) => s.student_email === patch.student_email);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...patch };
        return updated;
      }
      return [
        ...prev,
        {
          student_email: patch.student_email,
          answered: 0,
          correct: 0,
          incorrect: 0,
          score_pct: 0,
          tab_switch_count: 0,
          flagged: false,
          status: "active",
          ...patch,
        } as StudentStat,
      ];
    });
  }, []);

  const recomputeKpis = useCallback((stats: StudentStat[], total: number) => {
    const submitted = stats.filter((s) => s.status === "submitted").length;
    const connected = stats.filter((s) => s.status === "active").length;
    const avgScore =
      stats.length > 0
        ? stats.reduce((sum, s) => sum + (s.score_pct || 0), 0) / stats.length
        : 0;
    const completionPct = total > 0 ? (submitted / total) * 100 : 0;
    setKpis({ connected, submitted, totalEnrolled: total, avgScore, completionPct });
  }, []);

  const connectWS = useCallback(() => {
    if (!testId || !mountedRef.current) return;

    const queryToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : "");
    const url = `${WS_BASE}/ws/test/monitor?test_id=${testId}${queryToken ? `&token=${queryToken}` : ""}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      backoffRef.current = 1000;
      setIsConnected(true);
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(e.data);
        setLastEvent(msg);
        const type: string = msg.type || "";

        switch (type) {
          case "MONITOR_READY":
            setKpis((prev) => ({
              ...prev,
              totalEnrolled: msg.total_enrolled || 0,
              connected: msg.connected_now || 0,
            }));
            break;

          case "STUDENT_JOINED":
            updateStudentStat({ student_email: msg.student_email, status: "active" });
            break;

          case "STUDENT_LEFT":
            updateStudentStat({ student_email: msg.student_email, status: "offline" });
            break;

          case "ANSWER_SUBMITTED":
            updateStudentStat({
              student_email: msg.student_email,
              status: "active",
            });
            break;

          case "TAB_SWITCH_ALERT":
            updateStudentStat({
              student_email: msg.student_email,
              tab_switch_count: msg.switch_count,
              flagged: msg.flagged,
              status: msg.flagged ? "Flagged" : "active",
            });
            break;

          case "FORCE_SUBMITTED":
            updateStudentStat({
              student_email: msg.student_email,
              status: "submitted",
              flagged: true,
            });
            break;

          case "STATS_SNAPSHOT":
            if (Array.isArray(msg.per_student)) {
              const mapped: StudentStat[] = msg.per_student.map((s: any) => ({
                student_email: s.student_email,
                answered: s.answered || 0,
                correct: s.correct || 0,
                incorrect: s.incorrect || 0,
                score_pct: s.score_pct || 0,
                tab_switch_count: s.tab_switch_count || 0,
                flagged: s.flagged || false,
                status: s.status || "active",
              }));
              setStudentStats(mapped);
              recomputeKpis(mapped, msg.total_enrolled || mapped.length);
            }
            break;

          case "TEST_ENDED":
            setIsConnected(false);
            ws.close();
            break;

          default:
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (!mountedRef.current) return;
      // Auto-reconnect with exponential backoff
      const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connectWS();
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [testId, token, updateStudentStat, recomputeKpis]);

  useEffect(() => {
    mountedRef.current = true;
    if (testId) connectWS();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const sendEndTest = useCallback((reason = "Ended by instructor") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "END_TEST", payload: { reason } }));
    }
  }, []);

  const requestSnapshot = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "REQUEST_SNAPSHOT" }));
    }
  }, []);

  const disconnect = useCallback(() => {
    mountedRef.current = false;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) wsRef.current.close();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    studentStats,
    questionStats,
    kpis,
    lastEvent,
    sendEndTest,
    requestSnapshot,
    disconnect,
  };
}

export default useLiveMonitor;
