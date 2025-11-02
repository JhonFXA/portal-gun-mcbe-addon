import { world, system, MolangVariableMap, BlockVolume } from "@minecraft/server";
import {
  portalSP,
  portalDP,
  ID,
  portalGunDP,
  portalGuns
} from "../utils/ids&variables";

/**
 * Calculates the Euclidean distance between two 3D locations.
 *
 * @param {Object} location1 - The first location.
 * @param {Object} location2 - The second location.
 * @returns {number} The distance between the two locations.
 */
export function calculateEuclideanDistance(location1, location2) {
  let deltaX = location1.x - location2.x;
  let deltaY = location1.y - location2.y;
  let deltaZ = location1.z - location2.z;
  let distance = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);
  return distance;
}


/**
 * Changes the mode of a Portal Gun and optionally removes all active portals linked to it.
 *
 * @param {Player} player - The player holding the Portal Gun.
 * @param {EntityInventoryComponent} inventory - The player’s inventory container.
 * @param {ItemStack} portalGunItem - The Portal Gun item being modified.
 * @param {string} mode - The new mode to set for the Portal Gun.
 * @param {boolean} [removePortals=true] - Whether to remove all portals linked to this Portal Gun.
 */
export function changePortalGunMode(player, inventory, portalGunItem, mode, removePortals = true) {
  portalGunItem.setDynamicProperty(portalGunDP.mode, mode);
  player.dimension.playSound("ram_portalgun:selection", player.location);
  if (removePortals)
    removeAllPortals(player, portalGunItem);
  inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
}

/**
 * Spawns a new portal entity in the specified dimension and location.
 * 
 * @param {string} portalId - The ID of the portal entity to spawn.
 * @param {Dimension} dimension - The dimension where the portal will be created.
 * @param {Vector3} location - The world location to spawn the portal.
 * @param {number} rotation - The portal's rotation index (0–3).
 * @param {number} orientation - The orientation of the portal (0 = vertical).
 * @param {number} scale - The portal’s size.
 * @param {string} ownerId - The ID of the player or entity that owns this portal.
 * @param {boolean} [autoClose=false] - Whether the portal should automatically close after a delay.
 * @returns {Entity} The newly created portal entity.
 */
export function spawnPortal(portalId, dimension, location, rotation, orientation, scale, ownerId, autoClose = false) {
  const variables = new MolangVariableMap();
  if(orientation == 0){
    variables.setFloat("variable.ray_orientation", 1);
  } else {
    variables.setFloat("variable.ray_orientation", 0);
  }

  const searchArea = {
    location: location,
    maxDistance: 1
  };
  const queryOptions = {
    ...searchArea,

    excludeTypes: ["minecraft:player", ...ID.portals] 
  };

  if(orientation == 0){
    const blockBelow = dimension.getBlock({ x: location.x, y: location.y - 1, z: location.z });
    if(scale == 1){
      if (blockBelow && blockBelow.typeId !== "minecraft:air") {
        location.y++;
      }
    } else if (scale > 1){
      if (blockBelow && blockBelow.typeId !== "minecraft:air") {
        location.y += 2;
      }
    }
  }

  let newPortal = dimension.spawnEntity(portalId, location);
  newPortal.setProperty(portalSP.rotation, rotation);
  newPortal.setProperty(portalSP.orientation, orientation);
  newPortal.setProperty(portalSP.scale, scale);
  newPortal.setDynamicProperty(portalDP.ownerPortalGun, ownerId);
  newPortal.setDynamicProperty(portalDP.autoClose, autoClose);

  const entitiesToDamage = newPortal.dimension.getEntities(queryOptions);
  for (const entity of entitiesToDamage) entity.applyDamage(20);

  newPortal.dimension.spawnParticle("ram_portalgun:portal_ray_particle", newPortal.location, variables);
  return newPortal;
}

/**
 * Links two portals together so that entities can travel between them.
 *
 * @param {string} portalAId - The unique ID of the first portal entity.
 * @param {string} portalBId - The unique ID of the second portal entity.
 */
export function linkPortals(portalAId, portalBId) {
  const portalA = world.getEntity(portalAId);
  const portalB = world.getEntity(portalBId);
  if (portalA && portalB) {
    portalA.setDynamicProperty(portalDP.DualityPortalId, portalB.id);
    portalB.setDynamicProperty(portalDP.DualityPortalId, portalA.id);
  }
}

/**
 * Removes a water or lava block at a given location, if present.
 *
 * @param {Dimension} dimension - The dimension where the block is located.
 * @param {Vector3} location - The coordinates of the block to check and remove.
 */
function removeFluidBlockAtLocation(dimension, location) {
  const block = dimension.getBlock(location);
  const isInWater =
    block.typeId === "minecraft:water" ||
    block.typeId === "minecraft:flowing_water";
  const isInLava =
    block.typeId === "minecraft:lava" ||
    block.typeId === "minecraft:flowing_lava";
  if (isInWater || isInLava) {
    dimension.runCommand(
      `setblock ${location.x} ${location.y} ${location.z} air`
    );
  }
} 

/**
 * Removes a portal entity with its closing animation, optionally also removing its linked (dual) portal.
 *
 * @param {Entity} portalEntity - The portal entity to remove.
 * @param {boolean} [mustRemoveDual=true] - Whether the linked (dual) portal should also be removed.
 */
export function removePortal(portalEntity, mustRemoveDual = true) {
  let animation_length = 0.46;
  const tickDelay = animation_length * 20; 
  
  let dualPortalID = portalEntity.getDynamicProperty(portalDP.DualityPortalId);
  let dualPortal;
  if (dualPortalID && mustRemoveDual){ 
    dualPortal = world.getEntity(dualPortalID);
    if(dualPortal){
      removeFluidBlockAtLocation(dualPortal.dimension, dualPortal.location);
      dualPortal.setProperty(portalSP.close, true);
    }
  }

  removeFluidBlockAtLocation(portalEntity.dimension, portalEntity.location);
  portalEntity.setProperty(portalSP.close, true);

  system.runTimeout(()=>{
    portalEntity.remove();
    if (mustRemoveDual){
      if(dualPortal) dualPortal.remove();
    }
  }, tickDelay);
}

/**
 * Removes all portals linked to a given Portal Gun item.
 * Each portal is removed using {@link removePortal}.
 *
 * @param {Entity} player - The player holding the Portal Gun.
 * @param {ItemStack} portalGunItem - The Portal Gun item whose portals should be removed.
 * @param {number} [slotIndex=player.selectedSlotIndex] - The inventory slot index of the Portal Gun.
 */
export function removeAllPortals(player, portalGunItem, slotIndex = player.selectedSlotIndex) {
  const inventory = player.getComponent("inventory");
  const portalListJson = portalGunItem.getDynamicProperty(portalGunDP.portalList);
  let portalIds = portalListJson ? JSON.parse(portalListJson) : [];

  if (portalIds.length > 0) {
    portalIds.forEach(portalId => {
      const portalEntity = world.getEntity(portalId);
      if (portalEntity) {
        removePortal(portalEntity, false);
      }
    });

    portalIds = [];
    savePortalList(portalGunItem, portalIds, player, inventory, slotIndex);
  }
}

export function savePortalList(
  portalGunItem,
  portalIds,
  player,
  inventory,
  slotIndex = player.selectedSlotIndex
) {
  portalGunItem.setDynamicProperty(
    portalGunDP.portalList,
    JSON.stringify(portalIds)
  );
  inventory.container.setItem(slotIndex, portalGunItem);
}

export function findPortalGunInInventory(player, portalGunId) {
  const inventory = player.getComponent("inventory");
  if (!inventory || !inventory.container) {
    return undefined;
  }
  const container = inventory.container;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);

    if (item && (portalGuns.some(gun => gun.id === item.typeId) || ID.dischargedPortalGuns.includes(item.typeId) || ID.components.portalGunBases.includes(item.typeId))) {
      let gunId = item.getDynamicProperty(portalGunDP.id);
      if (gunId == portalGunId) return { item, slotIndex: i };
    }
  }
  return undefined;
}

export function findItemInInventory(player, itemId) {
  const inventory = player.getComponent("inventory");
  if (!inventory || !inventory.container) {
    return undefined;
  }
  const container = inventory.container;
  for (let i = 0; i < container.size; i++) {
    const itemStack = container.getItem(i);
    
    if (itemStack && itemStack.typeId === itemId) {
      return { itemStack, slotIndex: i };
    }
  }
  return undefined;
}

export function getRotationToPlayer(player, entityLocation) {
  const playerLocation = player.location;
  const dx = playerLocation.x - entityLocation.x;
  const dz = playerLocation.z - entityLocation.z;

  const angle = Math.atan2(dz, dx) * (180 / Math.PI);

  const normalizedAngle = (angle + 360) % 360;

  if (normalizedAngle >= 315 || normalizedAngle < 45) {
    return 3;
  } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
    return 0;
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    return 1;
  } else {
    return 2;
  }
}

export function findNearbyAir(dimension, center, radius = 10) {
  const volume = new BlockVolume(
    {
      x: center.x - radius,
      y:  center.y - radius,
      z: center.z - radius,
    },
    {
      x: center.x + radius,
      y: center.y + radius,
      z: center.z + radius,
    }
  );

  const locations = [];
  try{
    const airBlocks = dimension.getBlocks(volume, { includeTypes: ["minecraft:air", "minecraft:water"] });
    for (const loc of airBlocks.getBlockLocationIterator()) {
      locations.push({ x: loc.x, y: loc.y, z: loc.z });
    }
  } catch (e){
    console.error(e)
  }


  return locations;
}