const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Ruta principal
  if (parsedUrl.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Tu generador de banners está funcionando 🚀");
  }

  // Endpoint /render (por ahora solo responde JSON)
  if (parsedUrl.pathname === "/render") {
    const template = parsedUrl.query.template || "offer_direct";
    const headline = parsedUrl.query.headline || "BLACK FRIDAY OFERTA";
    const cta = parsedUrl.query.cta || "COMPRAR AHORA";

    const output = {
      template,
      content: {
        headline,
        cta
      },
      status: "ok",
      message: "Endpoint /render funcionando ✅"
    };

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(output, null, 2));
  }

  // Si la ruta no existe
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Ruta no encontrada ❌");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto " + PORT);
});
