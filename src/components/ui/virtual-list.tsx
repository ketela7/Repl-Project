/**
 * Virtual scrolling component for large lists
 * Only renders visible items for better performance
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // Number of items to render outside visible area
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, visibleRange]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="w-full"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for virtual scrolling with dynamic heights
export function useVirtualScroll<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  
  // Initialize item heights
  useEffect(() => {
    setItemHeights(new Array(items.length).fill(estimatedItemHeight));
  }, [items.length, estimatedItemHeight]);

  // Calculate cumulative heights for positioning
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    let total = 0;
    for (let i = 0; i < itemHeights.length; i++) {
      total += itemHeights[i] || estimatedItemHeight;
      heights.push(total);
    }
    return heights;
  }, [itemHeights, estimatedItemHeight]);

  // Find visible range with dynamic heights
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    for (let i = 0; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i] <= scrollTop && cumulativeHeights[i + 1] > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    const visibleBottom = scrollTop + containerHeight;
    for (let i = startIndex; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i] >= visibleBottom) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, cumulativeHeights, items.length, overscan]);

  const updateItemHeight = (index: number, height: number) => {
    setItemHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  };

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight: cumulativeHeights[cumulativeHeights.length - 1] || 0,
    getItemOffset: (index: number) => cumulativeHeights[index] || 0,
    updateItemHeight
  };
}