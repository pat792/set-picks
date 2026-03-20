import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [prevOffset, setPrevOffset] = useState(0);

  useEffect(() => {
    const toggleScrollDirection = () => {
      let scrollY = window.pageYOffset;
      
      // If we are at the very top, always show the header
      if (scrollY === 0) {
        setScrollDirection('up');
      }
      // Scrolling down (hide header)
      else if (scrollY > prevOffset && scrollY > 50) {
        setScrollDirection('down');
      } 
      // Scrolling up (show header)
      else if (scrollY < prevOffset) {
        setScrollDirection('up');
      }
      
      setPrevOffset(scrollY);
    };

    window.addEventListener('scroll', toggleScrollDirection);
    return () => window.removeEventListener('scroll', toggleScrollDirection);
  }, [prevOffset]);

  return scrollDirection;
}