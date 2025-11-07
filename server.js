const os = require("os");
const express = require("express");
const path = require("path");

const app = express();

const PORT = 3001;
const isDev = true;

if (isDev) {
  const livereload = require("livereload");
  const connectLivereload = require("connect-livereload");

  const liveReloadServer = livereload.createServer();

  liveReloadServer.watch(path.join(__dirname));

  app.use(connectLivereload());

  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });

  console.log("✅ Live reload ativo em modo desenvolvimento!");
} else {
  console.log("✅ Servidor rodando em modo produção (sem live reload)");
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const localIP = getLocalIP();

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`🌍 Modo: ${isDev ? "desenvolvimento" : "produção"}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`📡 IP LAN: http://${localIP}:${PORT}`);
});
