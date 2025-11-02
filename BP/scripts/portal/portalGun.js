import {
  Direction,
  system,
  ItemStack,
  world,
} from "@minecraft/server";
import { openPortalGunMenu } from "../gui/menu";
import {
  findPortalGunInInventory,
  linkPortals,
  removePortal,
  removeAllPortals,
  savePortalList,
  spawnPortal,
  getRotationToPlayer,
  findNearbyAir,
} from "../utils/my_API";

import {
  ID,
  portalGuns,
  playerDP,
  portalGunDP,
  portalDP,
  PORTAL_MODES,
} from "../utils/ids&variables";

/**
 * Pauses execution for a specified number of ticks.
 * @param {number} ticks - The number of game ticks to wait (1 tick = 1/20 second).
 * @returns {Promise} - A promise that resolves after the specified ticks.
 */
function sleep(ticks) {
  return new Promise((resolve) => system.runTimeout(resolve, ticks));
}

/**
 * Waits for a specific chunk at a given location to load in the given dimension.
 * @param {Dimension} dimension - The dimension object where the chunk is located.
 * @param {Vector3} location - The location within the dimension to check for a loaded block.
 * @param {number} [timeoutTicks=100] - Maximum number of ticks to wait before timing out.
 * @returns {Promise<boolean>} - Resolves to true if the chunk is loaded, false if timeout occurs.
 */
export async function waitForChunkLoad(dimension, location, timeoutTicks = 100) {
  for (let i = 0; i < timeoutTicks; i++) {
    try {
      if (dimension.getBlock(location)) {
        return true;
      }
    } catch (e) {
      // Ignore errors, likely chunk not loaded yet
    }
    await sleep(1);
  }
  console.warn(
    `[PortalGun] Timeout while waiting for chunk to load at X: ${location.x}, Y: ${location.y}, Z: ${location.z}`
  );
  return false;
}

/**
 * Initializes a portal gun item with default dynamic properties.
 *
 * @param {ItemStack} portalGunItem - The portal gun item to initialize.
 * @returns {number} - The unique ID assigned to the portal gun.
 */
function initializePortalGun(portalGunItem) {
  //Verify if the portal gun is a charged one.
  if (ID.portalGunsIds.includes(portalGunItem.typeId)) {
    const charge = portalGunItem.getDynamicProperty(portalGunDP.charge);
    if (charge === undefined) {
      portalGunItem.setDynamicProperty(portalGunDP.charge, 100);
    } else {
      portalGunItem.setDynamicProperty(portalGunDP.charge, charge);
    }
  } else {
    portalGunItem.setDynamicProperty(portalGunDP.charge, 0);
  }
  const portalGunId = Math.floor(Math.random() * 10000);
  portalGunItem.setDynamicProperty(portalGunDP.mode, PORTAL_MODES.FIFO);
  portalGunItem.setDynamicProperty(portalGunDP.id, portalGunId);
  portalGunItem.setDynamicProperty(portalGunDP.highPressure, false);
  portalGunItem.setDynamicProperty(portalGunDP.autoClose, false);
  portalGunItem.setDynamicProperty(portalGunDP.safePlacement, true);
  portalGunItem.setDynamicProperty(portalGunDP.scale, 1);
  portalGunItem.setDynamicProperty(portalGunDP.portalList, JSON.stringify([]));
  return portalGunId;
}

/**
 * Validates the list of portals stored in a portal gun item.
 * Removes any portal IDs that no longer correspond to existing entities in the world.
 * Updates the portal gun item in the inventory if invalid portals were removed.
 *
 * @param {ItemStack} portalGunItem - The portal gun item containing the portal list to validate.
 * @param {Inventory} inventory - The inventory containing the portal gun item.
 * @param {number} slotIndex - The slot index in the inventory where the portal gun item is located.
 * @returns {Array<number>} - An array of valid portal entity IDs remaining after validation.
 */
function validatePortalList(portalGunItem, inventory, slotIndex) {
  const portalListJson = portalGunItem.getDynamicProperty(
    portalGunDP.portalList
  );
  let portalIds = portalListJson ? JSON.parse(portalListJson) : [];
  let validPortalIds = portalIds.filter((id) => !!world.getEntity(id));
  if (validPortalIds.length !== portalIds.length) {
    portalGunItem.setDynamicProperty(
      portalGunDP.portalList,
      JSON.stringify(validPortalIds)
    );
    inventory.container.setItem(slotIndex, portalGunItem);
  }
  return validPortalIds;
}

/**
 * Handles the use of a portal gun by a player.
 * Either opens the menu or fires a projectile depending on whether the player is sneaking.
 *
 * @param {Player} player - The player using the portal gun.
 * @param {ItemStack} portalGunItem - The portal gun item being used by the player.
 */
export function usePortalGun(player, portalGunItem) {
  const inventory = player.getComponent("inventory");
  if (!inventory || !inventory.container) {
    return;
  }
  let portalGunId = portalGunItem.getDynamicProperty(portalGunDP.id);

  // Initialize the portal gun if it has no ID yet
  if (portalGunId === undefined) {
    portalGunId = initializePortalGun(portalGunItem);
    inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
  }

  // Validate the portal list to remove invalid portal IDs
  validatePortalList(portalGunItem, inventory, player.selectedSlotIndex);
  if (player.isSneaking) {
    // player.runCommand("camera @s set minecraft:free ease 0.5 in_out_sine pos ~1 ~1.6 ~-1 rot 10 ~");
    openPortalGunMenu(player);
  } else {
    const charge = portalGunItem.getDynamicProperty(portalGunDP.charge);
    const scale = portalGunItem.getDynamicProperty(portalGunDP.scale);
    const cost = scale
    const gunObject = portalGuns.find((gun) => gun.id === portalGunItem.typeId);

    player.playAnimation("animation.ram_portalgun.player.portal_gun_shoot", {blendOutTime: 0.5});

    if (charge > 0) {
      portalGunItem = gunObject.decreaseCharge(
        player,
        portalGunItem,
        charge,
        cost
      );
      player.setDynamicProperty(playerDP.portalGunId, portalGunId);
      portalGunItem.setDynamicProperty(portalGunDP.lastUser, player.name);
      inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
      gunObject.fireProjectile(player, portalGunItem);
    } else {
      player.dimension.playSound(
        "ram_portalgun:empty_portal_gun",
        player.location
      );
    }
  }
}

/**
 * Updates the history of portal locations for a portal gun item.
 * Maintains a maximum of 30 entries, adding the newest location at the front of the history list.
 *
 * @param {ItemStack} portalGunItem - The portal gun item whose history is being updated.
 * @param {Vector3} location - The new portal location to add to the history.
 * @returns {ItemStack} - The updated portal gun item with the new history.
 */
function handlePortalGunHistory(portalGunItem, location) {
  const historyJson = portalGunItem.getDynamicProperty(
    portalGunDP.historyLocations
  );
  let history = historyJson ? JSON.parse(historyJson) : [];

  if (history.length >= 30) {
    history.pop();
  }

  history.unshift(location);
  portalGunItem.setDynamicProperty(
    portalGunDP.historyLocations,
    JSON.stringify(history)
  );
  return portalGunItem;
}

/**
 * Calculates the placement location, rotation, and orientation for a portal based on the player's target.
 * Can handle either a block or an entity as the target.
 *
 * @param {Player} player - The player who is placing the portal.
 * @param {Object} target - The target for portal placement. Can contain a "block" or an "entity" property.
 * @returns {Object|undefined} - Returns an object with { location, rotation, orientation } if valid, otherwise undefined.
 */
function getPortalPlacement(player, target) {
  if (!target) return;

  let rotation = 0,
    orientation = 0,
    location;

  if ("block" in target) {
    const block = target.block;
    if (!block?.isValid) {
      player.onScreenDisplay.setActionBar("§e[!] Block is not valid!");
      return;
    }
    const face = target.face;
    const ry = (player.getRotation().y + 180) % 360;

    switch (face) {
      case Direction.Up:
        location = block.above(1).center();
        orientation = 2;
        rotation = ry < 45 || ry >= 315 ? 0 : ry < 135 ? 1 : ry < 225 ? 2 : 3;
        break;
      case Direction.Down:
        location = block.below(1).center();
        orientation = 1;
        rotation = ry < 45 || ry >= 315 ? 0 : ry < 135 ? 1 : ry < 225 ? 2 : 3;
        break;
      case Direction.North:
        location = block.north(1).center();
        orientation = 0;
        rotation = 2;
        break;
      case Direction.West:
        location = block.west(1).center();
        orientation = 0;
        rotation = 1;
        break;
      case Direction.South:
        location = block.south(1).center();
        orientation = 0;
        rotation = 0;
        break;
      case Direction.East:
        location = block.east(1).center();
        orientation = 0;
        rotation = 3;
        break;
    }
    location.y -= 0.5;
  } else if ("entity" in target) {
    const entity = target.entity;
    if (!entity?.isValid) {
      player.onScreenDisplay.setActionBar("§e[!] Entity is not valid!");
      return;
    }
    location = entity.location;
    rotation = getRotationToPlayer(player, location);
    orientation = 0;
  }

  return { location, rotation, orientation };
}


/**
 * Ensures a safe placement location for a portal in the target dimension.
 * Tries to find a valid and non-hazardous position by checking solid ground or searching for nearby air blocks.
 * If lava or other unsafe conditions are detected, it warns the player.
 * 
 * @param {Dimension} targetDimension - The dimension where the portal will be placed.
 * @param {Vector3} customLocation - The initial target location for the portal.
 * @param {Vector3} fixedCustomLocation - A mutable version of the target location that can be adjusted for safety.
 * @param {Player} player - The player who is creating the portal.
 * @param {Entity} newPortal - The portal entity that was spawned.
 * @param {string} tickingAreaName - The name of the ticking area associated with the portal.
 * @returns {Vector3|undefined} - Returns a safe location vector if found; otherwise, returns undefined.
 */
function handleSafePlacement(targetDimension, customLocation, fixedCustomLocation, player, newPortal, tickingAreaName) {
  const block = targetDimension.getBlock(customLocation);

  if (!block) {
    player.sendMessage("§c[!] The target location is not loaded.§r");
    return;
  }
    // === Helper: warn player if lava exists directly below ===
  function warnIfLavaBelow(dimension, position, player) {
    const below = dimension.getBlock({ x: position.x, y: position.y - 1, z: position.z });
    if (below && (below.typeId === "minecraft:lava" || below.typeId === "minecraft:flowing_lava")) {
      const msg = "§e[!] WARNING: The target location is surrounded by lava.§r";
      player.sendMessage(msg);
    }
  }

  if (block && block.isAir) {
    let safeY = fixedCustomLocation.y;
    while (safeY > targetDimension.heightRange.min) {
      const groundBlock = targetDimension.getBlock({
        x: fixedCustomLocation.x,
        y: safeY - 1,
        z: fixedCustomLocation.z,
      });

      // Found solid ground?
      if (groundBlock && !groundBlock.isAir) {
        warnIfLavaBelow(targetDimension, { x: fixedCustomLocation.x, y: safeY, z: fixedCustomLocation.z }, player);
        fixedCustomLocation.y = safeY;
        return fixedCustomLocation;
      }
      safeY--;
    }
  } else {
    // First attempt: search for nearby air within radius 10
    let candidates = [];

    try {
      candidates = findNearbyAir(targetDimension, customLocation, 10);
    } catch (e) {
      player.sendMessage(
        "§c[!] Error finding a safe location for the portal.§r"
      );
      removePortal(newPortal, false);
      targetDimension.runCommand(`tickingarea remove "${tickingAreaName}"`);
      return;
    }

    if (candidates.length > 0) {
      // Sort candidates by distance from original location
      candidates.sort((a, b) => {
        const da =
          (a.x - fixedCustomLocation.x) ** 2 +
          (a.y - fixedCustomLocation.y) ** 2 +
          (a.z - fixedCustomLocation.z) ** 2;
        const db =
          (b.x - fixedCustomLocation.x) ** 2 +
          (b.y - fixedCustomLocation.y) ** 2 +
          (b.z - fixedCustomLocation.z) ** 2;
        return da - db;
      });

      const best = candidates[0];
      fixedCustomLocation.x = best.x + 0.5;
      fixedCustomLocation.y = best.y;
      fixedCustomLocation.z = best.z + 0.5;

      warnIfLavaBelow(targetDimension, best, player);
      return fixedCustomLocation;
    } else {
      // Fallback: vertical scan upwards until air is found
      const maxHeight = targetDimension.heightRange.max;
        const maxScan = Math.min(maxHeight, fixedCustomLocation.y + 40); // limit scan to +40 blocks for performance
      while (fixedCustomLocation.y < maxScan) {
        const block = targetDimension.getBlock(fixedCustomLocation);
        if (block && (block.isAir || block.typeId === "minecraft:water")) {
          warnIfLavaBelow(targetDimension, fixedCustomLocation, player);
          return fixedCustomLocation;
        }
        fixedCustomLocation.y++;
      }
    }
  }
  return undefined;
}

/**
 * Handles custom portal mode placement for a portal gun.
 * It manages ticking areas, safe placement checks, and portal linking across dimensions.
 * 
 * @param {Player} player - The player using the portal gun.
 * @param {ItemStack} portalGunItem - The portal gun item instance.
 * @param {Object} itemObject - Item slot info {slotIndex, ...}.
 * @param {Container} inventory - Player inventory container.
 * @param {Entity} newPortal - The newly created local portal entity.
 * @param {string[]} portalIds - The current list of linked portals.
 * @param {number} orientation - The current facing/orientation of the portal.
 * @param {number} rotation - The portal's visual rotation.
 * @param {number} scale - The portal's scale.
 * @param {string} portalGunId - Unique ID of the current portal gun.
 * @param {string} portalId - Unique ID for the portal being created.
 */
function handleCustomMode(player, portalGunItem, itemObject, inventory, newPortal, portalIds, orientation, rotation, scale, portalGunId, portalId) {
  const locJson = portalGunItem.getDynamicProperty(portalGunDP.customLocation);
  if (!locJson) return removePortal(newPortal, false);

  const loc = JSON.parse(locJson);
  const fixedLoc = { ...loc };
  const locId = loc.id;
  const safePlacement = portalGunItem.getDynamicProperty(portalGunDP.safePlacement);
  const autoClose = portalGunItem.getDynamicProperty(portalGunDP.autoClose);
  const dim = world.getDimension(loc.dimensionId);
  const tickingAreaName = `portal_${player.name}_${Math.floor(Math.random() * 10000)}`;

  if (portalIds.length > 1) {
    const root = world.getEntity(portalIds[0]);
    if (locId !== root?.getDynamicProperty(portalDP.locationId)) {
      removeAllPortals(player, portalGunItem, itemObject.slotIndex);
      portalIds = [newPortal.id];
    } else {
      newPortal.setDynamicProperty(portalDP.isRoot, false);
      linkPortals(portalIds[0], newPortal.id);
      root.setDynamicProperty(portalDP.childList, JSON.stringify([...portalIds, newPortal.id]));
      savePortalList(portalGunItem, portalIds, player, inventory, itemObject.slotIndex);
      return;
    }
  }

  try {
    dim.runCommand(`tickingarea add circle ${fixedLoc.x} ${fixedLoc.y} ${fixedLoc.z} 1 "${tickingAreaName}"`);
  } catch {
    removePortal(newPortal, false);
    return;
  }
  

  system.run(async () => {
    const chunkLoaded = await waitForChunkLoad(dim, loc);
    if (!chunkLoaded) {
      removePortal(newPortal, false);
      dim.runCommand(`tickingarea remove "${tickingAreaName}"`);
      return;
    }

    if (safePlacement) {
      const safe = handleSafePlacement(dim, loc, fixedLoc, player, newPortal, tickingAreaName);
      if (!safe) {
        removePortal(newPortal, false);
        dim.runCommand(`tickingarea remove "${tickingAreaName}"`);
        return;
      }
      Object.assign(fixedLoc, safe);
    }

    let customOri = orientation === 1 ? 2 : orientation === 2 ? (fixedLoc.y += 2, 1) : 0;
    const customPortal = spawnPortal(portalId, dim, fixedLoc, rotation, customOri, scale, portalGunId, autoClose);
    if (!customPortal) {
      removePortal(newPortal, false);
      dim.runCommand(`tickingarea remove "${tickingAreaName}"`);
      return;
    }

    portalIds = [customPortal.id, newPortal.id];

    customPortal.setDynamicProperty(portalDP.locationId, locId);
    customPortal.setDynamicProperty(portalDP.tickingArea, tickingAreaName);
    customPortal.setDynamicProperty(portalDP.isRoot, true);
    customPortal.setDynamicProperty(portalDP.childList, JSON.stringify(portalIds));
  

    linkPortals(customPortal.id, newPortal.id);
    portalGunItem.setDynamicProperty(portalGunDP.portalList, JSON.stringify(portalIds));
    portalGunItem = handlePortalGunHistory(portalGunItem, loc);
    inventory.container.setItem(itemObject.slotIndex, portalGunItem);

    system.runTimeout(() => {
      dim.runCommand(`tickingarea remove "${tickingAreaName}"`);
    }, 60);
  });
}

/**
 * Summons a new portal based on the player's current target and the active Portal Gun mode.
 * Determines placement, creates a portal entity, manages portal linking logic,
 * and updates the Portal Gun's portal list accordingly.
 *
 * @param {Player} player - The player using the Portal Gun.
 * @param {Object} target - The target block or entity data returned from a raycast or selection event.
 */
export function summonPortal(player, target) {
  const placement = getPortalPlacement(player, target);
  if (!placement) {
    player.sendMessage("§c[!] Invalid target for portal placement.§r");
    return;
  }
  const { location, rotation, orientation } = placement;

  system.run(() => {
    const inventory = player.getComponent("inventory");
    if (!inventory || !inventory.container) {
      return;
    }

    const ownerId = player.getDynamicProperty(playerDP.portalGunId);
    const itemObject = findPortalGunInInventory(player, ownerId);
    const portalGunItem = itemObject?.item;
    if (!portalGunItem) {
      player.sendMessage("§c[!] Portal Gun not found in inventory.");
      return;
    }

    const gunInstance = portalGuns.find(
      (gun) => gun.id === portalGunItem.typeId || gun.dischargedVersionId === portalGunItem.typeId || gun.baseId === portalGunItem.typeId
    );

    const portalGunMode = portalGunItem.getDynamicProperty(portalGunDP.mode);
    const portalGunId = portalGunItem.getDynamicProperty(portalGunDP.id);
    const scale = portalGunItem.getDynamicProperty(portalGunDP.scale);
    const autoClose = portalGunItem.getDynamicProperty(portalGunDP.autoClose);

    const portalListJson = portalGunItem.getDynamicProperty(
      portalGunDP.portalList
    );
    let portalIds = portalListJson ? JSON.parse(portalListJson) : [];

    let newPortal = spawnPortal(gunInstance.portalId, player.dimension, location, rotation, orientation, scale, portalGunId, autoClose);
    if (!newPortal) {
      player.sendMessage("§c[!] Failed to spawn portal.§r");
      return;
    }

    portalIds.push(newPortal.id);

    switch (portalGunMode) {
      case PORTAL_MODES.FIFO:
        if (portalIds.length == 2) {
          linkPortals(portalIds[0], portalIds[1]);
        }
        if (portalIds.length > 2) {
          const oldestPortalId = portalIds.shift();
          const oldestPortal = world.getEntity(oldestPortalId);
          if (oldestPortal) {
            removePortal(oldestPortal, false);
          }
          linkPortals(portalIds[0], portalIds[1]);
        }
        savePortalList(
          portalGunItem,
          portalIds,
          player,
          inventory,
          itemObject.slotIndex
        );
        break;

      case PORTAL_MODES.LIFO:
        if (portalIds.length == 2) {
          linkPortals(portalIds[0], portalIds[1]);
        }
        if (portalIds.length > 2) {
          const newerPortalId = portalIds.splice(1, 1)[0];
          const newerPortal = world.getEntity(newerPortalId);
          if (newerPortal) {
            removePortal(newerPortal, false);
          }
          linkPortals(portalIds[0], portalIds[1]);
        }
        savePortalList(
          portalGunItem,
          portalIds,
          player,
          inventory,
          itemObject.slotIndex
        );
        break;

      case PORTAL_MODES.MULTI_PAIR:
        if (portalIds.length % 2 == 0) {
          linkPortals(
            portalIds[portalIds.length - 2],
            portalIds[portalIds.length - 1]
          );
        }
        savePortalList(
          portalGunItem,
          portalIds,
          player,
          inventory,
          itemObject.slotIndex
        );
        break;

      case PORTAL_MODES.ROOT:
        if (portalIds.length > 1) {
          const rootPortal = world.getEntity(portalIds[0]);
          rootPortal.setDynamicProperty(portalDP.childList, JSON.stringify(portalIds));
          newPortal.setDynamicProperty(portalDP.isRoot, false);
          linkPortals(portalIds[0], portalIds[portalIds.length - 1]);
        } else {
          newPortal.setDynamicProperty(portalDP.isRoot, true);
          newPortal.setDynamicProperty(portalDP.childList, JSON.stringify(portalIds));
        }
        savePortalList(
          portalGunItem,
          portalIds,
          player,
          inventory,
          itemObject.slotIndex
        );
        break;

      case PORTAL_MODES.CUSTOM:
        handleCustomMode(
          player,
          portalGunItem,
          itemObject,
          inventory,
          newPortal,
          portalIds,
          orientation,
          rotation,
          scale,
          portalGunId,
          gunInstance.portalId
        );
        break;

      default:
        break;
    }
  });
}