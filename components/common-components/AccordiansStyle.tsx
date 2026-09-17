import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, RefreshCw } from "lucide-react";

interface AccordiansStyleProps {
  topics?: any[];
  title?: string;
  subtitle?: string;
  topicCount?: number;
  topicCountLabel?: string;
  expandable?: boolean;
  expandedSectionLabel?: React.ReactNode;
  btnOnClick?: (topic: any) => void;
  footerContent?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  onAddTopic?: () => void;
  renderModals?: () => React.ReactNode;
}

const AccordiansStyle = ({
  topics = [],
  title = "Topics",
  subtitle,
  topicCount,
  topicCountLabel = "Topics",
  expandable = true,
  expandedSectionLabel,
  btnOnClick,
  footerContent,
  loading = false,
  loadingMessage = "Generating with NEURO AI...",
  onAddTopic,
  renderModals,
}: AccordiansStyleProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const count = topicCount ?? topics.length;

  const toggle = (id: string) => {
    if (!expandable) return;

    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="mb-5" aria-label="accordion section">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {/* ───────────────── HEADER ───────────────── */}
        <div className="flex items-center justify-between bg-[#111238] px-4 py-3 text-white">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>

            {subtitle && (
              <p className="mt-0.5 text-sm text-white/70">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded bg-white/15 px-4 py-1 text-sm font-semibold">
              {count} {topicCountLabel}
            </span>
            {onAddTopic && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTopic();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-color2 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Topic
              </button>
            )}
          </div>
        </div>

        {/* ───────────────── TOPIC ROWS ───────────────── */}
        {loading ? (
          <div className="p-6">
            <div className="flex items-center justify-center gap-2.5 pb-6 text-sm font-semibold text-color2">
              <RefreshCw className="h-4 w-4 animate-spin text-color2" />
              <span>{loadingMessage}</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="flex animate-pulse items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="h-6 w-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {topics.map((topic: any) => {
            const isOpen = expandedId === topic.id;

            return (
              <div key={topic.id}>
                {/* ───────────── Topic Header Row ───────────── */}
                <div className="flex items-start gap-2 px-5 py-4">
                  {/* Main clickable area */}
                  <button
                    type="button"
                    onClick={() => toggle(topic.id)}
                    disabled={!expandable}
                    className={`flex min-w-0 flex-1 items-start gap-2 text-left transition-colors ${
                      expandable
                        ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        : "cursor-default"
                    }`}
                    aria-expanded={expandable ? isOpen : undefined}
                  >
                    {/* Chevron */}
                    {(topic.items.length > 0 && expandable) &&
                      (isOpen ? (
                        <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pri" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pri" />
                      ))}

                    {/* Title + Meta */}
                    <span className="min-w-0 flex-1">
                      {/* Topic Title */}
                      <span className="font-semibold text-color1">
                        {topic.title}
                      </span>

                      {/* Verified Status badge if present */}
                      {topic?.verified_status && (
                        <div className="mt-1">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                              topic.verified_status === "Needs Review"
                                ? "border border-amber-300 bg-amber-50 text-amber-600"
                                : "border border-emerald-300 bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {topic?.verified_status}
                          </span>
                        </div>
                      )}

                      {/* Meta */}
                      {expandable && topic.meta && !topic.actions?.length && (
                        <span className="text-pri mt-0.5 block text-xs font-normal">
                          {topic.meta}
                        </span>
                      )}
                    </span>
                  </button>

                  {/* ───────────── RIGHT SIDE ───────────── */}
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Topic Actions (Hours, Knowledge Level, Status badge/button, Edit icon) */}
                    {topic.actions?.map((action: any) =>
                      action.asTag ? (
                        <span
                          key={action.key}
                          className={action.className}
                        >
                          {action.icon}
                          {action.label}
                        </span>
                      ) : (
                        <button
                          key={action.key}
                          type="button"
                          className={
                            action.className ??
                            "text-pri flex items-center gap-1.5 rounded-full border border-gray-400 px-3 py-1 text-xs font-semibold hover:border-[#000] hover:text-[#000]"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick?.(topic);
                          }}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      )
                    )}

                    {/* Expandable Badge */}
                    {expandable && !topic.actions?.length ? (
                      (() => {
                        const badge = isOpen
                          ? topic.expandedBadge
                          : topic.collapsedBadge;

                        return badge ? (
                          <span
                            className={`h-fit shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                              badge.className ??
                              "border border-orange-200 bg-orange-50 text-orange-600"
                            }`}
                          >
                            {badge.label}
                          </span>
                        ) : null;
                      })()
                    ) : !topic.actions ? (
                      topic?.button ? (
                        /* ───────────── CREATE BUTTON ───────────── */
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            btnOnClick?.(topic);
                          }}
                          className="create-btn cursor-pointer"
                        >
                          {topic?.button?.icon}
                          {topic?.button?.label}
                        </button>
                      ) : (
                        /* ───────────── COLLAPSED BADGES ───────────── */
                        topic?.collapsedBadge &&
                        topic.collapsedBadge.map(
                          (item: any, index: number) => (
                            <span
                              key={item.id ?? index}
                              onClick={(e) => {
                                if (item.onClick) {
                                  e.stopPropagation();
                                  item.onClick();
                                }
                              }}
                              className={`h-fit shrink-0 rounded px-2 py-1 text-xs font-bold ${
                                item.className ??
                                "bg-color2-l text-color2"
                              } ${item.onClick ? "cursor-pointer select-none transition hover:opacity-80 active:scale-95" : ""}`}
                            >
                              {item.label}
                            </span>
                          )
                        )
                      )
                    ) : null}
                  </div>
                </div>

                {/* ───────────────── EXPANDED ITEMS ───────────────── */}
                {topic.items.length > 0 && expandable && isOpen && (
                  <div className="mx-4 mb-3 rounded-xl border bg-violet-50 p-3">
                    {/* Expanded Section Label */}
                    {expandedSectionLabel && (
                      <div className="text-color2 mb-2 flex items-center gap-1 text-sm font-bold tracking-wide">
                        {expandedSectionLabel}
                      </div>
                    )}

                    <div className="space-y-2">
                      {topic.items?.map((item: any) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-4 rounded-xl px-3 py-3 ${
                            item.highlighted
                              ? "border border-green-200 bg-green-100/50"
                              : "border border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {/* Index Circle */}
                          <span
                            className={`flex h-fit shrink-0 items-center justify-center rounded-full px-2 py-1 text-xs font-bold ${
                              item.highlighted
                                ? "bg-green-700 text-white"
                                : "bg-gray-200"
                            }`}
                          >
                            {item.index}
                          </span>

                          {/* Title + Badge + Description */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-semibold">
                                {item.title}
                              </p>

                              {item.badge && (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                                    item.badge.className ??
                                    "bg-green-500"
                                  }`}
                                >
                                  {item.badge.label}
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-pri text-xs">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex shrink-0 items-center gap-2">
                            {item.actions?.map((action: any) =>
                              action.asTag ? (
                                <span
                                  key={action.key}
                                  className={action.className}
                                >
                                  {action.icon}
                                  {action.label}
                                </span>
                              ) : (
                                <button
                                  key={action.key}
                                  type="button"
                                  className={
                                    action.className ??
                                    "text-pri flex items-center gap-1.5 rounded-full border border-gray-400 px-3 py-1 text-xs font-semibold hover:border-[#000] hover:text-[#000]"
                                  }
                                  onClick={() =>
                                    action.onClick?.(item, topic)
                                  }
                                >
                                  {action.icon}
                                  {action.label}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

        {/* ───────────────── FOOTER ───────────────── */}
        {footerContent && (
          <div className="border-t px-3 py-3">
            <div className="bg-color2-l text-color2 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold">
              {footerContent}
            </div>
          </div>
        )}
      </div>

      {/* ───────────────── MODALS ───────────────── */}
      {renderModals?.()}
    </section>
  );
};

export default AccordiansStyle;