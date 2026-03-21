/* =============================================
   HELLION NEWTAB — storage.js
   Abstraction Layer: chrome.storage.local / localStorage
   ============================================= */

const Store = {
  QUOTA_WARNING_BYTES: 8 * 1024 * 1024, // 8 MB Warnung (Limit ist 10 MB)

  get(key) {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], r => resolve(r[key] ?? null));
      } else {
        try { resolve(JSON.parse(localStorage.getItem(key))); }
        catch { resolve(null); }
      }
    });
  },

  set(key, value) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            console.error('Storage-Fehler:', chrome.runtime.lastError.message);
            HellionDialog.alert('Speicher voll! Bitte lösche alte Boards oder das Hintergrundbild, um Platz zu schaffen.', { type: 'danger', title: 'Speicher voll' });
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      } else {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          resolve();
        } catch (e) {
          console.error('Storage-Fehler:', e.message);
          HellionDialog.alert('Speicher voll! Bitte lösche alte Boards oder das Hintergrundbild, um Platz zu schaffen.', { type: 'danger', title: 'Speicher voll' });
          reject(e);
        }
      }
    });
  },

  async checkQuota() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local.getBytesInUse) {
      return new Promise(resolve => {
        chrome.storage.local.getBytesInUse(null, bytes => {
          if (bytes > Store.QUOTA_WARNING_BYTES) {
            const usedMB = (bytes / 1024 / 1024).toFixed(1);
            console.warn('Storage-Warnung: ' + usedMB + ' MB von 10 MB belegt.');
          }
          resolve(bytes);
        });
      });
    }
    return 0;
  }
};
