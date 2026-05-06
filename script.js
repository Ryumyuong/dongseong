// FAQ: 한 번에 하나만 열리게
document.querySelectorAll('.faq details').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) {
      document.querySelectorAll('.faq details').forEach((other) => {
        if (other !== d) other.open = false;
      });
    }
  });
});

// 스크롤 시 헤더에 그림자
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
  } else {
    header.style.boxShadow = 'none';
  }
});

// ============== 사례 캐러셀 무한 슬라이드 ==============
(() => {
  const track = document.getElementById('casesTrack');
  if (!track) return;

  const INTERVAL = 3500;
  const ANIM_MS = 600;

  // 화면 폭에 따라 보이는 카드 수 결정
  function getVisibleCount() {
    const w = window.innerWidth;
    if (w <= 560) return 1;
    if (w <= 900) return 3;
    return 5;
  }

  function applyClasses() {
    const visible = getVisibleCount();
    const centerIdx = Math.floor(visible / 2);
    [...track.children].forEach((c, i) => {
      c.classList.remove('is-center', 'is-edge', 'is-near');
      if (i >= visible) return;
      if (i === centerIdx) c.classList.add('is-center');
      else if (visible >= 5 && (i === 0 || i === visible - 1)) c.classList.add('is-edge');
      else c.classList.add('is-near');
    });
  }

  function getStep() {
    const first = track.firstElementChild;
    if (!first) return 0;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0');
    return first.getBoundingClientRect().width + gap;
  }

  let isAnimating = false;
  function slide() {
    if (isAnimating) return;
    isAnimating = true;
    const step = getStep();
    track.style.transition = `transform ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    track.style.transform = `translateX(-${step}px)`;

    setTimeout(() => {
      track.style.transition = 'none';
      track.appendChild(track.firstElementChild);
      track.style.transform = 'translateX(0)';
      void track.offsetHeight;
      applyClasses();
      isAnimating = false;
    }, ANIM_MS);
  }

  applyClasses();
  let timer = setInterval(slide, INTERVAL);

  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', () => { timer = setInterval(slide, INTERVAL); });
  window.addEventListener('resize', applyClasses);
})();
