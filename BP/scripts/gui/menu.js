import { ItemStack } from "@minecraft/server";
import {ActionFormData, ModalFormData, MessageFormData} from "@minecraft/server-ui";
import {changePortalGunMode, removeAllPortals} from '../utils/my_API';
import { portalGunDP, ID } from "../utils/ids&variables";


/**
 * 
 * @param {Player} player 
 * 
 * Causes the player to perform a button-click animation on the portal gun.
 */
function playPlayerAnimation(player){
    player.playAnimation("animation.ram_portalgun.player.portal_gun_interface", {blendOutTime: 0.5, stopExpression: "query.is_moving || !query.is_item_name_any('slot.weapon.mainhand', 'ram_portalgun:portal_gun', 'ram_portalgun:portal_gun_discharged')"});
}

function stopPlayerAnimation(player){
    // player.runCommand("camera @s clear");
    player.playAnimation("animation.ram_portalgun.player.reset");
}

/**
 * Opens the main Portal Gun menu for the player.
 *
 * @param {Player} player - The player interacting with the Portal Gun.
 *
 * Displays the main options such as:
 * Saved Locations, Set Coordinates, Select Mode, and Settings.
 */

export function openPortalGunMenu(player) {
    const inventory = player.getComponent("inventory");
    const portalGunItem = inventory.container.getItem(player.selectedSlotIndex)
    const currentMode = portalGunItem.getDynamicProperty(portalGunDP.mode);
    const charge = portalGunItem.getDynamicProperty(portalGunDP.charge)??0;

    const totalBars = 10;
    const filledBars = Math.ceil(charge / 10);
    const remainder = charge % 10;
    const isLowPartial = remainder > 0 && remainder < 5;

    let chargeBars = "";
    for (let i = 0; i < totalBars; i++) {
        if (i < filledBars - 1) {
            chargeBars += "§a|§r";
        } else if (i === filledBars - 1 && isLowPartial) {
            chargeBars += "§7|§r";
        } else if (i < filledBars) {
            chargeBars += "§a|§r";
        } else {
            chargeBars += "§0|§r";
        }
    }

    const customUi = new ActionFormData()
    .title("Portal Gun Menu")
    .body(`Charge: ${chargeBars}`)
    .button("Saved Locations", "textures/ui/pg_ui/menu/saved_locations_ui")
    .button("Set Coordinates", "textures/ui/pg_ui/menu/set_coordinates_ui")
    .button("Select Mode", "textures/ui/pg_ui/menu/select_mode_ui")
    .button("", "textures/ui/pg_ui/menu/settings_ui")
    .button("", "textures/ui/pg_ui/menu/close_menu");

    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:open_menu", player.location);

    customUi.show(player).then(response => {
       switch (response.selection) {
            case 0: openSavedLocationsForm(player, inventory, portalGunItem); break;
            case 1: openSetCoordinatesForm(player, inventory, portalGunItem); break;
            case 2: openSelectModeForm(player, inventory, portalGunItem); break;
            case 3: openSettingsForm(player, inventory, portalGunItem); break;
            default: {
                player.dimension.playSound("ram_portalgun:button_click", player.location);
                stopPlayerAnimation(player);
            }
        }
    })
}

/**
 * Displays the list of saved teleport locations stored in the Portal Gun.
 *
 * @param {Player} player - The player interacting with the menu.
 * @param {EntityInventoryComponent} inventory - The player's inventory component.
 * @param {ItemStack} portalGunItem - The current Portal Gun item.
 *
 * Allows the player to save, delete, or select custom teleport locations.
 */
function openSavedLocationsForm(player, inventory, portalGunItem) {
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    const form = new ActionFormData()
    .title("Saved Locations")
    .button("Save Current Location", "textures/ui/pg_ui/saved_locations/save_ui")
    .button("Delete Location", "textures/ui/pg_ui/saved_locations/delete_location_ui")
    .divider()
    
    // Retrieve saved locations from the Portal Gun's dynamic property
    const locationsJson = portalGunItem.getDynamicProperty(portalGunDP.savedLocations);
    const savedLocations = locationsJson ? JSON.parse(locationsJson) : [];

    if(savedLocations.length > 0){
        form.button("Search Location").divider();
        form.label(`Locations (${savedLocations.length}):`);
        savedLocations.forEach(location => {
            const { dimensionId, name, x, y, z } = location;
            const { dimName, color } = getDimensionLabel(dimensionId);
            form.button(`§0${name}§r\nX: ${x}, Y: ${y}, Z: ${z}\nDimension: ${color}${dimName}§r`);
        });
    } else {
        form.label("No Locations Saved.")
    }
    form.divider().button("Back to Menu", "textures/ui/pg_ui/back_button");

    form.show(player).then(response => {
        if (response.selection === 0) {
            openSaveCurrentLocationForm(player, inventory, portalGunItem, savedLocations);
        } else if (response.selection === 1) {
            openDeleteLocationForm(player, inventory, portalGunItem, savedLocations);
        } else if (response.selection === 2){
            openSearchForm(player, inventory, portalGunItem, savedLocations);
        } else if (response.selection === savedLocations.length + 3){
            openPortalGunMenu(player);
        } else if (response.selection !== undefined){
            const selectedLocation = savedLocations[response.selection - 3];
            portalGunItem.setDynamicProperty(portalGunDP.customLocation, JSON.stringify(selectedLocation));
            portalGunItem.setDynamicProperty(portalGunDP.mode, "CUSTOM")
            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.onScreenDisplay.setActionBar(
                `§aSet to location: ${selectedLocation.name} (§eX:${selectedLocation.x} Y:${selectedLocation.y} Z:${selectedLocation.z}§r)§r`
            );
            player.dimension.playSound("ram_portalgun:selection", player.location);
            stopPlayerAnimation(player);
        } else {
            stopPlayerAnimation(player);
        }
    })
}

function openSearchForm(player, inventory, portalGunItem, savedLocations, error = null){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    const form = new ModalFormData()
    .title("Search Location")
    .textField("Enter Location Name", "")

    if(error){
        form.label(`§c${error}§r`);
    }
    form.show(player).then(response => {
        if(response.formValues == undefined){
            return stopPlayerAnimation(player);
        }
        else if (response.formValues[0]){
            const searchTerm = response.formValues[0].toLowerCase().trim();
            const filteredLocations = savedLocations.filter(location => location.name.toLowerCase().includes(searchTerm));
            if(filteredLocations.length === 0){
                openSearchForm(player, inventory, portalGunItem, savedLocations, `No locations found matching '${searchTerm}'.`);
                player.dimension.playSound("ram_portalgun:error_sound", player.location);
                return;
            }
            openFilteredLocationsForm(player, inventory, portalGunItem, filteredLocations, response.formValues[0]);
        } else {
            stopPlayerAnimation(player);
        }
    })
}

function openFilteredLocationsForm(player, inventory, portalGunItem, filteredLocations, searchTerm){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    const lowerSearch = searchTerm.toLowerCase().trim();
    const resultsForm = new ActionFormData()
    .title("Search Results")
    .body(`Locations matching '${searchTerm}':`)
    .divider();
    filteredLocations.forEach(location => {
        const { dimensionId, name, x, y, z } = location;
        const { dimName, color } = getDimensionLabel(dimensionId);

        const regex = new RegExp(`(${lowerSearch})`, "gi");
        const highlightedName = name.replace(regex, "§4$1§0");

        resultsForm.button(`§0${highlightedName}§r\nX: ${x}, Y: ${y}, Z: ${z}\nDimension: ${color}${dimName}§r`);
    });
    resultsForm.divider().button("Back to Saved Locations", "textures/ui/pg_ui/back_button");
    resultsForm.show(player).then(resultsResponse => {
        if (resultsResponse.selection === filteredLocations.length) {
            openSavedLocationsForm(player, inventory, portalGunItem);
        } else if (resultsResponse.selection !== undefined) {
            const selectedLocation = filteredLocations[resultsResponse.selection];
            portalGunItem.setDynamicProperty(portalGunDP.customLocation, JSON.stringify(selectedLocation));
            portalGunItem.setDynamicProperty(portalGunDP.mode, "CUSTOM")
            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.onScreenDisplay.setActionBar(
                `§aSet to location: ${selectedLocation.name} (§eX:${selectedLocation.x} Y:${selectedLocation.y} Z:${selectedLocation.z}§r)§r`
            );
            player.dimension.playSound("ram_portalgun:selection", player.location);
            stopPlayerAnimation(player);
        } else {
            stopPlayerAnimation(player);
        }
    });
}

/**
 * Opens form to save the current player location.
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 * @param {Array} savedLocations
 */
function openSaveCurrentLocationForm(player, inventory, portalGunItem, savedLocations){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    const form = new ModalFormData()
    .title("Save Current Location")
    .textField("Set The Location Name", "")
    form.show(player).then(response => {
        if(response.formValues == undefined){
            return stopPlayerAnimation(player);
        }
        else if (response.formValues[0]){
            const locationName = response.formValues[0];

            const newLocationData = {
                name: locationName,
                id: savedLocations.length,
                dimensionId: player.dimension.id,
                x: parseInt(player.location.x),
                y: parseInt(player.location.y),
                z: parseInt(player.location.z)
            };

            savedLocations.push(newLocationData);
            portalGunItem.setDynamicProperty(portalGunDP.savedLocations, JSON.stringify(savedLocations));
            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.dimension.playSound("ram_portalgun:selection", player.location);
            openSavedLocationsForm(player, inventory, portalGunItem);
        } else {
            stopPlayerAnimation(player);
        }
    })
}

/**
 * Deletes a selected saved location.
 * Provides a cancel option if the player changes their mind.
 *
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 * @param {Array} savedLocations
 */
function openDeleteLocationForm(player, inventory, portalGunItem, savedLocations){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    const form = new ActionFormData()
    .title("Delete Location")
    .body("Select a location to delete.");

    if(savedLocations.length === 0) {
        player.onScreenDisplay.setActionBar(
                `§cNo saved locations to delete.§r`
            );
        player.dimension.playSound("ram_portalgun:error_sound", player.location);
        stopPlayerAnimation(player);
        return;
    }
    savedLocations.forEach((location) => {
        const { dimensionId, name, x, y, z } = location;
        const { dimName, color } = getDimensionLabel(dimensionId);
        form.button(`§0${name}§r\nX: ${x}, Y: ${y}, Z: ${z}\nDimension: ${color}${dimName}§r`);
    });
    form.divider()
    .button("Cancel");

    form.show(player).then(response => {
        if(response.selection == savedLocations.length){
            openSavedLocationsForm(player, inventory, portalGunItem);
        }
        else if (response.selection !== undefined){
            savedLocations.splice(response.selection, 1);
            portalGunItem.setDynamicProperty(portalGunDP.savedLocations, JSON.stringify(savedLocations));
            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.dimension.playSound("ram_portalgun:selection", player.location);
            openSavedLocationsForm(player, inventory, portalGunItem);
        } else {
            stopPlayerAnimation(player);
        }
    })

}

/**
 * Opens the form to set custom coordinates for the Portal Gun.
 * Allows the player to input X, Y, Z, and select the dimension.
 *
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 */
function openSetCoordinatesForm(player, inventory, portalGunItem) {
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    let form = new ModalFormData()
    .title("Set Coordinates")
    .textField("X:", "")
    .textField("Y:", "")
    .textField("Z:", "")
    .divider()
    .dropdown("Dimension", ["Overworld", "Nether", "The End"],{ defaultValueIndex: 0 })

    form.show(player).then(response => {
        if(response.formValues == undefined){
            return stopPlayerAnimation(player);
        } else if( Number.isNaN(parseInt(response.formValues[0]))  || Number.isNaN(parseInt(response.formValues[1])) || Number.isNaN(parseInt(response.formValues[2]))){
            player.onScreenDisplay.setActionBar(
                `§cInvalid coordinates entered.§r`
            );
            player.dimension.playSound("ram_portalgun:error_sound", player.location);
        } else {
            const newLocationData = {
                name: "Unnamed Location",
                id: -Math.floor(Math.random() * 10000),
                x: parseInt(response.formValues[0]),
                y: parseInt(response.formValues[1]),
                z: parseInt(response.formValues[2]),
                dimensionId: response.formValues[4] == 0? "minecraft:overworld" : response.formValues[4] == 1? "minecraft:nether" : "minecraft:the_end"
            }

            portalGunItem.setDynamicProperty(portalGunDP.mode, "CUSTOM");
            portalGunItem.setDynamicProperty(portalGunDP.customLocation, JSON.stringify(newLocationData));
            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.dimension.playSound("ram_portalgun:selection", player.location);
            player.onScreenDisplay.setActionBar(
                `§aSet to location: ${newLocationData.name} (§eX:${newLocationData.x} Y:${newLocationData.y} Z:${newLocationData.z}§r)§r`
            );
        }
        stopPlayerAnimation(player);
    });
}

/**
 * Opens the Portal Gun mode selection menu.
 * Player can switch between FIFO, LIFO, Multi-Pair, or Root mode.
 *
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 */
function openSelectModeForm(player, inventory, portalGunItem) {
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    let form = new ActionFormData()
    .title("Select Mode")
    .button("FIFO Mode", "textures/ui/pg_ui/select_mode/fifo_mode_button")
    .button("LIFO Mode", "textures/ui/pg_ui/select_mode/lifo_mode_button")
    .button("Multi-Pair Mode", "textures/ui/pg_ui/select_mode/multipair_mode_button")
    .button("Root Mode", "textures/ui/pg_ui/select_mode/root_mode_button")
    .divider()
    .label("Modes explained:\n\n§eFIFO§r - First In First Out:\nAfter having 2 portals active, each new portal will replace the oldest one.\n\n§eLIFO§r - Last In First Out:\nAfter having 2 portals active, each new portal will replace the newest one.\n\n§eMulti-Pair§r:\nAllows you to have multiple pairs of portals active at the same time. You can enter any portal and come out from its pair.\n\n§eRoot§r:\nShoots a portal that acts as an anchor. You can shoot multiple portals, but when you enter one, you will always come out from the root portal. Entering the root portal will take you back to the last portal you shooted.")
    .button("Back to Menu", "textures/ui/pg_ui/back_button");

    form.show(player).then(response => {
        switch (response.selection) {
            case 0: changePortalGunMode(player, inventory, portalGunItem, "FIFO"); 
                    player.onScreenDisplay.setActionBar(`§aSet Mode to FIFO.§r`); 
                    stopPlayerAnimation(player); 
                    break;
            case 1: changePortalGunMode(player, inventory, portalGunItem, "LIFO"); 
                    player.onScreenDisplay.setActionBar(`§aSet Mode to LIFO.§r`); 
                    stopPlayerAnimation(player);
                    break;
            case 2: changePortalGunMode(player, inventory, portalGunItem, "Multi-Pair"); 
                    player.onScreenDisplay.setActionBar(`§aSet Mode to Multi-Pair.§r`); 
                    stopPlayerAnimation(player);
                    break;
            case 3: changePortalGunMode(player, inventory, portalGunItem, "Root"); 
                    player.onScreenDisplay.setActionBar(`§aSet Mode to Root.§r`);
                    stopPlayerAnimation(player);
                    break;
            case 4: openPortalGunMenu(player); 
                    break;
            default: stopPlayerAnimation(player);
        }
    })

}


/**
 * Opens the Portal Gun settings menu.
 * Provides access to behavior settings, history, dismounting, resetting, and debugging.
 *
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 */
function openSettingsForm(player, inventory, portalGunItem) {
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    let form = new ActionFormData()
    .title("Portal Gun Settings")
    .button("Behavior Settings", "textures/ui/pg_ui/settings/toggle")
    .divider()
    .button("History", "textures/ui/pg_ui/settings/history")
    .button("Dismount Portal Gun", "textures/ui/pg_ui/settings/dismount_portal_gun")
    .button("Close All Portals", "textures/ui/pg_ui/settings/close_all_portals")
    .button("Reset Portal Gun", "textures/ui/pg_ui/settings/reset_portal_gun")
    .button("How to Use", "textures/ui/pg_ui/settings/question_mark")
    .button("Terminal", "textures/ui/pg_ui/settings/terminal")
    .divider()
    .button("Back to Menu", "textures/ui/pg_ui/back_button")

    form.show(player).then(response => {
        switch (response.selection) {
            case 0: openBehaviorSettingsForm(player, portalGunItem, inventory); break;
            case 1: openHistoryForm(player, inventory, portalGunItem); break;
            case 2: 
                stopPlayerAnimation(player);
                dismountPortalGun(player, portalGunItem, inventory);
                break;
            case 3:
                stopPlayerAnimation(player);
                removeAllPortals(player, portalGunItem); 
                player.dimension.playSound("ram_portalgun:selection", player.location); 
                break;
            case 4: 
                openResetForm(player, portalGunItem, inventory); 
                break;
            case 5: openHowToUseForm(player, inventory, portalGunItem); break;
            case 6: openTerminalForm(player, inventory, portalGunItem); break;
            case 7: openPortalGunMenu(player); break;
            default: stopPlayerAnimation(player);
        }
    })
}

/**
 * Opens behavior settings form for the Portal Gun.
 * Adjusts auto-close, high pressure, safe placement, and portal scale.
 *
 * @param {Player} player
 * @param {ItemStack} portalGunItem
 * @param {EntityInventoryComponent} inventory
 */
function openBehaviorSettingsForm(player, portalGunItem, inventory){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    let autoClose = portalGunItem.getDynamicProperty(portalGunDP.autoClose);
    let scale = portalGunItem.getDynamicProperty(portalGunDP.scale);

    let form = new ModalFormData()
    .title("Behavior Settings")
    .toggle("Auto Close Portals", {
        defaultValue: autoClose? true: false,
        tooltip: "If enabled, portals will automatically\nclose after player enters them."
    })
    .toggle("High Pressure Mode", {
        defaultValue: portalGunItem.getDynamicProperty(portalGunDP.highPressure)? true: false,
        tooltip: "If enabled, portal gun will shoot\na high pressure projectile that\ncan reach further distances."
    })
    .toggle("Safe Placement", {
        defaultValue: portalGunItem.getDynamicProperty(portalGunDP.safePlacement)? true: false,
        tooltip: "If enabled, it ensures portals\nopen only in safe spots,\nnever buried underground or\nfloating too high."
    })
    .slider("Portal Scale", 1, 4, {
        defaultValue: scale == 0.5? 1 : scale == 1? 2 : scale == 1.5? 3 : scale == 2? 4 : 2,
        valueStep: 1
    })
    .divider()
    .submitButton("Save Changes");

    form.show(player).then(response => {
        if(response.formValues == undefined) {
            stopPlayerAnimation(player);
            return;
        } else {
            portalGunItem.setDynamicProperty(portalGunDP.autoClose, response.formValues[0]);
            portalGunItem.setDynamicProperty(portalGunDP.highPressure, response.formValues[1]);
            portalGunItem.setDynamicProperty(portalGunDP.safePlacement, response.formValues[2]);
            switch(response.formValues[3]){
                case 1:
                    portalGunItem.setDynamicProperty(portalGunDP.scale, 0.5);
                    break;
                case 2:
                    portalGunItem.setDynamicProperty(portalGunDP.scale, 1);
                    break;
                case 3:
                    portalGunItem.setDynamicProperty(portalGunDP.scale, 1.5);
                    break;
                case 4:
                    portalGunItem.setDynamicProperty(portalGunDP.scale, 2);
                    break;
                default:
                    portalGunItem.setDynamicProperty(portalGunDP.scale, 1);
                    break;
            }

            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.onScreenDisplay.setActionBar(
                `§aSettings updated.§r`
            );
            player.dimension.playSound("ram_portalgun:selection", player.location);
            stopPlayerAnimation(player);
        }

    })
}

/**
 * Opens the teleportation history menu.
 * Player can select previous locations (up to 30) to use them again.
 *
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 */
function openHistoryForm(player, inventory, portalGunItem){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    const historyJson = portalGunItem.getDynamicProperty(portalGunDP.historyLocations);
    const history =  historyJson ? JSON.parse(historyJson) : [];

    let form = new ActionFormData()
    .title("History")
    .body("Here you can view your §eportal gun's teleportation history§r.\nSelect a location below to use it.\n\n§eLimit: 30 locations§r")
    .divider()
    .button("Back to Settings", "textures/ui/pg_ui/back_button")
    .divider();

    if(history.length == 0){
        form.label("§eNo history to show.§r");
    } else history.forEach( location => {
        const { dimensionId, name, x, y, z } = location;
        const { dimName, color } = getDimensionLabel(dimensionId);
        form.button(`§0${name}§r\nX:${x}, Y:${y}, Z:${z}\nDimension: ${color}${dimName}§r`);
    });

    form.show(player).then(response => {
        if (response.selection == 0){
            openSettingsForm(player, inventory, portalGunItem);
        }
        else if (response.selection !== undefined && response.selection > 0){
            const selectedLocation = history[response.selection - 1];
            portalGunItem.setDynamicProperty(portalGunDP.customLocation, JSON.stringify(selectedLocation));
            portalGunItem.setDynamicProperty(portalGunDP.mode, "CUSTOM")
            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.onScreenDisplay.setActionBar(
                `§aSet to location: ${selectedLocation.name} (§eX:${selectedLocation.x} Y:${selectedLocation.y} Z:${selectedLocation.z}§r)§r`
            );
            player.dimension.playSound("ram_portalgun:selection", player.location);
            stopPlayerAnimation(player);
        } else {
            return stopPlayerAnimation(player);
        }
    });
}

/**
 * Opens a confirmation form to reset the Portal Gun.
 * Clears all dynamic properties and saved locations.
 *
 * @param {Player} player
 * @param {ItemStack} portalGunItem
 * @param {EntityInventoryComponent} inventory
 */
function openResetForm(player, portalGunItem, inventory){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    let form = new MessageFormData()
    .title("Reset Portal Gun")
    .body("Are you sure you want to reset your portal gun?\n\n§e[!]§r You will lose all your saved locations and history.")
    .button1("Yes")
    .button2("No")

    form.show(player).then(response =>{
        if(response.cancelled || response.selection === undefined){
            stopPlayerAnimation(player);
            return;
        }
        if(response.selection == 0){
            stopPlayerAnimation(player);
            removeAllPortals(player, portalGunItem);
            const charge = portalGunItem.getDynamicProperty(portalGunDP.charge);
            portalGunItem.clearDynamicProperties();
            portalGunItem.setDynamicProperty(portalGunDP.charge, charge);
            inventory.container.setItem(player.selectedSlotIndex, portalGunItem);
            player.dimension.playSound("ram_portalgun:selection", player.location);
            player.onScreenDisplay.setActionBar(
                `§aPortal gun has been reset.§r`
            );
        } else if (response.selection == 1){
            openSettingsForm(player, inventory, portalGunItem);
        }
    })
}

/**
 * Opens the “How to Use” tutorial form.
 * Displays controls and basic usage instructions.
 *
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 */
function openHowToUseForm(player, inventory, portalGunItem){
    playPlayerAnimation(player);
    player.dimension.playSound("ram_portalgun:button_click", player.location);
    let form = new ActionFormData()
    .title("How to Use")
    .header("Controls")
    .body("\n:mouse_right_button: - Interact\n\n:mouse_left_button: - Attack\n\n:tip_virtual_button_sneak: - Sneak (Shift)\n\n")
    .divider()
    .label("§eShoot Portals§r     :mouse_right_button:\n\n§eFast Change Location§r     :mouse_left_button: while aiming at a block\n\n§eOpen Menu§r     :tip_virtual_button_sneak: + :mouse_right_button:\n\n§eRemove a Portal§r     :tip_virtual_button_sneak: + :mouse_left_button: while aiming at it\n\n")
    .button("Back to Menu", "textures/ui/pg_ui/back_button");
    form.show(player).then(response => {
        if(response.selection == 0){
            openSettingsForm(player, inventory, portalGunItem);
        } else {
            return stopPlayerAnimation(player);
        }
    });
}

/**
 * Command registry for the terminal.
 * Each command name maps to a handler function.
 */
const terminalCommands = {
    "gunconfig": (player, inventory, portalGunItem) => {
        const debug = getGunConfig(player, inventory, portalGunItem);
        openTerminalForm(player, inventory, portalGunItem, debug);
    },

    "help": (player, inventory, portalGunItem) => {
        const helpText = `Available commands:
    - gunconfig : Show Portal Gun info
    - help : Show this list
    - clear : Clear the terminal output
    - coords : Show current player coordinates
    - exit : Exit the terminal`;
        openTerminalForm(player, inventory, portalGunItem, helpText);
    },

    "clear": (player, inventory, portalGunItem) => {
        openTerminalForm(player, inventory, portalGunItem, "");
    },

    "coords": (player, inventory, portalGunItem) => {
        const { x, y, z } = player.location;
        const dimensionId = player.dimension.id;
        const { dimName, color } = getDimensionLabel(dimensionId);
        const coordsText = `Current Coordinates:
X: ${Math.floor(x.toFixed(2))}
Y: ${Math.floor(y.toFixed(2))}
Z: ${Math.floor(z.toFixed(2))}
Dimension: ${color}${dimName}§r`;
        openTerminalForm(player, inventory, portalGunItem, coordsText);
    },

    "exit": (player, inventory, portalGunItem) => {
        openSettingsForm(player, inventory, portalGunItem);
    }
};

/**
 * Opens the terminal command input form.
 * Executes matching commands from the command registry.
 *
 * @param {Player} player
 * @param {EntityInventoryComponent} inventory
 * @param {ItemStack} portalGunItem
 * @param {string|null} response - Optional response message to display
 */
function openTerminalForm(player, inventory, portalGunItem, response = null) {
  playPlayerAnimation(player);
  player.dimension.playSound("ram_portalgun:button_click", player.location);

  let form = new ModalFormData()
    .title("Terminal")
    .textField("Enter Command", "")
    .divider();

  if (response) {
    form.label(`${response}§r`);
  }

  form.submitButton("Execute");
  form.show(player).then(response => {
    if (response.formValues === undefined) {
      stopPlayerAnimation(player);
      return;
    }

    const command = response.formValues[0]?.toLowerCase().trim();
    if (!command) {
      openSettingsForm(player, inventory, portalGunItem);
      return;
    }

    const handler = terminalCommands[command];
    if (handler) {
      handler(player, inventory, portalGunItem);
    } else {
      openTerminalForm(player, inventory, portalGunItem, `§cError: Unknown command '${command}'.\n§eType 'help' for a list of commands.§r`);
      player.dimension.playSound("ram_portalgun:error_sound", player.location);
    }
  });
}

/**
 * Returns debug info for the Portal Gun.
 * Displays all internal properties for troubleshooting.
 *
 * @param {Player} player
 * @returns {string} Debug information text
 */
function getGunConfig(player, inventory, portalGunItem){
    const portalListJson = portalGunItem.getDynamicProperty(portalGunDP.portalList);
    const portalList = portalListJson ? JSON.parse(portalListJson) : [];
    const id = portalGunItem.getDynamicProperty(portalGunDP.id);
    const lastUser = portalGunItem.getDynamicProperty(portalGunDP.lastUser);
    const mode = portalGunItem.getDynamicProperty(portalGunDP.mode);
    const autoClose = portalGunItem.getDynamicProperty(portalGunDP.autoClose)? true: false;
    const highPressure = portalGunItem.getDynamicProperty(portalGunDP.highPressure)? true: false;
    const safePlacement = portalGunItem.getDynamicProperty(portalGunDP.safePlacement)? true: false;
    const scale = portalGunItem.getDynamicProperty(portalGunDP.scale);
    const quantPortalsActive = portalList.length;
    const charge = portalGunItem.getDynamicProperty(portalGunDP.charge)??0;
    const savedLocationsJson = portalGunItem.getDynamicProperty(portalGunDP.savedLocations);
    const savedLocations = savedLocationsJson ? JSON.parse(savedLocationsJson) : [];

    return `======== GUN CONFIG ========
Portal Gun ID: ${id}
Last User: ${lastUser}
Mode: ${mode}
Charge: ${charge}%%
Auto Close: ${autoClose}
High Pressure: ${highPressure}
Safe Placement: ${safePlacement}
Portal Scale: ${scale}x
Quantity of Portals Active: ${quantPortalsActive}
Quantity of Saved Locations: ${savedLocations.length}
============================`;
}

/**
 * Helper function: returns a user-friendly dimension name and color for UI.
 *
 * @param {string} dimensionId
 * @returns {{dimName: string, color: string}}
 */
function getDimensionLabel(dimensionId) {
    switch (dimensionId) {
        case "minecraft:overworld": return { dimName: "Overworld", color: "§q" };
        case "minecraft:nether": return { dimName: "Nether", color: "§4" };
        case "minecraft:the_end": return { dimName: "The End", color: "§u" };
        default: return { dimName: "Unknown", color: "§f" };
    }
}

/**
 * Dismounts the Portal Gun back to its base form and returns tubes for remaining charge.
 *
 * @param {Player} player
 * @param {ItemStack} portalGunItem
 * @param {EntityInventoryComponent} inventory
 */
function dismountPortalGun(player, portalGunItem, inventory) {
    stopPlayerAnimation(player);
    const portalGunProperties = portalGunItem.getDynamicPropertyIds();
    const portalGunBase = new ItemStack("ram_portalgun:portal_gun_base", 1);

    portalGunProperties.forEach(id => {
        const value = portalGunItem.getDynamicProperty(id);
        portalGunBase.setDynamicProperty(id, value);
    });

    inventory.container.setItem(player.selectedSlotIndex, portalGunBase);

    const charge = portalGunItem.getDynamicProperty(portalGunDP.charge);
    if (charge > 0) {
        const chargedTube = new ItemStack("ram_portalgun:charged_tube", 1);
        chargedTube.setDynamicProperty(portalGunDP.charge, charge);
        chargedTube.setLore([`§eCharge: ${charge}%§r`]);
        inventory.container.addItem(chargedTube);
    } else {
        inventory.container.addItem(new ItemStack("ram_portalgun:empty_tube", 1));
    }

    player.dimension.playSound("ram_portalgun:portal_gun_unplug", player.location);
}