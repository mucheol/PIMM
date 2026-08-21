// v-reveal 디렉티브: 요소가 뷰포트에 15% 이상 들어오면 isRevealed 클래스를 붙여
// CSS 등장 애니메이션(reveal 클래스, base/layout css 참고)을 트리거한다.
// 한 번 나타난 뒤에는 observer를 해제해 스크롤할 때마다 반복 실행되지 않게 한다.
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const reveal = {
  mounted(el) {
    // 모션 최소화 설정이면 애니메이션 없이 바로 보이는 상태로 처리
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
