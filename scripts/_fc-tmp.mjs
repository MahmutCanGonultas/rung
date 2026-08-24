import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
for (const scheme of ["light", "dark"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 940 });
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-color-scheme", value: scheme },
    ],
  });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  const out = await page.evaluate(() => {
    const fills = [...document.querySelectorAll(".proof-fill")];
    return {
      body: getComputedStyle(document.body).backgroundColor,
      measureBg: (() => { const m = document.querySelector(".measure"); return m ? getComputedStyle(m).backgroundColor : null; })(),
      count: fills.length,
      fills: fills.map(f => {
        const cs = getComputedStyle(f);
        const r = f.getBoundingClientRect();
        return {
          cls: f.parentElement.className,
          bg: cs.backgroundColor,
          fca: cs.forcedColorAdjust,
          w: Math.round(r.width), h: Math.round(r.height),
          parentBg: getComputedStyle(f.parentElement).backgroundColor,
        };
      }),
      pipe: (() => { const p = document.querySelector(".pipe-cell"); if(!p) return null;
        const cs = getComputedStyle(p, "::before"); return { bg: cs.backgroundColor, w: cs.width, h: cs.height }; })(),
    };
  });
  console.log(scheme, JSON.stringify(out, null, 2));
  await page.close();
}
await browser.close();
