import React, { useEffect, useRef } from 'react';
import './AriaLive.css';

const AriaLive = ({ message, priority = 'polite' }) => {
  const liveRef = useRef(null);

  useEffect(() => {
    if (message && liveRef.current) {
      // Clear and set message to ensure screen readers announce it
      liveRef.current.textContent = '';
      setTimeout(() => {
        if (liveRef.current) {
          liveRef.current.textContent = message;
        }
      }, 10);
    }
  }, [message]);

  return (
    <div
      ref={liveRef}
      aria-live={priority}
      aria-atomic="true"
      className="aria-live-region"
    />
  );
};

// Global AriaLive Container
export const AriaLiveContainer = () => {
  const politeRef = useRef(null);
  const assertiveRef = useRef(null);

  useEffect(() => {
    // Global function to announce messages
    window.announceToScreenReader = (message, priority = 'polite') => {
      const targetRef = priority === 'assertive' ? assertiveRef : politeRef;
      
      if (targetRef.current) {
        // Clear and announce
        targetRef.current.textContent = '';
        setTimeout(() => {
          if (targetRef.current) {
            targetRef.current.textContent = message;
          }
        }, 10);
      }
    };

    return () => {
      delete window.announceToScreenReader;
    };
  }, []);

  return (
    <>
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="aria-live-region"
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="aria-live-region"
      />
    </>
  );
};

export default AriaLive;