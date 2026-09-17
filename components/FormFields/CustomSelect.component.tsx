import React, { useCallback, useRef } from "react";
import Select from "react-select";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  options: Option[];
  value: Option | null;
  onChange: (selectedOption: Option | null) => void;
  placeholder?: string;
  title?: string;
  isSearchable?: boolean;
  className?: string;
  error?: string;
  isMulti?: boolean;
  required?: boolean;
  loadMore?: any;
  borderRadius?: number;
  menuOpen?: any;
  disabled?: boolean;
  isClearable?: boolean;
  leftIcon?: React.ReactNode;
  loading?:boolean
  onSearch?:any
  menuPortalTarget?: HTMLElement | null;
  position?: "top" | "bottom" 
}

const CustomSelect = (props: SelectProps) => {
  const {
    borderRadius,
    disabled,
    options,
    value,
    onChange,
    placeholder = "Select...",
    title,
    isSearchable = true,
    className,
    error,
    isMulti,
    required,
    loadMore,
    menuOpen,
    isClearable,
    leftIcon,
    loading,
    onSearch,
    position
  } = props;

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(searchValue);
      }
    }, 500);
  }, [onSearch]);

  const isFilterInput = className?.includes("filter-input");
  const focusColor = isFilterInput ? "#7c3aed" : "#7c3aed";

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: error ? "red" : state.isFocused ? focusColor : "#d1d5db",
      boxShadow: error ? "0 0 0 0.9px red" : state.isFocused ? `0 0 0 0px ${focusColor}` : "none",
      "&:hover": {
        borderColor: error ? "red" : state.isFocused ? focusColor : "#d1d5db",
      },
      borderRadius: borderRadius ? borderRadius : "6px",
      paddingLeft: leftIcon ? "40px" : "12px",
      minHeight: "38px",
      
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      paddingLeft: "0px",
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 99999 }),
    menu: (base: any) => ({ ...base, zIndex: 99999 }),
    menuList: (base: any) => ({
      ...base,
      maxHeight: 160, 
      paddingTop: 0,
      paddingBottom: 0,
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: "14px",
      padding: "8px 12px",
      minHeight: "36px",
      cursor: "pointer",
      backgroundColor: state.isSelected
        ? "#d8c7fc"
        : state.isFocused
        ? "#f5f3ff"
        : "transparent",
      color: state.isSelected ? "#000" : "#000",
      fontWeight: state.isSelected ? "600" : "400",
      "&:active": {
        backgroundColor: "#ECE3FC",
      },
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      padding: "4px 8px",
    }),
    clearIndicator: (base: any) => ({
      ...base,
      padding: "4px 8px",
    }),
    placeholder: (base: any) => ({
      ...base,
      fontSize: "14px",
      fontWeight:"600",
      color:"#6b7280"
    }),
    singleValue: (base: any) => ({
      ...base,
      fontSize: "14px",
      fontWeight:"600",

    }),
  };

  const CustomDropdownIndicator = (props: any) => {
    return (
      <div {...props.innerProps} className="px-2">
        <ChevronDown className="h-4 w-4 text-[#000]" />
      </div>
    );
  };

  return (
    <div className={` ${className ||'w-full'}`}>
      {title && (
        <label className="block text-sm font-bold text-[#000] mb-1">
          

          {title} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <Select
          isDisabled={disabled}
          placeholder={placeholder}
          options={options}
          value={value}
          onChange={onChange}
          isLoading={loading}
          isSearchable={isSearchable}
          isMulti={isMulti}
          isClearable={isClearable !== undefined ? isClearable : true}
          styles={customStyles}
          onMenuOpen={() => menuOpen && menuOpen(true)}
          onMenuClose={() => menuOpen && menuOpen(false)}
          onInputChange={(inputValue) => {
            if (inputValue !== null && inputValue !== undefined) {
              const searchValue = String(inputValue);
              debouncedSearch(searchValue);
            }
          }}
          components={{
            DropdownIndicator: CustomDropdownIndicator,
          }}
          classNamePrefix="react-select"
          onMenuScrollToBottom={loadMore}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
           menuPlacement={position??"bottom"}
        menuPosition="fixed"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default CustomSelect;