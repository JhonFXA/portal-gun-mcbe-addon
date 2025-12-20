import {ActionFormData, ModalFormData, MessageFormData} from "@minecraft/server-ui";

export function openMathGUI(player){
    const ui = new ActionFormData()
    .title("Math Workbench")
    .body("Time to do some math yupiii!")
    .button("Option 1")
    .button("Option 2")
    .button("Option 3")
    .button("Option 4");

    ui.show(player).then(response => {
        
    });
}