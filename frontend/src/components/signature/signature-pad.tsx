"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

export type SignaturePadProps = {
  title: string;
  subtitle: string;
  clearLabel: string;
  continueLabel: string;
  requiredError?: string;
  icon?: React.ReactNode;
  onConfirm: (dataUrl: string) => void;
};

export function SignaturePad({
  title,
  subtitle,
  clearLabel,
  continueLabel,
  requiredError,
  icon,
  onConfirm,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const imageData = hasStrokes
      ? canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height)
      : null;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  }, [hasStrokes]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  function getPosFromNative(e: TouchEvent | MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    if ("clientX" in e) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    return { x: 0, y: 0 };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleStart(e: TouchEvent | MouseEvent) {
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      drawingRef.current = true;
      const { x, y } = getPosFromNative(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000";
    }

    function handleMove(e: TouchEvent | MouseEvent) {
      if (!drawingRef.current) return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPosFromNative(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasStrokes(true);
    }

    function handleEnd() {
      drawingRef.current = false;
    }

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd);

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    setSubmitted(false);
  }

  function handleContinue() {
    setSubmitted(true);
    if (!hasStrokes) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onConfirm(canvas.toDataURL("image/png"));
  }

  const showError = submitted && !hasStrokes && requiredError;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {icon && (
          <div className="flex-shrink-0 text-muted-foreground/40">{icon}</div>
        )}
      </div>

      <div
        ref={containerRef}
        className={
          "relative h-[280px] overflow-hidden rounded-2xl border bg-white shadow-sm" +
          (showError ? " border-destructive" : " border-border")
        }
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
        />

        {/* Baseline hint */}
        <div className="pointer-events-none absolute bottom-16 left-8 right-8 h-px bg-black/10" />
      </div>

      {showError && (
        <p className="text-xs text-destructive">{requiredError}</p>
      )}

      {/* Clear button */}
      <button
        type="button"
        onClick={clearCanvas}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/40"
      >
        {clearLabel}
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Continue */}
      <button
        type="button"
        onClick={handleContinue}
        className="w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
      >
        {continueLabel}
      </button>
    </div>
  );
}
