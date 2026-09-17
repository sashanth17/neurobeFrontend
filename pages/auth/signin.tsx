import Link from "next/link";
import { useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { setPageTitle } from "../../store/themeConfigSlice";
import { useRouter } from "next/router";
import BlankLayout from "@/components/Layouts/BlankLayout";
import IconMail from "@/components/Icon/IconMail";
import IconLockDots from "@/components/Icon/IconLockDots";
import IconEye from "@/components/Icon/IconEye";
import IconEyeOff from "@/components/Icon/IconEyeOff";
import TextInput from "@/components/FormFields/TextInput.component";
import { Failure, Success, useSetState } from "@/utils/function.utils";
import Utils from "@/imports/utils.import";
import * as Yup from "yup";
import Models from "@/imports/models.import";
import PrimaryButton from "@/components/FormFields/PrimaryButton.component";
import { CAPTCHA_SITE_KEY, getDefaultRouteByRole } from "@/utils/constant.utils";
import { userData } from "@/store/userConfigSlice";
import ReCAPTCHA from "react-google-recaptcha";
import {
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Target,
  FileSpreadsheet,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

const LoginBoxed = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [loginCaptchaToken, setLoginCaptchaToken] = useState("");
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const captchaRef = useRef<any>(null);
  const captchaVerifiedRef = useRef(false);
  const captchaPopupOpenRef = useRef(false);
  const [captchaPopupRect, setCaptchaPopupRect] = useState<DOMRect | null>(null);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const isResettingRef = useRef(false);

  const resetCaptcha = () => {
    isResettingRef.current = true;
    captchaRef.current?.reset();
    setLoginCaptchaToken("");
    captchaVerifiedRef.current = false;
    captchaPopupOpenRef.current = false;
    setCaptchaPopupRect(null);
    setTimeout(() => {
      isResettingRef.current = false;
    }, 500);
  };

  // Detect when reCAPTCHA image popup opens/closes
  useEffect(() => {
    let debounceTimer: any = null;

    const updatePopupState = () => {
      if (isResettingRef.current) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const iframe = document.querySelector<HTMLIFrameElement>(
          "iframe[src*='recaptcha'][src*='bframe']"
        );
        if (iframe) {
          const rect = iframe.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          captchaPopupOpenRef.current = isVisible;
          setCaptchaPopupRect(isVisible ? rect : null);
        } else {
          captchaPopupOpenRef.current = false;
          setCaptchaPopupRect(null);
        }
      }, 100);
    };

    const observer = new MutationObserver(updatePopupState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, []);

  // Outside click — only resets when image popup is open and user has NOT verified
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!captchaPopupOpenRef.current) return;
      if (captchaVerifiedRef.current) return;
      const iframe = document.querySelector<HTMLIFrameElement>(
        "iframe[src*='recaptcha'][src*='bframe']"
      );
      if (!iframe) return;
      const rect = iframe.getBoundingClientRect();
      const isInsidePopup =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!isInsidePopup) resetCaptcha();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [state, setState] = useSetState({
    showPassword: false,
    email: "",
    password: "",
    error: null,
    btnLoading: false,
    userRestrictModal: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("Sign In | NEUROBE"));
  }, [dispatch]);

  const submitForm = async (e: any) => {
    e.preventDefault();
    try {
      setState({ btnLoading: true });
      const body = {
        email: state.email.trim(),
        password: state.password,
        // recaptcha_token: loginCaptchaToken,
      };

      const validationErrors: any = {};

      try {
        await Utils.Validation.login.validate(body, { abortEarly: false });
      } catch (yupError) {
        if (yupError instanceof Yup.ValidationError) {
          yupError.inner.forEach((err) => {
            validationErrors[err.path] = err?.message;
          });
        }
      }

      // if (!loginCaptchaToken) {
      //   validationErrors.loginCaptchaInput = "Please complete the captcha verification";
      // }

      if (Object.keys(validationErrors).length > 0) {
        setState({ error: validationErrors, btnLoading: false });
        return;
      }

      const res: any = await Models.auth.login(body);

      // if (res?.user?.role === "applicant") {
      //   setState({ btnLoading: false, email: "", password: "" });
      //   resetCaptcha();
      //   setShowApplicantModal(true);
      //   return;
      // }

      const accessToken = res?.access_token || res?.access || "";
      const refreshToken = res?.refresh_token || res?.refresh || "";
      const user = res?.user || null;
      const role = user?.role || res?.role || "";

      localStorage.setItem("token", accessToken);
      localStorage.setItem("refresh", refreshToken);
      if (user?.id) localStorage.setItem("userId", String(user.id));
      if (role) {
        localStorage.setItem("role", role);
        localStorage.setItem("group", role);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        dispatch(userData(user));
      }

      Success("Login Successfully");
      const targetRoute = getDefaultRouteByRole(role);
      router.replace(targetRoute);
      setState({ btnLoading: false });
    } catch (error: any) {
      setLoginCaptchaToken("");
      captchaRef.current?.reset();
      Failure(error?.error || "Login failed. Please check your credentials.");
      setState({ btnLoading: false });
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F7F9FE] p-4 font-nunito selection:bg-[#5C28CA] selection:text-white dark:bg-[#060818] sm:p-6 lg:p-10">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[#5C28CA]/10 blur-3xl filter dark:bg-[#5C28CA]/20" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-[#4361ee]/10 blur-3xl filter dark:bg-[#4361ee]/15" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-[#805dca]/5 blur-3xl filter" />

      {/* Main Unified Split Card */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_20px_60px_-15px_rgba(0,14,59,0.08)] dark:border-gray-800/80 dark:bg-[#0e1726] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] lg:min-h-[720px] lg:flex-row">
        
        {/* LEFT PANEL: Brand Hero Showcase (Desktop) */}
        <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#000E3B] via-[#100c38] to-[#5C28CA] p-10 text-white lg:flex lg:w-1/2 xl:w-7/12 xl:p-12">
          {/* Subtle Grid Pattern Overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Decorative glowing gradient accents */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#5C28CA]/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#4361ee]/30 blur-2xl" />

          {/* Top Brand Pill & Logo */}
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-xl bg-white px-4 py-2 shadow-md">
                <img
                  src="/assets/images/neurobe/logo.png"
                  alt="Neurobe Logo"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Higher Education OBE Platform
              </span>
            </div>

            {/* Hero Copy */}
            <div className="mt-10">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
                Outcome-Based Academic &amp; Curriculum Intelligence
              </h1>
              <p className="mt-3.5 max-w-lg text-sm leading-relaxed text-white/75 xl:text-base">
                Streamline direct and indirect CO-PO attainment, Bloom’s taxonomy-aligned pedagogy, automated CIA evaluations, and institutional accreditation.
              </p>
            </div>
          </div>

          {/* Middle: Feature Highlights & Academic Setup Visual */}
          <div className="relative z-10 my-8 space-y-4">
            {/* Feature Pills */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm transition hover:bg-white/[0.12]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Target className="h-5 w-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">CO-PO Attainment</p>
                  <p className="truncate text-[11px] text-white/70">
                    Automated direct &amp; indirect targets
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm transition hover:bg-white/[0.12]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <BookOpen className="h-5 w-5 text-[#AEEAD3]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Pedagogy &amp; Topics</p>
                  <p className="truncate text-[11px] text-white/70">
                    Bloom&apos;s level taxonomy mapping
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Asset Preview */}
            <div className="relative flex items-center justify-center py-6">
              <div className="absolute h-52 w-52 rounded-full bg-[#5C28CA]/35 blur-3xl filter" />
              <img
                src="/assets/images/neurobe/Rectangle.png"
                alt="Neurobe Academic Platform"
                className="relative z-10 max-h-[250px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>

          {/* Bottom Security / Accreditation Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#10b981]" />
              <span>NBA, NAAC &amp; Washington Accord Aligned</span>
            </div>
            <span className="font-semibold text-white/90">Institutional Portal</span>
          </div>
        </div>

        {/* RIGHT PANEL: Authentication Form */}
        <div className="flex w-full flex-col justify-center bg-white px-6 py-10 dark:bg-[#0e1726] sm:px-12 md:px-16 lg:w-1/2 xl:w-5/12 xl:px-14">
          {/* Mobile-Only Header with Logo */}
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 inline-flex items-center rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-[#181f32]">
              <img
                src="/assets/images/neurobe/logo.png"
                alt="Neurobe Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-color2-l px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-color2 dark:bg-[#5C28CA]/20 dark:text-[#c4a6ff]">
              <Sparkles className="h-3 w-3" /> OBE Academic Platform
            </span>
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            {/* Form Title & Subtitle */}
            <div className="mb-8">
              <div className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-color2-l px-3 py-1 text-xs font-bold uppercase tracking-wider text-color2 dark:bg-[#5C28CA]/20 dark:text-[#c4a6ff]">
                <GraduationCap className="h-3.5 w-3.5" />
                Institutional Sign In
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-color1 dark:text-white sm:text-3xl">
                Welcome Back
              </h2>
              <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                Enter your institutional credentials to access your academic workspace.
              </p>
            </div>

            {/* Sign In Form */}
            <form onSubmit={submitForm} className="space-y-5">
              {/* Email Address */}
              <div>
                <TextInput
                  name="email"
                  type="email"
                  title="Institutional Email"
                  placeholder="e.g. coordinator@institution.edu"
                  value={state.email}
                  onChange={(e) =>
                    setState({
                      email: e.target.value,
                      error: { ...state.error, email: undefined },
                    })
                  }
                  error={state.error?.email}
                  icon={<IconMail fill={true} />}
                  className="h-11 rounded-xl border-gray-200 text-sm transition focus:border-color2 focus:ring-1 focus:ring-color2 dark:border-gray-700 dark:bg-[#121e32] dark:text-white"
                />
              </div>

              {/* Password */}
              <div>
                <TextInput
                  id="Password"
                  title="Password"
                  name="password"
                  type={state.showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={state.password}
                  onChange={(e) =>
                    setState({
                      password: e.target.value,
                      error: { ...state.error, password: undefined },
                    })
                  }
                  error={state.error?.password}
                  icon={<IconLockDots fill={true} />}
                  rightIcon={state.showPassword ? <IconEyeOff /> : <IconEye />}
                  rightIconOnlick={() =>
                    setState({ showPassword: !state.showPassword })
                  }
                  className="h-11 rounded-xl border-gray-200 text-sm transition focus:border-color2 focus:ring-1 focus:ring-color2 dark:border-gray-700 dark:bg-[#121e32] dark:text-white"
                />
              </div>

              {/* Forgot Password Row */}
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forget-password")}
                  className="text-xs font-bold text-color2 transition hover:text-purple-700 hover:underline dark:text-[#a884f7]"
                >
                  Forgot Password?
                </button>
              </div>

              {/* reCAPTCHA Verification */}
              {/* <div className="relative flex w-full flex-col items-center justify-center rounded-2xl border border-gray-200/90 bg-gray-50/70 p-3 dark:border-gray-700/60 dark:bg-gray-900/40">
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={CAPTCHA_SITE_KEY}
                  asyncScriptOnLoad={() => setCaptchaLoaded(true)}
                  onChange={(token) => {
                    setLoginCaptchaToken(token || "");
                    if (token) {
                      captchaVerifiedRef.current = true;
                      setState({
                        error: { ...state.error, loginCaptchaInput: undefined },
                      });
                    }
                  }}
                  onExpired={() => resetCaptcha()}
                />

                {!captchaLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <svg
                        className="h-5 w-5 animate-spin text-color2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Loading Security Verification...
                    </div>
                  </div>
                )}

                {state.error?.loginCaptchaInput && (
                  <p className="mt-2 text-center text-xs font-semibold text-red-500">
                    {state.error.loginCaptchaInput}
                  </p>
                )}
              </div> */}

              {/* Submit Button */}
              <div className="pt-2">
                <PrimaryButton
                  type="submit"
                  text="Sign In to Portal"
                  className="!mt-0 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-0 bg-color2 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_20px_-6px_rgba(92,40,202,0.4)] transition hover:bg-[#4d1fb0] hover:shadow-[0_14px_24px_-6px_rgba(92,40,202,0.5)] active:scale-[0.99] disabled:opacity-60"
                  loading={state.btnLoading}
                />
              </div>
            </form>

            {/* Portal Footer / Help Notice */}
            <div className="mt-8 border-t border-gray-100 pt-6 text-center dark:border-gray-800">
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                <span>Protected by 256-bit SSL Academic Encryption</span>
              </p>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                Need help or role provisioning? Contact your Institutional Administrator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Restricted Applicant Modal */}
      {showApplicantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 text-center shadow-2xl dark:border-gray-800 dark:bg-[#0e1726]">
            {/* Amber Warning Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-extrabold text-color1 dark:text-white">
              Applicant Portal Notice
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              This portal is dedicated for Institutional HR, Coordinators, and Faculty members. As an Applicant, please login through your dedicated candidate portal:
            </p>

            <div className="mt-6 space-y-3">
              <a
                href="https://facultypro.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-color2 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#4d1fb0] hover:shadow-lg"
              >
                Go to Faculty Candidate Portal
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => setShowApplicantModal(false)}
                className="w-full rounded-xl py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Dismiss &amp; Return to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LoginBoxed.getLayout = (page: any) => {
  return <BlankLayout>{page}</BlankLayout>;
};

export default LoginBoxed;
