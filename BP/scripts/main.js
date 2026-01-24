/*
  ___ _    _                  _   __  __         _        
 | _ (_)__| |__  __ _ _ _  __| | |  \/  |___ _ _| |_ _  _ 
 |   / / _| / / / _` | ' \/ _` | | |\/| / _ \ '_|  _| || |
 |_|_\_\__|_\_\ \__,_|_||_\__,_| |_|  |_\___/_|  \__|\_, |
                                                     |__/ 
██████╗░░█████╗░██████╗░████████╗░█████╗░██╗░░░░░  ░██████╗░██╗░░░██╗███╗░░██╗
██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██║░░░░░  ██╔════╝░██║░░░██║████╗░██║
██████╔╝██║░░██║██████╔╝░░░██║░░░███████║██║░░░░░  ██║░░██╗░██║░░░██║██╔██╗██║
██╔═══╝░██║░░██║██╔══██╗░░░██║░░░██╔══██║██║░░░░░  ██║░░╚██╗██║░░░██║██║╚████║
██║░░░░░╚█████╔╝██║░░██║░░░██║░░░██║░░██║███████╗  ╚██████╔╝╚██████╔╝██║░╚███║
╚═╝░░░░░░╚════╝░╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝╚══════╝  ░╚═════╝░░╚═════╝░╚═╝░░╚══╝


┌──────────────────────────────────────────────────────────┐
│ *buuurp* Hey, developer!                                 │
│                                                          │
│ You just opened some interdimensional, totally unstable  │
│ piece of code... and now you're stuck with it. Congrats! │
│                                                          │
│ Anyway, feel free to mess around, break things, or — if  │
│ you're actually smart enough — contribute to the GitHub  │
│ repo.                                                    │
│ The more brains working here, the more portals we can    │
│ open!                                                    │
│ WUBBA LUBBA DUB-DUB!                                     │
└──────────────────────────────────────────────────────────┘

*/

import {ItemStack, EquipmentSlot, world, system} from "@minecraft/server";

// import './portal/teleportLogic';

import {summonPortal, usePortalGun} from "./portal/portalGun";

import {linkPortals, removePortal, dealPortalFluidDamage} from "./utils/my_API";

import {
  ID,
  portalGuns,
  portalGunDP,
  portalDP,
  PORTAL_MODES,
} from "./utils/ids&variables";

import { runCooldown, onTick, tagHandling} from "./portal/teleportLogic";

import { openSynthesisGUI } from "./gui/synthesis_gui";

system.runInterval(() => {
    runCooldown();
    onTick();
}, 1);

system.runInterval(() => {
    tagHandling();
}, 5);

//==============================================================================================================================


/*
  ____        __                 ______               _       
 |  _ \      / _|               |  ____|             | |      
 | |_) | ___| |_ ___  _ __ ___  | |____   _____ _ __ | |_ ___ 
 |  _ < / _ \  _/ _ \| '__/ _ \ |  __\ \ / / _ \ '_ \| __/ __|
 | |_) |  __/ || (_) | | |  __/ | |___\ V /  __/ | | | |_\__ \
 |____/ \___|_| \___/|_|  \___| |______\_/ \___|_| |_|\__|___/
                                                              

*/

// Triggered before a player breaks a block
// it **prevents players from breaking blocks while holding a Portal Gun in creative mode**
world.beforeEvents.playerBreakBlock.subscribe((event) => {
  const inventory = event.player.getComponent("inventory");
  const selectedItem = inventory?.container.getItem(
    event.player.selectedSlotIndex
  );

  if(!ID.portalGunsIds.includes(selectedItem?.typeId) && !ID.hair.includes(selectedItem?.typeId)) return;
  const gamemode = event.player.getGameMode();
  if (selectedItem &&  gamemode == "Creative")
    event.cancel = true;
});


world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (event.isFirstEvent !== true) return;

    const {block, itemStack, player} = event;

    if(block.typeId != "ram_portalgun:synthesis_bench") return;
  
    if(!itemStack || !ID.components.bootlegTubes.includes(itemStack?.typeId)){
      player.sendMessage("§eInteract with the workbench using a Bootleg Portal Fluid.");
      return;
    }
    system.run(() => {
        openSynthesisGUI(player);
    });
});


//==============================================================================================================================

/*

            __ _              ______               _       
     /\    / _| |            |  ____|             | |      
    /  \  | |_| |_ ___ _ __  | |____   _____ _ __ | |_ ___ 
   / /\ \ |  _| __/ _ \ '__| |  __\ \ / / _ \ '_ \| __/ __|
  / ____ \| | | ||  __/ |    | |___\ V /  __/ | | | |_\__ \
 /_/    \_\_|  \__\___|_|    |______\_/ \___|_| |_|\__|___/
                                                           
                                                                                                                      
                                                              

*/

/* When the player hits a block while holding a hair,changes it style*/
world.afterEvents.entityHitBlock.subscribe((event) => {
  const {damagingEntity: player } = event;
  const inventory = player.getComponent("inventory").container;
  const itemStack = inventory?.getItem(player.selectedSlotIndex);

  if(!itemStack) return;

  if (!ID.hair.includes(itemStack.typeId)){
    return;
  }

  if (itemStack.typeId == "ram_portalgun:rick_hair") {
    const newHair = new ItemStack("ram_portalgun:homesteader_rick_hair", 1);
    inventory.setItem(player.selectedSlotIndex, newHair);
  } else if (itemStack.typeId == "ram_portalgun:homesteader_rick_hair") {
    const newHair = new ItemStack("ram_portalgun:memory_rick_hair", 1);
    inventory.setItem(player.selectedSlotIndex, newHair);
  } else if (itemStack.typeId == "ram_portalgun:memory_rick_hair") {
    const newHair = new ItemStack("ram_portalgun:rick_hair", 1);
    inventory.setItem(player.selectedSlotIndex, newHair);
  }


});

//Used to detect when the player interacts with a portal gun.
world.afterEvents.itemUse.subscribe((event) => {
  const { itemStack, source: player } = event;

   // Ignore the event if the item is not a Portal Gun, discharged gun, or base component
  if (
    !ID.portalGunsIds.includes(itemStack.typeId) &&
    !ID.dischargedPortalGuns.includes(itemStack.typeId) &&
    !ID.components.portalGunBases.includes(itemStack.typeId)
  ) {
    return;
  }

  // If the item used is a Portal Gun base
  if (ID.components.portalGunBases.includes(itemStack.typeId)) {
    const equippable = player.getComponent("minecraft:equippable");
    const itemOffhand = equippable.getEquipment(EquipmentSlot.Offhand);

    const gunInstance = portalGuns.find(
      (gun) => gun.baseId === itemStack.typeId
    );

    // Determine which gun type to create based on the tube in the offhand
    let newGunType;
    if (itemOffhand?.typeId === gunInstance.chargedTubeId) {
      newGunType = gunInstance.id;
    } else if (itemOffhand?.typeId === gunInstance.emptyTubeId) {
      newGunType = gunInstance.dischargedVersionId;
    } else if( ID.components.bootlegTubes.includes(itemOffhand?.typeId)){
      newGunType = gunInstance.id;
      player.onScreenDisplay.setActionBar("§cWeird fluid detected...");
      player.dimension.playSound("ram_portalgun:error_sound", player.location);
    }

    if (!newGunType) return; // if tube doesn't match, do nothing
    
    const inventory = player.getComponent("inventory").container;
    const portalGun = new ItemStack(newGunType, 1);

    // Copy dynamic properties from the base to the new gun
    for (const id of itemStack.getDynamicPropertyIds()) {
      portalGun.setDynamicProperty(id, itemStack.getDynamicProperty(id));
    }

    // Set the charge depending on the tube type
    if (ID.components.chargedTubes.includes(itemOffhand.typeId)) {
      const currentCharge = itemOffhand.getDynamicProperty(portalGunDP.charge) ?? 100;
      portalGun.setDynamicProperty(portalGunDP.charge, currentCharge);
      portalGun.setDynamicProperty(portalGunDP.bootleggedFluid, false);
    } 
    else if (ID.components.emptyTubes.includes(itemOffhand.typeId)) {
      portalGun.setDynamicProperty(portalGunDP.charge, 0);
      portalGun.setDynamicProperty(portalGunDP.bootleggedFluid, false);
    }
    else if( ID.components.bootlegTubes.includes(itemOffhand.typeId)){
      const currentCharge = itemOffhand.getDynamicProperty(portalGunDP.charge) ?? 100;
      portalGun.setDynamicProperty(portalGunDP.charge, currentCharge);
      portalGun.setDynamicProperty(portalGunDP.bootleggedFluid, true);
    }

    // Consume one tube from offhand
    if (itemOffhand.amount > 1) {
      itemOffhand.amount -= 1;
      equippable.setEquipment(EquipmentSlot.Offhand, itemOffhand);
    } else {
      equippable.setEquipment(EquipmentSlot.Offhand, undefined);
    }

    // Replace base with assembled Portal Gun and play plug sound
    inventory.setItem(player.selectedSlotIndex, portalGun);
    player.playAnimation("animation.ram_portalgun.player.portal_gun_plug", {blendOutTime: 1});
    player.dimension.playSound(
      "ram_portalgun:portal_gun_plug",
      player.location
    );
    return;
  }
  
  const portalGunTypeId = itemStack.typeId;
  
  const cooldownName = portalGunTypeId.replace("ram_portalgun:", "") + "_cooldown";
  const cooldownComponent = itemStack.getComponent("cooldown");
  const cooldown = player.getItemCooldown(cooldownName);
  const cooldownTicks = cooldownComponent.cooldownTicks;

  if (cooldown < cooldownTicks - 1) {
    return;
  }
  usePortalGun(player, itemStack);
});

// It is used to **cycle through saved custom portal locations**
// when the player hits a block while holding a Portal Gun and not sneaking.
world.afterEvents.entityHitBlock.subscribe((event) => {
  if (event.damagingEntity.typeId !== "minecraft:player") return;
  const player = event.damagingEntity;

  const inventory = player.getComponent("inventory");
  const item = inventory?.container.getItem(player.selectedSlotIndex);
  if (!item) return;
  if (!ID.portalGunsIds.includes(item.typeId)) return;
  const fastLocationChange = item.getDynamicProperty(portalGunDP.fastLocationChange);
  if (!fastLocationChange) return;

  let savedLocationsJson = item.getDynamicProperty(portalGunDP.savedLocations);
  let savedLocations = savedLocationsJson ? JSON.parse(savedLocationsJson) : [];
  if (savedLocations.length === 0) return;

  let mode = item.getDynamicProperty(portalGunDP.mode);
  let currentIndex = Number(
    item.getDynamicProperty(portalGunDP.customLocationIndex) ?? 0
  );

  if (mode !== PORTAL_MODES.CUSTOM) {
    item.setDynamicProperty(portalGunDP.mode, PORTAL_MODES.CUSTOM);
  } else {
    if(player.isSneaking) {
      currentIndex = (currentIndex - 1 + savedLocations.length) % savedLocations.length;
    } else {
      currentIndex = (currentIndex + 1) % savedLocations.length;
    }
  }

  item.setDynamicProperty(
    portalGunDP.customLocation,
    JSON.stringify(savedLocations[currentIndex])
  );
  item.setDynamicProperty(portalGunDP.customLocationIndex, currentIndex);

  let dimension = savedLocations[currentIndex].dimensionId;
  switch (dimension) {
    case "minecraft:overworld":
      dimension = "Overworld";
      break;
    case "minecraft:nether":
      dimension = "Nether";
      break;
    case "minecraft:the_end":
      dimension = "The End";
      break;
  }

  inventory.container.setItem(player.selectedSlotIndex, item);
  player.dimension.playSound("ram_portalgun:selection", player.location);
  player.onScreenDisplay.setActionBar(
    `Location: §a${savedLocations[currentIndex].name}§r (${currentIndex + 1}/${
      savedLocations.length
    })\nDimension: §a${dimension}§r`
  );
});

// It allows Portal Gun projectiles to hit entities and give them poison effect.
world.afterEvents.projectileHitEntity.subscribe((event) => {
  if (!ID.projectiles.includes(event.projectile.typeId) && !ID.bootlegProjectiles.includes(event.projectile.typeId)) {
    return;
  }

  const hitEntity = event.getEntityHit()?.entity;
  if (ID.portals.includes(hitEntity?.typeId)) {
    return;
  }

  dealPortalFluidDamage(hitEntity);

});

// It is used to detect when a Portal Gun projectile lands on a block
// and then summon a portal at the hit location.
world.afterEvents.projectileHitBlock.subscribe((event) => {
  const projectile = event.projectile;

  if (!ID.projectiles.includes(projectile.typeId) && !ID.bootlegProjectiles.includes(projectile.typeId)) {
    return;
  }

  const bootleggedFluid = ID.bootlegProjectiles.includes(projectile.typeId);
  const player = event.source;
  summonPortal(player, event.getBlockHit(), bootleggedFluid);
});

/*
  Allow players to remove portals by hitting them while sneaking (crouching) with a Portal Gun.
*/
world.afterEvents.entityHitEntity.subscribe((event) => {
  if (event.damagingEntity.typeId !== "minecraft:player") return;
  const player = event.damagingEntity;
  if (!player.isSneaking) return;
  const portalEntity = event.hitEntity;
  if (!portalEntity.matches({ families: ["ram_portalgun:portal"] })) return;

  const portalGunItem = player.getComponent("inventory").container.getItem(player.selectedSlotIndex);

  if (!portalGunItem) return;
  if (!ID.portalGunsIds.includes(portalGunItem.typeId) && !ID.dischargedPortalGuns.includes(portalGunItem.typeId) && !ID.components.portalGunBases.includes(portalGunItem.typeId))
    return;


  /*
  If the portal has no root info, it is removed directly. 
  If it has a linked dual portal, the root portal is determined and the child list is retrieved. 
  For chains longer than two portals, either all child portals are removed (if root) or the current portal is removed and the root portal is relinked. 
  For chains of only two portals, the portals are removed directly. 
  */


  const portalIsRoot = portalEntity.getDynamicProperty(portalDP.isRoot);

  if (portalIsRoot === undefined || portalEntity.getDynamicProperty(portalDP.DualityPortalId) === undefined) {
    return removePortal(portalEntity, true);
  }
  const dualPortal = world.getEntity(portalEntity.getDynamicProperty(portalDP.DualityPortalId));
  if(dualPortal === undefined) return removePortal(portalEntity, false);
  const rootPortal = portalIsRoot ? portalEntity : dualPortal;
  const childListJson = rootPortal.getDynamicProperty(portalDP.childList);
  const childList = childListJson ? JSON.parse(childListJson) : [];

  if (childList.length > 2) {
    if(portalIsRoot) {
      childList.forEach((portalId, index) => {
        const portal = world.getEntity(portalId);
        removePortal(portal, false);
      });
    } else {
      const idx = childList.indexOf(portalEntity.id);
      if (idx !== -1) {
        childList.splice(idx, 1);
        linkPortals(childList[0], childList[childList.length - 1]);
        rootPortal.setDynamicProperty(portalDP.childList, JSON.stringify(childList));
        removePortal(portalEntity, false);
      }

    }
  } else {
    return removePortal(portalEntity, true);
  } 
});
