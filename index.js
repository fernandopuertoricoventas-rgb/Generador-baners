const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fillTemplate(html, data) {
  const benefits = (data.benefits || []).slice(0, 3);
  while (benefits.length < 3) benefits.push("");

  return html
    .replaceAll("{{headline}}", escapeHtml(data.headline))
    .replaceAll("{{sub_badge}}", escapeHtml(data.sub_badge))
    .replaceAll("{{benefit_1}}", escapeHtml(benefits[0]))
    .replaceAll("{{benefit_2}}", escapeHtml(benefits[1]))
    .replaceAll("{{benefit_3}}", escapeHtml(benefits[2]))
    .replaceAll("{{cta}}", escapeHtml(data.cta));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const route = parsedUrl.pathname;

  // HOME
  if (route === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Servidor funcionando 🚀");
  }

  // LANDING
  if (route === "/landing") {
    const html = fs.readFileSync(path.join(__dirname, "landing.html"), "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  // APP
  if (route === "/app") {
    const html = fs.readFileSync(path.join(__dirname, "app.html"), "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  // PREVIEW
  if (route === "/preview") {
    const headline = parsedUrl.query.headline || "OFERTA HOY";
    const sub_badge = parsedUrl.query.sub_badge || "PACK X2";
    const cta = parsedUrl.query.cta || "COMPRAR AHORA";
    const benefits = [
      parsedUrl.query.b1 || "ENVÍO GRATIS",
      parsedUrl.query.b2 || "GARANTÍA",
      parsedUrl.query.b3 || "CALIDAD"
    ];

    const html = fs.readFileSync("offer-direct.html", "utf8");
    const filled = fillTemplate(html, { headline, sub_badge, cta, benefits });

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(filled);
  }

  // PNG
  if (route === "/png") {
    try {
      const headline = parsedUrl.query.headline || "OFERTA HOY";
      const sub_badge = parsedUrl.query.sub_badge || "PACK X2";
      const cta = parsedUrl.query.cta || "COMPRAR AHORA";
      const benefits = [
        parsedUrl.query.b1 || "ENVÍO GRATIS",
        parsedUrl.query.b2 || "GARANTÍA",
        parsedUrl.query.b3 || "CALIDAD"
      ];

      const html = fs.readFileSync("offer-direct.html", "utf8");
      const filled = fillTemplate(html, { headline, sub_badge, cta, benefits });

      const browser = await chromium.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });

      await page.setContent(filled);
      const buffer = await page.screenshot({ type: "png" });

      await browser.close();

      res.writeHead(200, { "Content-Type": "image/png" });
      return res.end(buffer);
    } catch (err) {
      res.writeHead(500);
      return res.end("Error PNG: " + err.message);
    }
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Ruta no encontrada ❌");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
