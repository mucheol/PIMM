const STRENGTH = 12; // deg

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const tilt = {
  mounted(el) {
    if (prefersReducedMotion()) return;

    function onMove(event) {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--tiltX", `${(-py * STRENGTH).toFixed(2)}deg`);
      el.style.setProperty("--tiltY", `${(px * STRENGTH).toFixed(2)}deg`);
    }
    function onLeave() {
      el.style.setProperty("--tiltX", "0deg");
      el.style.setProperty("--tiltY", "0deg");
    }

    el.addEventListener("pointerenter", onMove);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.__tiltCleanup = () => {
      el.removeEventListener("pointerenter", onMove);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  },
  unmounted(el) {
    el.__tiltCleanup?.();
  },
};
