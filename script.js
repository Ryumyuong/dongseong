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

  const VISIBLE = 5;          // 한 번에 보이는 카드 수
  const CENTER_IDX = 2;       // 가운데 카드 인덱스 (0..VISIBLE-1)
  const INTERVAL = 3500;      // 자동 슬라이드 주기(ms)
  const ANIM_MS = 600;        // 슬라이드 애니메이션 시간

  function applyClasses() {
    [...track.children].forEach((c, i) => {
      c.classList.remove('is-center', 'is-edge', 'is-near');
      if (i === CENTER_IDX) c.classList.add('is-center');
      else if (i === 0 || i === VISIBLE - 1) c.classList.add('is-edge');
      else if (i < VISIBLE) c.classList.add('is-near');
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
      void track.offsetHeight; // reflow
      applyClasses();
      isAnimating = false;
    }, ANIM_MS);
  }

  applyClasses();
  let timer = setInterval(slide, INTERVAL);

  // 마우스 올리면 일시 정지
  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', () => { timer = setInterval(slide, INTERVAL); });

  // 리사이즈 시 클래스 재적용 (간격·폭이 바뀔 수 있으므로)
  window.addEventListener('resize', applyClasses);
})();
