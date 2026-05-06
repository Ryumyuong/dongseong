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
    header.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
  } else {
    header.style.boxShadow = 'none';
  }
});
