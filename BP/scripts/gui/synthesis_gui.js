import {ActionFormData, ModalFormData, MessageFormData} from "@minecraft/server-ui";

export function openSynthesisGUI(player){
    const ui = new ActionFormData()
    .title("Synthesis Bench")
    .body("\"Solve some equations to gain attribute points.\"")
    .button("Solve Equations", "textures/ui/sb_ui/btn1_indicator")
    .button("Calibrate Fluid", "textures/ui/sb_ui/btn2_indicator")
    .button("", "")

    ui.show(player).then(response => {
        
    });
}

