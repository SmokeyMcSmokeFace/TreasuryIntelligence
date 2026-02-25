"use client";

import { useRef, useState, useEffect, useCallback, ReactNode } from "react";

const MIN_WIDTH = 200;
const DEFAULT_LEFT = 300;
const DEFAULT_RIGHT = 300;

interface Props {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

function Divider({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="relative shrink-0 w-4 flex items-center justify-center cursor-col-resize group z-10"
      title="Drag to resize"
    >
      {/* Visual line */}
      <div className="w-px h-full bg-slate-800 group-hover:bg-gold-500/50 transition-colors duration-150" />
      {/* Drag grip dots */}
      <div className="absolute flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-gold-500/60" />
        ))}
      </div>
    </div>
  );
}

export function ResizableColumns({ left, center, right }: Props) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT);
  const dragging = useRef<"left" | "right" | null>(null);
  const lastX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;

      const containerWidth = containerRef.current?.offsetWidth ?? 1200;
      const maxSide = Math.floor(containerWidth * 0.4); // cap at 40% of container

      if (dragging.current === "left") {
        setLeftWidth((w) => Math.max(MIN_WIDTH, Math.min(maxSide, w + delta)));
      } else {
        setRightWidth((w) => Math.max(MIN_WIDTH, Math.min(maxSide, w - delta)));
      }
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startDrag = useCallback(
    (side: "left" | "right") => (e: React.MouseEvent) => {
      dragging.current = side;
      lastX.current = e.clientX;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    },
    []
  );

  return (
    <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left column */}
      <div
        style={{ width: leftWidth, minWidth: MIN_WIDTH }}
        className="shrink-0 flex flex-col gap-4 overflow-y-auto p-4"
      >
        {left}
      </div>

      <Divider onMouseDown={startDrag("left")} />

      {/* Center column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-4">
        {center}
      </div>

      <Divider onMouseDown={startDrag("right")} />

      {/* Right column */}
      <div
        style={{ width: rightWidth, minWidth: MIN_WIDTH }}
        className="shrink-0 flex flex-col p-4"
      >
        {right}
      </div>
    </div>
  );
}
