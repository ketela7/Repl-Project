
import { useEffect, useRef } from 'react';

interface UseStaggeredAnimationOptions {
  delay?: number;
  duration?: number;
  threshold?: number;
}

export function useStaggeredAnimation({
  delay = 0.1,
  duration = 0.4,
  threshold = 0.1
}: UseStaggeredAnimationOptions = {}) {
  const elementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const animationDelay = index * delay;
            
            element.style.animationDelay = `${animationDelay}s`;
            element.style.animationDuration = `${duration}s`;
            element.style.animationFillMode = 'forwards';
            element.classList.add('animate-slide-in-up');
            
            observer.unobserve(element);
          }
        });
      },
      { threshold }
    );

    elementsRef.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [delay, duration, threshold]);

  const addElementRef = (element: HTMLElement | null) => {
    if (element && !elementsRef.current.includes(element)) {
      elementsRef.current.push(element);
    }
  };

  return { addElementRef };
}
