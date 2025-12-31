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
  // Oferta directa
  const benefits = (data.benefits || []).slice(0, 3);
  while (benefits.length < 3) benefits.push("");

  // Autoridad proofs
  const proofs = (data.proofs || []).slice(0, 3);
  while (proofs.length < 3) proofs.push({ value: "", label: "" });

  return html
    // comunes
    .replaceAll("{{headline}}", escapeHtml(data.headline))
    .replaceAll("{{cta}}", escapeHtml(data.cta))

    // offer-direct.html
    .replaceAll("{{sub_badge}}", escapeHtml(data.sub_badge))
    .replaceAll("{{benefit_1}}", escapeHtml(benefits[0]))
    .replaceAll("{{benefit_2}}", escapeHtml(benefits[1]))
    .replaceAll("{{benefit_3}}", escapeHtml(benefits[2]))

    // authority.html
    .replaceAll("{{brand}}", escapeHtml(data.brand))
    .replaceAll("{{authority_badge}}", escapeHtml(data.authority_badge))
    .replaceAll("{{proof_1}}", escapeHtml(proofs[0].value))
    .replaceAll("{{proof_1_label}}", escapeHtml(proofs[0].label))
    .replaceAll("{{proof_2}}", escapeHtml(proofs[1].value))
    .replaceAll("{{proof_2_label}}", escapeHtml(proofs[1].label))
    .replaceAll("{{proof_3}}", escapeHtml(proofs[2].value))
    .replaceAll("{{proof_3_label}}", escapeHtml(proofs[2].label))
    .replaceAll("{{footer_left}}", escapeHtml(data.footer_left))
    .replaceAll("{{footer_right}}", escapeHtml(data.footer_right));
}

function getTemplateAndData(parsedUrl) {
  const q = parsedUrl.query || {};
  const template = (q.template || "offer_direct").toLowerCase();

  if (template === "authority") {
    return {
      file: "./authority.html",
      data: {
        headline: q.headline || "MÁS CLIENTES EN 14 DÍAS",
        cta: q.cta || "AGENDA UNA LLAMADA",
        brand: q.brand || "TU MARCA",
        authority_badge: q.badge || "CASOS REALES",
        proofs: [
          { value: q.p1 || "+1,240", label: q.p1l || "VENTAS" },
          { value: q.p2 || "4.9★", label: q.p2l || "RESEÑAS" },
          { value: q.p3 || "30D", label: q.p3l || "GARANTÍA" }
        ],
        footer_left: q.fl || "DISTRIBUIDOR AUTORIZADO",
        footer_right: q.fr || "SOPORTE 24/7"
      }
    };
  }

  // default: offer_direct
  return {
    file: "./offer-direct.html",
    data: {
      headline: q.headline || "BLACK FRIDAY OFERTA",
      sub_badge: q.sub_badge || "PACK X2",
      cta: q.cta || "COMPRAR AHORA",
      benefits: [
        q.b1 || "REPARA",
        q.b2 || "NUTRE",
        q.b3 || "BRILLO"
      ],
      // campos de autoridad vacíos para no romper reemplazos
      brand: "",
      authority_badge: "",
      proofs: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }],
      footer_left: "",
      footer_right: ""
    }
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Tu generador de banners está funcionando 🚀");
  }

  // Preview HTML (elige template por query)
  if (parsedUrl.pathname === "/preview") {
    const { file, data } = getTemplateAndData(parsedUrl);
    const html = fs.readFileSync(file, "utf8");
    const filled = fillTemplate(html, data);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(filled);
  }

  // PNG (elige template por query)
  if (parsedUrl.pathname === "/png") {
    (async () => {
      try {
        const { file, data } = getTemplateAndData(parsedUrl);
        const html = fs.readFileSync(file, "utf8");
        const filled = fillTemplate(html, data);

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

  // Mantengo tu /render si aún lo necesitas (opcional)
  if (parsedUrl.pathname === "/render") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ ok: true, message: "Usa /preview o /png" }, null, 2));
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Ruta no encontrada ❌");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Servidor corriendo en el puerto " + PORT));
