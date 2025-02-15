const mineflayer = require("mineflayer");
const { Vec3 } = require("vec3");
const tool = require("mineflayer-tool").plugin;

startBot();
async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
async function startBot() {
  createBot("Supermancx");
  await delay(5500);
}

// Create bot
function createBot(name) {
  const bot = mineflayer.createBot({
    host: "minegens.id", // minecraft server ip
    username: name, // username or email, switch if you want to change accounts
    auth: "offline", // for offline mode servers, you can set this to 'offline'
    version: "1.18.1",
    keepAlive: true,
    skipValidation: true, // port: 25565,                // only set if you need a port that isn't 25565
    // version: false,             // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
    // password: '12345678'        // set if you want to use password-based auth (may be unreliable). If specified, the `username` must be an email
  });

  // Load plugins
  bot.loadPlugin(tool);

  // Initialize viewer
  bot.once("spawn", () => {
    console.log("Bot spawned. Initiating actions...");
    botAction();
  });

  // Start bot actions
  function botAction() {
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

    async function dig() {
      const block = bot.blockAtCursor(5);
      if (!block) {
        await delay(10);
      } else {
        await bot.dig(block, "ignore", "raycast");
      }

      dig();
    }

    // Detect chat messages and check if the message contains the bot's name
    bot.on("message", (message) => {
      const messageText = message.toString();
      const botNameTag = `!invite ${bot.username}`; // Construct the bot's name tag (e.g., #Shirenogami)

      if (messageText.includes(botNameTag)) {
        console.log(
          `Detected ${botNameTag} in chat. Executing /is accept to owner...`
        );
        bot.chat(`/is accept`);
      }
    });

    bot.on("message", (message) => {
      const messageText = message.toString();
      const botNameTag = `!teleport ${bot.username}`; // Construct the bot's name tag (e.g., #Shirenogami)

      if (messageText.includes(botNameTag)) {
        console.log(
          `Detected ${botNameTag} in chat. Executing /tpa to owner...`
        );
        bot.chat(`/tpa 0xLunatic`);
      }
    });

    bot.on("message", (message) => {
      const messageText = message.toString();
      const botNameTag = `!equip ${bot.username}`; // Construct the bot's name tag (e.g., !equip Shirenogami)

      if (messageText.includes(botNameTag)) {
        console.log(
          `Detected ${botNameTag} in chat. Equipping best pickaxe...`
        );

        // Equip the best pickaxe in the inventory
        equipBestPickaxe();
      }
    });

    async function equipBestPickaxe() {
      const pickaxes = [
        "diamond_pickaxe",
        "iron_pickaxe",
        "stone_pickaxe",
        "wooden_pickaxe",
      ];
      let bestPickaxe = null;

      // Search for the best pickaxe in the inventory
      for (let pickaxe of pickaxes) {
        const item = bot.inventory
          .items()
          .find((item) => item.name === pickaxe);
        if (item) {
          bestPickaxe = item;
          break; // Stop once we find the best available pickaxe
        }
      }

      if (bestPickaxe) {
        // Equip the best pickaxe (this assumes the bot has a valid pickaxe)
        bot.equip(bestPickaxe, "hand", (err) => {
          if (err) {
            console.log("Error equipping pickaxe:", err);
          } else {
            console.log(`Equipped ${bestPickaxe.name}`);
          }
        });
      } else {
        console.log("No pickaxe found in inventory.");
      }
    }

    bot.on("end", (reason) => {
      console.log(`Bot disconnected: ${reason}`);
      setTimeout(() => {
        console.log("Reconnecting...");
        botAction();
      }, 5000);
    });
  }
}
