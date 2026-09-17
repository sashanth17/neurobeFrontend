import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, country: any) => void;
  title?: string;
  name?: string;
  required?: boolean;
  className?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  country?: string;
  enableSearch?: boolean;
  [key: string]: any;
}

const CustomPhoneInput: React.FC<PhoneInputProps> = (props) => {
  const { 
    value, 
    onChange, 
    title, 
    name, 
    required, 
    className, 
    error, 
    placeholder = "Phone Number",
    disabled = false,
    country = 'in',
    enableSearch = true,
    ...rest 
  } = props;

  return (
    <div className="w-full">
      {title && (
        <label className="block text-sm font-bold text-[#000] mb-1">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="w-full">
        <PhoneInput
          country={country}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          enableSearch={enableSearch}
          inputProps={{
            name: name,
            required: required,
          }}
          containerStyle={{ width: '100%' }}
          inputStyle={{ 
            width: '100%',
            borderRadius: '0.375rem',
            border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
            paddingLeft: '48px',
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
          buttonStyle={{
            border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
            borderRadius: '0.375rem 0 0 0.375rem',
            backgroundColor: '#f9fafb',
          }}
          dropdownStyle={{
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
          }}
          searchStyle={{
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            margin: '4px',
          }}
          {...rest}
        />
        
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomPhoneInput;