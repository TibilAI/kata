import * as pdfjsLib from './vendor/pdfjs/pdf.mjs';

const screen = document.querySelector('[data-kata-reader]');
if (screen) {
  const track = (eventName) => window.KataAnalytics?.track(eventName);
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

  const canvas = screen.querySelector('[data-kata-canvas]');
  const stage = screen.querySelector('[data-kata-stage]');
  const status = screen.querySelector('[data-kata-status]');
  const pageInput = screen.querySelector('[data-kata-page-input]');
  const pageCountLabel = screen.querySelector('[data-kata-page-count]');
  const pageError = screen.querySelector('[data-kata-page-error]');
  const previous = screen.querySelector('[data-kata-previous]');
  const next = screen.querySelector('[data-kata-next]');
  const notesButton = screen.querySelector('[data-kata-notes]');
  const noteDot = screen.querySelector('[data-kata-note-dot]');
  const noteDialog = document.querySelector('[data-kata-note-dialog]');
  const noteInput = noteDialog.querySelector('[data-kata-note-input]');
  const notePage = noteDialog.querySelector('[data-kata-note-page]');
  const noteStatus = noteDialog.querySelector('[data-kata-note-status]');
  const noteClose = noteDialog.querySelector('[data-kata-note-close]');
  const noteClear = noteDialog.querySelector('[data-kata-note-clear]');
  const noteDone = noteDialog.querySelector('[data-kata-note-done]');
  const readerStateKey = 'kata.kataReader.state';
  const readerNotesKey = 'kata.kataReader.notes';
  let documentProxy;
  let currentPage = 1;
  let rendering = false;
  let pendingPage = null;
  let touchStartX = 0;
  let resizeTimer;
  let noteSaveTimer;
  let notes = {};
  let hasRenderedPage = false;
  let ignorePageInputBlur = false;

  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch (_) { return fallback; }
  };
  const noteText = (pageNumber = currentPage) => notes[String(pageNumber)]?.text || '';
  const updateNoteIndicator = () => { noteDot.hidden = !noteText().trim(); };
  const saveNote = (announce = false) => {
    const text = noteInput.value.trim();
    const pageKey = String(currentPage);
    if (text) notes[pageKey] = { text, updatedAt: new Date().toISOString() };
    else delete notes[pageKey];
    localStorage.setItem(readerNotesKey, JSON.stringify(notes));
    if (announce) track('kata_note_saved');
    updateNoteIndicator();
    if (announce) noteStatus.textContent = text ? 'Saved on this device.' : 'Note cleared.';
  };
  const loadNote = () => {
    noteInput.value = noteText();
    notePage.textContent = `Notes for page ${currentPage}`;
    noteStatus.textContent = noteInput.value ? 'Saved on this device.' : '';
    updateNoteIndicator();
  };

  const setControls = () => {
    const pageCount = documentProxy?.numPages || 0;
    previous.disabled = !pageCount || currentPage <= 1;
    next.disabled = !pageCount || currentPage >= pageCount;
    pageInput.disabled = !pageCount;
    pageInput.min = '1';
    pageInput.max = pageCount ? String(pageCount) : '1';
    pageInput.value = pageCount ? String(currentPage) : '';
    pageCountLabel.textContent = pageCount ? String(pageCount) : '—';
  };

  const clearPageError = () => {
    pageInput.removeAttribute('aria-invalid');
    pageError.hidden = true;
    pageError.textContent = '';
  };
  const submitPageInput = () => {
    const raw = pageInput.value.trim();
    const requested = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!documentProxy || !Number.isInteger(requested) || requested < 1 || requested > documentProxy.numPages) {
      pageInput.value = documentProxy ? String(currentPage) : '';
      pageInput.setAttribute('aria-invalid', 'true');
      pageError.textContent = documentProxy ? `Enter a page from 1 to ${documentProxy.numPages}.` : 'The document is still loading.';
      pageError.hidden = false;
      return;
    }
    clearPageError();
    goTo(requested);
  };

  const render = async (pageNumber) => {
    if (!documentProxy) return;
    if (rendering) { pendingPage = pageNumber; return; }
    rendering = true;
    const targetPage = Math.min(Math.max(pageNumber, 1), documentProxy.numPages);
    const pageChanged = hasRenderedPage && currentPage !== targetPage;
    if (pageChanged) {
      window.clearTimeout(noteSaveTimer);
      saveNote();
    }
    currentPage = targetPage;
    setControls();
    status.hidden = false;
    status.textContent = `Loading page ${currentPage}…`;
    try {
      const page = await documentProxy.getPage(currentPage);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(1, stage.clientWidth - 2);
      const cssScale = availableWidth / unscaledViewport.width;
      const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: cssScale * deviceScale });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${Math.ceil(viewport.width / deviceScale)}px`;
      canvas.style.height = `${Math.ceil(viewport.height / deviceScale)}px`;
      await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport }).promise;
      canvas.hidden = false;
      status.textContent = `Page ${currentPage} of ${documentProxy.numPages}`;
      status.hidden = true;
      localStorage.setItem(readerStateKey, JSON.stringify({ lastPage: currentPage, updatedAt: new Date().toISOString() }));
      if (pageChanged) track('kata_page_changed');
      loadNote();
      hasRenderedPage = true;
    } catch (error) {
      status.hidden = false;
      status.textContent = 'This page could not be displayed. Please try again.';
      console.error('KATA PDF page render failed.', error);
    } finally {
      rendering = false;
      setControls();
      if (pendingPage !== null) {
        const nextPage = pendingPage;
        pendingPage = null;
        render(nextPage);
      }
    }
  };

  const goTo = (pageNumber) => render(pageNumber);
  previous.addEventListener('click', () => goTo(currentPage - 1));
  next.addEventListener('click', () => goTo(currentPage + 1));
  pageInput.addEventListener('input', clearPageError);
  pageInput.addEventListener('change', submitPageInput);
  pageInput.addEventListener('blur', () => {
    if (ignorePageInputBlur) { ignorePageInputBlur = false; return; }
    submitPageInput();
  });
  pageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitPageInput();
      ignorePageInputBlur = true;
      pageInput.blur();
    }
  });
  notesButton.addEventListener('click', () => {
    loadNote();
    if (typeof noteDialog.showModal === 'function') noteDialog.showModal();
    else noteDialog.setAttribute('open', '');
    noteInput.focus();
  });
  noteInput.addEventListener('input', () => {
    window.clearTimeout(noteSaveTimer);
    noteStatus.textContent = 'Saving…';
    noteSaveTimer = window.setTimeout(() => saveNote(true), 300);
  });
  noteClear.addEventListener('click', () => { noteInput.value = ''; saveNote(true); });
  const closeNotes = () => { window.clearTimeout(noteSaveTimer); saveNote(); noteDialog.close?.(); noteDialog.removeAttribute('open'); };
  noteClose.addEventListener('click', closeNotes);
  noteDone.addEventListener('click', closeNotes);
  noteDialog.addEventListener('close', () => { window.clearTimeout(noteSaveTimer); saveNote(); });
  stage.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 45) return;
    goTo(currentPage + (distance < 0 ? 1 : -1));
  }, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (!documentProxy || event.altKey || event.ctrlKey || event.metaKey || event.target?.matches?.('input, textarea, select')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(currentPage - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(currentPage + 1); }
  });
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => render(currentPage), 120);
  });

  (async () => {
    try {
      status.textContent = 'Opening your KATA…';
      documentProxy = await pdfjsLib.getDocument('../data/kata.pdf').promise;
      track('kata_pdf_loaded');
      notes = readJson(readerNotesKey, {});
      setControls();
      notesButton.disabled = false;
      const savedPage = Number(readJson(readerStateKey, {}).lastPage);
      await render(Number.isInteger(savedPage) && savedPage >= 1 ? Math.min(savedPage, documentProxy.numPages) : 1);
    } catch (error) {
      previous.disabled = true;
      next.disabled = true;
      status.hidden = false;
      pageInput.disabled = true;
      pageInput.value = '';
      pageCountLabel.textContent = '—';
      status.textContent = 'The KATA PDF is not available yet. Add ui/data/kata.pdf, then reload this page.';
      track('kata_pdf_unavailable');
      console.warn('KATA PDF could not be opened.', error);
    }
  })();
}
