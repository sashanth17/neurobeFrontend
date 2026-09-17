interface KeepFilePromptProps {
  onKeep?: () => void;
  onDiscard?: () => void;
  title?: string;
  subTitle?: string;
  icon?: React.ReactNode;
  actionBtn1?: {
    label?: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  actionBtn2?: {
    label?: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  bg?:string;
  border?:string;
  text?:string;
  label?:string;
}

const KeepFilePrompt = ({
  onKeep,
  onDiscard,
  title,
  subTitle,
  icon,
  actionBtn1,
  actionBtn2,
  bg,border,text,
  label
}: KeepFilePromptProps) => {
  return (
    <div className={`${bg??"bg-color-l"} ${border??"border-gray-300"} bg-color2-l mb-5 flex items-center justify-between rounded-xl border-[1px]  px-6 py-4 dark:border-gray-700`}>
      <div>
        <div className="flex items-center gap-2">
          {icon && <>{icon}</>}
          <p className={`${text??"text-color2 "}  text-sm font-bold dark:text-white `}>
            {title}
          </p>
        </div>

        <p className="mt-0.5 text-sm text-[#000]">{subTitle}</p>
      </div>
      {(actionBtn1 || actionBtn2) && (
        <div className="flex shrink-0 items-center gap-3">
          {actionBtn1 && (
            <button
              onClick={actionBtn1.onClick}
              className="create-btn-sec border border-gray-300 !bg-white"
            >
              {actionBtn1.label}
            </button>
          )}
          {actionBtn2 && (
            <button onClick={actionBtn2.onClick} className="create-btn">
              {actionBtn2.label}
            </button>
          )}
        </div>
      )}
      {label&&
        <p className={`${text??"text-color2 "}  text-sm font-bold dark:text-white text-dark-red`}>
        {label}
      </p>
    }
    </div>
  );
};

export default KeepFilePrompt;
