// Clean AI website — shared config (checkout, orders and download links).
// Everything that changes when the store goes live is in this one object.
const CLEAN_AI = {
  // Dodo Payments LIVE checkout links (monthly EUR 11, yearly EUR 100).
  // Product ids go into the licence server secret DODO_PRODUCT_ID.
  checkoutUrl: 'https://checkout.dodopayments.com/buy/pdt_0Ns8NCt3BR5u9Qw1LdDUq?quantity=1',
  // If this is ever emptied, the Yearly button falls back to the MONTHLY checkout.
  checkoutYearlyUrl: 'https://checkout.dodopayments.com/buy/pdt_0Ns8NXZrdEeUrJ2iucq4k?quantity=1',
  // Dodo customer portal: invoices, cancel, update card, lost keys (email sign-in link).
  ordersUrl: 'https://customer.dodopayments.com/login/bus_0Ns8INMUb8gxfpaKfghNA',
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

// The landing page used to hold every section; old links (the app's Renew button
// opens index.html#pricing) now go to the section's own page.
(function () {
  const PAGES = { '#how': 'how-it-works.html', '#features': 'features.html', '#pricing': 'pricing.html', '#faq': 'faq.html' };
  const onIndex = /\/(index\.html)?$/.test(location.pathname);
  if (onIndex && PAGES[location.hash]) location.replace(PAGES[location.hash]);
})();

// The old sign-in / account pages are gone: forget what they saved in this
// browser (licence key, trial-page accounts with password hashes).
try {
  for (const k of ['cleanai.licence', 'cleanai.trial.accounts', 'cleanai.trial.session']) {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  }
} catch { /* storage blocked: nothing to clean */ }
