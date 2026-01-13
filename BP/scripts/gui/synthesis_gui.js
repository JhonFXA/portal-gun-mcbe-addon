import { ItemStack } from "@minecraft/server";
import {ActionFormData, ModalFormData, MessageFormData} from "@minecraft/server-ui";

export function openSynthesisGUI(player, points = 0){
    const ui = new ActionFormData()
    .title("Synthesis Bench")
    .body("\"Solve some equations to gain attribute points.\"")
    .button("Solve Equations", "textures/ui/sb_ui/btn1_indicator")
    .button("Calibrate Fluid", "textures/ui/sb_ui/btn2_indicator")
    .button("", "")

    ui.show(player).then(response => {
        switch(response.selection){
            case 0:
                openSolveEquationsForm(player);
                break;
            case 1:
                openCalibrateFluidForm(player);
                break;
            default:
        }
    });
}


function openSolveEquationsForm(player){

}

function openCalibrateFluidForm(player){
    const form = new ModalFormData()
    .title("Calibrate Fluid")
    //default values: 0, 50, 500, 50
    .slider("Fluid Dimensional Phase", -100, 100, {defaultValue: 8})
    .slider("Isotopic Concentration", 0, 100, {defaultValue: 42})
    .slider("Quantum Flux", 0, 1000, {defaultValue: 314})
    .slider("Molecular Cohesion", 0, 100, {defaultValue: 73})

    form.show(player).then(response => {
        if(response.canceled){
            openSynthesisGUI(player);
            return;
        }
        const [phase, concentration, flux, cohesion] = response.formValues;

        const standardFluid = (phase === 8) && (concentration === 42) && (flux === 314) && (cohesion === 73);
        const inventory = player.getComponent("minecraft:inventory").container;
        const item = inventory.getItem(player.selectedSlotIndex);
        if(item.typeId !== "ram_portalgun:bootleg_portal_fluid" && item.typeId !== "ram_portalgun:portal_fluid"){
            player.sendMessage("You must hold a fluid in your hand to calibrate it.");
            return;
        }
        if(standardFluid){
            const calibratedFluid = new ItemStack("ram_portalgun:portal_fluid", 1);
            inventory.setItem(player.selectedSlotIndex, calibratedFluid);
            player.dimension.playSound("random.potion.brewed", player.location, {volume: 1, pitch: 1});
            player.dimension.createExplosion(player.location, 1, {allowUnderwater: true, breaksBlocks: false, causesFire: false, source: player});
        } else {
            player.dimension.createExplosion(player.location, 0.5, {allowUnderwater: true, breaksBlocks: true, causesFire: true, source: player});
        }
    });
}
