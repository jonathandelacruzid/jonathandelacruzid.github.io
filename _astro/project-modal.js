// Project modal — opens from any [data-project-modal] trigger on a case page: the
// "Open the experience" button, or an item in a media library (.media-item). A YouTube,
// Vimeo, Loom, Arcade or Google Docs/Drive link is converted to its embed URL and shown
// inline — nothing navigates away or opens a new tab.
//
// Each trigger names its own media with data-video="<link>"; visitors can't enter links.
// A same-site .mp4/.webm path (data-video="/video/clip.mp4") plays in a <video> element;
// add data-poster="<image>" for its still frame.
// Media-library items title the modal from their own .media-title and autoplay on open.

const YT_ID = /^[\w-]{11}$/;
const LOCAL_VIDEO = /^\/[\w\/.-]+\.(?:mp4|webm)$/i;   // same-site files only
const LOCAL_DOC = /^\/[\w\/.-]+\.html$/i;           // same-site pages, shown as documents
const LOCAL_COURSE = /^\/courses\/[\w\/.-]+\.html$/i; // published eLearning: widescreen, not a document

// Only recognised hosts with validated IDs ever become an iframe src.
function toEmbed(raw, { autoplay = true } = {}) {
  let text = (raw || '').trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;
  let url;
  try { url = new URL(text); } catch { return null; }
  const host = url.hostname.replace(/^(www|m)\./, '');
  const ap = autoplay ? 1 : 0;

  if (host === 'youtube.com' || host === 'youtu.be') {
    const id = host === 'youtu.be'
      ? url.pathname.split('/')[1]
      : url.searchParams.get('v') || (url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/) || [])[1];
    if (id && YT_ID.test(id)) return `https://www.youtube.com/embed/${id}?autoplay=${ap}&rel=0`;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([\da-f]+))?\/?$/i);
    if (m) {
      const hash = m[2] || url.searchParams.get('h');           // unlisted videos carry a hash
      const h = hash && /^[\da-f]+$/i.test(hash) ? `h=${hash}&` : '';
      return `https://player.vimeo.com/video/${m[1]}?${h}autoplay=${ap}`;
    }
  }
  if (host === 'loom.com') {
    const m = url.pathname.match(/^\/(?:share|embed)\/(?:[\w-]*-)?([\da-f]{32})/i);
    if (m) return `https://www.loom.com/embed/${m[1]}?autoplay=${ap}`;
  }
  if (host === 'demo.arcade.software' || host === 'app.arcade.software') {
    const m = url.pathname.match(/^\/(?:share\/)?([A-Za-z0-9]{10,40})\/?$/);
    // embed_mobile=inline keeps phones in the page too (Arcade's default opens a new tab)
    if (m) return `https://demo.arcade.software/${m[1]}?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=false`;
  }
  if (host === 'docs.google.com' || host === 'drive.google.com') {
    // Docs, Slides, Sheets and uploaded Office files all render through Drive's previewer
    const m = url.pathname.match(/^\/(?:document|presentation|spreadsheets|file)\/d\/([\w-]{20,})/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }
  return null;
}

const ICON_CLOSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const dialog = document.createElement('dialog');
dialog.className = 'pm';
dialog.setAttribute('aria-labelledby', 'pm-title');
dialog.innerHTML = `
  <div class="pm-card">
    <div class="pm-header">
      <button type="button" class="pm-close" aria-label="Close">${ICON_CLOSE}</button>
      <div class="pm-avatar" aria-hidden="true"><span class="pm-initial"></span></div>
    </div>
    <div class="pm-body">
      <h2 class="pm-title" id="pm-title"></h2>
      <p class="pm-category"></p>
      <p class="pm-desc"></p>
      <p class="pm-empty" hidden>This experience isn’t available right now.</p>
      <div class="pm-player" hidden>
        <div class="pm-frame"></div>
        <div class="pm-source" hidden>
          <p class="pm-source-line"><span class="pm-source-lead">Trouble viewing it here? </span><a class="pm-source-link" target="_blank" rel="noopener">Open the document directly ↗</a></p>
          <p class="pm-note" hidden></p>
        </div>
      </div>
    </div>
  </div>`;
document.body.append(dialog);

const $ = (sel) => dialog.querySelector(sel);
const els = {
  close: $('.pm-close'), initial: $('.pm-initial'), title: $('.pm-title'),
  category: $('.pm-category'), desc: $('.pm-desc'), empty: $('.pm-empty'),
  player: $('.pm-player'), frame: $('.pm-frame'),
  source: $('.pm-source'), sourceLink: $('.pm-source-link'), note: $('.pm-note'),
  sourceLead: $('.pm-source-lead'), sourceLine: $('.pm-source-line'),
};

let current = null;
let lastTrigger = null;

// Pull title / category / description from the page, so content lives in one place.
function readProject(trigger) {
  const slot = (document.body.className.match(/\bcase-(\d+)\b/) || [])[1];
  const item = trigger.closest('.media-item');
  if (item) {
    return {
      slot,
      title: item.querySelector('.media-title')?.textContent.trim() || 'Video',
      category: item.closest('[data-category]')?.dataset.category ?? '',
      desc: '',
    };
  }
  return {
    slot,
    titleEl: document.querySelector('.case-hero h1'),
    category: document.querySelector('.project-status')?.textContent.trim() ?? '',
    desc: document.querySelector('.case-deck')?.textContent.trim() ?? '',
  };
}

// Direct link for documents, in case the embedded preview won't load. Only a Google
// Docs/Drive address is used as-is; anything else falls back to Drive's own viewer.
function docHref(raw, src) {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (/^(docs|drive)\.google\.com$/.test(u.hostname)) return u.href;
  } catch { /* fall through */ }
  return src.replace(/\/preview$/, '/view');
}

// A trigger without a playable link shows a short message instead of a player.
function showEmpty() {
  els.frame.replaceChildren();
  els.source.hidden = true;
  dialog.classList.remove('pm--wide', 'pm--doc');
  els.player.hidden = true;
  els.empty.hidden = false;
}

function showPlayer(src) {
  const local = LOCAL_VIDEO.test(src);
  const course = LOCAL_COURSE.test(src);
  const doc = src.startsWith('https://drive.google.com/file/') || (LOCAL_DOC.test(src) && !course);
  let media;
  if (local) {
    media = document.createElement('video');
    media.src = src;
    media.controls = true;
    media.playsInline = true;
    media.preload = 'metadata';
    media.autoplay = current.autoplay;
    if (current.poster) media.poster = current.poster;
    media.setAttribute('aria-label', `Video — ${current.label}`);
  } else {
    media = document.createElement('iframe');
    media.src = src;
    media.title = `${doc ? 'Document' : course ? 'Course' : 'Video'} — ${current.label}`;
    media.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write';
    media.allowFullscreen = true;
    media.referrerPolicy = 'strict-origin-when-cross-origin';
  }
  els.frame.replaceChildren(media);
  // The fallback link is only for documents hosted elsewhere (an http(s) source); a
  // same-site document has nothing to fall back to. A note (data-note) can accompany any media.
  const external = doc && /^https?:\/\//i.test(current.source);
  els.source.hidden = !(external || current.note);
  els.sourceLine.hidden = !external;
  els.note.textContent = current.note;
  els.note.hidden = !current.note;
  if (external) {
    els.sourceLink.href = docHref(current.source, src);
    els.sourceLead.hidden = Boolean(current.sourceLabel);
    els.sourceLink.textContent = current.sourceLabel || 'Open the document directly ↗';
  }
  // Interactive demos and screen recordings show UI detail — widen the modal for them.
  // Documents get their own taller, scrollable frame.
  dialog.classList.toggle('pm--wide', local || course || src.startsWith('https://demo.arcade.software/'));
  dialog.classList.toggle('pm--doc', doc);
  els.empty.hidden = true;
  els.player.hidden = false;
}

// CSS caps the frame by viewport height with a fixed allowance for the rest of the modal.
// A long title or description can still push past that, so trim the frame by any overflow.
function fitFrame() {
  const frame = els.frame;
  frame.style.width = '';
  frame.style.height = '';
  if (!dialog.open || els.player.hidden) return;
  const over = dialog.scrollHeight - dialog.clientHeight;
  if (over <= 0) return;
  const h = frame.getBoundingClientRect().height - over;
  if (dialog.classList.contains('pm--doc')) frame.style.height = `${Math.max(h, 288)}px`;
  else frame.style.width = `${(Math.max(h, 162) * 16) / 9}px`;   // height follows the 16:9 ratio
}

function open(trigger) {
  const p = readProject(trigger);
  let title = p.titleEl?.cloneNode(true);
  if (!title) { title = document.createElement('span'); title.textContent = p.title || 'Project'; }
  title.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  const label = title.textContent.replace(/\s+/g, ' ').trim();

  const autoplay = Boolean(trigger.closest('.media-item'));
  current = { slot: p.slot, label, autoplay, poster: trigger.dataset.poster || '' };
  dialog.dataset.slot = p.slot || '01';
  els.initial.textContent = label.charAt(0).toUpperCase();
  els.title.replaceChildren(...title.childNodes);
  els.category.textContent = p.category;
  els.category.hidden = !p.category;
  els.desc.textContent = p.desc;
  els.desc.hidden = !p.desc;

  // Picking a media-library item is a request to play, so that autoplays.
  const link = trigger.dataset.video || '';
  // data-source points the fallback link somewhere else (e.g. the original file);
  // data-source-label replaces the default "Trouble viewing it here?" wording.
  current.source = trigger.dataset.source || link;
  current.sourceLabel = trigger.dataset.sourceLabel || '';
  current.note = trigger.dataset.note || '';   // optional disclaimer shown under the media
  const local = LOCAL_VIDEO.test(link) || LOCAL_DOC.test(link);
  const src = link && (local ? link : toEmbed(link, { autoplay }));
  if (src) showPlayer(src); else showEmpty();

  lastTrigger = trigger;
  document.documentElement.classList.add('pm-open');
  dialog.showModal();
  fitFrame();
  els.close.focus();
}

window.addEventListener('resize', fitFrame);

els.close.addEventListener('click', () => dialog.close());

// Close on a backdrop click — but not when a text selection drag ends outside the card.
let pressedBackdrop = false;
dialog.addEventListener('pointerdown', (e) => { pressedBackdrop = e.target === dialog; });
dialog.addEventListener('click', (e) => { if (pressedBackdrop && e.target === dialog) dialog.close(); });

dialog.addEventListener('close', () => {
  els.frame.replaceChildren();   // unloading the iframe stops playback
  document.documentElement.classList.remove('pm-open');
  lastTrigger?.focus();
});

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-project-modal]');
  if (!trigger) return;
  e.preventDefault();
  open(trigger);
});
