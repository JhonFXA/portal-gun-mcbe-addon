import { ItemStack, world } from "@minecraft/server";
import { findPortalGunInInventory } from "../utils/my_API";
import { portalGunDP } from "../utils/ids&variables";
import { openPortalGunMenu } from "../gui/pg_menu";

export class PortalGun {
  constructor({
    typeId,
    baseId,
    dischargedVersionId,
    emptyTubeId,
    chargedTubeId,
    bootlegTubeId,
    projectileId,
    bootlegProjectileId,
    highPressureProjectileId,
    highPressureBootlegProjectileId,
    portalId,
    interfaceTextures,
  }) {
    this.typeId = typeId;
    this.baseId = baseId;
    this.dischargedVersionId = dischargedVersionId;
    this.emptyTubeId = emptyTubeId;
    this.chargedTubeId = chargedTubeId;
    this.bootlegTubeId = bootlegTubeId;
    this.projectileId = projectileId;
    this.bootlegProjectileId = bootlegProjectileId;
    this.highPressureProjectileId = highPressureProjectileId;
    this.highPressureBootlegProjectileId = highPressureBootlegProjectileId;
    this.portalId = portalId;
    this.interfaceTextures = interfaceTextures;
  }

  openInterface(player, portalGunItem) {
    try {
      openPortalGunMenu(player, portalGunItem, this);
    } catch (error) {
      player.sendMessage(
        `§c[Portal Gun] Failed to open interface: \n§e[!] ${error}§r`,
      );
      player.dimension.playSound("ram_portalgun:error_sound", player.location);
    }
  }

  fireProjectile(player, portalGunItem) {
    try {
      const headLocation = player.getHeadLocation();
      const viewDirection = player.getViewDirection();
      const spawnPosition = {
        x: headLocation.x,
        y: headLocation.y - 0.1,
        z: headLocation.z,
      };

      const highPressure =
        portalGunItem.getDynamicProperty(portalGunDP.behavior.highPressure) === true;
      const bootleggedFluid =
        portalGunItem.getDynamicProperty(portalGunDP.bootleggedFluid) === true;

      const projectileType = highPressure
        ? bootleggedFluid
          ? this.highPressureBootlegProjectileId
          : this.highPressureProjectileId
        : bootleggedFluid
          ? this.bootlegProjectileId
          : this.projectileId;

      const projectile = player.dimension.spawnEntity(
        projectileType,
        spawnPosition,
      );
      const projectileComponent = projectile.getComponent(
        "minecraft:projectile",
      );

      if (projectileComponent) {
        projectileComponent.owner = player;
        projectileComponent.shoot(viewDirection);
      }

      player.dimension.playSound("ram_portalgun:fire_portal", player.location);
    } catch (error) {
      player.sendMessage(
        `§c[Portal Gun] Failed to fire projectile: \n§e[!] ${error}§r`,
      );
      player.dimension.playSound("ram_portalgun:error_sound", player.location);
    }
  }

  decreaseCharge(player, portalGunItem, charge, amount) {
    charge = Math.max(0, charge - amount);
    portalGunItem.setDynamicProperty(portalGunDP.charge, charge);
    if (charge === 0) {
      const dischargedId = this.dischargedVersionId;
      const dischargedPortalGun = new ItemStack(dischargedId, 1);
      for (const id of portalGunItem.getDynamicPropertyIds()) {
        dischargedPortalGun.setDynamicProperty(
          id,
          portalGunItem.getDynamicProperty(id),
        );
      }
      player.dimension.playSound(
        "ram_portalgun:power_off_portal_gun",
        player.location,
      );
      portalGunItem = dischargedPortalGun;
    }
    return portalGunItem;
  }
}
