process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { createBot } = require("mineflayer");
const fs = require("fs");
const socks = require("socks").SocksClient;

const USE_PROXY = true;
const mcServerHost = "play.relxmc.com";
const mcServerPort = 25565;

let proxies = [];
if (USE_PROXY) {
  proxies = fs
    .readFileSync("proxy.txt", "utf-8")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}
let proxyIndex = 0;

const accounts = [
  { username: "shadowViper" },
  { username: "Neon_spectre" },
  { username: "cyber_rogue" },
  { username: "PixelFury99" },
  { username: "quantum_knight" },
  { username: "ghostlyReaperX" },
  { username: "blaze_titan" },
  { username: "echoPhantom42" },
  { username: "storm_breaker" },
  { username: "infernoStriker" },
  { username: "frostbyte77" },
  { username: "crimsonHunter_" },
  { username: "voltage_x" },
  { username: "darknova2024" },
  { username: "thunderdglitch" },
  { username: "AlexRivera" },
  { username: "Jordan_Miles" },
  { username: "EthanCole" },
  { username: "Sophie_Anderson" },
  { username: "DanielParker" },
  { username: "Mia_Henderson" },
  { username: "TylerBrooks" },
  { username: "Ava_Simpson" },
  { username: "Nathan_Foster" },
  { username: "EmilyGrayson" },
  { username: "Zach_Taylor" },
  { username: "OliviaMarshall" },
  { username: "Liam_Dawson" },
  { username: "Emma_Sullivan" },
  { username: "BenjaminCarter" },
  { username: "Chloe_Watson" },
  { username: "Lucas_Harris" },
  { username: "IsabellaMason" },
  { username: "Ryan_Freeman" },
  { username: "Grace_Hughes" },
  { username: "ShadowVortex" },
  { username: "Neon_Spectre77" },
  { username: "CyberPhantomX" },
  { username: "PixelFury99" },
  { username: "Glitch_Rogue" },
  { username: "EchoStorm42" },
  { username: "QuantumByte" },
  { username: "Stealth_Reaper" },
  { username: "SolarSentinelX" },
  { username: "Dark_Warrior23" },
  { username: "Neon_Shadow99" },
  { username: "CyberAssassin" },
  { username: "PixelSpectreX" },
  { username: "PhantomGlitch" },
  { username: "Vortex_Striker" },
  { username: "HavocByte77" },
  { username: "QuantumRift" },
  { username: "Stealth_HunterX" },
  { username: "SolarRogue42" },
  { username: "DarkNova99" },
];

const maxRetries = 15;
const retryDelays = 2500;

function createBotInstance(account, proxy, retries = 0) {
  console.log(
    `[INFO] Connecting ${account.username} using proxy ${proxy} (Attempt: ${
      retries + 1
    })`
  );

  const botOptions = {
    host: mcServerHost,
    username: account.username,
    skipValidation: true,
    version: "1.20.1",
    keepAlive: true,
  };

  if (USE_PROXY && proxy) {
    const [proxyHost, proxyPort] = proxy.split(":");
    botOptions.connect = (client) => {
      socks.createConnection(
        {
          proxy: { host: proxyHost, port: parseInt(proxyPort, 10), type: 5 },
          command: "connect",
          destination: { host: mcServerHost, port: mcServerPort },
        },
        (err, info) => {
          if (err) {
            console.log(`[ERROR] Proxy ${proxy} failed: ${err.message}`);
            return handleReconnect(account, proxy, retries);
          }
          client.setSocket(info.socket);
          client.emit("connect");
        }
      );
    };
  }

  const bot = createBot(botOptions);

  bot.once("spawn", () => {
    console.log(`[SUCCESS] ${account.username} joined using proxy ${proxy}`);
    setTimeout(() => {
      bot.chat("/server survival");
      setTimeout(() => {
        bot.chat("/warp afk");
        setInterval(() => {
          bot.chat("/points pay 0xLunatic 1");
        }, 10000);
      }, 8000);
    }, 8000);
  });

  bot.on("error", (err) => {
    console.log(`[ERROR] ${account.username} failed: ${err.message}`);
    bot.end();
    handleReconnect(account, proxy, retries);
  });

  bot.on("end", () => {
    handleReconnect(account, proxy, retries);
  });
}

function handleReconnect(account, proxy, retries) {
  if (retries >= maxRetries) {
    console.log(
      `[ERROR] ${account.username} max retries reached. Switching proxy...`
    );
    switchProxy(account);
  } else {
    console.log(
      `[INFO] Retrying ${account.username} on same proxy in ${
        retryDelays / 1000
      } seconds...`
    );
    setTimeout(
      () => createBotInstance(account, proxy, retries + 1),
      retryDelays
    );
  }
}

function switchProxy(account) {
  proxyIndex = (proxyIndex + 1) % proxies.length;
  console.log(
    `[INFO] Switching proxy to ${proxies[proxyIndex]} for ${account.username}`
  );
  createBotInstance(account, proxies[proxyIndex]);
}

// Assign proxies to accounts and loop back if needed
accounts.forEach((account, index) => {
  if (USE_PROXY && proxies.length > 0) {
    const proxy = proxies[proxyIndex]; // Assign proxy
    proxyIndex = (proxyIndex + 1) % proxies.length; // Loop back to the first proxy when all are used

    setTimeout(() => {
      createBotInstance(account, proxy);
    }, 3000 * index);
  } else {
    console.log(
      `[WARNING] No proxies available. Retrying with the first proxy.`
    );
    proxyIndex = 0; // Reset proxy index to loop
    setTimeout(() => {
      createBotInstance(account, proxies[proxyIndex]); // Start again with first proxy
    }, 3000 * index);
  }
});
