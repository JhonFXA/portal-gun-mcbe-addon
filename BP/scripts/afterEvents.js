import {
    world,
    ItemStack
} from "@minecraft/server";
import { ID } from "./utils/ids&variables";


/* When the player hits a block while holding a hair,changes it style*/
world.afterEvents.entityHitBlock.subscribe((event) => {
    const {damagingEntity: player } = event;
    const inventory = player.getComponent("inventory").container;
    const itemStack = inventory?.getItem(player.selectedSlotIndex);

  if (!ID.hair.includes(itemStack.typeId)){
    return;
  }

  if (itemStack.typeId == "ram_portalgun:rick_hair") {
    const newHair = new ItemStack("ram_portalgun:homesteader_rick_hair", 1);
    inventory.setItem(player.selectedSlotIndex, newHair);
  } else {
    const newHair = new ItemStack("ram_portalgun:rick_hair", 1);
    inventory.setItem(player.selectedSlotIndex, newHair);
  }

});