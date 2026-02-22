"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StackedCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  children?: React.ReactNode; // For overlays that sit on top of the stack area
  showArrows?: boolean;
  showDots?: boolean;
}

export function StackedCarousel({ images, alt, className, children, showArrows = true, showDots = true }: StackedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const currentDragXRef = useRef<number>(0);

  // Configuration
  const CARD_WIDTH_PERCENT = 90; // Active slide width %
  const PEEK_WIDTH_PERCENT = 10; // How much of the next slide to peek
  const SCALE_STEP = 0.05; // Scale difference per stack level
  const TRANSLATE_STEP_PX = 20; // Horizontal offset per stack level (when static)
  const SWIPE_THRESHOLD_PERCENT = 0.25; // Drag 25% to snap
  
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    // Disable transition during drag
  };

  const handleMove = (clientX: number) => {
    if (startXRef.current === null) return;
    const diff = clientX - startXRef.current;
    
    // Limits
    // Dragging left (negative): unlimited (until snap)
    // Dragging right (positive): allowed only if we have a previous slide?
    // User spec: "Dragging right returns to previous image (if allowed)"
    // If activeIndex == 0, resist drag right.
    
    let restrictedDiff = diff;
    if (activeIndex === 0 && diff > 0) {
      restrictedDiff = diff * 0.3; // Resistance
    }
    // If dragging past last image?
    if (activeIndex === images.length - 1 && diff < 0) {
      restrictedDiff = diff * 0.3;
    }

    setDragX(restrictedDiff);
    currentDragXRef.current = restrictedDiff;
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (startXRef.current === null) return;

    const width = containerRef.current?.offsetWidth || 1;
    const threshold = width * SWIPE_THRESHOLD_PERCENT;
    const diff = currentDragXRef.current;

    if (diff < -threshold && activeIndex < images.length - 1) {
      // Next
      setActiveIndex((prev) => prev + 1);
    } else if (diff > threshold && activeIndex > 0) {
      // Previous
      setActiveIndex((prev) => prev - 1);
    }

    // Reset drag
    setDragX(0);
    startXRef.current = null;
    currentDragXRef.current = 0;
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };
  const onMouseUp = () => {
    if (isDragging) handleEnd();
  };
  const onMouseLeave = () => {
    if (isDragging) handleEnd();
  };
  
  // Calculate style for a given index relative to activeIndex
  const getCardStyle = (index: number) => {
    // Relative index
    // i = index. k = activeIndex.
    // Case 1: Active Card (index === activeIndex)
    // Case 2: Next Cards (index > activeIndex) -> Stacked behind
    // Case 3: Previous Cards (index < activeIndex) -> Usually offscreen left, UNLESS we are dragging right (reverting).
    
    // When dragging left (dragX < 0):
    // Active (k) moves left by dragX.
    // Next (k+1) moves left parallax? 
    // Spec: "Next card i+1: Moves slightly left as i is dragged (parallax feel). Scales up slightly toward active size."
    
    const isTransitioning = !isDragging; // Use CSS transition if not dragging
    const offset = index - activeIndex;
    
    // Base styles (Static state where dragX = 0)
    let zIndex = 50 - offset;
    let opacity = 1;
    let transform = "";
    
    // We need to interpolate based on dragX.
    // Normalized drag: progress = dragX / screenWidth.
    // If dragX is -300 and width is 375, progress is -0.8.
    
    const width = containerRef.current?.offsetWidth || 1000; // fallback
    const progress = dragX / width; // -1 to 1 approx

    // Determine layout based on index relative to visual focus
    // We treat the transition as a continuous function between states.
    
    if (index === activeIndex) {
      // The active card.
      // Moves with dragX.
      // Scale? "Active card i: Translates left... Slight scale down may occur (optional)."
      const scale = 1 + (progress < 0 ? progress * 0.05 : 0); // Scale down slightly on left drag
      const x = dragX;
      transform = `translateX(${x}px) scale(${Math.max(scale, 0.9)})`;
      zIndex = 50;
    } else if (index === activeIndex + 1) {
       // The next card.
       // Base state: 
       // x = stackedOffset (e.g. 10% of width or specific px)
       // scale = 1 - SCALE_STEP
       // z = 50 - 1
       
       // Interaction: As progress goes 0 -> -1 (swiping left):
       // x goes from Base -> 0
       // scale goes from Base -> 1
       
       // Base X position (peek offset)
       // Let's stick to pixels for offset.
       const baseX = width * (100 - CARD_WIDTH_PERCENT) / 100 + TRANSLATE_STEP_PX; 
       // or just fixed pixels? "Next slide shows a visible peek (e.g. 12-20%)"
        
       // If card width is 90%, gap is 10%.
       // If we want it to be right behind, maybe just a small visible strip.
       
       const baseScale = 1 - SCALE_STEP; // 0.95
       const visibleOffset = 24; // px visible
       
       // Calculate target state (when it becomes active)
       // It implies it moves to 0 and scale 1.
       
       // Interpolation for dragX < 0 (Coming in)
       if (progress < 0) {
         // fraction 0 to 1
         const p = Math.abs(progress); // 0 to 1
         
         // Move from visibleOffset to 0?
         // Spec: "Moves slightly left as i is dragged (parallax)"
         // It doesn't need to reach 0 strictly until the snap happens.
         // Actually on snap, activeIndex changes.
         
         // Parallax move:
         // Start: visibleOffset
         // End (at p=1): 0 
         
         const currentX = visibleOffset * (1 - p);
         const currentScale = baseScale + (1 - baseScale) * p;
         
         transform = `translateX(${currentX}px) scale(${currentScale})`;
       } else {
         // Dragging right (progress > 0) -> this card is being pushed further back?
         // Or just stays static?
         transform = `translateX(${visibleOffset}px) scale(${baseScale})`;
       }
       zIndex = 49;

    } else if (index > activeIndex + 1) {
       // Cards further back
       const stackIndex = index - activeIndex;
       const visibleOffset = 24; 
       // Offset accumulates?
       // Usually in a stack, they pile up with small offsets.
       const x = visibleOffset + (stackIndex - 1) * 10;
       const s = 1 - stackIndex * SCALE_STEP;
       
       transform = `translateX(${x}px) scale(${s})`;
       zIndex = 50 - stackIndex;
       
       // Hide deep cards
       if (stackIndex > 3) opacity = 0;
    } else if (index === activeIndex - 1) {
       // Previous card (to the left)
       // If progress > 0 (dragging right), it comes back from left.
       // Base: Offscreen Left. (-Width)
       
       const w = containerRef.current?.offsetWidth || 1000;
       
       if (progress > 0) {
          // Dragging right. Bringing prev card back.
          // Start: -w
          // End: 0
          // progress goes 0 -> 1
          const x = -w + (progress * w);
          transform = `translateX(${x}px) scale(1)`;
          zIndex = 51; // High z-index to slide ON TOP of current active? 
          // Spec: "Slide #0 (active) is frontmost".
          // If we go back, the "previous" slide becomes #0. 
          // So it normally slides in on top, or push active right?
          // "Dragging right returns to previous image". 
          // Standard iOS pop: swipes from left on top.
          // Standard Android carousel: slides entire viewport.
          // Our design: "Active card i ... moves left". 
          // Inverse for right drag: Active card i moves right? 
          // If i moves right, it reveals i-1 behind? Or i-1 enters from left?
          // Let's assume i-1 enters from Left (Standard page transition).
          
          zIndex = 51; 
       } else {
         // It's gone.
         transform = `translateX(-120%) scale(1)`;
         opacity = 0;
       }
    } else {
      // index < activeIndex - 1
      opacity = 0;
      transform = `translateX(-120%)`;
    }

    return {
      zIndex,
      opacity,
      transform,
      transition: isTransitioning ? "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s" : "none",
      width: `${CARD_WIDTH_PERCENT}%`,
      left: 0, // Align left
      // Need to center vertically or allow full height
    };
  };

  return (
    <div 
      className={cn("relative h-full w-full overflow-hidden select-none bg-white", className)}
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {images.map((src, index) => {
        const style = getCardStyle(index);
        
        // Optimization: Don't render image if opacity is 0 (unless transition might need it)
        // But keep DOM node for stability
        const isVisible = style.opacity !== 0;

        return (
          <div
            key={index}
            className="absolute top-0 bottom-0 origin-center rounded-xl overflow-hidden shadow-2xl bg-zinc-900"
            style={style}
          >
            {isVisible && (
              <>
                 <Image 
                   src={src} 
                   alt={`${alt} ${index + 1}`} 
                   fill 
                   className="object-cover" 
                   draggable={false}
                   unoptimized
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
              </>
            )}
          </div>
        );
      })}
      
      {/* Overlay Children (passthrough) */}
      <div className="absolute inset-0 pointer-events-none z-[60]">
        {children}
      </div>

      {/* Navigation arrows (Figma: faint semi-transparent chevrons on edges) */}
      {showArrows && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeIndex > 0) setActiveIndex((i) => i - 1);
            }}
            disabled={activeIndex === 0}
            className="absolute left-2 top-1/2 z-[70] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition-opacity hover:bg-white/50 disabled:opacity-0"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeIndex < images.length - 1) setActiveIndex((i) => i + 1);
            }}
            disabled={activeIndex === images.length - 1}
            className="absolute right-2 top-1/2 z-[70] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition-opacity hover:bg-white/50 disabled:opacity-0"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dot indicators (Figma: bottom center, below suite name, white active, grey inactive) */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-14 left-0 right-0 z-[70] flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(i);
              }}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                i === activeIndex ? "bg-white scale-110" : "bg-white/50"
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
