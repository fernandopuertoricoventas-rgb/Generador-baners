const http = require("http");
const url = require("url");
const fs = require("fs");
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

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Página principal
  if (parsedUrl.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Tu generador de banners está funcionando 🚀");
  }

  // Endpoint JSON (lo que ya tenías)
  if (parsedUrl.pathname === "/render") {
    const template = parsedUrl.query.template || "offer_direct";
    const headline = parsedUrl.query.headline || "BLACK FRIDAY OFERTA";
    const cta = parsedUrl.query.cta || "COMPRAR AHORA";

    const output = {
      template,
      content: { headline, cta },
      status: "ok",
      message: "Endpoint /render funcionando ✅"
    };

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(output, null, 2));
  }

  // NUEVO: Preview HTML del banner
  if (parsedUrl.pathname === "/preview") {
    const headline = parsedUrl.query.headline || "BLACK FRIDAY OFERTA";
    const sub_badge = parsedUrl.query.sub_badge || "PACK X2";
    const cta = parsedUrl.query.cta || "COMPRAR AHORA";
    const benefits = [
      parsedUrl.query.b1 || "REPARA",
      parsedUrl.query.b2 || "NUTRE",
      parsedUrl.query.b3 || "BRILLO"
    ];

    // Lee la plantilla desde el repo
    const html = fs.readFileSync("./offer-direct.html", "utf8");
    const filled = fillTemplate(html, { headline, sub_badge, cta, benefits });

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(filled);
      // NUEVO: Generar PNG (banner final)
  if (parsedUrl.pathname === "/png") {
    (async () => {
      try {
        const headline = parsedUrl.query.headline || "BLACK FRIDAY OFERTA";
        const sub_badge = parsedUrl.query.sub_badge || "PACK X2";
        const cta = parsedUrl.query.cta || "COMPRAR AHORA";
        const benefits = [
          parsedUrl.query.b1 || "REPARA",
          parsedUrl.query.b2 || "NUTRE",
          parsedUrl.query.b3 || "BRILLO"
        ];

        const html = fs.readFileSync("./offer-direct.html", "utf8");
        const filled = fillTemplate(html, { headline, sub_badge, cta, benefits });

        const browser = await chromium.launch();
        const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });

        await page.setContent(filled, { waitUntil: "load" });
        const buffer = await page.screenshot({ type: "png" });

        await page.close();
        await browser.close();

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Cache-Control": "no-store"
        });
        return res.end(buffer);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("Error generando PNG: " + err.message);
      }
    })();

    return;
  }

  }

  // Si no existe la ruta
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Ruta no encontrada ❌");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto " + PORT);
});
