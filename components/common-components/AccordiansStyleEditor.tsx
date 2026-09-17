import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export interface MaterialSection {
  heading: string;
  body?: string;
  bullets?: { label: string; text: string }[];
  footer?: string;
}

function sectionsToHtml(sections: MaterialSection[]): string {
  return sections
    .map((s, i) => {
      let html = `<h2>${i + 1}. ${s.heading}</h2>`;
      if (s.body) html += `<p>${s.body}</p>`;
      if (s.bullets?.length) {
        html += `<ul>${s.bullets
          .map((b) => `<li><strong>${b.label}</strong> ${b.text}</li>`)
          .join("")}</ul>`;
      }
      if (s.footer) html += `<p>${s.footer}</p>`;
      return html;
    })
    .join("");
}

const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ align: "" }, { align: "center" }, { align: "right" }],
    [{ list: "bullet" }],
    ["image", "link"],
  ],
};

const QUILL_FORMATS = [
  "bold",
  "italic",
  "underline",
  "align",
  "list",
  "bullet",
  "image",
  "link",
];

const AccordiansStyleEditor = ({
  title,
  topicCountLabel = "Topics",
  sections = [],
  onBack,
  icon,
  isEditing = false,
  editorValue,
  onEditorChange,
  onSave,
  onCancelEdit,
  actionBtn1,
  actionBtn2,
  actionBtn3,
  actionBtn4,
  saveChanges,
  final,
  finalValue
}: {
  title?: string;
  topicCountLabel?: string;
  sections?: MaterialSection[];
  onBack?: () => void;
  icon?: React.ReactNode;
  isEditing?: boolean;
  editorValue?: string;
  onEditorChange?: (val: string) => void;
  onSave?: () => void;
  onCancelEdit?: () => void;
  actionBtn1?: { label: string; icon?: React.ReactNode; onClick: () => void };
  actionBtn2?: { label: string; icon?: React.ReactNode; onClick: () => void };
  actionBtn3?: { label: string; icon?: React.ReactNode; onClick: () => void };
  actionBtn4?: { label: string; icon?: React.ReactNode; onClick: () => void };
  final?: { label: string; icon?: React.ReactNode; onClick: () => void };
  final2?: { label: string; icon?: React.ReactNode; onClick: () => void };
  saveChanges?: boolean;
  finalValue?: boolean;
}) => {
  const defaultHtml = useMemo(() => sectionsToHtml(sections), [sections]);

  return (
    <section className="mb-5" aria-label="accordion section">
      {/* HEADER */}
      <div className="flex items-center justify-between rounded-t-2xl bg-[#111238] px-4 py-3 text-white">

        <div className="flex items-center gap-2">
          {icon && <span className="flex items-center">{icon}</span>}

          <h3 className="text-lg font-bold">{title}</h3>
        </div>

        <span className="rounded bg-white/15 px-4 py-1 text-sm font-semibold">
          {topicCountLabel}
        </span>
      </div>

      {/* <div className="flex items-center justify-between bg-[#111238] px-4 py-3 text-white">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>

            {subtitle && (
              <p className="mt-0.5 text-sm text-white/70">
                {subtitle}
              </p>
            )}
          </div>

          <span className="rounded bg-white/15 px-4 py-1 text-sm font-semibold">
            {count} {topicCountLabel}
          </span>
        </div> */}

      {isEditing ? (
        /* ── EDIT MODE ── */
        <div>
          {/* sub-header */}
          <div className="flex items-center justify-between border border-t-0 border-gray-200 bg-white p-3 px-5 py-2">
            <p className="text-xs text-[#000]">
              Directly edit headings, paragraphs, explanations, examples, and
              exercises.
            </p>
            <p className="text-xs italic text-[#000]">
              Standard Academic Text Format
            </p>
          </div>

          {/* Quill editor */}
          <div className="border border-t-0 border-gray-200 bg-white p-3 [&_.ql-editor]:min-h-[500px] [&_.ql-editor]:p-8 [&_.ql-editor]:text-sm [&_.ql-editor]:leading-relaxed [&_.ql-toolbar_.ql-active_.ql-fill]:fill-[#5C28CA] [&_.ql-toolbar_.ql-active_.ql-stroke]:stroke-[#5C28CA] [&_.ql-toolbar_button.ql-active]:text-[#5C28CA]">
            <ReactQuill
              theme="snow"
              value={editorValue ?? defaultHtml}
              onChange={onEditorChange}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
            />
          </div>

          {/* Edit footer */}

          <div className="mt-4 flex items-center justify-between">
            {saveChanges ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex items-center gap-1.5 text-sm font-semibold text-pri hover:text-[#000]"
              >
                ← Back to Learning Materials
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#000] hover:text-[#000]"
              >
                Cancel
              </button>
            )}
            {saveChanges && (
              <div className="flex items-center gap-2">
                {actionBtn4 && (
                  <button
                    onClick={actionBtn4?.onClick}
                    className="create-btn-sec"
                  >
                    {actionBtn4?.icon}
                    {actionBtn4?.label}
                  </button>
                )}
                {actionBtn3 && (
                  <button onClick={actionBtn3?.onClick} className="create-btn">
                    {actionBtn3?.icon}
                    {actionBtn3?.label}
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onSave}
              className="bg-color2 flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              ✓ Save Changes
            </button>
          </div>
        </div>
      ) : (
        /* ── READ MODE ── */
        <>
          <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="space-y-6">
              {sections.map((section, i) => (
                <div key={i}>
                  <h2 className="mb-2 text-base font-bold text-[#000]">
                    {i + 1}. {section.heading}
                  </h2>
                  {section.body && (
                    <p className="text-sm leading-relaxed text-pri">
                      {section.body}
                    </p>
                  )}
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {section.bullets.map((b, j) => (
                        <li
                          key={j}
                          className="flex gap-1 text-sm text-pri"
                        >
                          <span className="shrink-0">•</span>
                          <span>
                            <span className="font-bold text-[#000]">
                              {b.label}
                            </span>{" "}
                            {b.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.footer && (
                    <p className="mt-3 text-sm leading-relaxed text-pri">
                      {section.footer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Read footer */}
          {!finalValue ?
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#000] hover:text-[#000]"
              >
                ← Back to Learning Materials
              </button>
              <div className="flex items-center gap-2">
                {actionBtn2 && (
                  <button onClick={actionBtn2.onClick} className="create-btn-sec">
                    {actionBtn2.icon}
                    {actionBtn2.label}
                  </button>
                )}
                {actionBtn1 && (
                  <button onClick={actionBtn1.onClick} className="create-btn">
                    {actionBtn1.icon}
                    {actionBtn1.label}
                  </button>
                )}
              </div>
            </div> :

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#000] hover:text-[#000]"
              >
                ← Back to Learning Materials
              </button>
              <div className="flex items-center gap-2">
               
                {final &&
                  <button onClick={final.onClick} className="create-btn">
                    {final.icon}
                    {final.label}
                  </button>
                }
              </div>
            </div>}
        </>
      )}
    </section>
  );
};

export default AccordiansStyleEditor;
