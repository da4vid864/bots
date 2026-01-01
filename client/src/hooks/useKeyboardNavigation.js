import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard navigation hook for power users
 * Provides comprehensive keyboard navigation for kanban boards and lists
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether keyboard navigation is enabled
 * @param {Function} options.onNavigateUp - Callback when navigating up
 * @param {Function} options.onNavigateDown - Callback when navigating down
 * @param {Function} options.onNavigateLeft - Callback when navigating left
 * @param {Function} options.onNavigateRight - Callback when navigating right
 * @param {Function} options.onSelect - Callback when selecting an item
 * @param {Function} options.onEscape - Callback when pressing escape
 * @param {Function} options.onOpenDetails - Callback when opening details
 * @param {Object} options.selectors - CSS selectors for navigation
 * @param {string} options.selectors.container - Container selector
 * @param {string} options.selectors.item - Item selector
 * @param {string} options.selectors.column - Column selector
 * @returns {Object} Navigation utilities
 */
export function useKeyboardNavigation(options = {}) {
  const {
    enabled = true,
    onNavigateUp,
    onNavigateDown,
    onNavigateLeft,
    onNavigateRight,
    onSelect,
    onEscape,
    onOpenDetails,
    onHome,
    onEnd,
    onTabNext,
    onTabPrev,
    selectors = {
      container: '.kanban-board',
      item: '.lead-card, [role="option"]',
      column: '.pipeline-column, [role="gridcell"]',
    },
  } = options;

  const containerRef = useRef(null);
  const currentIndexRef = useRef(0);
  const selectedItemsRef = useRef(new Set());

  // Get all focusable items
  const getFocusableItems = useCallback(() => {
    if (!containerRef.current) return [];
    
    const container = containerRef.current.querySelector(selectors.container);
    if (!container) return [];
    
    return Array.from(container.querySelectorAll(selectors.item))
      .filter(item => item.tabIndex !== -1 && !item.hasAttribute('disabled'));
  }, [selectors]);

  // Get columns for horizontal navigation
  const getColumns = useCallback(() => {
    if (!containerRef.current) return [];
    
    const container = containerRef.current.querySelector(selectors.container);
    if (!container) return [];
    
    return Array.from(container.querySelectorAll(selectors.column));
  }, [selectors]);

  // Navigate to specific index
  const navigateTo = useCallback((index) => {
    const items = getFocusableItems();
    if (items.length === 0) return;
    
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const item = items[clampedIndex];
    
    if (item) {
      item.focus();
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      currentIndexRef.current = clampedIndex;
    }
    
    return clampedIndex;
  }, [getFocusableItems]);

  // Navigate to item by ID
  const navigateToItem = useCallback((itemId) => {
    const items = getFocusableItems();
    const index = items.findIndex(item => item.id === itemId || item.dataset.id === itemId);
    if (index !== -1) {
      return navigateTo(index);
    }
  }, [getFocusableItems, navigateTo]);

  // Select item (for multi-select)
  const selectItem = useCallback((index) => {
    const items = getFocusableItems();
    const item = items[index];
    
    if (item) {
      if (selectedItemsRef.current.has(index)) {
        selectedItemsRef.current.delete(index);
        item.removeAttribute('data-selected');
      } else {
        selectedItemsRef.current.add(index);
        item.setAttribute('data-selected', 'true');
      }
    }
    
    return selectedItemsRef.current;
  }, [getFocusableItems]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    const items = getFocusableItems();
    items.forEach(item => {
      item.removeAttribute('data-selected');
    });
    selectedItemsRef.current.clear();
  }, [getFocusableItems]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    const items = getFocusableItems();
    const currentIndex = currentIndexRef.current;
    const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;

    switch (e.key) {
      case 'ArrowDown':
        if (!hasModifier) {
          e.preventDefault();
          navigateTo(currentIndex + 1);
          if (onNavigateDown) onNavigateDown(currentIndex, items[currentIndex + 1]);
        }
        break;

      case 'ArrowUp':
        if (!hasModifier) {
          e.preventDefault();
          navigateTo(currentIndex - 1);
          if (onNavigateUp) onNavigateUp(currentIndex, items[currentIndex - 1]);
        }
        break;

      case 'ArrowRight':
        if (!hasModifier) {
          e.preventDefault();
          if (onNavigateRight) onNavigateRight(currentIndex);
        }
        break;

      case 'ArrowLeft':
        if (!hasModifier) {
          e.preventDefault();
          if (onNavigateLeft) onNavigateLeft(currentIndex);
        }
        break;

      case 'Enter':
        if (!hasModifier) {
          e.preventDefault();
          if (onSelect) onSelect(items[currentIndex], currentIndex);
        }
        break;

      case ' ':
        if (!hasModifier) {
          e.preventDefault();
          if (onSelect) onSelect(items[currentIndex], currentIndex);
        }
        break;

      case 'Escape':
        e.preventDefault();
        clearSelection();
        if (onEscape) onEscape();
        break;

      case 'd':
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
          e.preventDefault();
          if (onOpenDetails) onOpenDetails(items[currentIndex], currentIndex);
        }
        break;

      case 'a':
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
          e.preventDefault();
          items.forEach((item, index) => {
            selectedItemsRef.current.add(index);
            item.setAttribute('data-selected', 'true');
          });
        }
        break;

      case 'Home':
        if (!hasModifier) {
          e.preventDefault();
          navigateTo(0);
          if (onHome) onHome(items[0]);
        }
        break;

      case 'End':
        if (!hasModifier) {
          e.preventDefault();
          navigateTo(items.length - 1);
          if (onEnd) onEnd(items[items.length - 1]);
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (onTabPrev) onTabPrev(currentIndex);
        } else {
          if (onTabNext) onTabNext(currentIndex);
        }
        break;

      case 's':
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
          e.preventDefault();
          selectItem(currentIndex);
        }
        break;

      default:
        if (!hasModifier && e.key >= '1' && e.key <= '9') {
          const index = parseInt(e.key) - 1;
          if (index < items.length) {
            e.preventDefault();
            navigateTo(index);
          }
        }
        break;
    }
  }, [enabled, getFocusableItems, navigateTo, onNavigateUp, onNavigateDown, 
      onNavigateLeft, onNavigateRight, onSelect, onEscape, onOpenDetails, 
      onHome, onEnd, onTabNext, onTabPrev, selectItem, clearSelection]);

  // Handle focus within container
  const handleFocusIn = useCallback((e) => {
    const items = getFocusableItems();
    const index = items.indexOf(e.target);
    if (index !== -1) {
      currentIndexRef.current = index;
    }
  }, [getFocusableItems]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown, { passive: false });
    container.addEventListener('focusin', handleFocusIn, { passive: true });

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusin', handleFocusIn);
    };
  }, [handleKeyDown, handleFocusIn]);

  return {
    ref: containerRef,
    navigateTo,
    navigateToItem,
    selectItem,
    clearSelection,
    getFocusableItems,
    getColumns,
    getSelectedItems: () => selectedItemsRef.current,
    getCurrentIndex: () => currentIndexRef.current,
  };
}

export default useKeyboardNavigation;
