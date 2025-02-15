process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { createBot } = require("mineflayer");
const fs = require("fs");
const socks = require("socks").SocksClient;
const randomUsernameGenerator = require("random-username-generator");

function generateCustomUsername(length) {
  const randomUsername = require("random-username-generator").generate(); // Use the random generator
  const modifiedUsername = randomUsername
    .replace(/-/g, "") // Replace all '-' with '_'
    .toLowerCase() // Convert all characters to lowercase first
    .split("_") // Split the string at '_'
    .map((part, index) => {
      // Capitalize the first character of each part
      if (index === 0) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
      return part.charAt(0).toUpperCase() + part.slice(1); // Capitalize each part after '_'
    })
    .join("_"); // Join the parts back with '_'

  return modifiedUsername.slice(0, length); // Ensure the username doesn't exceed the max length
}

const USE_PROXY = true; // Set to true to use proxies, false to connect directly
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

const maxAccounts = 350; // Set the maximum number of accounts
const accounts = generateAccounts(maxAccounts);

function generateAccounts(max) {
  const generatedAccounts = [];
  for (let i = 0; i < max; i++) {
    let username = generateCustomUsername(14); // Generate a custom username with max length 16
    generatedAccounts.push({ username });
  }
  return generatedAccounts;
}

const maxRetries = 1;
const retryDelays = 100; // 1 second before retrying

function createBotInstance(account, proxy, retries = 0) {
  console.log(
    `[INFO] Connecting ${account.username} ${
      USE_PROXY ? `using proxy ${proxy}` : "without proxy"
    } (Attempt: ${retries + 1})`
  );

  const botOptions = {
    host: mcServerHost,
    username: account.username,
    skipValidation: true,
    version: "1.18.1",
  };

  if (USE_PROXY && proxy) {
    const [proxyHost, proxyPort] = proxy.split(":");
    botOptions.connect = (client) => {
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

  bot.on("death", () => {
    bot.emit("spawn"); // Force the bot to respawn
  });

  bot.once("spawn", () => {
    console.log(
      `[SUCCESS] ${account.username} joined ${
        USE_PROXY ? `using proxy ${proxy}` : "without proxy"
      }`
    );

    // Registration and login flow
    setTimeout(() => {
      setTimeout(() => {
        bot.chat("/server survival");
        setTimeout(() => {
          if (bot.health === 0) {
            bot.emit("spawn");
          }
          setInterval(() => {
            bot.chat(generateRandomSpam());
          }, 4000); // Spams every 10ms (you can adjust this delay)
        }, 8000);
      }, 8000);
    }, 1000);

    function generateRandomSpam() {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:'\",.<>?/`~";
      let spamText = "";
      const length = Math.floor(Math.random() * 40) + 20; // Generates random length between 5 and 25

      for (let i = 0; i < length; i++) {
        spamText += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }

      return spamText;
    }

    function moveRandomly() {
      const randomMove = () => {
        const randomX = Math.random() * 25 - 5; // Random X direction (between -5 and 5)
        const randomZ = Math.random() * 25 - 5; // Random Z direction (between -5 and 5)

        bot.jump = true;

        bot.setControlState("forward", true);
        bot.lookAt(bot.entity.position.offset(randomX, 0, randomZ), false);

        setTimeout(() => {
          bot.setControlState("forward", false); // Stop moving after a random time
        }, Math.random() * 2000 + 1000); // Random stop between 1 to 3 seconds
      };

      setInterval(randomMove, Math.random() * 3000 + 2000); // Call randomMove every 2 to 5 seconds

      setInterval(() => {
        const randomYaw = Math.random() * 180 - 90; // Random yaw to simulate turning (between -90 and 90 degrees)
        const randomPitch = Math.random() * 40 - 20; // Random pitch for vertical look adjustment (between -20 and 20 degrees)
        bot.lookAt(
          bot.entity.position.offset(randomYaw, randomPitch, 0),
          false
        );
      }, Math.random() * 4000 + 1000); // Random turn every 1 to 5 seconds
    }
  });

  bot.on("message", (message) => {
    const msg = message.toString();
    if (msg.includes("/register")) {
      setTimeout(() => {
        bot.chat("/register lolofaw123 lolofaw123");
        console.log(`[INFO] ${account.username} executed /register`);
      }, 1000);
    }
    if (msg.includes("/login")) {
      setTimeout(() => {
        bot.chat("/login lolofaw123");
        console.log(`[INFO] ${account.username} executed /login`);
      }, 1000);
    }
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
      `[ERROR] ${account.username} exceeded max retries. ${
        USE_PROXY ? "Switching proxy..." : "Stopping bot."
      }`
    );
    if (USE_PROXY) {
      switchProxy(account);
    }
  } else {
    console.log(
      `[INFO] Retrying ${account.username} in ${retryDelays / 1000} seconds...`
    );
    setTimeout(
      () => createBotInstance(account, proxy, retries + 1),
      retryDelays
    );
  }
}

function switchProxy(account) {
  proxyIndex++;
  if (proxyIndex >= proxies.length) {
    proxyIndex = 0;
    return;
  }
  console.log(
    `[INFO] Switching proxy to ${proxies[proxyIndex]} for ${account.username}`
  );
  createBotInstance(account, proxies[proxyIndex]);
}

// Start bots using proxies if enabled, otherwise connect normally
accounts.forEach((account, index) => {
  if (USE_PROXY) {
    if (index < proxies.length) {
      setTimeout(() => {
        createBotInstance(account, proxies[index]);
      }, 1000);
    } else {
      console.log(`[ERROR] Not enough proxies available for all accounts.`);
    }
  } else {
    createBotInstance(account);
  }
});
