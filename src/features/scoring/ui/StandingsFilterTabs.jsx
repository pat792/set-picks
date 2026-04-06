import React, { useCallback, useRef } from 'react';

import PageTitle from '../../../shared/ui/PageTitle';

const scrollRibbon =
  'overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const DRAG_THRESHOLD_PX = 4;

/**
 * @param {Object} props
 * @param {string} props.activeFilter — `'global'` or a pool id
 * @param {Array<{ id: string; label: string }>} props.filterOptions
 * @param {(filterId: string) => void} props.onTabChange
 */
export default function StandingsFilterTabs({ activeFilter, filterOptions, onTabChange }) {
  const ribbonRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);

  const finishPointer = useCallback((e) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const el = ribbonRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    const { didDrag } = state;
    dragRef.current = null;
    if (didDrag) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  }, []);

  const onPointerDown = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    const el = ribbonRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      didDrag: false,
    };
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const el = ribbonRef.current;
    if (!el) return;
    const dx = e.clientX - state.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) state.didDrag = true;
    el.scrollLeft = state.startScroll - dx;
  }, []);

  const onClickCapture = useCallback((e) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <div className="mb-4">
      <PageTitle as="h3" variant="eyebrow" className="px-2 mb-2">
        Compare
      </PageTitle>

      <div
        ref={ribbonRef}
        className={`flex cursor-grab gap-1.5 px-1 pb-1 select-none active:cursor-grabbing ${scrollRibbon}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onLostPointerCapture={finishPointer}
        onClickCapture={onClickCapture}
      >
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTabChange(opt.id)}
              className={[
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold tracking-tight transition-colors',
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
