import { PortalGun } from "./classes";

export var portalSP;
export var portalDP;
export var playerDP;
export var portalGunDP;

export const portalGuns = [
  new PortalGun({
    id: "ram_portalgun:portal_gun",
    dischargedVersionId: "ram_portalgun:portal_gun_discharged",
    baseId: "ram_portalgun:portal_gun_base",
    emptyTubeId: "ram_portalgun:empty_tube",
    chargedTubeId: "ram_portalgun:charged_tube",
    projectileId: "ram_portalgun:fluid_projectile",
    highPressureProjectileId: "ram_portalgun:fluid_projectile_high_pressure",
    portalId: "ram_portalgun:green_portal"
  })
];

export var ID = {
  portalGunsIds : ["ram_portalgun:portal_gun"],
  dischargedPortalGuns : ["ram_portalgun:portal_gun_discharged"],
  components: {
    portalGunBases : ["ram_portalgun:portal_gun_base"],
    emptyTubes : ["ram_portalgun:empty_tube"],
    chargedTubes : ["ram_portalgun:charged_tube"]
  },
  projectiles : ["ram_portalgun:fluid_projectile", "ram_portalgun:fluid_projectile_high_pressure"],
  portals: ["ram_portalgun:green_portal"]
};

export const PORTAL_MODES = {
    FIFO: "FIFO",
    LIFO: "LIFO",
    MULTI_PAIR: "Multi-Pair",
    ROOT: "Root",
    CUSTOM: "CUSTOM"
};

(function (portalSP) {
  portalSP["isLinked"] = "ram_portalgun:is_linked";
  portalSP["rotation"] = "ram_portalgun:rotation";
  portalSP["orientation"] = "ram_portalgun:orientation";
  portalSP["close"] = "ram_portalgun:close"
  portalSP["scale"] = "ram_portalgun:portal_scale"
})(portalSP || (portalSP = {}));

(function (portalDP){
  portalDP["DualityPortalId"] = "ram_portalgun:dualityPortalId";
  portalDP["lastPortalUsed"] = "ram_portalgun:lastPortalUsed";
  portalDP["locationId"] = "ram_portalgun:location_id";
  portalDP["ownerPortalGun"] = "ram_portalgun:owner_portal_gun";
  portalDP["tickingArea"] = "ram_portalgun:ticking_area_name";
  portalDP["autoClose"] = "ram_portalgun:auto_close";
  portalDP["isRoot"] = "ram_portalgun:is_root";
  portalDP["childList"] = "ram_portalgun:child_list";
})(portalDP || (portalDP = {}));

(function (playerDP){
  playerDP["portalGunId"] = "ram_portalgun:portal_gun_id";
})(playerDP || (playerDP = {}));

(function (portalGunDP){
  portalGunDP["id"] = "ram_portalgun:portal_gun_id";
  portalGunDP["lastUser"] = "ram_portalgun:last_user";
  portalGunDP["portalList"] = "ram_portalgun:portal_list";
  portalGunDP["mode"] = "ram_portalgun:mode";
  portalGunDP["customLocation"] = "ram_portalgun:custom_location";
  portalGunDP["customLocationIndex"] = "ram_portalgun:custom_location_index";
  portalGunDP["savedLocations"] = "ram_portalgun:saved_locations";
  portalGunDP["historyLocations"] = "ram_portalgun:history_locations";
  portalGunDP["autoClose"] = "ram_portalgun:auto_close";
  portalGunDP["highPressure"] = "ram_portalgun:high_pressure";
  portalGunDP["safePlacement"] = "ram_portalgun:safe_placement";
  portalGunDP["charge"] = "ram_portalgun:charge";
  portalGunDP["scale"] = "ram_portalgun:portal_scale"

})(portalGunDP || (portalGunDP = {}));