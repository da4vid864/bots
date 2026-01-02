import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * VirtualizedList - Lista virtualizada para mejor performance con muchos elementos
 * Solo renderiza los elementos visibles en el viewport
 */
export const VirtualizedList = ({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calcular qué elementos son visibles
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    return {
      start: Math.max(0, start - overscan),
      end
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Elementos visibles
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Altura total del contenido
  const totalHeight = items.length * itemHeight;
  // Offset para posicionar los elementos visibles
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-label={`Lista con ${items.length} elementos`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={actualIndex}
                style={{ height: itemHeight }}
                role="listitem"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

VirtualizedList.propTypes = {
  items: PropTypes.array.isRequired,
  itemHeight: PropTypes.number,
  containerHeight: PropTypes.number,
  renderItem: PropTypes.func.isRequired,
  overscan: PropTypes.number,
  className: PropTypes.string
};

export default VirtualizedList;

