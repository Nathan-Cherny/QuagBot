import { useEffect, useState } from 'react';

// Presentation only: saved messages and API context always contain the full text.
function WelcomeText({ text }) {
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const started = performance.now();
    const timer = setInterval(() => {
      const progress = Math.min((performance.now() - started) / 2200, 1);
      setVisibleLength(Math.ceil(text.length * progress));
      if (progress === 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="hidden motion-reduce:inline">{text}</span>
      <span aria-hidden="true" className="motion-reduce:hidden">
        {text.slice(0, visibleLength)}
        {visibleLength < text.length && <span className="ml-space-1 inline-block size-[7px] rounded-full bg-text-muted" />}
      </span>
    </span>
  );
}

export default WelcomeText;
