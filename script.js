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

// ============== 광고 유입 경로 캡처 (ref) ==============
// 첫 진입 시 URL의 ?ref= 값을 sessionStorage에 저장 — 이후 폼 전송 시 함께 보냄
(() => {
  try {
    const ref = new URLSearchParams(location.search).get('ref');
    if (ref) {
      sessionStorage.setItem('__tracking', JSON.stringify({
        ref,
        referrer: document.referrer || '',
        capturedAt: new Date().toISOString()
      }));
    }
  } catch (e) { /* noop */ }
})();

// ============== 폼 → Google Apps Script 전송 ==============
// 배포 후 GAS_URL 값에 Web App URL을 채워주세요. (예: https://script.google.com/macros/s/.../exec)
const GAS_URL = '';

(() => {
  const forms = document.querySelectorAll('form[data-gas-form]');
  if (!forms.length) return;

  function getTracking() {
    try {
      const raw = sessionStorage.getItem('__tracking');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  // 연락처 정규화: 01012345678 또는 12345678 모두 010-1234-5678 로 변환
  // 그 외 자릿수/접두사는 null 반환 → 호출부에서 유효성 실패 처리
  function normalizePhone(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    let core;
    if (digits.length === 11 && digits.startsWith('010')) {
      core = digits.slice(3);
    } else if (digits.length === 8) {
      core = digits;
    } else {
      return null;
    }
    return '010-' + core.slice(0, 4) + '-' + core.slice(4);
  }

  function collect(form) {
    const data = { type: form.dataset.gasType || 'unknown' };
    new FormData(form).forEach((v, k) => {
      if (k === 'agree') data[k] = true;
      else data[k] = v;
    });
    const tracking = getTracking();
    data.ref = tracking.ref || '';
    data.referrer = tracking.referrer || document.referrer || '';
    data.submittedAt = new Date().toISOString();
    data.userAgent = navigator.userAgent;
    return data;
  }

  async function send(form) {
    const data = collect(form);

    // 연락처 정규화 + 유효성
    if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
      const normalized = normalizePhone(data.phone);
      if (!normalized) {
        alert('연락처 형식이 올바르지 않습니다.\n예) 01012345678 또는 12345678 형태로 입력해주세요.');
        const phoneInput = form.querySelector('input[name="phone"]');
        if (phoneInput) phoneInput.focus();
        return;
      }
      data.phone = normalized;
      const phoneInput = form.querySelector('input[name="phone"]');
      if (phoneInput) phoneInput.value = normalized;
    }

    if (!GAS_URL) {
      alert('상담 신청이 접수되었습니다. 빠르게 연락드리겠습니다.');
      console.warn('[GAS_URL이 비어 있습니다] — script.js 상단 GAS_URL 상수에 배포한 Apps Script 웹 앱 URL을 채워주세요.');
      form.reset();
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"], [type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '전송 중...'; }
    try {
      // GAS는 application/json preflight를 처리하지 못하므로 text/plain 으로 전송
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      alert('상담 신청이 접수되었습니다. 빠르게 연락드리겠습니다.');
      form.reset();
    } catch (err) {
      console.error(err);
      alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
    }
  }

  forms.forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      send(form);
    });
  });
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
