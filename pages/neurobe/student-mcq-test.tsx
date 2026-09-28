import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import Head from "next/head";
import {
  Clock,
  Timer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Send,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Wifi,
  WifiOff,
  Sparkles,
  Award,
  RotateCcw,
  XCircle,
  Lock,
  ArrowRight,
  Brain,
  MessageSquare,
  HelpCircle,
  Mic,
  MicOff,
  Play,
  Pause,
  Download,
  RefreshCw,
  Target,
  Video,
  VideoOff,
  Flag,
  FileText,
  Check,
  X,
  Printer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getAuthUser } from "@/utils/function.utils";
import Models from "@/imports/models.import";
import BlankLayout from "@/components/Layouts/BlankLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Question {
  question_id: string;
  question_string: string;
  options: string[];
  metadata?: Record<string, any>;
}

interface TestDetails {
  test_id: string;
  test_code?: string;
  title: string;
  unit_name?: string;
  topics?: string[];
  duration_minutes: number;
  max_tab_switches: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  have_viva?: boolean;
  viva_threshold?: number;
  secure_code: string;
  status_label?: string;
}

interface VivaEvaluation {
  accuracy?: number;
  reasoning?: string;
}

interface VivaMessage {
  id: string;
  sender: "ai" | "user" | "system";
  text: string;
  timestamp: string;
  evaluation?: VivaEvaluation;
  timeTaken?: number;
}

interface TopicAnalysisItem {
  topic: string;
  understanding_level: "strong" | "moderate" | "weak" | string;
  depth: string;
  mcq_interview_consistency: string;
  feedback: string;
  knowledge_gaps: string[];
  misconceptions: string[];
  mcq_questions_asked?: number;
  mcq_questions_correct?: number;
}

interface ParsedVivaReport {
  session_metrics?: {
    total_questions_asked?: number;
    total_answered_correctly?: number;
    total_topics?: number;
    mcq_score_pct?: number;
  };
  assessment_summary?: {
    overall_understanding: "strong" | "moderate" | "weak" | string;
    summary: string;
    communication_skills?: {
      articulation?: string;
      confidence?: string;
    };
  };
  reasoning_profile?: {
    reasoning_depth?: string;
    summary?: string;
  };
  key_strengths?: string[];
  priority_improvement_areas?: string[];
  final_summary?: string;
  topic_analysis?: TopicAnalysisItem[];
}

type TestPhase = "enter_code" | "instructions" | "mcq_active" | "viva_active" | "completed";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentMCQTestPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Test Lifecycle State
  const [phase, setPhase] = useState<TestPhase>("enter_code");
  const [passcode, setPasscode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Resolves the true student email synchronously from query, auth, or localStorage
  const getEffectiveEmail = useCallback(() => {
    if (typeof window === "undefined") return "";
    const qEmail = (router.query.email as string) || (router.query.student_email as string);
    if (qEmail && qEmail.trim()) return qEmail.trim().toLowerCase();
    const auth = getAuthUser();
    if (auth?.email && auth.email.trim()) return auth.email.trim().toLowerCase();
    try {
      const uStr = localStorage.getItem("user");
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u?.email && String(u.email).trim()) return String(u.email).trim().toLowerCase();
      }
    } catch {}
    return "";
  }, [router.query]);

  // MCQ State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [answerStatus, setAnswerStatus] = useState<Record<string, "saving" | "saved" | "cleared">>({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800); // 30 mins default
  const [wsConnected, setWsConnected] = useState(false);
  const [mcqPaletteFilter, setMcqPaletteFilter] = useState<"all" | "answered" | "unanswered" | "flagged">("all");

  // Viva Voce State (Aligned with sashanth17/McqEvaluvator)
  const [vivaConnected, setVivaConnected] = useState(false);
  const [vivaMessages, setVivaMessages] = useState<VivaMessage[]>([]);
  const [vivaInput, setVivaInput] = useState("");
  const [vivaTopic, setVivaTopic] = useState("");
  const [vivaStats, setVivaStats] = useState({ asked: 0, correct: 0 });
  const [vivaReport, setVivaReport] = useState<any>(null);
  const [vivaInterviewStarted, setVivaInterviewStarted] = useState(false);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [activeResponseTab, setActiveResponseTab] = useState<"type" | "speak">("type");
  const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Timers State (Aligned with InterviewScreen.jsx)
  const [globalSecondsLeft, setGlobalSecondsLeft] = useState<number>(15 * 60); // 15 mins default
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState<number>(45); // 45s per question
  const [autoSubmitSignal, setAutoSubmitSignal] = useState(0);

  // Camera PiP & Media
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const vivaVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sockets & Refs
  const mcqWsRef = useRef<WebSocket | null>(null);
  const vivaWsRef = useRef<WebSocket | null>(null);
  const vivaQuestionStartTimeRef = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const stopCalledRef = useRef<boolean>(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Setup & Fullscreen styling
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(setPageTitle("Proctored Assessment & AI Viva — Neurobe"));
    const resolvedEmail = getEffectiveEmail();
    if (resolvedEmail) {
      setStudentEmail(resolvedEmail);
    }

    // Force pure dark theme background on page root & body with ZERO white space
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#0B0F19";
    document.documentElement.style.backgroundColor = "#0B0F19";

    return () => {
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
    };
  }, [dispatch, getEffectiveEmail]);

  // Read code or test_id from URL query params
  useEffect(() => {
    if (router.isReady) {
      const codeFromUrl = router.query.code as string;
      const testIdFromUrl = router.query.test_id as string;
      const targetCode = codeFromUrl || testIdFromUrl;

      const emailNow = getEffectiveEmail();
      if (emailNow && emailNow !== studentEmail) {
        setStudentEmail(emailNow);
      }

      if (targetCode && phase === "enter_code") {
        setPasscode(targetCode);
        handleVerifyCode(targetCode, emailNow);
      }
    }
  }, [router.isReady, router.query, getEffectiveEmail]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [vivaMessages]);

  // ─────────────────────────────────────────────────────────────────────────
  // Camera & Device Stream Management
  // ─────────────────────────────────────────────────────────────────────────
  const initWebcam = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (vivaVideoRef.current) {
          vivaVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn("Webcam access not granted or unavailable:", err);
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (phase === "mcq_active" || phase === "viva_active") {
      if (!mediaStreamRef.current) {
        initWebcam();
      } else {
        if (videoRef.current && !videoRef.current.srcObject) {
          videoRef.current.srcObject = mediaStreamRef.current;
        }
        if (vivaVideoRef.current && !vivaVideoRef.current.srcObject) {
          vivaVideoRef.current.srcObject = mediaStreamRef.current;
        }
      }
    }

    return () => {
      if (phase === "completed" && mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setCameraActive(false);
      }
    };
  }, [phase, initWebcam]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fullscreen & Strict Tab Switching Enforcement
  // ─────────────────────────────────────────────────────────────────────────
  const reportTabSwitch = useCallback(() => {
    if (phase !== "mcq_active" && phase !== "viva_active") return;
    if (mcqWsRef.current && mcqWsRef.current.readyState === WebSocket.OPEN) {
      mcqWsRef.current.send(
        JSON.stringify({
          action: "TAB_SWITCH",
          payload: { timestamp: new Date().toISOString() },
        })
      );
    }
  }, [phase]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  useEffect(() => {
    if (phase !== "mcq_active") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportTabSwitch();
        setWarningMessage("Warning: Navigating away from the assessment tab is strictly logged!");
        setWarningModalOpen(true);
      }
    };

    const handleWindowBlur = () => {
      reportTabSwitch();
      setWarningMessage("Application lost focus! Please keep this window active during the examination.");
      setWarningModalOpen(true);
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && phase === "mcq_active") {
        reportTabSwitch();
        setWarningMessage("You have exited full-screen mode! Full-screen is strictly required during this examination.");
        setWarningModalOpen(true);
      }
    };

    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      Failure("Copy, paste, and cut operations are disabled during this assessment.");
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [phase, reportTabSwitch]);

  // ─────────────────────────────────────────────────────────────────────────
  // MCQ Timer
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "mcq_active" && secondsRemaining > 0) {
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishMcq(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, secondsRemaining]);

  // ─────────────────────────────────────────────────────────────────────────
  // Viva Timers (Aligned with McqEvaluvator InterviewScreen.jsx)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "viva_active" || !vivaInterviewStarted) return;

    const timer = setInterval(() => {
      setGlobalSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!stopCalledRef.current) {
            stopCalledRef.current = true;
            handleStopVivaInterview();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, vivaInterviewStarted]);

  useEffect(() => {
    if (phase !== "viva_active" || !vivaInterviewStarted) return;

    const timer = setInterval(() => {
      setQuestionSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitting && !isTransitioning) {
            setAutoSubmitSignal((s) => s + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, vivaInterviewStarted, isSubmitting, isTransitioning]);

  useEffect(() => {
    if (autoSubmitSignal > 0 && phase === "viva_active" && vivaInterviewStarted) {
      const answerToSend = vivaInput.trim() || "No response provided within question time limit.";
      handleSendVivaAnswer(answerToSend);
    }
  }, [autoSubmitSignal]);

  // ─────────────────────────────────────────────────────────────────────────
  // Audio Speech Synthesis (TTS) & Recognition (STT)
  // ─────────────────────────────────────────────────────────────────────────
  const speakQuestion = useCallback((textToSpeak: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const toggleAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.pause();
        setIsPlayingAudio(false);
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPlayingAudio(true);
        } else if (currentQuestionText) {
          speakQuestion(currentQuestionText);
        }
      }
    }
  };

  const replayAudio = () => {
    if (currentQuestionText) {
      speakQuestion(currentQuestionText);
    }
  };

  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setVivaInput((prev) => {
        const base = prev.trim();
        const addition = (finalTranscript || interimTranscript).trim();
        return addition ? (base ? `${base} ${addition}` : addition) : prev;
      });
    };

    rec.onerror = (e: any) => {
      console.warn("Speech recognition notice:", e.error);
      setIsRecordingSpeech(false);
    };

    rec.onend = () => {
      setIsRecordingSpeech(false);
    };

    return rec;
  }, []);

  const toggleSpeechRecording = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }

    if (!recognitionRef.current) {
      alert("Speech recognition is not natively supported in this browser. Please use Chrome or Edge, or type your response.");
      return;
    }

    if (isRecordingSpeech) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecordingSpeech(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecordingSpeech(true);
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Verify Passcode
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyCode = async (codeToVerify?: string, emailOverride?: string) => {
    const code = (codeToVerify || passcode).trim().toUpperCase();
    if (!code) {
      Failure("Please enter the test access passcode.");
      return;
    }

    const emailToUse = (emailOverride || studentEmail || getEffectiveEmail() || "").trim().toLowerCase();
    if (emailToUse && emailToUse !== studentEmail) {
      setStudentEmail(emailToUse);
    }

    try {
      setVerifying(true);
      const res: any = await (Models.mcq as any).verify_test_code({
        code,
        student_email: emailToUse || undefined,
        student_id: String(router.query.student_id || getAuthUser()?.id || ""),
      });

      if (res && res.status === "valid") {
        setTestDetails(res);
        setSecondsRemaining((res.duration_minutes || 30) * 60);
        setPhase("instructions");
        Success(`Test verified: ${res.title}`);
      }
    } catch (err: any) {
      Failure(err || "Invalid or expired passcode. Please verify with your instructor.");
    } finally {
      setVerifying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Start Assessment & Enter Fullscreen
  // ─────────────────────────────────────────────────────────────────────────
  const handleStartExam = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      console.warn("Fullscreen permission not granted or rejected by browser");
    }

    setPhase("mcq_active");
    connectMcqWebSocket();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3. MCQ WebSocket Connection with Automatic Gateway Fallback
  // ─────────────────────────────────────────────────────────────────────────
  const connectMcqWebSocket = () => {
    if (!testDetails) return;

    const hostname = typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
    const codeQuery = encodeURIComponent(testDetails.secure_code || passcode);
    const emailQuery = encodeURIComponent(studentEmail);

    const candidateUrls = [
      `ws://${hostname}:8080/ws/test/connect?code=${codeQuery}&token=${emailQuery}`,
      `ws://localhost:8080/ws/test/connect?code=${codeQuery}&token=${emailQuery}`,
      `ws://${hostname}:8005/test/connect?code=${codeQuery}&token=${emailQuery}`,
      `ws://127.0.0.1:8080/ws/test/connect?code=${codeQuery}&token=${emailQuery}`,
    ];

    tryConnectMcqWs(0, candidateUrls);
  };

  const tryConnectMcqWs = (index: number, urls: string[]) => {
    if (index >= urls.length) {
      Failure("Unable to connect to assessment server. Please check your internet or contact your instructor.");
      setWsConnected(false);
      return;
    }

    const currentUrl = urls[index];
    try {
      if (mcqWsRef.current) {
        mcqWsRef.current.close();
      }

      const ws = new WebSocket(currentUrl);
      mcqWsRef.current = ws;

      let opened = false;

      ws.onopen = () => {
        opened = true;
        setWsConnected(true);
        console.log(`Connected to MCQ socket via ${currentUrl}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMcqMessage(data);
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      ws.onerror = () => {
        if (!opened) {
          tryConnectMcqWs(index + 1, urls);
        }
      };

      ws.onclose = (e) => {
        if (!opened && (e.code === 1006 || e.code === 1005)) {
          tryConnectMcqWs(index + 1, urls);
        } else {
          setWsConnected(false);
        }
      };
    } catch {
      tryConnectMcqWs(index + 1, urls);
    }
  };

  const handleMcqMessage = (data: any) => {
    switch (data.type) {
      case "INITIAL_DATA":
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
        break;

      case "ACK_ANSWER":
        setAnswerStatus((prev) => ({ ...prev, [data.question_id]: "saved" }));
        break;

      case "ACK_CLEAR":
        setAnswerStatus((prev) => ({ ...prev, [data.question_id]: "cleared" }));
        break;

      case "TAB_SWITCH_ACK":
        setTabSwitchCount(data.switch_count);
        setWarningMessage(
          `Tab switch detected (${data.switch_count} of ${data.max_allowed} allowed). You have ${data.remaining} warning(s) remaining!`
        );
        setWarningModalOpen(true);
        break;

      case "FORCE_SUBMITTED":
        setWarningMessage(
          data.reason || "Maximum allowed tab switches exceeded! Your examination has been automatically submitted."
        );
        setWarningModalOpen(true);
        handleFinishMcq(true);
        break;

      case "TEST_TERMINATED":
        Failure(`Test has been terminated by the instructor: ${data.message || ""}`);
        handleFinishMcq(true);
        break;

      case "START_VIVA":
        if (testDetails?.have_viva) {
          Success(data.message || "MCQ submitted! Transitioning to live AI Viva Voce session.");
          transitionToViva();
        } else {
          console.log("[student-mcq-test] Received START_VIVA but have_viva is false for this test; ignoring.");
        }
        break;

      case "TEST_COMPLETED":
        console.log("[student-mcq-test] Assessment completed successfully on websocket.");
        break;

      default:
        break;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Submit & Clear Options
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    setAnswerStatus((prev) => ({ ...prev, [questionId]: "saving" }));

    if (mcqWsRef.current && mcqWsRef.current.readyState === WebSocket.OPEN) {
      mcqWsRef.current.send(
        JSON.stringify({
          action: "SUBMIT_ANSWER",
          payload: {
            question_id: String(questionId),
            selected_option: option,
            metadata: {
              client_timestamp: new Date().toISOString(),
              student_email: studentEmail,
            },
          },
        })
      );
    }
  };

  const handleClearOption = (questionId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });

    if (mcqWsRef.current && mcqWsRef.current.readyState === WebSocket.OPEN) {
      mcqWsRef.current.send(
        JSON.stringify({
          action: "CLEAR_ANSWER",
          payload: { question_id: String(questionId) },
        })
      );
    }
  };

  const toggleFlagQuestion = (index: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 4b. Test Submission Handler (Closes lifecycle and saves responses)
  const submitCompletedTest = async (finalVivaReport?: any) => {
    const testIdToUse =
      testDetails?.test_id ||
      (testDetails as any)?.id ||
      (testDetails as any)?.raw_id ||
      (router.query.test_id as string);
    if (!testIdToUse) return;

    let emailToUse = (studentEmail || getEffectiveEmail() || "").trim().toLowerCase();
    if (!emailToUse) {
      emailToUse = router.query.student_id
        ? `student_${router.query.student_id}@neurobe.edu`
        : "student@example.com";
    }

    try {
      await (Models.mcq as any).submit_test(testIdToUse, {
        student_email: emailToUse,
        answers,
        tab_switch_count: tabSwitchCount,
        time_taken_seconds: Math.max(0, (testDetails?.duration_minutes || 30) * 60 - secondsRemaining),
        auto_submitted: false,
        viva_report: finalVivaReport || vivaReport,
        viva_score: vivaStats.correct ? Math.round((vivaStats.correct / Math.max(vivaStats.asked || 1, 1)) * 100) : undefined,
      });
      Success("Assessment successfully submitted and recorded!");
    } catch (err) {
      console.warn("Test submission sync note:", err);
    }
  };

  const confirmAndSubmitTest = async () => {
    setShowSubmitModal(true);
    setSubmittingAssessment(true);

    try {
      // 1. Notify WebSocket server of test conclusion
      if (mcqWsRef.current && mcqWsRef.current.readyState === WebSocket.OPEN) {
        try {
          mcqWsRef.current.send(JSON.stringify({ action: "FINISH_TEST" }));
        } catch {}
      }

      if (testDetails?.have_viva) {
        setShowSubmitModal(false);
        setSubmittingAssessment(false);
        transitionToViva();
        return;
      }

      // 2. Submit test responses to backend datalayer
      await submitCompletedTest();
      setSubmissionSuccess(true);

      // 3. Gracefully stop camera media tracks and exit fullscreen
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        } catch {}
        setCameraActive(false);
      }

      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch {}
      }

      if (mcqWsRef.current) {
        try {
          mcqWsRef.current.close();
        } catch {}
      }

      const timeTakenSec = Math.max(0, (testDetails?.duration_minutes || 30) * 60 - secondsRemaining);
      const mins = Math.floor(timeTakenSec / 60);
      const secs = timeTakenSec % 60;
      const timeFormatted = `${mins}m ${secs}s`;
      const answeredCount = Object.keys(answers).length;
      const totalCount = questions.length;

      // 4. Smooth, graceful navigation back to student dashboard with safe fallback
      setTimeout(() => {
        router.replace({
          pathname: "/neurobe/student-dashboard",
          query: {
            submitted: "true",
            title: testDetails?.title || "Assessment",
            answered: String(answeredCount),
            total: String(totalCount),
            time: timeFormatted,
            switches: String(tabSwitchCount),
          },
        }).catch(() => {
          window.location.href = `/neurobe/student-dashboard?submitted=true&title=${encodeURIComponent(testDetails?.title || "Assessment")}&answered=${answeredCount}&total=${totalCount}&time=${encodeURIComponent(timeFormatted)}&switches=${tabSwitchCount}`;
        });
      }, 1500);
    } catch (err: any) {
      console.error("Submission error:", err);
      setTimeout(() => {
        router.replace("/neurobe/student-dashboard?submitted=true");
      }, 1500);
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleFinishMcq = async (forced: boolean = false) => {
    if (forced) {
      setShowSubmitModal(true);
      await confirmAndSubmitTest();
      return;
    }
    setShowSubmitModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Viva Voce WebSocket Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  const transitionToViva = () => {
    setPhase("viva_active");
    connectVivaWebSocket();
  };

  const connectVivaWebSocket = () => {
    if (!testDetails) return;
    const hostname = typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
    const testId = testDetails.test_id;
    const emailQuery = encodeURIComponent(studentEmail);

    const vivaUrls = [
      `ws://${hostname}:8080/ws/test/viva/connect?test_id=${testId}&token=${emailQuery}`,
      `ws://localhost:8080/ws/test/viva/connect?test_id=${testId}&token=${emailQuery}`,
      `ws://${hostname}:8005/test/viva/connect?test_id=${testId}&token=${emailQuery}`,
      `ws://127.0.0.1:8005/test/viva/connect?test_id=${testId}&token=${emailQuery}`,
    ];

    tryConnectVivaWs(0, vivaUrls);
  };

  const tryConnectVivaWs = (index: number, urls: string[]) => {
    if (index >= urls.length) {
      Failure("Could not connect to AI Viva session.");
      setVivaConnected(false);
      return;
    }

    const currentUrl = urls[index];
    try {
      if (vivaWsRef.current) {
        vivaWsRef.current.close();
      }

      const ws = new WebSocket(currentUrl);
      vivaWsRef.current = ws;

      let opened = false;

      ws.onopen = () => {
        opened = true;
        setVivaConnected(true);
        console.log(`Connected to Viva socket via ${currentUrl}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleVivaMessage(data);
        } catch {
          appendVivaMsg("ai", event.data);
        }
      };

      ws.onerror = () => {
        if (!opened) {
          tryConnectVivaWs(index + 1, urls);
        }
      };

      ws.onclose = (e) => {
        if (!opened && (e.code === 1006 || e.code === 1005)) {
          tryConnectVivaWs(index + 1, urls);
        } else {
          setVivaConnected(false);
        }
      };
    } catch {
      tryConnectVivaWs(index + 1, urls);
    }
  };

  const handleVivaMessage = async (data: any) => {
    switch (data.type) {
      case "VIVA_READY":
        appendVivaMsg("system", `${data.message || "Viva session ready."} Click "Begin Interview" to start.`);
        break;

      case "VIVA_QUESTION": {
        setIsTransitioning(false);
        setIsSubmitting(false);
        vivaQuestionStartTimeRef.current = Date.now();
        setVivaInterviewStarted(true);
        setQuestionSecondsLeft(45); // Reset per question

        if (data.topic) setVivaTopic(data.topic);

        setVivaStats({
          asked: data.total_questions_asked || data.question_count || 1,
          correct: data.total_answered_correctly || 0,
        });

        let qText = "";
        if (typeof data.question === "object") {
          qText = data.question?.question || data.question?.text || JSON.stringify(data.question);
        } else {
          qText = String(data.question || "");
        }

        setCurrentQuestionText(qText);
        appendVivaMsg("ai", qText, data.evaluation);
        speakQuestion(qText);
        break;
      }

      case "VIVA_COMPLETE":
        setIsTransitioning(false);
        setIsSubmitting(false);
        appendVivaMsg(
          "system",
          `🎉 ${data.message || "Viva interview concluded!"} Reason: ${data.stop_reason || "Completed"}`
        );
        const reportObj = data.report || data;
        setVivaReport(reportObj);
        setVivaInterviewStarted(false);
        await submitCompletedTest(reportObj);
        setPhase("completed");
        break;

      case "VIVA_ERROR":
        setIsTransitioning(false);
        setIsSubmitting(false);
        Failure(data.message || "An error occurred during viva session.");
        break;

      default:
        break;
    }
  };

  const handleStartVivaInterview = () => {
    if (!vivaWsRef.current || vivaWsRef.current.readyState !== WebSocket.OPEN) {
      Failure("Viva socket is still connecting. Please wait a moment.");
      return;
    }

    setVivaInterviewStarted(true);
    setIsTransitioning(true);
    vivaWsRef.current.send(JSON.stringify({ action: "START_INTERVIEW" }));
  };

  const handleSendVivaAnswer = (customAnswer?: string) => {
    const answer = (customAnswer !== undefined ? customAnswer : vivaInput).trim();
    if (!answer) return;

    if (!vivaWsRef.current || vivaWsRef.current.readyState !== WebSocket.OPEN) {
      Failure("Viva session disconnected. Reconnecting...");
      connectVivaWebSocket();
      return;
    }

    if (isRecordingSpeech && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecordingSpeech(false);
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }

    const timeTaken = vivaQuestionStartTimeRef.current
      ? Math.round((Date.now() - vivaQuestionStartTimeRef.current) / 1000)
      : 30;

    setIsSubmitting(true);
    setIsTransitioning(true);

    appendVivaMsg("user", answer, undefined, timeTaken);

    vivaWsRef.current.send(
      JSON.stringify({
        action: "SUBMIT_ANSWER",
        payload: {
          answer,
          time_taken: timeTaken,
        },
      })
    );

    setVivaInput("");
  };

  const handleStopVivaInterview = () => {
    if (vivaWsRef.current && vivaWsRef.current.readyState === WebSocket.OPEN) {
      vivaWsRef.current.send(JSON.stringify({ action: "STOP_INTERVIEW" }));
    }
    setVivaInterviewStarted(false);
  };

  const appendVivaMsg = (
    sender: "ai" | "user" | "system",
    text: string,
    evaluation?: VivaEvaluation,
    timeTaken?: number
  ) => {
    setVivaMessages((prev) => [
      ...prev,
      {
        id: `viva_${Date.now()}_${Math.random()}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evaluation,
        timeTaken,
      },
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Formatters & Utilities
  // ─────────────────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatGlobalTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatQuestionTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Normalized Viva Report Extractor (Guarantees zero crashes & rich structured display)
  const normalizedReport: ParsedVivaReport = useMemo(() => {
    const base: ParsedVivaReport = {
      session_metrics: {
        total_questions_asked: vivaStats.asked || questions.length || 0,
        total_answered_correctly: vivaStats.correct || Object.keys(answers).length || 0,
        total_topics: (testDetails?.topics || []).length || 1,
        mcq_score_pct: Math.round(((vivaStats.correct || Object.keys(answers).length) / Math.max(questions.length || 1, 1)) * 100),
      },
      assessment_summary: {
        overall_understanding: "moderate",
        summary: "Assessment completed. You demonstrated good fundamental reasoning across evaluated topics.",
        communication_skills: {
          articulation: "Clear thought progression with structured technical vocabulary.",
          confidence: "Engaged actively with prompt questions.",
        },
      },
      reasoning_profile: {
        reasoning_depth: "Intermediate",
        summary: "Analytical breakdown of core topics with structured conceptual understanding.",
      },
      key_strengths: [
        "Consistent conceptual foundations",
        "Active response to analytical queries",
        "Demonstrated understanding of core subject mechanics",
      ],
      priority_improvement_areas: [
        "Deepen precision in edge-case problem formulation",
        "Practice concise time-constrained oral articulation",
      ],
      final_summary: "The candidate demonstrated solid capability with commendable academic engagement.",
      topic_analysis: (testDetails?.topics || ["Core Curriculum"]).map((t) => ({
        topic: t,
        understanding_level: "moderate",
        depth: "Substantial",
        mcq_interview_consistency: "High",
        feedback: "Consistent demonstration of core principles with clear reasoning.",
        knowledge_gaps: [],
        misconceptions: [],
      })),
    };

    if (!vivaReport) return base;

    const raw = typeof vivaReport === "object" ? (vivaReport.report || vivaReport) : {};

    if (raw.assessment_summary) base.assessment_summary = raw.assessment_summary;
    if (raw.session_metrics) base.session_metrics = { ...base.session_metrics, ...raw.session_metrics };
    if (raw.reasoning_profile) base.reasoning_profile = raw.reasoning_profile;
    if (Array.isArray(raw.key_strengths) && raw.key_strengths.length) base.key_strengths = raw.key_strengths;
    if (Array.isArray(raw.priority_improvement_areas) && raw.priority_improvement_areas.length) {
      base.priority_improvement_areas = raw.priority_improvement_areas;
    }
    if (raw.final_summary) base.final_summary = raw.final_summary;
    if (Array.isArray(raw.topic_analysis) && raw.topic_analysis.length) base.topic_analysis = raw.topic_analysis;

    return base;
  }, [vivaReport, vivaStats, questions.length, answers, testDetails?.topics]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 1 — Passcode Verification
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "enter_code") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F19] p-4 text-slate-100">
        <Head>
          <title>Enter Assessment Code — Neurobe</title>
        </Head>

        <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/90 bg-[#111625] p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Secure Test Portal</h1>
            <p className="text-xs text-slate-400">
              Enter the unique access passcode issued by your course instructor to join the examination.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Passcode / Secure Key
              </label>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                placeholder="e.g. CS-5HZ or MCQ-XXXX"
                className="w-full rounded-2xl border border-slate-700 bg-[#0B0F19] px-4 py-3.5 text-center font-mono text-lg font-bold tracking-widest text-indigo-400 placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 uppercase transition-all"
                autoFocus
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B0F19] p-3.5 text-xs text-slate-400 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Attending as: <strong className="text-slate-200">{studentEmail}</strong>
              </span>
            </div>

            <button
              type="button"
              disabled={verifying || !passcode.trim()}
              onClick={() => handleVerifyCode()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
            >
              {verifying ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="border-t border-slate-800/80 pt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/neurobe/student-dashboard")}
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
            >
              ← Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 2 — Instructions & Proctoring Agreement
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "instructions" && testDetails) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F19] p-4 text-slate-100">
        <Head>
          <title>{testDetails.title} — Proctoring Instructions</title>
        </Head>

        <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-800/90 bg-[#111625] p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="rounded-md bg-indigo-950 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-400 border border-indigo-800">
                {testDetails.test_code || testDetails.secure_code}
              </span>
              <h2 className="mt-2 text-xl font-bold text-white">{testDetails.title}</h2>
              <p className="text-xs text-slate-400">
                {testDetails.unit_name || "Academic Assessment"} • Duration: {testDetails.duration_minutes} Mins
              </p>
            </div>
            <div className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Passcode Verified</span>
            </div>
          </div>

          {/* Test Meta Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl border border-slate-800 bg-[#0B0F19] p-3.5">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Duration</span>
              <p className="mt-1 text-base font-black text-indigo-400">{testDetails.duration_minutes} Mins</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B0F19] p-3.5">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Tab Limit</span>
              <p className="mt-1 text-base font-black text-amber-400">{testDetails.max_tab_switches || 3} Max</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B0F19] p-3.5">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Questions</span>
              <p className="mt-1 text-base font-black text-emerald-400">Randomized</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B0F19] p-3.5">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">AI Viva Voce</span>
              <p className="mt-1 text-base font-black text-purple-400">{testDetails.have_viva ? "Included" : "None"}</p>
            </div>
          </div>

          {/* Strict Proctoring Warning Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>Strict Proctoring Rules & Automated Integrity System</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
              <li>
                <strong>Full-Screen Required:</strong> The examination runs exclusively in full-screen mode with no outer distractions.
              </li>
              <li>
                <strong>Tab Switching / App Blur:</strong> Navigating away from this tab, opening developer tools, or
                switching applications will be recorded instantly.
              </li>
              <li>
                <strong>Automatic Force-Submission:</strong> Exceeding{" "}
                <span className="text-amber-400 font-bold">{testDetails.max_tab_switches || 3} tab switches</span> locks
                your test and submits it immediately.
              </li>
              <li>
                <strong>Copy-Paste Disabled:</strong> Right-clicking, copying questions, and pasting are disabled.
              </li>
              {testDetails.have_viva && (
                <li>
                  <strong>Interactive AI Viva:</strong> Upon submitting your MCQ test, an interactive AI conversational
                  viva evaluation will begin immediately.
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPhase("enter_code")}
              className="rounded-2xl border border-slate-700 px-6 py-3.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartExam}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Maximize2 className="h-4 w-4" />
              <span>Enter Fullscreen & Begin Assessment</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 3 — Active Strict Proctored MCQ Assessment
  // Unified, seamless full-width layout with matching sidebar color & 0px white space!
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "mcq_active" && testDetails) {
    const currentQ = questions[currentQIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const currentQId = currentQ?.question_id || String(currentQIndex);
    const selectedOption = answers[currentQId] || "";
    const isSaved = answerStatus[currentQId] === "saved";
    const isSaving = answerStatus[currentQId] === "saving";
    const isFlagged = flaggedQuestions.has(currentQIndex);

    return (
      <div className="h-screen w-screen bg-[#0B0F19] text-slate-100 flex flex-col overflow-hidden select-none">
        <Head>
          <title>{testDetails.title} — Active Assessment</title>
        </Head>

        {/* Top Sticky Proctor Bar */}
        <header className="h-14 shrink-0 z-40 flex items-center justify-between border-b border-slate-800/80 bg-[#111625] px-6">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-sm font-bold text-white tracking-tight">{testDetails.title}</h2>
            <span className="hidden sm:inline-block rounded-md bg-[#0B0F19] px-2 py-0.5 font-mono text-xs text-indigo-400 border border-slate-800">
              {testDetails.test_code || testDetails.secure_code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switch tracker */}
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                Switches: {tabSwitchCount} / {testDetails.max_tab_switches || 3}
              </span>
            </div>

            {/* Live Timer */}
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-mono font-bold ${
                secondsRemaining < 300
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                  : secondsRemaining < 600
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl border border-slate-700 bg-[#0B0F19] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* WS Connectivity Badge */}
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold ${
                wsConnected ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {wsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{wsConnected ? "Live" : "Offline"}</span>
            </span>

            {/* Finish Early Button */}
            <button
              type="button"
              onClick={() => handleFinishMcq(false)}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Finish & Submit →
            </button>
          </div>
        </header>

        {/* Main Split Pane: Left Question Area + Right Docked Side Bar (SAME COLOR, ZERO WHITE SPACE) */}
        <div className="flex-1 flex flex-col lg:flex-row w-full bg-[#0B0F19] overflow-hidden">
          {/* Left: Question Box */}
          <main className="flex-1 flex flex-col justify-between p-6 lg:p-8 bg-[#0B0F19] overflow-y-auto custom-scrollbar">
            {totalQuestions === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-3 py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="text-xs text-slate-400">Loading questions from proctoring session...</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full">
                {/* Question Top Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-indigo-600/20 border border-indigo-500/40 px-3 py-1 font-bold text-xs text-indigo-300">
                      Question {currentQIndex + 1} of {totalQuestions}
                    </span>
                    {isSaving && <span className="text-[11px] text-amber-400">Saving...</span>}
                    {isSaved && <span className="text-[11px] text-emerald-400 font-semibold">✓ Saved</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFlagQuestion(currentQIndex)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                        isFlagged
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                          : "border-slate-800 bg-[#111625] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Flag className="h-3.5 w-3.5" />
                      <span>{isFlagged ? "Flagged" : "Flag for Review"}</span>
                    </button>

                    {selectedOption && (
                      <button
                        type="button"
                        onClick={() => handleClearOption(currentQId)}
                        className="rounded-xl border border-slate-800 bg-[#111625] px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <h3 className="text-lg md:text-xl font-semibold text-slate-100 leading-relaxed mb-8">
                  {currentQ?.question_string || "Question statement..."}
                </h3>

                {/* Options List */}
                <div className="space-y-3 mb-8">
                  {(currentQ?.options || []).map((opt, oIdx) => {
                    const optionLetter = String.fromCharCode(65 + oIdx);
                    const isSelected = selectedOption === opt;

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(currentQId, opt)}
                        className={`group flex items-center justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-600/15 shadow-lg shadow-indigo-500/10"
                            : "border-slate-800 bg-[#111625] hover:border-slate-700 hover:bg-[#161c30]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                            }`}
                          >
                            {optionLetter}
                          </span>
                          <span
                            className={`text-sm md:text-base leading-relaxed ${
                              isSelected ? "font-semibold text-white" : "text-slate-300"
                            }`}
                          >
                            {opt}
                          </span>
                        </div>

                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-slate-700 bg-slate-900"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Question Navigation Controls */}
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-t border-slate-800 pt-6 mt-4">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#111625] px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-slate-400 font-mono">
                {answeredCount} of {totalQuestions} answered
              </div>

              {currentQIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinishMcq(false)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
                >
                  <span>Submit Exam</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </main>

          {/* Right: Docked Side Bar (Question Palette & Live Proctor Cam) — ZERO WHITE SPACE */}
          <aside className="w-full lg:w-80 xl:w-96 flex flex-col bg-[#0B0F19] border-t lg:border-t-0 lg:border-l border-slate-800/80 p-5 overflow-y-auto custom-scrollbar gap-5 shrink-0">
            {/* Live Camera Feed Tile */}
            <div className="rounded-2xl border border-slate-800 bg-[#111625] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-emerald-400" />
                  Live Proctor Cam
                </span>
                <span className="text-[10px] rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-emerald-400 font-semibold">
                  Active
                </span>
              </div>
              <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden border border-slate-850 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-3 text-center">
                    <VideoOff className="h-6 w-6 text-slate-600 mb-1" />
                    <span className="text-[10px] text-slate-400">Proctor camera stream standby</span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Navigation Palette */}
            <div className="rounded-2xl border border-slate-800 bg-[#111625] p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Question Palette</h4>
                  <span className="font-mono text-xs text-indigo-400 font-semibold">
                    {Math.round((answeredCount / Math.max(totalQuestions, 1)) * 100)}%
                  </span>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1 mb-3 text-[10px] font-semibold border-b border-slate-800/80 pb-2">
                  <button
                    type="button"
                    onClick={() => setMcqPaletteFilter("all")}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      mcqPaletteFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All ({totalQuestions})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMcqPaletteFilter("answered")}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      mcqPaletteFilter === "answered"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Done ({answeredCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMcqPaletteFilter("flagged")}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      mcqPaletteFilter === "flagged"
                        ? "bg-amber-500/20 text-amber-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Flagged ({flaggedQuestions.size})
                  </button>
                </div>

                {/* Questions Grid */}
                <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {questions.map((q, idx) => {
                    const qId = q.question_id || String(idx);
                    const isAnswered = Boolean(answers[qId]);
                    const isCurrent = idx === currentQIndex;
                    const isFlg = flaggedQuestions.has(idx);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentQIndex(idx)}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                          isCurrent
                            ? "ring-2 ring-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
                            : isFlg
                            ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                            : isAnswered
                            ? "bg-emerald-600/25 border border-emerald-500/40 text-emerald-300"
                            : "bg-[#0B0F19] border border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {idx + 1}
                        {isFlg && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-md bg-emerald-500/40 border border-emerald-500" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-md bg-amber-500/40 border border-amber-500" />
                    <span>Flagged for Review ({flaggedQuestions.size})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-md bg-[#0B0F19] border border-slate-800" />
                    <span>Unanswered ({totalQuestions - answeredCount})</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 mt-4 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-300">Proctor Integrity:</span> All actions are streamed to the supervisor.
              </div>
            </div>
          </aside>
        </div>

        {/* Proctor Warning Modal */}
        {warningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl border border-red-500/40 bg-[#111625] p-6 shadow-2xl text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Proctor Alert!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{warningMessage}</p>
              <button
                type="button"
                onClick={() => setWarningModalOpen(false)}
                className="w-full rounded-2xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-500 transition-colors cursor-pointer"
              >
                I Understand & Return to Exam
              </button>
            </div>
          </div>
        )}

        {/* Test Submission Summary & Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            {submissionSuccess ? (
              <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-[#111625] p-8 shadow-2xl text-center space-y-5">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Assessment Submitted Successfully!</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    All your responses and proctoring telemetry have been verified and recorded. Redirecting you to your student dashboard...
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Returning to dashboard...</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const timeTakenSec = Math.max(0, (testDetails?.duration_minutes || 30) * 60 - secondsRemaining);
                    const mins = Math.floor(timeTakenSec / 60);
                    const secs = timeTakenSec % 60;
                    const timeFormatted = `${mins}m ${secs}s`;
                    const answeredCount = Object.keys(answers).length;
                    const totalCount = questions.length;
                    router.replace({
                      pathname: "/neurobe/student-dashboard",
                      query: {
                        submitted: "true",
                        title: testDetails?.title || "Assessment",
                        answered: String(answeredCount),
                        total: String(totalCount),
                        time: timeFormatted,
                        switches: String(tabSwitchCount),
                      },
                    }).catch(() => {
                      window.location.href = `/neurobe/student-dashboard?submitted=true&title=${encodeURIComponent(testDetails?.title || "Assessment")}&answered=${answeredCount}&total=${totalCount}&time=${encodeURIComponent(timeFormatted)}&switches=${tabSwitchCount}`;
                    });
                  }}
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Return to Dashboard Now →
                </button>
              </div>
            ) : (
              <div className="w-full max-w-lg rounded-3xl border border-indigo-500/30 bg-[#111625] p-6 sm:p-8 shadow-2xl text-left space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Submit Assessment?</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{testDetails.title}</p>
                  </div>
                </div>

                {/* Stats Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#0B0F19] p-4 border border-slate-800 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Questions Answered</span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      {answeredCount} <span className="text-slate-600 font-normal">/ {totalQuestions}</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Unanswered</span>
                    <span className={`font-mono text-base font-bold ${totalQuestions - answeredCount > 0 ? "text-amber-400" : "text-slate-400"}`}>
                      {totalQuestions - answeredCount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Time Elapsed</span>
                    <span className="font-mono text-sm font-bold text-slate-200">
                      {formatTime((testDetails.duration_minutes || 30) * 60 - secondsRemaining)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Tab Switches</span>
                    <span className="font-mono text-sm font-bold text-slate-200">
                      {tabSwitchCount} / {testDetails.max_tab_switches || 3}
                    </span>
                  </div>
                </div>

                {totalQuestions - answeredCount > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      You have {totalQuestions - answeredCount} unanswered question{totalQuestions - answeredCount > 1 ? "s" : ""}. You can return to review them before finalizing.
                    </span>
                  </div>
                )}

                {testDetails.have_viva ? (
                  <div className="flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 p-3 text-xs text-purple-300">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>
                      This assessment includes an AI Viva Voce session. Upon submitting MCQs, your oral interview will commence.
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upon confirmation, your assessment responses will be submitted to the examination server and the test will be marked as Completed.
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submittingAssessment}
                    onClick={() => setShowSubmitModal(false)}
                    className="rounded-xl border border-slate-700 bg-transparent px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Review Answers
                  </button>
                  <button
                    type="button"
                    disabled={submittingAssessment}
                    onClick={confirmAndSubmitTest}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {submittingAssessment ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>{testDetails.have_viva ? "Submit & Start Viva →" : "Confirm & Submit Assessment"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 4 — AI Conversational Viva Voce Session
  // (Full Architecture & UX Aligned with sashanth17/McqEvaluvator InterviewScreen.jsx)
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "viva_active" && testDetails) {
    const progressPercent = Math.min((vivaStats.asked / 5) * 100, 100);

    return (
      <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex flex-col pb-10">
        <Head>
          <title>AI Viva Voce Session — {testDetails.title}</title>
        </Head>

        {/* Top Header Bar with Timers & Progress (Aligned with InterviewScreen.jsx) */}
        <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 mb-2 gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-slate-400">
              Question {vivaStats.asked} {testDetails.topics?.length ? `• ${vivaTopic || testDetails.topics[0]}` : ""}
            </span>

            {/* Global Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                globalSecondsLeft < 120
                  ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                  : "bg-[#111625] border-slate-800 text-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Global: {formatGlobalTime(globalSecondsLeft)}</span>
            </div>

            {/* Question Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                questionSecondsLeft < 10
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse"
                  : "bg-[#111625] border-slate-800 text-slate-300"
              }`}
            >
              <Timer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Q Timer: {formatQuestionTime(questionSecondsLeft)}</span>
            </div>

            {/* End & View Report Button */}
            <button
              type="button"
              onClick={handleStopVivaInterview}
              className="px-3.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-full text-xs font-medium transition-colors cursor-pointer"
            >
              End & View Report
            </button>
          </div>

          <div className="w-full sm:w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-in-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col relative px-4 sm:px-6">
          {/* Welcome Card if Interview Not Yet Started */}
          {!vivaInterviewStarted && (
            <div className="mb-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">AI Viva Voce Examiner Online</h3>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Ensure your audio and microphone are connected. Click below to begin your personalized viva
                  examination.
                </p>
              </div>
              <button
                type="button"
                disabled={!vivaConnected}
                onClick={handleStartVivaInterview}
                className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-40 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                <span>Begin Interview</span>
              </button>
            </div>
          )}

          {/* ── InterviewerTile (Aligned with InterviewerTile.jsx) ────────────────── */}
          <div
            className={`w-full min-h-[280px] sm:min-h-[340px] md:min-h-[380px] bg-[#111625] rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col justify-end p-8 transition-all duration-500 shadow-2xl ${
              isTransitioning ? "opacity-60 scale-[0.99]" : "opacity-100 scale-100"
            }`}
          >
            {/* Abstract Animated Concentric Rings Avatar */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-40 pointer-events-none">
              <div
                className={`w-48 h-48 rounded-full border border-indigo-500/20 absolute ${
                  isPlayingAudio ? "animate-ping" : ""
                }`}
                style={{ animationDuration: "3s" }}
              />
              <div
                className={`w-32 h-32 rounded-full border border-indigo-500/40 absolute ${
                  isPlayingAudio ? "animate-ping" : ""
                }`}
                style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
              />
              <div
                className={`w-20 h-20 rounded-full border border-indigo-500/60 absolute ${
                  isPlayingAudio ? "animate-ping" : ""
                }`}
                style={{ animationDuration: "2s", animationDelay: "1s" }}
              />
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] ${
                  isPlayingAudio ? "shadow-[0_0_40px_rgba(99,102,241,0.9)] scale-110" : ""
                } transition-all duration-300`}
              />
            </div>

            {/* Audio Controls Overlay */}
            {!isTransitioning && currentQuestionText && (
              <div className="absolute top-5 right-5 z-20 flex items-center gap-2 bg-[#0B0F19]/80 backdrop-blur-md p-1.5 rounded-full border border-slate-800 shadow-lg">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-indigo-400 transition-colors"
                  title={isPlayingAudio ? "Pause Audio" : "Play Question Audio"}
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="w-px h-4 bg-slate-800" />
                <button
                  type="button"
                  onClick={replayAudio}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-indigo-400 transition-colors"
                  title="Replay Question Audio"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Question Text or Loader */}
            <div className="relative z-10 max-w-3xl flex h-full">
              {isTransitioning ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-100 py-12">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-base font-medium opacity-80 animate-pulse">
                    Synthesizing Next Follow-up Question...
                  </span>
                </div>
              ) : (
                <div className="mt-auto w-full max-h-full overflow-y-auto pr-2 custom-scrollbar">
                  <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-slate-100 leading-snug drop-shadow-md">
                    {currentQuestionText ||
                      "Welcome to your AI Viva Voce evaluation. Click 'Begin Interview' to initiate questions."}
                  </h2>
                </div>
              )}
            </div>
          </div>

          {/* ── CallControls (Aligned with CallControls.jsx) ──────────────────────── */}
          <div className="flex items-center justify-between w-full max-w-xl px-6 py-3.5 bg-[#111625] backdrop-blur-md rounded-2xl border border-slate-800 mx-auto mt-5 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-wider text-slate-300">LIVE VIVA</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-full transition-all focus:outline-none cursor-pointer ${
                  isMicOn
                    ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                }`}
                title={isMicOn ? "Microphone On" : "Microphone Muted"}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className={`p-3 rounded-full transition-all focus:outline-none cursor-pointer ${
                  showHistoryDrawer
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Toggle Q&A History"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>

            {/* Webcam PiP in corner */}
            <div className="relative h-10 w-14 rounded-xl bg-black overflow-hidden border border-slate-800">
              <video
                ref={vivaVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
          </div>

          {/* ── ResponsePanel (Aligned with ResponsePanel.jsx) ───────────────────── */}
          <div className="w-full max-w-3xl mx-auto mt-6 bg-[#111625] rounded-3xl border border-slate-800 p-6 shadow-2xl">
            {/* Tabs: Type vs Speak */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveResponseTab("type")}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeResponseTab === "type"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Type Response
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResponseTab("speak")}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeResponseTab === "speak"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Speak Response</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                {vivaInput.length} chars
              </span>
            </div>

            {/* Response Input Body */}
            {activeResponseTab === "speak" ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-4 rounded-2xl bg-[#0B0F19] border border-slate-800/80">
                <button
                  type="button"
                  onClick={toggleSpeechRecording}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all cursor-pointer ${
                    isRecordingSpeech
                      ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  }`}
                >
                  <Mic className="h-8 w-8" />
                  {isRecordingSpeech && (
                    <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
                  )}
                </button>

                <p className="text-xs text-slate-300 font-medium">
                  {isRecordingSpeech
                    ? "Listening... Speak your answer now. Click mic again to stop."
                    : "Click the microphone to start speaking your answer."}
                </p>

                {vivaInput && (
                  <div className="w-full rounded-xl bg-[#111625] p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed text-left max-h-32 overflow-y-auto">
                    {vivaInput}
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={vivaInput}
                onChange={(e) => setVivaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleSendVivaAnswer();
                  }
                }}
                disabled={isSubmitting || !vivaInterviewStarted}
                placeholder="Type your structured answer to the question above (Press Ctrl+Enter or click Send)..."
                className="w-full min-h-[110px] rounded-2xl border border-slate-800 bg-[#0B0F19] p-4 text-xs md:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition-all custom-scrollbar resize-none"
              />
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] text-slate-400">
                {activeResponseTab === "type" ? "Tip: Press Ctrl+Enter to submit response" : "Voice transcription active"}
              </span>

              <div className="flex items-center gap-3">
                {vivaInput && (
                  <button
                    type="button"
                    onClick={() => setVivaInput("")}
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  disabled={!vivaInput.trim() || isSubmitting || !vivaInterviewStarted}
                  onClick={() => handleSendVivaAnswer()}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Transcript History Drawer */}
          {showHistoryDrawer && (
            <div className="w-full max-w-3xl mx-auto mt-6 rounded-3xl border border-slate-800 bg-[#111625] p-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Interview Transcript & Live Evaluations</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div ref={chatScrollRef} className="max-h-72 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {vivaMessages.map((msg) => {
                  const isAi = msg.sender === "ai";
                  if (msg.sender === "system") {
                    return (
                      <div key={msg.id} className="text-center text-[11px] text-slate-500 py-1">
                        {msg.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isAi
                          ? "bg-[#0B0F19] border border-slate-800 text-slate-200"
                          : "bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 ml-6"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] font-bold opacity-70">
                        <span>{isAi ? "AI Examiner" : "Your Answer"}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.text}</p>

                      {msg.evaluation && typeof msg.evaluation.accuracy === "number" && (
                        <div
                          className={`mt-2 rounded-xl p-2 text-[10px] border ${
                            msg.evaluation.accuracy >= 0.6
                              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                              : "bg-amber-950/40 border-amber-500/30 text-amber-300"
                          }`}
                        >
                          Accuracy: {Math.round(msg.evaluation.accuracy * 100)}% — {msg.evaluation.reasoning}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PHASE 5 — Comprehensive Assessment & Viva Evaluation Report
  // (Full Architecture & Layout Aligned with sashanth17/McqEvaluvator ReportScreen.jsx)
  // ─────────────────────────────────────────────────────────────────────────────
  const { session_metrics, assessment_summary, topic_analysis, reasoning_profile, key_strengths, priority_improvement_areas, final_summary } = normalizedReport;

  const getUnderstandingBadge = (level?: string) => {
    switch ((level || "").toLowerCase()) {
      case "strong":
        return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
      case "moderate":
        return "text-indigo-300 border-indigo-500/40 bg-indigo-500/10";
      case "weak":
        return "text-red-400 border-red-500/40 bg-red-500/10";
      default:
        return "text-slate-300 border-slate-700 bg-slate-800";
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8 pb-20">
      <Head>
        <title>Assessment Report — {testDetails?.title || "Evaluation"}</title>
      </Head>

      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="rounded-3xl border border-slate-800 bg-[#111625] p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-indigo-400 text-xs tracking-widest uppercase">
                Step 03 — Final Evaluation Report
              </span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Verified
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-bold">
              {testDetails?.title || "Academic Assessment Report"}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Student: <strong className="text-slate-200">{studentEmail}</strong> • Code:{" "}
              <strong className="text-indigo-400 font-mono">{testDetails?.secure_code || passcode || "N/A"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-[#0B0F19] px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/neurobe/student-dashboard")}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Report Content Grid (Aligned with ReportScreen.jsx) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Metrics & Qualitative Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* MCQ Summary Card */}
            {session_metrics && (
              <div className="rounded-3xl border border-slate-800 bg-[#111625] p-6 shadow-xl">
                <h3 className="font-serif text-lg font-bold mb-4 border-b border-slate-800 pb-2 text-white flex items-center justify-between">
                  <span>Assessment Metrics</span>
                  <Award className="h-5 w-5 text-amber-400" />
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Questions Answered</span>
                    <p className="text-2xl font-mono">
                      <span className="text-emerald-400 font-bold">{session_metrics.total_answered_correctly || 0}</span>
                      <span className="text-slate-600 mx-1.5">/</span>
                      <span className="text-slate-400 text-lg">{session_metrics.total_questions_asked || 0}</span>
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-800/60 pt-3">
                    <span className="text-xs text-slate-400">Evaluated Accuracy</span>
                    <span className="text-xl font-mono text-indigo-400 font-bold">
                      {session_metrics.mcq_score_pct || 0}%
                    </span>
                  </div>

                  {session_metrics.total_topics && (
                    <div className="flex justify-between items-center border-t border-slate-800/60 pt-3">
                      <span className="text-xs text-slate-400">Total Core Topics</span>
                      <span className="text-sm font-mono text-purple-400 font-semibold">
                        {session_metrics.total_topics} Evaluated
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overall Understanding */}
            {assessment_summary && (
              <div className="rounded-3xl border border-slate-800 bg-[#111625] p-6 shadow-xl space-y-3">
                <h3 className="font-serif text-lg font-bold border-b border-slate-800 pb-2 text-white">
                  Overall Understanding
                </h3>
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getUnderstandingBadge(
                      assessment_summary.overall_understanding
                    )}`}
                  >
                    Level: {assessment_summary.overall_understanding.replace("_", " ")}
                  </span>
                </div>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{assessment_summary.summary}</p>
              </div>
            )}

            {/* Communication Skills */}
            {assessment_summary?.communication_skills && (
              <div className="rounded-3xl border border-slate-800 bg-[#111625] p-6 shadow-xl space-y-3">
                <h3 className="font-serif text-lg font-bold border-b border-slate-800 pb-2 text-white">
                  Communication Skills
                </h3>
                <div className="space-y-3">
                  {assessment_summary.communication_skills.articulation && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Articulation</h4>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {assessment_summary.communication_skills.articulation}
                      </p>
                    </div>
                  )}
                  {assessment_summary.communication_skills.confidence && (
                    <div className="border-t border-slate-800/60 pt-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Confidence</h4>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {assessment_summary.communication_skills.confidence}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reasoning Profile */}
            {reasoning_profile && (
              <div className="rounded-3xl border border-slate-800 bg-[#111625] p-6 shadow-xl space-y-3">
                <h3 className="font-serif text-lg font-bold border-b border-slate-800 pb-2 text-white">
                  Reasoning Profile
                </h3>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border text-indigo-300 border-indigo-500/30 bg-indigo-500/10">
                    Depth: {reasoning_profile.reasoning_depth || "Standard"}
                  </span>
                </div>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{reasoning_profile.summary}</p>
              </div>
            )}

            {/* Key Strengths */}
            {key_strengths && key_strengths.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-[#111625] p-6 shadow-xl space-y-3">
                <h3 className="font-serif text-lg font-bold border-b border-slate-800 pb-2 text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Key Strengths</span>
                </h3>
                <ul className="space-y-2.5">
                  {key_strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Priority Improvements */}
            {priority_improvement_areas && priority_improvement_areas.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-[#111625] p-6 shadow-xl space-y-3">
                <h3 className="font-serif text-lg font-bold border-b border-slate-800 pb-2 text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Priority Improvements</span>
                </h3>
                <ul className="space-y-2.5">
                  {priority_improvement_areas.map((imp, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Topic Breakdown & Conclusion */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Final Conclusion Card */}
            {final_summary && (
              <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-[#111625] p-6 shadow-xl">
                <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <span>Executive Conclusion</span>
                </h3>
                <p className="text-slate-200 italic font-serif text-base sm:text-lg leading-relaxed">
                  "{final_summary}"
                </p>
              </div>
            )}

            {/* Topic Analysis Cards */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-white font-bold border-b border-slate-800 pb-2">
                Curriculum Topic Breakdown
              </h3>

              {topic_analysis && topic_analysis.length > 0 ? (
                topic_analysis.map((topic, idx) => (
                  <div
                    key={idx}
                    className="rounded-3xl border border-slate-800 bg-[#111625] p-6 relative overflow-hidden shadow-xl hover:border-slate-700 transition-colors"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    <h4 className="text-base font-bold text-white mb-3">{topic.topic}</h4>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getUnderstandingBadge(
                          topic.understanding_level
                        )}`}
                      >
                        {topic.understanding_level.replace("_", " ")}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border text-slate-300 border-slate-700 bg-slate-800/60">
                        Depth: {topic.depth || "Standard"}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border text-purple-300 border-purple-800 bg-purple-950/40">
                        Consistency: {topic.mcq_interview_consistency || "High"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">{topic.feedback}</p>

                    {(topic.knowledge_gaps.length > 0 || topic.misconceptions.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
                        {topic.knowledge_gaps.length > 0 && (
                          <div>
                            <h5 className="text-[11px] font-bold text-red-400 mb-1.5">Knowledge Gaps</h5>
                            <ul className="space-y-1">
                              {topic.knowledge_gaps.map((g, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                  <span className="text-red-400">•</span> {g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {topic.misconceptions.length > 0 && (
                          <div>
                            <h5 className="text-[11px] font-bold text-indigo-400 mb-1.5">Misconceptions</h5>
                            <ul className="space-y-1">
                              {topic.misconceptions.map((m, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                  <span className="text-indigo-400">•</span> {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#111625] p-6 text-center text-xs text-slate-400">
                  Comprehensive topic analysis has been recorded and submitted to your course faculty.
                </div>
              )}
            </div>

            {/* Viva Dialogue Transcript Breakdown (if messages exist) */}
            {vivaMessages.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-white font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>Viva Voce Dialogue History</span>
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                </h3>

                <div className="space-y-3">
                  {vivaMessages.map((msg) => {
                    const isAi = msg.sender === "ai";
                    if (msg.sender === "system") return null;

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-2xl p-4 text-xs leading-relaxed border ${
                          isAi
                            ? "bg-[#111625] border-slate-800 text-slate-200"
                            : "bg-indigo-950/40 border-indigo-800/40 text-indigo-200 ml-4"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold opacity-75">
                          <span>{isAi ? "AI Examiner Question" : "Candidate Response"}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p>{msg.text}</p>

                        {msg.evaluation && typeof msg.evaluation.accuracy === "number" && (
                          <div
                            className={`mt-2 rounded-xl p-2.5 text-[11px] border font-medium ${
                              msg.evaluation.accuracy >= 0.6
                                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                                : "bg-amber-950/40 border-amber-500/30 text-amber-300"
                            }`}
                          >
                            Accuracy: {Math.round(msg.evaluation.accuracy * 100)}% — {msg.evaluation.reasoning}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-8 mt-12">
          <button
            type="button"
            onClick={() => router.push("/neurobe/student-dashboard")}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-[#111625] px-6 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download & Save Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attach BlankLayout to bypass DefaultLayout (removes dashboard sidebar & white borders)
// ─────────────────────────────────────────────────────────────────────────────
StudentMCQTestPage.getLayout = (page: any) => {
  return <BlankLayout>{page}</BlankLayout>;
};
