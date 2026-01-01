import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce a value
 * Delays updating the debounced value until after the specified delay
 * 
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 * 
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} The debounced callback
 */
export function useDebouncedCallback(callback, delay = 300) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

/**
 * Throttle a callback
 * Ensures the callback is only called at most once per specified delay
 * 
 * @param {Function} callback - The callback to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} The throttled callback
 */
export function useThrottledCallback(callback, delay = 300) {
  const lastRan = useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();

    if (now - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = now;
    }
  }, [callback, delay]);
}

/**
 * Throttle a value
 * 
 * @param {*} value - The value to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {*} The throttled value
 */
export function useThrottle(value, delay = 300) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now - lastUpdated.current >= delay) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [value, delay]);

  return throttledValue;
}

/**
 * Track window scroll position
 * 
 * @returns {Object} Scroll position { x, y }
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({ x: window.scrollX, y: window.scrollY });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
}

/**
 * Intersection Observer for lazy loading and visibility detection
 * 
 * @param {Object} options - IntersectionObserver options
 * @returns {Object} { ref, isIntersecting, hasIntersected, entry }
 */
export function useIntersectionObserver(options = {}) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      ([firstEntry]) => {
        setEntry(firstEntry);
        
        if (firstEntry.isIntersecting) {
          setIsIntersecting(true);
          setHasIntersected(true);
          
          if (triggerOnce) {
            observer.disconnect();
          }
        } else {
          setIsIntersecting(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return { ref: elementRef, isIntersecting, hasIntersected, entry };
}

/**
 * Local storage sync hook
 * Provides synchronized state with localStorage
 * 
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if not found in localStorage
 * @returns {Array} [storedValue, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        const valueToStore = initialValue instanceof Function ? initialValue() : initialValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Window size hook
 * 
 * @returns {Object} Window size { width, height }
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Previous value hook
 * Returns the previous value of a state or prop
 * 
 * @param {*} value - The current value
 * @returns {*} The previous value
 */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Component mounted state
 * 
 * @returns {boolean} Whether the component is mounted
 */
export function useIsMounted() {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

/**
 * Callback ref for measuring element dimensions
 * 
 * @returns {Array} [ref, dimensions]
 */
export function useMeasure() {
  const ref = useRef(null);
  const [dimensions, setDimensions] = useState(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { borderBoxSize } = entry;
        
        if (borderBoxSize) {
          const { inlineSize: width, blockSize: height } = borderBoxSize[0];
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, dimensions];
}

/**
 * Online status hook
 * 
 * @returns {boolean} Whether the user is online
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Media query hook
 * 
 * @param {string} query - Media query string
 * @returns {boolean} Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Click outside detection hook
 * 
 * @param {Function} handler - Callback when clicking outside
 * @returns {Object} ref to attach to element
 */
export function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener, { passive: true });
    document.addEventListener('touchstart', listener, { passive: true });

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}

/**
 * Toggle state hook
 * 
 * @param {boolean} initialValue - Initial state
 * @returns {Array} [value, toggle, setValue]
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse, setValue];
}

/**
 * Async state hook for handling async operations
 * 
 * @param {Function} asyncFunction - Async function to execute
 * @param {Array} dependencies - Dependencies that trigger re-execution
 * @returns {Object} { execute, loading, error, data }
 */
export function useAsync(asyncFunction, dependencies = []) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction(...args);
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error }));
      throw error;
    }
  }, dependencies);

  return {
    ...state,
    execute,
  };
}

export default {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  useThrottledCallback,
  useScrollPosition,
  useIntersectionObserver,
  useLocalStorage,
  useWindowSize,
  usePrevious,
  useIsMounted,
  useMeasure,
  useOnlineStatus,
  useMediaQuery,
  useClickOutside,
  useToggle,
  useAsync,
};
