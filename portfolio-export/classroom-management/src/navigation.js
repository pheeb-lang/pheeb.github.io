// Keep the selected section, shareable URL and browser history in sync.
export function setupNavigation(document, window, onViewChange) {
  const buttons = [...document.querySelectorAll('[data-view]')];
  const defaultView = 'instructors';
  function show(view) {
    const selected = buttons.some(button => button.dataset.view === view) ? view : defaultView;
    for (const button of buttons) {
      const active = button.dataset.view === selected;
      button.setAttribute('aria-pressed', String(active));
      document.getElementById(button.dataset.view + '-view').hidden = !active;
    }
    onViewChange(selected);
  }
  function restore() {
    show(new URL(window.location.href).searchParams.get('view'));
  }
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const url = new URL(window.location.href);
      if (url.searchParams.get('view') !== button.dataset.view) {
        url.searchParams.set('view', button.dataset.view);
        window.history.pushState(null, '', url.href);
      }
      show(button.dataset.view);
    });
  }
  window.addEventListener('popstate', restore);
  restore();
}
