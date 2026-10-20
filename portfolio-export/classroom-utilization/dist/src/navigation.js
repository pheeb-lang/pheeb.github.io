// Keep the selected section, shareable URL and browser history in sync.
export function setupNavigation(document, window, onViewChange) {
  const buttons = [...document.querySelectorAll('#utilization-demo [data-view]')];
  const defaultView = 'utilization';
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
  function navigate(view, {replace = false} = {}) {
    const url = new URL(window.location.href);
    if (url.searchParams.get('view') !== view) {
      url.searchParams.set('view', view);
      window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', url.href);
    }
    show(view);
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
  return {navigate};
}

