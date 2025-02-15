const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const { GoalBlock } = goals;
const Vec3 = require("vec3");
const mineflayerViewer = require("prismarine-viewer").mineflayer;
const collectBlock = require("mineflayer-collectblock").plugin;

const bot = mineflayer.createBot({
  host: "minegens.id",
  username: "Shirenogami",
  auth: "offline",
  port: 25565,
  version: "1.18.1",
});

let mcData = require("minecraft-data")(bot.version);

bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock);

bot.once("spawn", () => {
  console.log("Bot spawned!");
  mineflayerViewer(bot, { port: 3000 }); // Start the viewing server on port 3000

  // Draw the path followed by the bot
  const path = [bot.entity.position.clone()];
  bot.on("move", () => {
    if (path[path.length - 1].distanceTo(bot.entity.position) > 1) {
      path.push(bot.entity.position.clone());
      bot.viewer.drawLine("path", path);
    }
  });

  // Register & login
  bot.chat("/register fauzanqwe123");
  setTimeout(() => bot.chat("/login fauzanqwe123"), 3000);
  setTimeout(() => bot.chat("/server oneblock"), 4000);
  setTimeout(() => bot.chat("/warp miner"), 10000);

  setTimeout(() => {
    walkToDante();
  }, 12000);

  setInterval(() => {
    bot.chat("/sellall");
  }, 30000);
});

function walkToDante() {
  const targetPos = { x: 56, y: 93, z: 130 };
  console.log(
    `Walking to target location at ${targetPos.x}, ${targetPos.y}, ${targetPos.z}...`
  );

  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  const goal = new GoalBlock(targetPos.x, targetPos.y, targetPos.z);
  bot.pathfinder.setGoal(goal);

  bot.once("goal_reached", () => {
    console.log("Reached target location!");
    setTimeout(interactWithNearestEntity, 2000);
  });
}

function interactWithNearestEntity() {
  const entities = Object.values(bot.entities).filter(
    (e) => (e.type === "player" || e.type === "mob") && e !== bot.entity
  );

  if (entities.length > 0) {
    const nearestEntity = entities.reduce((prev, curr) =>
      bot.entity.position.distanceTo(curr.position) <
      bot.entity.position.distanceTo(prev.position)
        ? curr
        : prev
    );

    console.log(
      `Interacting with nearest entity: ${nearestEntity.name || "Unknown"}`
    );
    bot.activateEntity(nearestEntity);

    setTimeout(() => {
      selectTeleportOption();
    }, 3000);
  } else {
    console.log("No valid entities nearby!");
  }
}

function selectTeleportOption() {
  const inventory = bot.currentWindow;

  if (!inventory) {
    console.log("GUI not open, retrying...");
    setTimeout(selectTeleportOption, 2000);
    return;
  }

  console.log("GUI Opened! Listing all items:");
  inventory.slots.forEach((item, index) => {
    if (item) {
      console.log(`Slot ${index}: ${item.name} - ${item.displayName}`);
    }
  });

  const slot5 = inventory.slots[5];
  if (slot5 && slot5.name.includes("paper")) {
    console.log(`Clicking Slot 5: ${slot5.displayName}...`);
    bot.clickWindow(5, 0, 0);

    setTimeout(() => {
      clickCopperIngot();
    }, 3000);
  } else {
    console.log("Slot 5 does not contain paper.");
  }
}

function clickCopperIngot() {
  const inventory = bot.currentWindow;

  if (!inventory) {
    console.log("GUI not open, retrying...");
    setTimeout(clickCopperIngot, 2000);
    return;
  }

  const copperIngotSlot = inventory.slots.find(
    (item) => item && item.name.includes("copper_ingot")
  );

  if (copperIngotSlot) {
    console.log("Clicking Copper Ingot...");
    bot.clickWindow(copperIngotSlot.slot, 0, 0);
    const point1 = new Vec3(-1164, 12, -84); // Set your first point (x, y, z)
    const point2 = new Vec3(-1116, -18, -36); // Set your second point (x, y, z)
    setTimeout(() => startChunkMine(point1, point2), 6000);
  } else {
    console.log("Could not find Copper Ingot.");
  }
}

async function startChunkMine(point1, point2) {
  console.log("Starting chunk mining...");

  // Clear any existing pathfinding goals to avoid interference
  bot.pathfinder.stop();

  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  // Calculate the bounding box from point1 and point2
  const minX = Math.min(point1.x, point2.x);
  const maxX = Math.max(point1.x, point2.x);
  const minY = Math.min(point1.y, point2.y);
  const maxY = Math.max(point1.y, point2.y);
  const minZ = Math.min(point1.z, point2.z);
  const maxZ = Math.max(point1.z, point2.z);

  console.log(
    `Mining area from ${minX}, ${minY}, ${minZ} to ${maxX}, ${maxY}, ${maxZ}`
  );

  // Loop through the area between the two points
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const block = bot.blockAt(new Vec3(x, y, z));

        // Check if the block is not air before mining
        if (block && block.name !== "air") {
          console.log(`Mining block at ${x}, ${y}, ${z}`);
          bot.dig(block, () => {
            console.log(`Finished mining block at ${x}, ${y}, ${z}`);
            bot.collectBlock.collect(block); // Collect the mined block
          });
        }
      }
    }
  }
}

function cleanInventory() {
  const keepItems = ["ore", "ingot", "raw", "pickaxe"];
  bot.inventory.items().forEach((item) => {
    if (!keepItems.some((keep) => item.name.includes(keep))) {
      bot.tossStack(item, (err) => {
        if (err) console.log("Error dropping item:", item.name);
        else console.log("Dropped item:", item.name);
      });
    }
  });
}

bot.on("message", (message) => {
  console.log("Chat:", message.toString());
});
