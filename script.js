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

  const INTERVAL = 4500;
  const ANIM_MS = 1000;

  // 화면 폭에 따라 보이는 카드 수 결정
  function getVisibleCount() {
    const w = window.innerWidth;
    if (w <= 600) return 1;
    if (w <= 900) return 3;
    return 5;
  }

  // 모바일(visible=1)에서는 마지막 카드를 앞에 끼워(phantom) 좌측 peek을 만든다.
  // 이때 시각적 center 카드는 DOM index 1 → applyClassesShifted 가 이 base 를 인식해야 함.
  function isShifted() { return track.dataset.shifted === 'true'; }
  function shouldShift() { return getVisibleCount() === 1; }

  function getStep() {
    const first = track.firstElementChild;
    if (!first) return 0;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0');
    return first.getBoundingClientRect().width + gap;
  }
  // 활성(center) 카드를 뷰포트 정중앙에 정렬 — 화면이 트랙보다 좁아도 중앙 유지
  function baseTransform() {
    const first = track.firstElementChild;
    if (!first) return 0;
    const vp = track.parentElement.getBoundingClientRect().width;
    const cardW = first.getBoundingClientRect().width;
    const step = getStep();
    const visible = getVisibleCount();
    const centerIdx = Math.floor(visible / 2) + (isShifted() ? 1 : 0);
    return vp / 2 - cardW / 2 - centerIdx * step;
  }

  function applyClassesShifted(shift) {
    const visible = getVisibleCount();
    const centerIdx = Math.floor(visible / 2);
    const baseShift = isShifted() ? 1 : 0;
    [...track.children].forEach((c, i) => {
      c.classList.remove('is-center', 'is-edge', 'is-near');
      const t = i - shift - baseShift;
      if (t < 0) {
        if (visible >= 5) c.classList.add('is-edge');
        else c.classList.add('is-near');
        return;
      }
      if (t >= visible) return;
      if (t === centerIdx) c.classList.add('is-center');
      else if (visible >= 5 && (t === 0 || t === visible - 1)) c.classList.add('is-edge');
      else c.classList.add('is-near');
    });
  }
  function applyClasses() { applyClassesShifted(0); }

  function ensureShiftMode() {
    const want = shouldShift();
    const has = isShifted();
    if (want && !has) {
      track.insertBefore(track.lastElementChild, track.firstElementChild);
      track.dataset.shifted = 'true';
    } else if (!want && has) {
      track.appendChild(track.firstElementChild);
      track.dataset.shifted = 'false';
    }
    track.style.transition = 'none';
    track.style.transform = `translateX(${baseTransform()}px)`;
    void track.offsetHeight;
    applyClasses();
  }

  let isAnimating = false;
  function slide() {
    if (isAnimating) return;
    isAnimating = true;
    const step = getStep();
    const base = baseTransform();
    applyClassesShifted(1);
    track.style.transition = `transform ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    track.style.transform = `translateX(${base - step}px)`;

    setTimeout(() => {
      track.style.transition = 'none';
      track.appendChild(track.firstElementChild);
      track.style.transform = `translateX(${base}px)`;
      void track.offsetHeight;
      applyClasses();
      isAnimating = false;
    }, ANIM_MS);
  }

  // 역방향(이전 카드) — 맨 끝 카드를 앞으로 가져와 좌측에서 들어오게
  function slidePrev() {
    if (isAnimating) return;
    isAnimating = true;
    const step = getStep();
    const base = baseTransform();
    track.style.transition = 'none';
    track.insertBefore(track.lastElementChild, track.firstElementChild);
    track.style.transform = `translateX(${base - step}px)`;
    void track.offsetHeight;
    applyClasses();
    track.style.transition = `transform ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    track.style.transform = `translateX(${base}px)`;
    setTimeout(() => {
      track.style.transition = 'none';
      applyClasses();
      isAnimating = false;
    }, ANIM_MS);
  }

  ensureShiftMode();
  let timer = setInterval(slide, INTERVAL);

  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', () => { timer = setInterval(slide, INTERVAL); });
  window.addEventListener('resize', ensureShiftMode);

  // 터치 스와이프 — 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전
  let touchX = null, touchY = null;
  track.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    clearInterval(timer);
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) slide();
      else slidePrev();
    }
    clearInterval(timer);
    timer = setInterval(slide, INTERVAL);
  }, { passive: true });

  // 마우스 드래그 (PC) — 왼쪽으로 끌면 다음, 오른쪽으로 끌면 이전
  let dragX = null;
  track.addEventListener('mousedown', (e) => {
    dragX = e.clientX;
    clearInterval(timer);
    e.preventDefault(); // 텍스트/이미지 선택 방지
  });
  window.addEventListener('mouseup', (e) => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    dragX = null;
    if (Math.abs(dx) > 40) {
      if (dx < 0) slide();
      else slidePrev();
    }
    clearInterval(timer);
    timer = setInterval(slide, INTERVAL);
  });
  track.style.cursor = 'grab';
})();

// ============== 이미지 카드 슬라이더 (6번째 섹션) — 무한루프 + 드래그 ==============
(() => {
  const track = document.getElementById('caseSlideTrack');
  const bar   = document.getElementById('caseSlideBar');
  const prevBtn = document.getElementById('caseSlidePrev');
  const nextBtn = document.getElementById('caseSlideNext');
  if (!track || !bar) return;
  const total = track.children.length;
  if (total === 0) return;

  const ANIM_MS = 700;
  const AUTO_MS = 5000;
  let logicalIdx = 0;
  let isAnimating = false;
  let timer = null;

  function step() {
    const first = track.firstElementChild;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0');
    return first.getBoundingClientRect().width + gap;
  }
  function setTransition(ms) {
    track.style.transition = ms
      ? `transform ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`
      : 'none';
  }
  function updateUi() {
    bar.style.width = (100 / total) + '%';
    bar.style.transform = `translateX(${logicalIdx * 100}%)`;
    [...track.children].forEach((el, i) => {
      el.classList.toggle('is-active', i === 0);
    });
  }

  // 다음: 현재 transform → -step 으로 애니메이션 후 firstChild를 끝으로 보내고 transform 0
  function next(fromTransformPx) {
    if (isAnimating) return;
    isAnimating = true;
    const s = step();
    if (typeof fromTransformPx === 'number') {
      setTransition(0);
      track.style.transform = `translateX(${fromTransformPx}px)`;
      void track.offsetHeight;
    }
    setTransition(ANIM_MS);
    track.style.transform = `translateX(${-s}px)`;
    setTimeout(() => {
      setTransition(0);
      track.appendChild(track.firstElementChild);
      track.style.transform = 'translateX(0)';
      void track.offsetHeight;
      logicalIdx = (logicalIdx + 1) % total;
      updateUi();
      isAnimating = false;
    }, ANIM_MS);
  }
  // 이전: lastChild를 앞에 끼우고 transform = -step+delta 에서 0 으로 애니메이션
  function prev(fromTransformPx) {
    if (isAnimating) return;
    isAnimating = true;
    const s = step();
    setTransition(0);
    track.insertBefore(track.lastElementChild, track.firstElementChild);
    const startTx = (typeof fromTransformPx === 'number')
      ? (-s + fromTransformPx)
      : -s;
    track.style.transform = `translateX(${startTx}px)`;
    void track.offsetHeight;
    setTransition(ANIM_MS);
    track.style.transform = 'translateX(0)';
    setTimeout(() => {
      logicalIdx = (logicalIdx - 1 + total) % total;
      updateUi();
      isAnimating = false;
    }, ANIM_MS);
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => next(), AUTO_MS);
  }
  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // 초기화
  updateUi();
  startTimer();

  nextBtn && nextBtn.addEventListener('click', () => { next(); startTimer(); });
  prevBtn && prevBtn.addEventListener('click', () => { prev(); startTimer(); });

  // 호버 일시정지 (드래그 중이 아닐 때만)
  track.addEventListener('mouseenter', () => { if (!dragging) stopTimer(); });
  track.addEventListener('mouseleave', () => { if (!dragging) startTimer(); });

  // ===== 드래그 (마우스 / 터치) =====
  let dragging = false;
  let startX = 0;
  let delta = 0;

  function pointerX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }
  function onDown(e) {
    if (isAnimating) return;
    dragging = true;
    startX = pointerX(e);
    delta = 0;
    setTransition(0);
    stopTimer();
  }
  function onMove(e) {
    if (!dragging) return;
    delta = pointerX(e) - startX;
    track.style.transform = `translateX(${delta}px)`;
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    const s = step();
    const threshold = s * 0.18;
    if (delta < -threshold) {
      next(delta);
    } else if (delta > threshold) {
      prev(delta);
    } else {
      setTransition(ANIM_MS);
      track.style.transform = 'translateX(0)';
    }
    delta = 0;
    startX = 0;
    startTimer();
  }

  track.addEventListener('mousedown', e => { e.preventDefault(); onDown(e); });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  track.addEventListener('touchstart', onDown, { passive: true });
  track.addEventListener('touchmove', onMove, { passive: true });
  track.addEventListener('touchend', onUp);

  // 이미지 ghost drag 방지
  track.querySelectorAll('img').forEach(img => {
    img.draggable = false;
    img.addEventListener('dragstart', e => e.preventDefault());
  });

  // 리사이즈 시 위치 보정
  window.addEventListener('resize', () => {
    if (isAnimating || dragging) return;
    setTransition(0);
    track.style.transform = 'translateX(0)';
  });
})();

// ============== 통계 숫자 카운트업 (stats-band) ==============
(() => {
  const band = document.querySelector('.stats-band');
  if (!band) return;
  const nums = band.querySelectorAll('.big-stat__num');
  if (!nums.length) return;

  const DURATION = 3000;
  const items = [...nums].map(el => {
    const suffixEl = el.querySelector('span');
    const suffix = suffixEl ? suffixEl.outerHTML : '';
    const numText = suffixEl
      ? el.textContent.replace(suffixEl.textContent, '')
      : el.textContent;
    const cleaned = numText.replace(/[^\d.]/g, '');
    const decimals = cleaned.includes('.') ? (cleaned.split('.')[1] || '').length : 0;
    const target = parseFloat(cleaned) || 0;
    return { el, target, suffix, decimals };
  });

  const fmt = (v, decimals) => v.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  // 초기값 0으로 리셋 (스크롤 들어오기 전에 노출되어도 자연스럽게)
  items.forEach(({ el, suffix, decimals }) => { el.innerHTML = fmt(0, decimals) + suffix; });

  function animate() {
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      items.forEach(({ el, target, suffix, decimals }) => {
        const v = target * eased;
        el.innerHTML = fmt(v, decimals) + suffix;
      });
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  let triggered = false;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !triggered) {
        triggered = true;
        animate();
        io.disconnect();
      }
    });
  }, { threshold: 0.3 });
  io.observe(band);
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
const GAS_URL = 'https://script.google.com/macros/s/AKfycbztxNjcvxJlrN6fue-1nRy5t9G5gT3byvmO0ykKi0XLqObA8gwfF4NCPNdISo5YVYh07w/exec';

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
      form.dispatchEvent(new CustomEvent('gas:submitted', { bubbles: true }));
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
      form.dispatchEvent(new CustomEvent('gas:submitted', { bubbles: true }));
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

// ============== 예상 변제 금액 계산 (히어로 폼) v2 — 150 케이스 매핑 ==============
// - 단위: 만원
// - 분기 A: 회생 적합 → 월 변제액 / 36개월 총 변제액 표시
// - 분기 B: 36개월 내 전액 변제 가능 → 회생 외 다른 상담 안내
// - 알고리즘: 최저 30만원 보장 + 최저변제율 15% (감면율 상한 85%)
(() => {
  const forms = document.querySelectorAll('form[data-estimate-form]');
  if (!forms.length) return;

  // 채무 미드포인트 (만원)
  const DEBT_MAP = {
    '1,000만원 미만':       800,
    '1,000만원 ~ 3,000만원': 2000,
    '3,000만원 ~ 5,000만원': 4000,
    '5,000만원 ~ 1억원':     7500,
    '1억원 ~ 3억원':         20000,
    '3억원 이상':            40000
  };
  const INCOME_MAP = {
    '100만원 미만':       80,
    '100만원 ~ 200만원':  150,
    '200만원 ~ 300만원':  250,
    '300만원 ~ 400만원':  350,
    '400만원 이상':       500
  };
  const FAMILY_MAP = {
    '1인':       130,
    '2인':       215,
    '3인':       275,
    '4인':       335,
    '5인 이상':  395
  };

  function calculate(debt, income, livingCost) {
    const incomeMonthly = Math.max(income - livingCost, 30);
    if (incomeMonthly * 36 >= debt) return { branch: 'B' };
    const debtFloorMonthly = Math.ceil(debt * 0.15 / 36);
    const monthlyPayment = Math.max(incomeMonthly, debtFloorMonthly);
    return {
      branch: 'A',
      monthlyPayment,
      totalPayment: monthlyPayment * 36,
      originalDebt: debt
    };
  }

  const fmt = n => n.toLocaleString('ko-KR');

  function renderA(inline, { monthlyPayment, totalPayment, originalDebt }) {
    inline.innerHTML = `
      <div class="estimate-card">
        <div class="estimate-card__split">
          <div class="estimate-card__col">
            <div class="estimate-card__label">예상 월 변제액</div>
            <div class="estimate-card__num estimate-card__num--navy">${fmt(monthlyPayment)}<span>만원</span></div>
          </div>
          <div class="estimate-card__divider"></div>
          <div class="estimate-card__col">
            <div class="estimate-card__label">36개월 총 변제액</div>
            <div class="estimate-card__num estimate-card__num--gold">${fmt(totalPayment)}<span>만원</span></div>
          </div>
        </div>
        <p class="estimate-card__desc">
          원 채무 ${fmt(originalDebt)}만원을 36개월 동안 분할하여 변제합니다
        </p>
        <button type="button" class="estimate-card__cta" data-open-consult>지금 상담 신청 →</button>
        <p class="estimate-card__foot">*예상 금액이며, 정확한 금액은 전문 상담을 통해 확인하세요</p>
      </div>
    `;
  }
  function renderB(inline) {
    inline.innerHTML = `
      <div class="estimate-card estimate-card--alt">
        <div class="estimate-card__alt-head">
          <div class="estimate-card__alt-title">회생보다 더 적합한 방향이 있습니다</div>
          <p class="estimate-card__alt-desc">
            현재 채무 규모 대비 소득이 충분합니다.<br />
            개인회생 외 다른 해결 방안을 안내해드립니다.
          </p>
        </div>
        <button type="button" class="estimate-card__cta" data-open-consult>지금 상담 신청 →</button>
        <p class="estimate-card__foot">*전문 상담을 통해 더 적합한 해결 방향을 안내해드립니다</p>
      </div>
    `;
  }

  forms.forEach(form => {
    const inline = form.querySelector('.estimate-inline');
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const debt = DEBT_MAP[form.totalDebt.value];
      const income = INCOME_MAP[form.monthlyIncome.value];
      const livingCost = FAMILY_MAP[form.dependents.value];
      if (debt == null || income == null || livingCost == null) {
        alert('모든 항목을 선택해주세요.');
        return;
      }
      const r = calculate(debt, income, livingCost);
      if (r.branch === 'B') renderB(inline);
      else renderA(inline, r);
      if (inline) inline.hidden = false;
      if (submitBtn) submitBtn.textContent = '다시 확인하기 →';
    });
  });
})();

// ============== 모바일: 예상 변제 입력 모달 오픈 ==============
(() => {
  const cta = document.querySelector('.hero__mobile-cta');
  const modal = document.getElementById('modal-estimate');
  if (!cta || !modal) return;

  function open() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.is-open')) {
      document.body.classList.remove('modal-open');
    }
  }

  cta.addEventListener('click', e => { e.preventDefault(); open(); });
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();

// ============== 상담 신청 모달 (인라인 결과 → 지금 상담 신청) ==============
(() => {
  const modal = document.getElementById('modal-consult');
  if (!modal) return;
  const consultForm = modal.querySelector('form[data-gas-form]');
  const heroForm = document.querySelector('form[data-estimate-form]');

  function openConsult() {
    if (heroForm && consultForm) {
      const debt = heroForm.totalDebt && heroForm.totalDebt.value;
      const dep = heroForm.dependents && heroForm.dependents.value;
      if (debt && consultForm.totalDebt) consultForm.totalDebt.value = debt;
      if (dep && consultForm.dependents) consultForm.dependents.value = dep;
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function closeConsult() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.is-open')) {
      document.body.classList.remove('modal-open');
    }
  }

  // CTA 는 폼 제출 후 동적으로 렌더링되므로 위임으로 처리
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-open-consult]');
    if (trigger) {
      e.preventDefault();
      openConsult();
    }
  });

  // 백드롭 / X 버튼 닫기
  modal.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeConsult);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeConsult();
  });

  // 전송 성공 시 모달 닫기
  if (consultForm) {
    consultForm.addEventListener('gas:submitted', closeConsult);
  }
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

// ============== 대표사례 탕감률 팝업 (내용 더보기) ==============
(() => {
  const modal = document.getElementById('modal-scase');
  if (!modal) return;
  const triggers = document.querySelectorAll('[data-scase-more]');
  if (!triggers.length) return;

  function setField(key, val) {
    modal.querySelectorAll('[data-sc="' + key + '"]').forEach(el => { el.textContent = val || ''; });
    const row = modal.querySelector('[data-sc-row="' + key + '"]');
    if (row) row.style.display = val ? '' : 'none';
  }
  function open(card) {
    setField('badge', card.dataset.badge || '인가결정완료');
    setField('court', card.dataset.court);
    setField('rate', card.dataset.rate);
    setField('debtor', card.dataset.debtor);
    setField('total', card.dataset.total);
    setField('monthly', card.dataset.monthly);
    setField('type', card.dataset.type);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.is-open')) document.body.classList.remove('modal-open');
  }

  triggers.forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('.scase-card');
    if (card) open(card);
  }));
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();
