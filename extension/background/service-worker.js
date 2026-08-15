/**
 * BUGTRACK background service worker.
 * Orchestrates screenshot capture, opens the annotator, exposes the
 * report-bundle API to the popup, and keeps the action badge in sync.
 */
const API_BASE = (chrome.runtime.getManifest().version_name || '').startsWith('prod')
  ? 'http://localhost:8787'
  : 'http://localhost:8787';
const SCREENSHOT_KEY = 'bt_pending_screenshot';

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function buildEnvInfo(win) {
  const ua = (win && win.navigator && win.navigator.userAgent) || '';
  return {
    browserName: /Edg\//.test(ua)
      ? 'Microsoft Edge'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Unknown',
    userAgent: ua,
    platform: (win && win.navigator && win.navigator.platform) || 'unknown',
    language: (win && win.navigator && win.navigator.language) || 'unknown',
    screenResolution: win ? `${win.screen.width}x${win.screen.height}` : 'unknown',
    viewport: win ? `${win.innerWidth}x${win.innerHeight}` : 'unknown',
    devicePixelRatio: win ? win.devicePixelRatio : 1,
  };
}

async function captureScreenshot() {
  const tab = await currentTab();
  if (!tab || !tab.id) throw new Error('No active tab');
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'jpeg',
      quality: 85,
    });
    return { dataUrl, tabId: tab.id, url: tab.url, title: tab.title };
  } catch (err) {
    if (/cannot be captured/.test(String(err))) {
      throw new Error('This page cannot be captured (restricted Chrome URL).');
    }
    throw err;
  }
}

async function sendTabMessage(tabId, message) {
  try {
    const resp = await chrome.tabs.sendMessage(tabId, message);
    return resp || {};
  } catch (_) {
    return {};
  }
}

/* ---------- message API ---------- */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message && message.type) {
      case 'BT_COLLECT': {
        const tab = await currentTab();
        const pageMeta = await sendTabMessage(tab && tab.id, { type: 'BT_GET_META' });
        const diag = (await chrome.storage.session.get('bt_diag'))['bt_diag'] || {};
        const win = await chrome.windows.getCurrent();
        const report = {
          tab: {
            id: tab && tab.id,
            url: tab ? tab.url : '',
            title: tab ? tab.title : '',
            favIconUrl: (tab && tab.favIconUrl) || null,
          },
          env: buildEnvInfo(win),
          page: pageMeta.page || {},
          diagnostics: {
            errors: diag.errors || [],
            network: diag.network || [],
            warnings: diag.warnings || [],
            mixed: diag.mixed || [],
          },
        };
        sendResponse({ ok: true, report });
        break;
      }

      case 'BT_REFRESH_DIAG': {
        const tab = await currentTab();
        await sendTabMessage(tab && tab.id, { type: 'BT_REFRESH_DIAG' });
        sendResponse({ ok: true });
        break;
      }

      case 'BT_GET_META': {
        const tab = await currentTab();
        const meta = await sendTabMessage(tab && tab.id, { type: 'BT_GET_META' });
        sendResponse({ ok: true, meta: meta.page || {} });
        break;
      }

      case 'BT_GET_HEADERS': {
        const tab = await currentTab();
        const stored = (await chrome.storage.session.get('bt_headers'))['bt_headers'] || null;
        if (stored && tab && stored.url && tab.url) {
          try {
            if (new URL(stored.url).hostname === new URL(tab.url).hostname) {
              sendResponse({ ok: true, headers: stored });
              break;
            }
          } catch (_) {
            /* fall through */
          }
        }
        sendResponse({ ok: true, headers: null });
        break;
      }

      case 'BT_CAPTURE': {
        const shot = await captureScreenshot();
        await chrome.storage.session.set({ [SCREENSHOT_KEY]: shot });
        await chrome.tabs.create({ url: chrome.runtime.getURL('annotator/annotator.html'), active: true });
        sendResponse({ ok: true, shot });
        break;
      }

      case 'BT_CLEAR_DIAG': {
        await chrome.storage.session.remove('bt_diag');
        sendResponse({ ok: true });
        break;
      }

      case 'BT_GET_API': {
        sendResponse({ ok: true, apiBase: API_BASE });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown message' });
    }
  })().catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : String(err) }));
  return true;
});

/* ---------- badge: live error count ---------- */
let badgeTimer = null;
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'session' || !changes.bt_diag) return;
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(async () => {
    const tab = await currentTab();
    if (!tab || !tab.id) return;
    const diag = changes.bt_diag.newValue || {};
    const count = (diag.errors || []).length + (diag.network || []).length;
    if (count > 0) {
      await chrome.action.setBadgeBackgroundColor({ color: '#e6002e' });
      await chrome.action.setBadgeText({ tabId: tab.id, text: String(count) });
    } else {
      await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    }
  }, 400);
});

/* ---------- passive security header capture ---------- */
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.frameType !== 'main_frame' || !details.tabId || details.tabId < 0) return;
    try {
      const headers = {};
      for (const h of details.responseHeaders || []) {
        const name = (h.name || '').toLowerCase();
        if (
          [
            'content-security-policy',
            'x-frame-options',
            'referrer-policy',
            'permissions-policy',
            'strict-transport-security',
            'content-type',
          ].includes(name)
        ) {
          headers[name] = String(h.value || '');
        }
      }
      const present = Object.keys(headers);
      const missing = ['content-security-policy', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'strict-transport-security'].filter(
        (k) => !(k in headers)
      );
      chrome.storage.session.set({
        bt_headers: {
          url: details.url,
          scheme: new URL(details.url).protocol,
          statusCode: details.statusCode,
          present,
          missing,
          headers,
          at: Date.now(),
        },
      });
    } catch (_) {
      /* ignore */
    }
  },
  { urls: ['<all_urls>'], types: ['main_frame'] },
  ['responseHeaders']
);

/* ---------- context menu ---------- */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'bugtrack-report',
      title: 'Report this page with BUGTRACK',
      contexts: ['page'],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'bugtrack-report') return;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'jpeg',
      quality: 85,
    });
    await chrome.storage.session.set({
      [SCREENSHOT_KEY]: { dataUrl, tabId: tab.id, url: tab.url, title: tab.title },
    });
    await chrome.tabs.create({ url: chrome.runtime.getURL('annotator/annotator.html'), active: true });
  } catch (_) {
    /* restricted page — silently ignore */
  }
});
