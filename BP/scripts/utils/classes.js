import {
  ItemStack,
} from "@minecraft/server";
import {
  portalGunDP,
} from "../utils/ids&variables";

export class PortalGun {
  constructor({
    id,
    dischargedVersionId,
    baseId,
    emptyTubeId,
    chargedTubeId,
    projectileId,
    highPressureProjectileId,
    portalId
  }) {
    this.id = id;
    this.dischargedVersionId = dischargedVersionId;
    this.baseId = baseId;
    this.emptyTubeId = emptyTubeId;
    this.chargedTubeId = chargedTubeId;
    this.projectileId = projectileId;
    this.highPressureProjectileId = highPressureProjectileId;
    this.portalId = portalId;
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

      const highPressure = portalGunItem.getDynamicProperty(portalGunDP.highPressure) === true;

      const projectileType = highPressure ? this.highPressureProjectileId : this.projectileId;
  

      const projectile = player.dimension.spawnEntity(projectileType, spawnPosition);
      const projectileComponent = projectile.getComponent("minecraft:projectile");

      if (projectileComponent) {
        projectileComponent.owner = player;
        projectileComponent.shoot(viewDirection);
      }

      player.dimension.playSound("ram_portalgun:fire_portal", player.location);
    } catch (error) {
      player.sendMessage(`§c[Portal Gun] Failed to fire projectile: \n§e[!] ${error}§r`);
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
        dischargedPortalGun.setDynamicProperty(id, portalGunItem.getDynamicProperty(id));
      }
      player.dimension.playSound("ram_portalgun:power_off_portal_gun", player.location);
      portalGunItem = dischargedPortalGun;
    }
    return portalGunItem;
  }
}