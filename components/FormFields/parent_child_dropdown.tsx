import React from "react";
import Select, { components } from "react-select";
import { capitalizeFLetter } from "@/utils/function.utils";

export function transformToGroupedOptions(apiData: any[]) {
  return (Array.isArray(apiData) ? apiData : []).filter(Boolean).map((parent) => ({
    label: parent?.name || "Untitled category",
    parentId: parent?.id,
    options: [
      {
        value: `parent_${parent?.id}`,
        label: parent?.name || "Untitled category",
        parentId: parent?.id,
        parentName: parent?.name || "Untitled category",
        childId: null,
        isParent: true,
      },
      ...(Array.isArray(parent?.subcategories) ? parent.subcategories : []).filter(Boolean).map((child: any) => ({
        value: `child_${child?.id}`,
        label: child?.name || "Untitled category",
        parentId: parent?.id,
        parentName: parent?.name || "Untitled category",
        childId: child?.id,
        isParent: false,
      })),
    ],
  }));
}

const MultiValue = (props: any) => {
  const { data } = props;
  if (data.isParent) return null;
  const label = `${data.parentName} > ${data.label}`;
  return (
    <components.MultiValue {...props}>
      <span>{label}</span>
    </components.MultiValue>
  );
};

const Option = (props: any) => {
  const { data, isSelected, selectOption } = props;

  return (
    <div
      onClick={() => !data.isParent && selectOption(data)}
      style={{
        paddingLeft: data.isParent ? "12px" : "28px",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingRight: "12px",
        cursor: data.isParent ? "default" : "pointer",
        backgroundColor: data.isParent ? "#fff" : isSelected ? "#eff6ff" : "#fff",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "14px",
        color: "#111",
      }}
    >
      {!data.isParent && (
        <div style={{
          width: "16px",
          height: "16px",
          minWidth: "16px",
          border: isSelected ? "none" : "2px solid #cbd5e1",
          borderRadius: "4px",
          backgroundColor: isSelected ? "#3b82f6" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}
      {data.isParent ? <strong style={{ fontWeight: 600 }}>{capitalizeFLetter(data.label)}</strong> : <span>{capitalizeFLetter(data.label)}</span>}
    </div>
  );
};

const GroupHeading = () => null;

export default function ParentChildCat(props: any) {
  const {
    placeholder = "Select categories",
    onChange,
    isMulti = true,
    clearable = true,
    title = "",
    disabled = false,
    options = [],
    value,
    error,
    required,
    actionClick,
    action
  } = props;

  const handleChange = (selected: any) => {
    const selectedArr = selected || [];
    let result = [...selectedArr];

    selectedArr.forEach((opt: any) => {
      if (!opt.isParent) {
        const parentAlreadySelected = result.some(
          (o: any) => o.isParent && o.parentId === opt.parentId
        );
        if (!parentAlreadySelected) {
          for (const group of options) {
            const parentOpt = group.options?.find(
              (o: any) => o.isParent && o.parentId === opt.parentId
            );
            if (parentOpt) {
              result = [parentOpt, ...result.filter((o: any) => o.value !== parentOpt.value)];
              break;
            }
          }
        }
      }
    });

    onChange(result);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        {title && (
          <label className="text-[#000]">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {action && (
          <div onClick={actionClick} className="underline block cursor-pointer font-medium text-blue-700">
            {action}
          </div>
        )}
      </div>
      <Select
        components={{ MultiValue, Option, GroupHeading }}
        isDisabled={disabled}
        placeholder={placeholder}
        options={options}
        value={value}
        onChange={handleChange}
        isSearchable={true}
        isMulti={isMulti}
        isClearable={clearable}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        menuPosition="fixed"
        menuShouldBlockScroll
        styles={{
          menu: (base) => ({ ...base, zIndex: 9999 }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          groupHeading: (base) => ({ ...base, fontWeight: "bold", color: "#333" }),
        }}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
