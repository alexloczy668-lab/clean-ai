// Clean AI website — shared config (checkout, orders and download links).
// Everything that changes when the store goes live is in this one object.
const CLEAN_AI = {
  // Lemon Squeezy store "clean-ai" (same id in test and live mode).
  storeId: 479522,
  // Checkout link. When the product is copied to LIVE mode, paste the new link here.
  checkoutUrl: 'https://clean-ai.lemonsqueezy.com/checkout/buy/e2c3871f-b081-4ba3-a8fc-1213837d8bcc',
  // Yearly plan (€100 / year) checkout link. Product id 1494447, accepted by the
  // licence server (LS_PRODUCT_ID=1376519,1494447). If this is ever emptied, the
  // Yearly button falls back to checkoutUrl above (the MONTHLY checkout).
  checkoutYearlyUrl: 'https://clean-ai.lemonsqueezy.com/checkout/buy/38529515-b2fb-4e0a-9086-9dff94531fd6',
  // Lemon Squeezy's buyer portal: invoices, cancel, update card, lost keys (email magic link).
  ordersUrl: 'https://app.lemonsqueezy.com/my-orders',
  // Every download button goes to the Microsoft Store listing. The Store delivers
  // updates too. (download/CleanAI-Setup.exe + version.json stay only so old
  // website installs can still update themselves.)
  downloadUrl: 'https://apps.microsoft.com/detail/9pffcdrs64fn?hl=en-US&gl=RS',
};

// Fill every <a data-link="checkout|checkoutYearly|orders|download"> from the config above.
document.querySelectorAll('[data-link]').forEach((a) => {
  const url = CLEAN_AI[a.dataset.link + 'Url'] || (a.dataset.link === 'checkoutYearly' ? CLEAN_AI.checkoutUrl : '');
  if (url) a.href = url;
  // The Store opens in a new tab so the Get key page stays open.
  if (a.dataset.link === 'download') { a.target = '_blank'; a.rel = 'noopener'; }
});

// The old sign-in / account pages are gone: forget what they saved in this
// browser (licence key, trial-page accounts with password hashes).
try {
  for (const k of ['cleanai.licence', 'cleanai.trial.accounts', 'cleanai.trial.session']) {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  }
} catch { /* storage blocked: nothing to clean */ }
