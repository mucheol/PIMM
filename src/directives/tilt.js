// v-tilt 디렉티브: 카드 위에서 마우스 위치에 따라 --tiltX/--tiltY CSS 변수를
// 갱신해 카드가 살짝 3D로 기울어지는 효과(실제 transform은 CSS에서 조합)를 만든다.
const STRENGTH = 12; // deg

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const tilt = {
  mounted(el) {
    if (prefersReducedMotion()) return;

    // 커서 위치를 요소 중심 기준 -0.5~0.5로 정규화해 기울기 각도로 변환
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
    // Vue 디렉티브는 unmounted에서 별도 인자로 리스너 참조를 받지 못하므로
    // 엘리먼트에 정리 함수를 직접 매달아 unmounted에서 호출한다
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
