import { useEffect, useRef } from "react";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

interface PhoneInputProps {
  onChange: (e164: string | null) => void;
  placeholder?: string;
}

export function PhoneInput({ onChange, placeholder = "+256700000000" }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const iti = intlTelInput(inputRef.current, {
      initialCountry: "auto",
      geoIpLookup: (callback) => {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => callback(data.country_code ?? "UG"))
          .catch(() => callback("UG"));
      },
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
    });

    itiRef.current = iti;

    const notify = () => {
      if (iti.isValidNumber()) {
        onChange(iti.getNumber());
      } else {
        onChange(null);
      }
    };

    inputRef.current.addEventListener("input", notify);
    inputRef.current.addEventListener("countrychange", notify);

    return () => {
      iti.destroy();
    };
  }, []);

  return (
    <div className="iti-dark-wrapper">
      <input
        ref={inputRef}
        type="tel"
        placeholder={placeholder}
        className="iti-input"
      />
    </div>
  );
}
