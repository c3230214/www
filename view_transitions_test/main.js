// main.js
document.addEventListener('DOMContentLoaded', () => {
  const fadeTargets = document.querySelectorAll('.fade-in');

  // アニメーションを減らしたい設定なら、最初から表示
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    fadeTargets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.15
  });

  fadeTargets.forEach(el => observer.observe(el));
});
