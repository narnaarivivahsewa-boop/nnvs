"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { ChevronDown, MapPin, Plus, X, Check } from "lucide-react";
import { INDIAN_CITIES } from "@/lib/constants/indian-cities";

export interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options?: readonly string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
  helperText?: string;
  customOptionSubtext?: string;
  error?: boolean;
}

export default function CityCombobox({
  value,
  onChange,
  onBlur,
  options = INDIAN_CITIES,
  placeholder = "Type city, small town, or village name...",
  required = false,
  disabled = false,
  readOnly = false,
  id,
  name,
  className = "",
  inputClassName = "",
  helperText = "Search listed cities or type any small town / village freely",
  customOptionSubtext = "Custom town, village, or regional birthplace supported",
  error = false,
}: CityComboboxProps) {
  const generatedId = useId();
  const inputId = id || `city-combobox-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const trimmedValue = (value || "").trim();

  // Filter curated city suggestions: prioritize starts-with matches, then includes matches
  const filteredCities = useMemo(() => {
    const query = trimmedValue.toLowerCase();
    if (!query) {
      return options.slice(0, 40);
    }

    const startsWith: string[] = [];
    const contains: string[] = [];

    for (const city of options) {
      const lower = city.toLowerCase();
      if (lower.startsWith(query)) {
        startsWith.push(city);
      } else if (lower.includes(query)) {
        contains.push(city);
      }
      if (startsWith.length + contains.length >= 40) break;
    }

    return [...startsWith, ...contains];
  }, [options, trimmedValue]);

  const hasExactMatch = useMemo(() => {
    if (!trimmedValue) return false;
    const q = trimmedValue.toLowerCase();
    return options.some((opt) => {
      const optLower = opt.toLowerCase();
      const cityOnly = optLower.split(",")[0]?.trim();
      return optLower === q || cityOnly === q;
    });
  }, [options, trimmedValue]);

  // Show creatable option whenever user typed something non-empty that isn't an exact match
  const showCustomCreateOption = Boolean(trimmedValue && !hasExactMatch);
  const totalSelectableItems =
    filteredCities.length + (showCustomCreateOption ? 1 : 0);

  // Close on outside mousedown / touchstart
  useEffect(() => {
    function handleOutsidePointer(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleOutsidePointer);
    document.addEventListener("touchstart", handleOutsidePointer);
    return () => {
      document.removeEventListener("mousedown", handleOutsidePointer);
      document.removeEventListener("touchstart", handleOutsidePointer);
    };
  }, []);

  const selectValue = (selected: string) => {
    onChange(selected);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(totalSelectableItems > 0 ? 0 : -1);
      } else if (totalSelectableItems > 0) {
        setHighlightedIndex((prev) =>
          prev < totalSelectableItems - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen && totalSelectableItems > 0) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : totalSelectableItems - 1
        );
      }
    } else if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
        selectValue(filteredCities[highlightedIndex]);
      } else if (
        showCustomCreateOption &&
        highlightedIndex === filteredCities.length
      ) {
        selectValue(trimmedValue);
      } else if (trimmedValue) {
        selectValue(trimmedValue);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          placeholder={placeholder}
          onFocus={() => {
            if (!disabled && !readOnly) {
              setIsOpen(true);
            }
          }}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onBlur={() => {
            onBlur?.();
          }}
          onKeyDown={handleKeyDown}
          style={{ paddingRight: "3.5rem" }}
          className={`w-full outline-none transition-all ${
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500"
              : ""
          } ${inputClassName || "h-12 px-4 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"}`}
        />

        {/* Clear & Toggle Controls */}
        <div className="absolute right-2 flex items-center gap-0.5">
          {value && !disabled && !readOnly && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear city or birthplace"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || readOnly}
            aria-label={isOpen ? "Close city suggestions" : "Open city suggestions"}
            onMouseDown={(e) => {
              e.preventDefault();
              if (disabled || readOnly) return;
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#4A121A] hover:bg-amber-50/70 transition cursor-pointer disabled:opacity-50"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                isOpen ? "rotate-180 text-[#4A121A]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {helperText && (
        <p className="mt-1 text-[11px] text-[#7A5835]/80">{helperText}</p>
      )}

      {/* Creatable Combobox Popover */}
      {isOpen && !disabled && !readOnly && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-[#DACBB4] bg-white shadow-xl z-50 py-1.5"
        >
          {/* Matching Suggestions */}
          {filteredCities.map((city, idx) => {
            const isSelected =
              city.toLowerCase() === trimmedValue.toLowerCase();
            const isHighlighted = highlightedIndex === idx;
            return (
              <button
                key={city}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectValue(city);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-xs sm:text-sm transition cursor-pointer ${
                  isHighlighted
                    ? "bg-[#FAF0DC] text-[#4A121A]"
                    : isSelected
                    ? "bg-amber-50/70 text-[#4A121A] font-semibold"
                    : "text-gray-800 hover:bg-[#FAF7F2]"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-[#C5A059] shrink-0" />
                  <span className="truncate">{city}</span>
                </span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}

          {/* Creatable Custom Town / Village Option */}
          {showCustomCreateOption && (
            <button
              type="button"
              role="option"
              aria-selected={highlightedIndex === filteredCities.length}
              onMouseDown={(e) => {
                e.preventDefault();
                selectValue(trimmedValue);
              }}
              onMouseEnter={() => setHighlightedIndex(filteredCities.length)}
              className={`w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left border-t border-[#F0E6D6] transition cursor-pointer ${
                highlightedIndex === filteredCities.length
                  ? "bg-emerald-50 text-emerald-950"
                  : "bg-[#FAF8F5] text-[#4A121A] hover:bg-emerald-50/70"
              }`}
            >
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#4A121A] truncate">
                  Use &ldquo;{trimmedValue}&rdquo;
                </div>
                <div className="text-[11px] text-[#7A5835]">
                  {customOptionSubtext}
                </div>
              </div>
            </button>
          )}

          {filteredCities.length === 0 && !showCustomCreateOption && (
            <div className="px-3.5 py-3 text-xs text-gray-500 text-center">
              Start typing any city, town, or village name...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
