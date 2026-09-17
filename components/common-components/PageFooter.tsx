import React from "react";

interface PageBannerProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionBtn1?: {
    label?: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  };
  actionBtn2?: {
    label?: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  };
  records?: string;
  content1?: string;
  content2?: string;
  batch?: boolean;
  status?: { label: string; color?: string };
}

const PageFooter = ({
  title,
  subtitle,
  icon,
  actionBtn1,
  records,
  actionBtn2,
  content1,
  content2,
  batch,
  status,
}: PageBannerProps) => {

  console.log("actionBtn1?.disabled", actionBtn1?.disabled);

  return (
    <div className="panel mb-4 flex items-center gap-4 rounded-xl border border-gray-100 px-5 py-4 lg:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe]">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="section-ti">{title}</p>
            {records && (
              <span className="text-color2 bg-color2-l rounded-full px-2 py-0.5 text-xs font-semibold">
                {records}
              </span>
            )}
          </div>

          <p
            className="mt-0.5 text-xs text-[#000]"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />

          <div className="flex items-center gap-2">
            {/* {batch &&<span
              className={`bg-green-500 inline-flex h-2 w-2 items-center justify-center rounded-full text-[10px] font-bold`}
            >
            </span>}
             <span className = 'font-bold'>{content1}</span>
            {content2 && <span
              className={`bg-gray-600 inline-flex h-1 w-1 items-center justify-center rounded-full text-[10px] font-bold`}
            >
              {" "}
              {""}
            </span>}
            <span className="text-xs text-[#000]">{content2}</span> */}
            {batch && <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />}
            {status && (
              <>
                <span className="text-sm font-semibold text-[#000]">Status:</span>
                <span className="text-sm font-semibold" style={{ color: status.color ?? "#f97316" }}>{status.label}</span>
                <span className="inline-flex h-1 w-1 rounded-full bg-gray-400" />
              </>
            )}
            <span className="font-bold">{content1}</span>
            {content2 && (
              <>
                <span className="inline-flex h-1 w-1 rounded-full bg-gray-600" />
                <span className="text-xs text-[#000]">{content2}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {(actionBtn1 || actionBtn2) && (
        <div className="flex items-center gap-2">
          {actionBtn2 && (
            <button
              onClick={actionBtn2?.onClick}
              className={actionBtn2?.className ?? (actionBtn2?.disabled ? "disabled-create-btn-sec" : "create-btn-sec")}
              disabled={actionBtn2?.disabled}
            >
              {actionBtn2?.icon}
              {actionBtn2?.label}
            </button>
          )}
          {actionBtn1 && (
            <button
              onClick={actionBtn1?.onClick}
              className={actionBtn1?.className ?? (actionBtn1?.disabled ? "disabled-create-btn" : "create-btn")}
              disabled={actionBtn1?.disabled}
            >
              {actionBtn1?.icon}
              {actionBtn1?.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PageFooter;
