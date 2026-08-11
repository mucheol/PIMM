const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const reveal = {
  mounted(el) {
    if (prefersReducedMotion()) {
      el.classList.add("isRevealed");
      return;
    }
    el.classList.add("reveal");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("isRevealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
  },
};
