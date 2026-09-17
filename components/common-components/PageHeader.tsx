import React from "react";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionBtn1?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    view?: boolean;
    outline?: boolean;
  };
  actionBtn2?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    outline?: boolean;
  };
  actionBtn3?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    outline?: boolean;
  };
  actionBtn4?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    outline?: boolean;
  };
  editMode?: boolean;
  records?: string;
  record2?: string;
  record3?: string;
  record4?: string;
  subContent1?: string;
  subContent2?: string;
  program?: {
    title?: string;
    value?: string;
    color?: string;
  }[];
  draft?: string
}

const PageHeader = ({
  title,
  subtitle,
  icon,
  actionBtn1,
  records,
  actionBtn2,
  actionBtn3,
  actionBtn4,
  editMode,
  record2,
  record3,
  record4,
  subContent1,
  subContent2,
  program,
  draft
}: PageBannerProps & { records?: string }) => {
  return (
    <div className="panel mb-4 flex items-center gap-4 rounded-xl border border-gray-100 px-5 py-5 lg:justify-between">
      <div className="flex items-center gap-3">
        {icon &&
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ede9fe]">
            {icon}
          </div>
        }
        <div>
          <div className="flex items-center gap-2">
            <p className="section-ti">{title}</p>
            {records && <span className="text-color2 bg-color2-l rounded-full px-2 py-0.5 text-xs font-semibold">
              {records}
            </span>}
            {record2 && (
              <span className=" text-color2 bg-color2-l rounded-full px-2 py-0.5 text-xs font-semibold">
                {record2}
              </span>
            )}
            {record3 && (
              <span className="text-green-dark btn-green-l rounded-full px-2 py-0.5 text-xs font-semibold">
                {record3}
              </span>
            )}
            {/* gray record */}
            {record4 && (
              <span className="text-pri bg-sec-dark rounded-full px-2 py-0.5 text-xs font-semibold">
                {record4}
              </span>
            )}
            {draft && (

              <span className="inline-flex items-center rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#C2410C] dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                {draft}
              </span>
            )}
          </div>
         { subtitle && <p
            className="mt-2 text-xs text-[#000]"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />}
          {(subContent1 || subContent2 || editMode) && (
            <div className="flex items-center gap-2 pt-2">
              {subContent1 && (
                <span
                  className={`h-fit shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                    //  topic?.verified_status === "Approved"
                    "border border-purple-400 bg-purple-50 text-purple-600"
                    //  : "border border-orange-200 bg-orange-50 text-orange-600"
                    }`}
                >
                  {subContent1}
                </span>
              )}
              {subContent2 && (
                <span
                  className={`h-fit shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${"border border-orange-200 bg-orange-50 text-orange-600"}`}
                >
                  {subContent2}
                </span>
              )}
              {editMode && (
                <span
                  className={`h-fit shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                    //  topic?.verified_status === "Approved"
                    "border border-purple-400 bg-purple-50 text-purple-600"
                    //  : "border border-orange-200 bg-orange-50 text-orange-600"
                    }`}
                >
                  {"Edit Mode"}
                </span>
              )}
            </div>
          )}

          {program?.length > 0 && (
            <div className="mt-2 flex gap-3">
              {program.map((item) => (
                <div key={item.title} className="flex gap-1">
                  <span className="text-xs font-semibold text-[#000]">
                    {item.title} :
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: item.color ?? "#000" }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {(actionBtn3 || actionBtn4) && (
        <div className="flex items-center gap-2">
          {actionBtn4 && (
            <button onClick={actionBtn4?.onClick} className={actionBtn4?.outline ? "create-btn-outline" : "create-btn"}>
              {actionBtn4?.icon}
              {actionBtn4?.label}
            </button>
          )}
          {actionBtn3 && (
            <button onClick={actionBtn3?.onClick} className={actionBtn3?.outline ? "create-btn-outline" : "create-btn-sec"}>
              {actionBtn3?.icon}
              {actionBtn3?.label}
            </button>
          )}
        </div>
      )}
      {(actionBtn1 || actionBtn2) && (
        <div className="flex items-center gap-2">
          {actionBtn2 && (
            <button onClick={actionBtn2?.onClick} className={actionBtn2?.outline ? "create-btn-outline" : "create-btn-sec"}>
              {actionBtn2?.icon}
              {actionBtn2?.label}
            </button>
          )}
          {actionBtn1 && (
            <button onClick={actionBtn1?.onClick} className={actionBtn1?.outline ? "create-btn-outline" : actionBtn1?.view ? "create-btn-sec" : "create-btn"}>
              {actionBtn1?.icon}
              {actionBtn1?.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
