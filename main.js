const mineflayer = require("mineflayer");
const { Vec3 } = require("vec3");
const tool = require("mineflayer-tool").plugin;
const socks = require("socks").SocksClient;
const fs = require("fs");

const mcServerHost = "minegens.id";
const mcServerPort = 25565;

const proxies = fs
  .readFileSync("proxy.txt", "utf-8")
  .split("\n")
  .map((p) => p.trim())
  .filter(Boolean);
let proxyIndex = 0;

// const botNames = ["Shirenogami"];
const botNames = ["Shirenogami", "PentolJarjit", "Jempol", "AkuC", "wslOn"];

// Define which bot should use a proxy (true = use proxy, false = no proxy)
const useProxy = {
  Shirenogami: false,
  PentolJarjit: false,
  Jempol: false,
  AkuC: false,
  wslOn: false,
};

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const botDisconnected = {}; // Object to track disconnection status for each bot

async function startBots() {
  for (const name of botNames) {
    if (proxyIndex >= proxies.length && useProxy[name]) {
      console.log("[ERROR] Not enough proxies available.");
      return;
    }

    if (useProxy[name]) {
      await createBot(name, proxies[proxyIndex]);
      proxyIndex++;
    } else {
      await createBotWithoutProxy(name); // Create bot without proxy
    }

    await delay(5500);
  }
}

async function createBot(name, proxy) {
  const [proxyHost, proxyPort] = proxy.split(":");
  console.log(`[INFO] Connecting ${name} using proxy ${proxy}`);

  const bot = mineflayer.createBot({
    host: mcServerHost,
    username: name,
    auth: "offline",
    version: "1.18.1",
    connect: (client) => {
      tryConnecting(client, proxyHost, proxyPort);
    },
  });

  bot.once("spawn", () => {
    console.log(`[SUCCESS] ${name} joined using proxy ${proxy}`);
    botAction(bot);
  });

  bot.on("message", (message) => {
    const messageText = message.toString();
    const botNameTag = `!tp ${bot.username}`; // Construct the bot's name tag (e.g., !equip Shirenogami)

    if (messageText.includes(botNameTag)) {
      console.log(`Detected Owner in chat. Teleporting bot to owner...`);
      bot.chat("/tpa 0xLunatic");
    }
  });

  bot.on("end", (reason) => {
    console.log(`[INFO] ${name} disconnected: ${reason}`);
    reconnectBot(name, proxy);
  });

  function tryConnecting(client, proxyHost, proxyPort) {
    socks.createConnection(
      {
        proxy: {
          host: proxyHost,
          port: parseInt(proxyPort, 10),
          type: 5,
        },
        command: "connect",
        destination: {
          host: mcServerHost,
          port: mcServerPort,
        },
      },
      (err, info) => {
        if (err) {
          console.log(
            `[ERROR] Proxy ${proxyHost}:${proxyPort} failed: ${err.message}`
          );
          reconnectBot(client.username, proxy);
          return;
        }
        client.setSocket(info.socket);
        client.emit("connect");
      }
    );
  }

  function reconnectBot(name, failedProxy) {
    console.log(`[INFO] Attempting to reconnect bot ${name}...`);

    if (proxyIndex >= proxies.length) {
      console.log("[ERROR] Not enough proxies left to attempt reconnect.");
      return;
    }

    const nextProxy = proxies[proxyIndex];
    console.log(`[INFO] Reconnecting ${name} using new proxy ${nextProxy}`);
    proxyIndex++;

    createBot(name, nextProxy); // Try connecting with the next proxy in the list
  }

  bot.loadPlugin(tool);

  async function botAction(bot) {
    console.log("Registering bot...");
    bot.chat("/register fauzanqwe123");

    setTimeout(() => {
      console.log("Logging in...");
      bot.chat("/login fauzanqwe123");
    }, 3000);

    setTimeout(() => {
      console.log("Joining OneBlock queue...");
      bot.chat("/server oneblock");
    }, 8000);

    setTimeout(() => {
      checkBlockLogin(bot);
    }, 9500);

    setTimeout(() => {
      dig(bot);
    }, 13000);
  }

  function checkBlockLogin(bot) {
    setTimeout(() => {
      if (!bot || !bot.entity) return;

      const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0));

      if (!blockBelow || blockBelow.name !== "gold_block") {
        bot.chat("/is");
      }
    }, 1000);
  }

  let hasDigged = false; // Flag to track if dig() has been executed for the first time

  async function dig(bot) {
    const block = bot.blockAtCursor(5);
    if (!block) {
      await delay(10);
    } else {
      await bot.dig(block, "ignore", "raycast");
    }

    if (!hasDigged) {
      hasDigged = true;
      startLocationCheck(bot); // Start location check after the first dig
    }

    dig(bot); // Keep calling dig recursively
  }

  async function startLocationCheck(bot) {
    setInterval(() => {
      if (!bot || !bot.entity || botDisconnected[bot.username]) return; // Skip if bot is already disconnected

      const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0));

      if (!blockBelow || blockBelow.name !== "gold_block") {
        console.log(
          `[ALERT] ${bot.username} is not on a gold block! Disconnecting...`
        );
        bot.quit();
        botDisconnected[bot.username] = true; // Mark this bot as disconnected
      }
    }, 2000); // Run every 2 seconds
  }
}

async function createBotWithoutProxy(name) {
  console.log(`[INFO] Connecting ${name} without proxy`);

  const bot = mineflayer.createBot({
    host: mcServerHost,
    username: name,
    auth: "offline",
    version: "1.18.1",
  });

  bot.once("spawn", () => {
    console.log(`[SUCCESS] ${name} joined without proxy`);
    botAction(bot);
  });

  bot.on("message", (message) => {
    const messageText = message.toString();
    const botNameTag = `!tp ${bot.username}`; // Construct the bot's name tag (e.g., !equip Shirenogami)

    if (messageText.includes(botNameTag)) {
      console.log(`Detected Owner in chat. Teleporting bot to owner...`);
      bot.chat("/tpa 0xLunatic");
    }
  });

  bot.on("end", (reason) => {
    console.log(`[INFO] ${name} disconnected: ${reason}`);
    reconnectBot(name, "");
  });

  async function botAction(bot) {
    botDisconnected[bot.username] = false;
    console.log("Registering bot...");
    bot.chat("/register fauzanqwe123");

    setTimeout(() => {
      console.log("Logging in...");
      bot.chat("/login fauzanqwe123");
    }, 3000);

    setTimeout(() => {
      console.log("Joining OneBlock queue...");
      bot.chat("/server oneblock");
    }, 8000);

    setTimeout(() => {
      checkBlockLogin(bot);
    }, 35500);

    setTimeout(() => {
      dig(bot);
    }, 13000);
  }
  function reconnectBot(name) {
    console.log(`[INFO] Attempting to reconnect bot ${name}...`);

    createBotWithoutProxy(name);
  }

  function checkBlockLogin(bot) {
    setTimeout(() => {
      if (!bot || !bot.entity) return;

      const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0));

      if (!blockBelow || blockBelow.name !== "gold_block") {
        bot.chat("/is");
      }
    }, 1000);
  }

  let hasDigged = false; // Flag to track if dig() has been executed for the first time

  async function dig(bot) {
    const block = bot.blockAtCursor(5);
    if (!block) {
      await delay(10);
    } else {
      await bot.dig(block, "ignore", "raycast");
    }

    if (!hasDigged) {
      hasDigged = true; // Start location check after the first dig
    }

    dig(bot); // Keep calling dig recursively
    startLocationCheck(bot);
  }

  async function startLocationCheck(bot) {
    let checkInterval = setInterval(() => {
      if (!bot || !bot.entity) {
        clearInterval(checkInterval); // Stop the interval if bot is not connected
        return;
      }

      const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0));

      if (!blockBelow || blockBelow.name !== "gold_block") {
        bot.quit();
        clearInterval(checkInterval); // Stop the interval once the bot quits
      }
    }, 1000); // Run every 1 second
  }
}

startBots();
