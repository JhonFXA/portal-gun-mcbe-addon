import {system, world} from "@minecraft/server";
import { portalGunDP, portalDP, portalSP} from "../utils/ids&variables";
import { calculateEuclideanDistance, findPortalGunInInventory, linkPortals, removePortal, dealPortalFluidDamage} from "../utils/my_API";

const TELEPORTED_TAG = "ram_portalgun:teleported";
const OBJECTIVE_ID = "ram_portalgun:cooldownTime";


// Handles teleport cooldown tags for entities in all dimensions
// Removes the TELEPORTED_TAG when the entity is ready to teleport again
export function tagHandling() {
    const dimensions = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];
    
    dimensions.forEach(dimId => {
        const dimension = world.getDimension(dimId);
        const entities = dimension.getEntities({ tags: [TELEPORTED_TAG] });

        entities.forEach(entity => {
            if (isOnCooldown(entity)) return; // Skip entities still on cooldown

            const lastPortalId = entity.getDynamicProperty(portalDP.lastPortalUsed);
            const lastPortal = lastPortalId && world.getEntity(lastPortalId);

            // Remove tag if no last portal, portal no longer exists, or dimensions differ
            if (!lastPortal || entity.dimension.id !== lastPortal.dimension.id) {
                entity.removeTag(TELEPORTED_TAG);
                return;
            }

            // Remove tag if entity is far enough from the last portal
            const distance = calculateEuclideanDistance(entity.location, lastPortal.location);
            const maxDistance = lastPortal.getProperty(portalSP.scale) > 1 ? 3 : 2;
            if (distance >= maxDistance) {
                entity.removeTag(TELEPORTED_TAG);
            }
        });
    });
}


// Decrease cooldowns for all participants and remove expired entries
export function runCooldown() {
    const scoreboard =
        world.scoreboard.getObjective(OBJECTIVE_ID) ??
        world.scoreboard.addObjective(OBJECTIVE_ID, OBJECTIVE_ID);

    scoreboard.getParticipants().forEach(participant => {
        const cooldown = scoreboard.getScore(participant) - 1;

        if (cooldown < 0) {
            scoreboard.removeParticipant(participant); // Remove expired cooldown
        } else {
            scoreboard.setScore(participant, cooldown); // Update remaining cooldown
        }
    });
}

// Called every tick to handle portals: teleportation, animations, fluids
export function onTick() {
    const dimensions = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

    dimensions.forEach(dimId => {
        const dimension = world.getDimension(dimId);
        const portals = dimension.getEntities({ families: ["ram_portalgun:portal"] });

        portals.forEach(portal => {
            const dualityPortalId = portal.getDynamicProperty(portalDP.DualityPortalId);
            const dualPortal = dualityPortalId
                ? world.getEntity(dualityPortalId)
                : null;

            const isLinked = !!dualPortal;
            portal.setProperty(portalSP.isLinked, isLinked);

            if (isLinked) {
                handlePortalFluids(portal, dualPortal);
            }

            const radius = getPortalRadius(portal);
            let nearbyEntities = findEntitiesNearPortal(
                portal.dimension,
                portal.location,
                radius
            );

            // Filter for small-scale portals
            if (portal.getProperty(portalSP.scale) < 1) {
                nearbyEntities = filterSmallEntities(nearbyEntities);
            }

            nearbyEntities = nearbyEntities.filter(entity => {
                const isRiding = entity.hasComponent("minecraft:riding");
                return !isRiding;
            });

            const bootleggedPortal =
                portal.getDynamicProperty(portalDP.bootleggedFluid) === true;

            nearbyEntities.forEach(entity => {
                if (bootleggedPortal) {
                    if (entity.typeId === "minecraft:item") return;

                    dealPortalFluidDamage(entity);

                    const { y: yaw } = entity.getRotation();
                    const yawRad = yaw * Math.PI / 180;

                    const x = Math.sin(yawRad) * 2;
                    const z = -Math.cos(yawRad) * 2;

                    entity.applyKnockback({ x, z }, 0.3);
                    activateCooldown(entity);
                    entity.addTag(TELEPORTED_TAG);
                    return;
                }

                if (!isLinked) return;

                playPortalAnimation(portal, dualPortal);

                if (entity.typeId !== "minecraft:player") {
                    activateCooldown(entity);
                    entity.setDynamicProperty(
                        portalDP.lastPortalUsed,
                        dualPortal.id
                    );
                    entity.addTag(TELEPORTED_TAG);
                    teleportEntityToLocation(portal, dualPortal, entity);
                } else {
                    playerUsePortal(portal, dualPortal, entity);
                }
            });
        });
    });
}

/**
 * Handle water or lava interaction for a portal.
 * @param {Entity} portal - The portal entity to check for fluid interactions.
 * @param {Entity} dualPortal - The linked portal entity.
 */
function handlePortalFluids(portal, dualPortal) {
    const block = portal.dimension.getBlock(portal.location);
    const fluids = {
        water: ['minecraft:water', 'minecraft:flowing_water'],
        lava: ['minecraft:lava', 'minecraft:flowing_lava']
    };

    if (fluids.water.includes(block.typeId)) {
        portal.teleport(portal.location);
        dualPortal.dimension.runCommand(`setblock ${dualPortal.location.x} ${dualPortal.location.y} ${dualPortal.location.z} flowing_water`);
    } else if (fluids.lava.includes(block.typeId)) {
        portal.teleport(portal.location);
        dualPortal.dimension.runCommand(`setblock ${dualPortal.location.x} ${dualPortal.location.y} ${dualPortal.location.z} flowing_lava`);
    }
}

/**
 * Calculate the detection radius of a portal based on scale and orientation.
 * @param {Entity} portal - The portal entity to calculate radius for.
 * @return {number} The radius around the portal for entity detection.
 */
function getPortalRadius(portal) {
    const scale = portal.getProperty(portalSP.scale);
    const orientation = portal.getProperty(portalSP.orientation);

    if (scale === 0.5) return 0.8;
    if (scale === 1) return orientation === 0 ? 1.2 : 1;
    if (scale > 1) return orientation === 0 ? 2.2 : 2;
    return 1;
}

/**
 * Filter entities allowed to pass through small-scale portals.
 * @param {Array<Entity>} entities - Array of entity objects near the portal.
 * @return {Array<Entity>} Filtered array of entities allowed to teleport.
 */
function filterSmallEntities(entities) {
    return entities.filter(entity => {
        if (entity.typeId === "minecraft:item") return true;

        const typeFamily = entity.getComponent("minecraft:type_family");
        const isBaby = entity.hasComponent("minecraft:is_baby");

        const allowedFamily =
            typeFamily.hasTypeFamily("minecart") ||
            typeFamily.hasTypeFamily("lightweight") ||
            typeFamily.hasTypeFamily("fish") ||
            typeFamily.hasTypeFamily("tnt") || 
            typeFamily.hasTypeFamily("player");

        return isBaby || allowedFamily;
    });
}

/**
 * Play the portal pass animation on both portals.
 * @param {Entity} portal - The first portal entity.
 * @param {Entity} dualPortal - The linked portal entity.
 */
function playPortalAnimation(portal, dualPortal) {
    const animation_length = 0.4; // duration in seconds
    const tickDelay = animation_length * 20; // convert to game ticks (20 ticks/sec)
    portal.playAnimation("animation.ram_portalgun.portal.pass");
    system.runTimeout(() => {
        dualPortal?.playAnimation("animation.ram_portalgun.portal.pass");
    }, tickDelay);
}


/**
 * Responsible for playing player animations when entering a portal.
 * @param {Entity} portal 
 * @param {Player} player 
 */
function playInAnimation(portal, player) {
    const orientation = portal.getProperty(portalSP.orientation);
    let animation;
    switch (orientation) {
        case 0: {
            // Determine if the player is looking toward the portal (front) or away (back)
            const pPos = player.location;
            const qPos = portal.location;

            // Horizontal vector from player to portal
            const vx = qPos.x - pPos.x;
            const vz = qPos.z - pPos.z;
            const len = Math.hypot(vx, vz) || 1;
            const nx = vx / len;
            const nz = vz / len;

            // Player look horizontal vector from yaw (degrees -> radians)
            const yawRad = (player.getRotation().y * Math.PI) / 180;
            const lookX = -Math.sin(yawRad);
            const lookZ = Math.cos(yawRad);

            const dot = lookX * nx + lookZ * nz;

            // If dot > 0 player is looking toward the portal position -> front animation
            animation = dot > 0
                ? "animation.ram_portalgun.player.portal_in_front"
                : "animation.ram_portalgun.player.portal_in_back";
            break;
        }
        case 1: {
            animation = "animation.ram_portalgun.player.portal_in_up";
            break;
        }
        case 2: {
            animation = player.isSprinting ? "animation.ram_portalgun.player.portal_in_down_dive" : "animation.ram_portalgun.player.portal_in_down";
            break;
        }
        default: {
            animation = "animation.ram_portalgun.player.portal_in_front";
        }
    }
    player.playAnimation(animation);
}


/**
 * Responsible for playing player animations when leaving a portal.
 * @param {Entity} portal 
 * @param {Player} player 
 */
function playOutAnimation(portal, player) {
    const orientation = portal.getProperty(portalSP.orientation);
    let animation;
    switch (orientation) {
        case 0: {
            animation = "animation.ram_portalgun.player.portal_out_front"
            break;
        }
        case 1: {
            animation = "animation.ram_portalgun.player.portal_out_up"
            break;
        }
        case 2: {
            animation = "animation.ram_portalgun.player.portal_out_down"
            break;
        }
    }
    player.playAnimation(animation);
}

/**
 * Teleports a player through a portal while handling animations, cooldown, and auto-close portal logic.
 * @param {Entity} portal - The portal entity the player entered.
 * @param {Entity} dualPortal - The linked portal entity the player will teleport to.
 * @param {Entity} player - The player entity that is being teleported.
 */
function playerUsePortal(portal, dualPortal, player) {
    const animation_length = 0.4; // duration in seconds
    const tickDelay = animation_length * 20; // convert to game ticks (20 ticks/sec)
    const cooldown = 30 + tickDelay;

    // Activate cooldown to prevent rapid re-entry
    activateCooldown(player, cooldown);
    player.setDynamicProperty(portalDP.lastPortalUsed, dualPortal.id);
    player.addTag(TELEPORTED_TAG);

    playInAnimation(portal, player);

    const portalGunId = portal.getDynamicProperty(portalDP.ownerPortalGun); 
    const portalGunItem = findPortalGunInInventory(player, portalGunId)?.item;
    if (portalGunItem) {
        const autoClose = portalGunItem.getDynamicProperty(portalGunDP.behavior.autoClose);
        if (autoClose) {
            portal.setDynamicProperty(portalDP.autoClose, true);
            dualPortal.setDynamicProperty(portalDP.autoClose, true);
        }
    }
        

    // Delay actual teleport to match animation
    system.runTimeout(() => {
        teleportEntityToLocation(portal, dualPortal, player);
        playOutAnimation(dualPortal, player);
    }, tickDelay);
}

/**
 * Checks if an entity is currently on the portal cooldown.
 * @param {Entity} entity - The entity to check for cooldown.
 * @return {boolean} True if the entity is on cooldown, false otherwise.
 */
function isOnCooldown(entity) {
    let scoreboard = world.scoreboard.getObjective(OBJECTIVE_ID);
    if (scoreboard === undefined) {
        scoreboard = world.scoreboard.addObjective(OBJECTIVE_ID, OBJECTIVE_ID);
    }
    return scoreboard.hasParticipant(entity);
}

/**
 * Activates a cooldown for an entity to prevent immediate re-teleportation.
 * @param {Entity} entity - The entity to activate the cooldown for.
 * @param {number} ticks - Duration of the cooldown in ticks (default: 20 ticks).
 */
function activateCooldown(entity, ticks = 20) {
    let scoreboard = world.scoreboard.getObjective(OBJECTIVE_ID);
    if (scoreboard === undefined) {
        scoreboard = world.scoreboard.addObjective(OBJECTIVE_ID, OBJECTIVE_ID);
    }
    scoreboard.setScore(entity, ticks);
}

/**
 * Finds nearby entities around a portal that are eligible for teleportation.
 * Excludes certain entity families and entities on cooldown.
 * @param {Dimension} dimension - The dimension to search in.
 * @param {Vector3} location - The center location to search around.
 * @param {number} radius - The search radius.
 * @return {Array<Entity>} An array of entities near the portal eligible for teleport.
 */
function findEntitiesNearPortal(dimension, location, radius) {
    const excludeFamilies = ["ram_portalgun:portal", "ram_portalgun:projectile", "dragon"];

    const queryOptions = {
        location,
        maxDistance: radius,
        excludeFamilies
    };
    return dimension.getEntities(queryOptions).filter(entity => {
        return !isOnCooldown(entity) && !entity.hasTag(TELEPORTED_TAG);
    });
}

/**
 * Teleports an entity to the linked portal's location, adjusting orientation and rotation.
 * @param {Entity} portal - The portal that the entity used.
 * @param {Entity} dualPortal - The destination portal entity.
 * @param {Entity} entity - The entity to teleport.
 */
function teleportEntityToLocation(portal, dualPortal, entity) {
    const orientation = dualPortal.getProperty(portalSP.orientation);
    const rotation = dualPortal.getProperty(portalSP.rotation);
    const scale = dualPortal.getProperty(portalSP.scale);
    let ry = entity.getRotation().y;

    let tpLocation = { 
        x: dualPortal.location.x, 
        y: dualPortal.location.y, 
        z: dualPortal.location.z 
    };

    if (orientation === 0) {
        if (scale >= 1) tpLocation.y -= 1;

        switch (rotation) {
            case 0: ry = 0;  break;
            case 1: ry = 90; break;
            case 2: ry = 180; break;
            case 3: ry = -90; break;
        }
    }

    const differentDimension = portal.dimension.id !== dualPortal.dimension.id;
    if (differentDimension && orientation === 0) {
        const offsetDistance = 1;
        let offset = { x: 0, z: 0 };

        switch (rotation) {
            case 0: offset.z = -offsetDistance; break;
            case 1: offset.x = offsetDistance; break;
            case 2: offset.z = offsetDistance; break;
            case 3: offset.x = -offsetDistance; break;
        }

        tpLocation.x += offset.x;
        tpLocation.z += offset.z;
    }

    try {
        entity.teleport(tpLocation, {
            dimension: dualPortal.dimension,
            rotation: { x: entity.getRotation().x, y: ry }
        });
    } catch (error) {
        world.sendMessage(`§c[Portal Gun] Failed to teleport entity: \n§e[!] ${error}§r`);
    }

    const autoClose = dualPortal.getDynamicProperty(portalDP.autoClose) || portal.getDynamicProperty(portalDP.autoClose);
    if (!autoClose) return;

    const dualPortalIsRoot = dualPortal.getDynamicProperty(portalDP.isRoot);

    system.runTimeout(() => {
        if (dualPortalIsRoot === undefined) return removePortal(dualPortal, true);

        const rootPortal = dualPortalIsRoot ? dualPortal : portal;
        const childListJson = rootPortal.getDynamicProperty(portalDP.childList);
        const childList = childListJson ? JSON.parse(childListJson) : [];

        if (childList.length > 2) {
            const portalToRemove = dualPortalIsRoot ? portal : dualPortal;

            const idx = childList.indexOf(portalToRemove.id);
            if (idx !== -1) childList.splice(idx, 1);
            rootPortal.setDynamicProperty(portalDP.childList, JSON.stringify(childList));

            linkPortals(childList[0], childList[childList.length - 1]);
            removePortal(portalToRemove, false);
        } else removePortal(dualPortal, true);
    }, 30);
}
