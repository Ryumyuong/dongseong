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

// ============== 이미지 카드 슬라이더 (6번째 섹션) ==============
(() => {
  const track = document.getElementById('caseSlideTrack');
  const bar   = document.getElementById('caseSlideBar');
  const prev  = document.getElementById('caseSlidePrev');
  const next  = document.getElementById('caseSlideNext');
  if (!track || !bar) return;

  const slides = [...track.children];
  const total  = slides.length;
  let idx = 0;
  const AUTO_MS = 5000;

  function step() {
    const first = slides[0];
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0');
    return first.getBoundingClientRect().width + gap;
  }

  function update() {
    track.style.transform = `translateX(-${idx * step()}px)`;
    bar.style.width = (100 / total) + '%';
    bar.style.transform = `translateX(${idx * 100}%)`;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === idx);
    });
  }

  function go(n) {
    idx = (n + total) % total;
    update();
  }

  next && next.addEventListener('click', () => { go(idx + 1); reset(); });
  prev && prev.addEventListener('click', () => { go(idx - 1); reset(); });

  let timer = setInterval(() => go(idx + 1), AUTO_MS);
  function reset() {
    clearInterval(timer);
    timer = setInterval(() => go(idx + 1), AUTO_MS);
  }

  // 호버 시 일시정지
  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', () => { timer = setInterval(() => go(idx + 1), AUTO_MS); });

  // 리사이즈 시 위치 보정
  window.addEventListener('resize', update);

  update();
})();

// ============== 정책 모달 (개인정보처리방침 / 이용약관) ==============
(() => {
  const triggers = document.querySelectorAll('[data-modal]');
  if (!triggers.length) return;

  function open(id) {
    const modal = document.getElementById('modal-' + id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function close(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.is-open')) {
      document.body.classList.remove('modal-open');
    }
  }

  triggers.forEach(t => t.addEventListener('click', e => {
    e.preventDefault();
    open(t.dataset.modal);
  }));

  document.querySelectorAll('.modal').forEach(modal => {
    modal.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => close(modal));
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.is-open').forEach(close);
    }
  });
})();
