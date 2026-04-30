// src/components/SongAutocomplete.jsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PHISH_SONGS } from '../data/phishSongs.js';
import { resolveCatalogSongTitle } from '../lib/resolveCatalogSongTitle.js';
import Input from './Input';

export default function SongAutocomplete({
  value,
  onChange,
  placeholder,
  onSongSelected,
  onFocus: onFocusProp,
  onBlur,
  readOnly = false,
  disabled = false,
  /**
   * When true, blur clears non-catalog text and normalizes casing to the catalog `name`.
   * Typing still filters suggestions; only selections / exact catalog matches stick.
   */
  requireCatalogMatch = false,
  /** Song titles (other slots) to omit from suggestions — case-insensitive. */
  excludeTitles = [],
  /** @type {{ name: string, total?: string, gap?: string, last?: string }[] | undefined} */
  songs: songsProp,
}) {
  const songs = songsProp ?? PHISH_SONGS;
  const excludedLower = useMemo(
    () =>
      new Set(
        excludeTitles
          .map((t) => String(t ?? '').trim().toLowerCase())
          .filter(Boolean),
      ),
    [excludeTitles],
  );

  const filterCatalog = useCallback(
    (query) => {
      const q = String(query ?? '').trim().toLowerCase();
      if (!q) return [];
      return songs
        .filter((song) => {
          const name = typeof song === 'string' ? song : song.name;
          const n = String(name ?? '').trim().toLowerCase();
          if (!n || excludedLower.has(n)) return false;
          return n.includes(q);
        })
        .slice(0, 10);
    },
    [songs, excludedLower],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const blurCloseTimeoutRef = useRef(null);

  const clearBlurCloseTimeout = () => {
    if (blurCloseTimeoutRef.current != null) {
      clearTimeout(blurCloseTimeoutRef.current);
      blurCloseTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => clearBlurCloseTimeout();
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange?.(val);

    if (val.length > 0) {
      const matches = filterCatalog(val);
      setFilteredSongs(matches);
      setIsOpen(true);
      setActiveIndex(-1);
    } else {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (songName) => {
    onChange?.(songName);
    onSongSelected?.(songName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeIndex < filteredSongs.length - 1) {
        setActiveIndex((prev) => prev + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredSongs[activeIndex]) {
        const songToSelect = typeof filteredSongs[activeIndex] === 'string' 
          ? filteredSongs[activeIndex] 
          : filteredSongs[activeIndex].name;
        handleSelect(songToSelect);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleFocus = (e) => {
    clearBlurCloseTimeout();
    onFocusProp?.(e);
    if (readOnly || disabled) return;
    const v = String(value ?? '');
    if (v.length > 0) {
      const matches = filterCatalog(v);
      setFilteredSongs(matches);
      setIsOpen(matches.length > 0);
    }
  };

  const handleBlur = (e) => {
    onBlur?.(e);
    // Defer close so a mousedown on a suggestion (onMouseDown + preventDefault) can select
    // before the menu unmounts; Tab/click-away still closes on the next tick.
    clearBlurCloseTimeout();
    const rawValue = e?.target?.value;
    blurCloseTimeoutRef.current = window.setTimeout(() => {
      blurCloseTimeoutRef.current = null;
      setIsOpen(false);
      setActiveIndex(-1);
      if (requireCatalogMatch && !readOnly && !disabled) {
        const raw = String(rawValue ?? '').trim();
        if (!raw) {
          onChange?.('');
          return;
        }
        const canonical = resolveCatalogSongTitle(rawValue, songs);
        if (canonical === null) {
          onChange?.('');
        } else if (canonical !== raw) {
          onChange?.(canonical);
        }
      }
    }, 0);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        ref={inputRef}
        type="text"
        value={String(value ?? '')}
        placeholder={placeholder ?? ''}
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        disabled={disabled}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="bg-[rgb(var(--surface-field)_/_1)] read-only:!opacity-100"
      />
      
      {isOpen && filteredSongs.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto overflow-x-hidden rounded-xl border-2 border-border-subtle bg-[rgb(var(--surface-field)_/_1)] shadow-inset-glass ring-1 ring-border-glass/30"
        >
          {filteredSongs.map((song, index) => {
            const songName = typeof song === 'string' ? song : song.name;
            const songGap = song.gap && song.gap !== '—' ? song.gap : 'N/A';
            const songLast = song.last && song.last !== '—' ? song.last : 'Never';
            const songTotal =
              typeof song !== 'string' && song.total && song.total !== '—'
                ? song.total
                : 'N/A';
            const isKeyboardActive = index === activeIndex;
            return (
              <li 
                key={index}
                role="option"
                aria-selected={isKeyboardActive}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(songName);
                }}
                className={`flex cursor-pointer flex-col gap-1 border-b border-border-muted/50 p-3 transition-colors last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                  isKeyboardActive
                    ? 'bg-[#1e293b] ring-1 ring-inset ring-brand/50'
                    : 'md:hover:bg-[#1e293b]'
                }`}
              >
                <div className="text-base font-bold text-slate-200 whitespace-normal break-words text-left">
                  {songName}
                </div>
                
                {typeof song !== 'string' && (
                  <div className="inline-flex flex-wrap items-baseline justify-start sm:justify-end gap-x-1.5 gap-y-0.5 text-xs sm:text-sm font-medium text-slate-400 tabular-nums text-left sm:text-right">
                    <span className="whitespace-nowrap">
                      <span className="text-slate-500">Total:</span> {songTotal}
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-slate-500">Gap:</span> {songGap}
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-slate-500">Last:</span> {songLast}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}