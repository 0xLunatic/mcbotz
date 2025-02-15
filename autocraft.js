const mineflayer = require("mineflayer");
const { Vec3 } = require("vec3");
const tool = require("mineflayer-tool").plugin;
const { pathfinder, goals } = require("mineflayer-pathfinder");

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
    host: "minegens.id", // Minecraft server IP
    username: name, // Username or email, switch if you want to change accounts
    auth: "offline", // For offline mode servers, set to 'offline'
    version: "1.18.1",
    keepAlive: true,
    skipValidation: true, // Only set if you need a port other than 25565
  });

  // Load plugins
  bot.loadPlugin(tool);
  bot.loadPlugin(pathfinder);

  // Initialize viewer
  bot.once("spawn", () => {
    console.log("Bot spawned. Initiating auto-crafting...");
    botAction();
  });

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

    setTimeout(() => {
      console.log("Joining OneBlock...");
      bot.chat("/is");
      setTimeout(() => {
        startAutoCrafting();
      }, 6000); // Start auto-crafting after "/is" command
    }, 14000);

    // Start auto-crafting action
    async function startAutoCrafting() {
      console.log("Moving to the crafting location...");
      await bot.pathfinder.goto(new goals.GoalBlock(67839, 100, 11397));

      console.log("Checking inventory for crafting items...");
      // Check chests around the bot for Coal and Lapis Lazuli
      checkNearbyChestsAndCraft();
    }

    // Function to check nearby chests and craft blocks
    // Function to check nearby chests and craft blocks
    async function checkNearbyChestsAndCraft() {
      const chests = bot.findBlocks({
        matching: bot.registry.blocksByName.chest.id,
        maxDistance: 10,
      });

      if (chests.length === 0) {
        console.log("No chests found nearby.");
        return;
      }

      // Set to track visited chests
      const visitedChests = new Set();

      // Iterate over all the chests found
      for (const chestPos of chests) {
        const chest = bot.blockAt(new Vec3(chestPos.x, chestPos.y, chestPos.z));

        // Skip the storage chest at 67840, 101, 11390 and avoid revisiting already opened chests
        if (
          chest.position.equals(new Vec3(67840, 101, 11390)) ||
          visitedChests.has(chest.position.toString())
        ) {
          continue;
        }

        if (chest) {
          console.log(`Found chest at ${chest.position}`);
          await checkChestForItemsAndCraft(chest);

          // Mark this chest as visited
          visitedChests.add(chest.position.toString());

          // Optional: Move the bot to a different chest after checking this one
          // await bot.pathfinder.goto(new goals.GoalBlock(chest.position.x + 10, chest.position.y, chest.position.z + 10));

          break; // Continue to the next chest after opening this one
        }
      }

      // Optional: Recursively check for more chests after opening one
      setTimeout(() => checkNearbyChestsAndCraft(), 2000); // Delay before checking for more chests
    }

    // Function to check the chest for items and craft blocks
    async function checkChestForItemsAndCraft(chest) {
      bot
        .openChest(chest)
        .then(async (openedChest) => {
          const coalItem = openedChest
            .containerItems()
            .find((item) => item.name === "coal");
          const lapisItem = openedChest
            .containerItems()
            .find((item) => item.name === "lapis_lazuli");

          if (coalItem && coalItem.count >= 9) {
            console.log("Found enough coal to craft a block.");
            await craftCoalBlock();
          }

          if (lapisItem && lapisItem.count >= 9) {
            console.log("Found enough lapis lazuli to craft a block.");
            await craftLapisBlock();
          }

          openedChest.close();
        })
        .catch((err) => {
          console.log("Error opening chest:", err);
        });
    }

    // Function to craft a Coal Block
    async function craftCoalBlock() {
      const ingredients = [{ name: "coal", count: 9 }];
      const hasIngredients = await checkIngredients(ingredients);
      if (hasIngredients) {
        console.log("Crafting Coal Block...");
        bot.craft(bot.registry.itemsByName["coal_block"], 1, null, (err) => {
          if (err) {
            console.log("Error crafting Coal Block:", err);
          } else {
            console.log("Coal Block crafted successfully!");
            storeCraftedBlock("coal_block");
          }
        });
      } else {
        console.log("Not enough coal to craft a block.");
      }
    }

    // Function to craft a Lapis Lazuli Block
    async function craftLapisBlock() {
      const ingredients = [{ name: "lapis_lazuli", count: 9 }];
      const hasIngredients = await checkIngredients(ingredients);
      if (hasIngredients) {
        console.log("Crafting Lapis Lazuli Block...");
        bot.craft(bot.registry.itemsByName["lapis_block"], 1, null, (err) => {
          if (err) {
            console.log("Error crafting Lapis Lazuli Block:", err);
          } else {
            console.log("Lapis Lazuli Block crafted successfully!");
            storeCraftedBlock("lapis_block");
          }
        });
      } else {
        console.log("Not enough lapis lazuli to craft a block.");
      }
    }

    // Function to check if bot has required ingredients in its inventory
    async function checkIngredients(ingredients) {
      for (const ingredient of ingredients) {
        const item = bot.inventory
          .items()
          .find((i) => i.name === ingredient.name);
        if (!item || item.count < ingredient.count) {
          return false;
        }
      }
      return true;
    }

    // Function to store crafted block in the chest at specified coordinates
    async function storeCraftedBlock(blockName) {
      const chestPos = new Vec3(67840, 101, 11390);
      const chest = bot.blockAt(chestPos);
      bot
        .openChest(chest)
        .then((openedChest) => {
          const block = bot.inventory.items().find((i) => i.name === blockName);
          if (block) {
            openedChest.deposit(block, null, block.count, (err) => {
              if (err) {
                console.log(`Error depositing ${blockName}:`, err);
              } else {
                console.log(`${blockName} stored in chest successfully!`);
              }
            });
          }
          openedChest.close();
        })
        .catch((err) => {
          console.log("Error opening chest:", err);
        });
    }

    bot.on("end", (reason) => {
      console.log(`Bot disconnected: ${reason}`);
      setTimeout(() => {
        console.log("Reconnecting...");
        startBot();
      }, 5000);
    });
  }
}
