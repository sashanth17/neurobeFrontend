import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import { IRootState } from "../../store";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { toggleSidebar } from "../../store/themeConfigSlice";
import {
  clearApplicationCount,
  resetApplicationCount,
} from "../../store/notificationSlice";
import { OwnmenuConfig, getMenuByRole } from "@/utils/constant.utils";

const Icons: Record<string, () => JSX.Element> = {
  "Academic Setup": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3L2 8l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  "Course Offerings": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  "User Management": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  "Roles & Permissions": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  "Bulk Import": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  "Audit Trial": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Masters: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
  "My Assigned Courses": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Syllabus: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  "CO-PO Mapping": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Topics: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Pedagogy: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  "Lesson Plan": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  "Learning Materials": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  "Question Bank": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  "MCQ Test Preperation": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  "CIA Question Paper": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  "Course Artifacts": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  "Student Enrollment": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  "MCQ Test Execution": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  "Results & Analysis": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  "Marks Extraction & Verification": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  ),
};

const FallbackIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ACTIVE_BG = "#5C28CA";

const SidebarDynamic = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [group, setGroup] = useState<string>("");
  const [userProfile, setUserProfile] = useState({
    name: "User",
    role: "ERP Admin",
    avatar: "U",
  });
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string>("");
  const [notifications, setNotifications] = useState<Record<string, number>>(
    {},
  );
  const semidark = useSelector(
    (state: IRootState) => state.themeConfig.semidark,
  );
  const activeView = useSelector(
    (state: IRootState) => state.courseView.activeView,
  );
  const applicationCountOverride = useSelector(
    (state: IRootState) => state.notification.applicationCount,
  );
  const scrollbarRef = useRef<any>(null);
  const pathnameRef = useRef(router.pathname);
  const isFirstMount = useRef(true);

  const COORDINATOR_DEFAULT = "/neurobe/syllabus";
  const INSTRUCTOR_DEFAULT = "/neurobe/course-artifacts";
  const APPLICATION_PAGES = [
    "/faculty/my_application",
    "/faculty/admin_application",
    "/faculty/ins_application",
  ];

  // on mobile always show labels; on desktop only when hovered
  const showLabels = isMobile || hovered;

  useEffect(() => {
    const role = localStorage.getItem("role") || localStorage.getItem("group") || "";
    setGroup(role);

    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const fullName =
          `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
          u?.email ||
          "User";
        setUserProfile({
          name: fullName,
          role: u?.role || role || "ERP Admin",
          avatar: (fullName || "U").charAt(0).toUpperCase(),
        });
      } else if (role) {
        setUserProfile((prev) => ({
          ...prev,
          role: role,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, [router.pathname]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    pathnameRef.current = router.pathname;
  }, [router.pathname]);

  useEffect(() => {
    router.prefetch(COORDINATOR_DEFAULT);
    router.prefetch(INSTRUCTOR_DEFAULT);
  }, []);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const id =
      activeView === "coordinator"
        ? "sidebar-section-coordinator"
        : "sidebar-section-instructor";
    const target =
      activeView === "coordinator" ? COORDINATOR_DEFAULT : INSTRUCTOR_DEFAULT;

    const timer = setTimeout(() => {
      const heading = document.getElementById(id);
      if (!heading) return;
      const container: HTMLElement | null =
        scrollbarRef.current?._container ?? null;
      if (container) {
        container.scrollTo({ top: heading.offsetTop - 16, behavior: "smooth" });
      } else {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeView]);

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      const path = url.split("?")[0];
      if (APPLICATION_PAGES.includes(path)) {
        setNotifications((prev) => ({ ...prev, new_applications: 0 }));
        dispatch(clearApplicationCount());
      }
    };
    const handleRouteChangeComplete = () => setActiveRoute();
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) dispatch(toggleSidebar());
    if (APPLICATION_PAGES.includes(router.pathname)) {
      setNotifications((prev) => ({ ...prev, new_applications: 0 }));
    } else {
      dispatch(resetApplicationCount());
    }
    setActiveRoute();
  }, [router.pathname]);

  const setActiveRoute = () => {
    const allLinks = document.querySelectorAll(".sidebar ul a.active");
    allLinks.forEach((el) => el.classList.remove("active"));
    const selector = document.querySelector(
      `.sidebar ul a[href="${window.location.pathname}"]`,
    );
    selector?.classList.add("active");
  };

  const getNotifyCount = (notifyKey: string) => {
    if (notifyKey === "new_applications" && applicationCountOverride === 0)
      return 0;
    return notifications[notifyKey] ?? 0;
  };

  let currentSection: "coordinator" | "instructor" | null = null;

  const isItemDisabled = () => {
    if (currentSection === "coordinator" && activeView === "instructor")
      return true;
    if (currentSection === "instructor" && activeView === "coordinator")
      return true;
    return false;
  };

  const getOwnMenu = () => {
    return getMenuByRole(group);
  };

  const menu = getOwnMenu() || [];

  const isActive = (href?: string) =>
    href
      ? router.pathname === href || router.pathname.startsWith(href + "/")
      : false;

  return (
    <div className={semidark ? "dark" : ""}>
      <nav
        className="sidebar bg-color1 fixed bottom-0 top-0 z-50 h-full overflow-hidden transition-[width] duration-300 ease-in-out lg:top-[72px] lg:max-h-[calc(100vh-72px)]"
        style={{ width: showLabels ? "270px" : "58px" }}
        onMouseEnter={() => {
          if (!isMobile) setHovered(true);
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setHovered(false);
            setExpandedKey("");
          }
        }}
      >
        {/* Mobile header: logo + close — only below lg */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/">
            <img src="/assets/images/neurobe/logo.png" alt="logo" className="h-[28px] w-auto" />
          </Link>
          <button
            type="button"
            className="flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.1)" }}
            onClick={() => dispatch(toggleSidebar())}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* User card — top */}
        <div className="px-2 pb-3 pt-4">
          <div
            className="flex items-center overflow-hidden rounded-[12px] transition-all duration-300"
            style={{
              background: showLabels ? "#000" : "transparent",
              border: showLabels ? "0.2px solid #fff" : "1px solid transparent",
              padding: showLabels ? "10px 12px" : "8px 0",
              justifyContent: showLabels ? "flex-start" : "center",
              minHeight: 56,
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold text-black"
              style={{
                width: 38,
                height: 38,
                border: "2px solid rgba(255,255,255,0.25)",
              }}
            >
              {userProfile.avatar}
            </div>
            {showLabels && (
              <div className="ml-3 min-w-0">
                <p className="truncate text-[15px] font-bold text-[#fff]">
                  {userProfile.name}
                </p>
                <p className="truncate pt-1 text-[13px] text-white/80">
                  {userProfile.role}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu list */}
        <div
          className="sidebar-menu-scroll flex flex-col space-y-1 overflow-y-auto overflow-x-hidden py-4"
          style={{ maxHeight: "calc(100% - 100px)" }}
        >
          {menu.map((item: any, idx: number) => {
            if (item.type === "heading") {
              const label: string = item.label ?? "";
              if (label.includes("COURSE PREPARATION"))
                currentSection = "coordinator";
              else if (label.includes("INSTRUCTOR FUNCTIONS"))
                currentSection = "instructor";
              const disabled = isItemDisabled();
              const anchorId = label.includes("COURSE PREPARATION")
                ? "sidebar-section-coordinator"
                : label.includes("INSTRUCTOR FUNCTIONS")
                ? "sidebar-section-instructor"
                : undefined;

              if (showLabels) {
                return (
                  <p
                    key={idx}
                    id={anchorId}
                    className={`whitespace-nowrap px-[14px] pb-1 pt-4 text-[10px] uppercase tracking-[1.8px] ${
                      disabled ? "select-none opacity-30" : ""
                    }`}
                    style={{ color: "rgba(191,208,244,0.6)" }}
                  >
                    {item.label}
                  </p>
                );
              }
              return (
                <div
                  key={idx}
                  id={anchorId}
                  className="mx-auto my-2"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
              );
            }

            const disabled = isItemDisabled();
            const disabledClass = disabled
              ? "opacity-30 pointer-events-none select-none"
              : "";

            if (item.type === "link") {
              const Icon = Icons[item.label] || FallbackIcon;
              const active = isActive(item.href);
              return (
                <Link
                  key={idx}
                  href={disabled ? "#" : item.href || "#"}
                  className={`mx-[8px] flex items-center transition-colors duration-150 ${disabledClass}`}
                  style={{
                    minHeight: 40,
                    borderRadius: "9999px",
                    padding: showLabels ? "9px 14px" : "9px 0",
                    justifyContent: showLabels ? "flex-start" : "center",
                    background: active ? ACTIVE_BG : "transparent",
                    color: "#fff",
                  }}
                  onClick={(e) => {
                    if (disabled) {
                      e.preventDefault();
                      return;
                    }
                    if (item.notifyKey === "new_applications") {
                      dispatch(clearApplicationCount());
                      setNotifications((prev) => ({
                        ...prev,
                        new_applications: 0,
                      }));
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled)
                      (e.currentTarget as HTMLElement).style.background =
                        ACTIVE_BG;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = active
                      ? ACTIVE_BG
                      : "transparent";
                  }}
                >
                  <span
                    className="flex shrink-0 items-center justify-center"
                    style={{ width: 28 }}
                  >
                    <Icon />
                  </span>
                  {showLabels && (
                    <span className="ml-3 whitespace-nowrap text-[14px] font-medium leading-none">
                      {item.label}
                    </span>
                  )}
                  {showLabels &&
                    !disabled &&
                    item.notifyKey &&
                    (() => {
                      const count = getNotifyCount(item.notifyKey);
                      return count > 0 ? (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] text-white">
                          {count}
                        </span>
                      ) : null;
                    })()}
                </Link>
              );
            }

            if (item.type === "submenu") {
              const Icon = Icons[item.label] || FallbackIcon;
              const open = expandedKey === item.key;
              const anyChildActive = item.children?.some((c: any) =>
                isActive(c.href),
              );
              const isHighlighted = anyChildActive || open;
              return (
                <div key={idx} className={disabledClass}>
                  <button
                    type="button"
                    disabled={disabled}
                    className="mx-[8px] flex items-center transition-colors duration-150"
                    style={{
                      minHeight: 40,
                      width: "calc(100% - 16px)",
                      borderRadius: "9999px",
                      padding: showLabels ? "9px 12px" : "9px 0",
                      justifyContent: showLabels ? "flex-start" : "center",
                      background: isHighlighted ? ACTIVE_BG : "transparent",
                      color: "#fff",
                    }}
                    onClick={() => {
                      if (!disabled && showLabels)
                        setExpandedKey(open ? "" : item.key);
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled)
                        (e.currentTarget as HTMLElement).style.background =
                          ACTIVE_BG;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        isHighlighted ? ACTIVE_BG : "transparent";
                    }}
                  >
                    <span
                      className="flex shrink-0 items-center justify-center"
                      style={{ width: 20 }}
                    >
                      <Icon />
                    </span>
                    {showLabels && (
                      <>
                        <span className="ml-3 flex-1 whitespace-nowrap text-left text-[14px] font-medium">
                          {item.label}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                            flexShrink: 0,
                            marginRight: 2,
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </>
                    )}
                  </button>
                  {showLabels && open && (
                    <div className="ml-[38px] mr-[8px] mt-[5px] flex flex-col gap-[5px]">
                      {item.children?.map((child: any, ci: number) => (
                        <Link
                          key={ci}
                          href={child.href || "#"}
                          className="rounded-full px-3 py-[7px] text-[14px] transition-colors duration-150"
                          style={{
                            color:  "#fff",
                            background: isActive(child.href)
                              ? "rgba(255, 255, 255, 0.18)"
                              : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive(child.href))
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "rgba(255, 255, 255, 0.18)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive(child.href))
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "transparent";
                          }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </nav>
    </div>
  );
};

export default SidebarDynamic;
