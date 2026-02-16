import { PortalGun } from "./classes";

export var portalSP;
export var portalDP;
export var playerDP;
export var portalGunDP;

export const portalGuns = [
  //STANDARD PORTAL GUN
  new PortalGun({
    typeId: "ram_portalgun:portal_gun",
    baseId: "ram_portalgun:portal_gun_base",
    dischargedVersionId: "ram_portalgun:portal_gun_discharged",
    emptyTubeId: "ram_portalgun:empty_tube",
    chargedTubeId: "ram_portalgun:portal_fluid",
    bootlegTubeId: "ram_portalgun:bootleg_portal_fluid",
    projectileId: "ram_portalgun:fluid_projectile",
    bootlegProjectileId: "ram_portalgun:bootleg_fluid_projectile",
    highPressureProjectileId: "ram_portalgun:fluid_projectile_high_pressure",
    highPressureBootlegProjectileId:
      "ram_portalgun:bootleg_fluid_projectile_high_pressure",
    portalId: "ram_portalgun:green_portal",
    interfaceTextures: {
      title: "Portal Gun Menu",
      avatar: "saved_locations_ui",
      gun: "portal_gun",
      background: "textures/ui/pg_ui/menu/custom_back",
      dischargedBg: "textures/ui/pg_ui/menu/bg_discharged_standard",
    },
  }),

  //INTERSPATIAL PROTOTYPE PORTAL GUN
  new PortalGun({
    typeId: "ram_portalgun:interspatial_prototype_portal_gun",
    baseId: "ram_portalgun:prototype_portal_gun_base",
    dischargedVersionId: "ram_portalgun:prototype_portal_gun_discharged",
    emptyTubeId: "ram_portalgun:empty_tube",
    chargedTubeId: "ram_portalgun:interspatial_portal_fluid",
    bootlegTubeId: "ram_portalgun:bootleg_portal_fluid",
    projectileId: "ram_portalgun:blue_fluid_projectile",
    bootlegProjectileId: "ram_portalgun:bootleg_fluid_projectile",
    highPressureProjectileId:
      "ram_portalgun:blue_fluid_projectile_high_pressure",
    highPressureBootlegProjectileId:
      "ram_portalgun:bootleg_fluid_projectile_high_pressure",
    portalId: "ram_portalgun:interspatial_portal",
    interfaceTextures: {
      title: "Prototype",
      avatar: "prototype_sv_ui",
      gun: "interspatial_prototype_portal_gun",
      background: "textures/ui/pg_ui/menu/custom_back_blue_prototype",
      dischargedBg: "textures/ui/pg_ui/menu/bg_discharged_prototype",
    },
  }),

  //INTERDIMENSIONAL PROTOTYPE PORTAL GUN
  new PortalGun({
    typeId: "ram_portalgun:prototype_portal_gun",
    baseId: "ram_portalgun:prototype_portal_gun_base",
    dischargedVersionId: "ram_portalgun:prototype_portal_gun_discharged",
    emptyTubeId: "ram_portalgun:empty_tube",
    chargedTubeId: "ram_portalgun:portal_fluid",
    bootlegTubeId: "ram_portalgun:bootleg_portal_fluid",
    projectileId: "ram_portalgun:fluid_projectile",
    bootlegProjectileId: "ram_portalgun:bootleg_fluid_projectile",
    highPressureProjectileId: "ram_portalgun:fluid_projectile_high_pressure",
    highPressureBootlegProjectileId:
      "ram_portalgun:bootleg_fluid_projectile_high_pressure",
    portalId: "ram_portalgun:green_portal",
    interfaceTextures: {
      title: "Prototype",
      avatar: "prototype_sv_ui",
      gun: "prototype_portal_gun",
      background: "textures/ui/pg_ui/menu/custom_back_prototype",
      dischargedBg: "textures/ui/pg_ui/menu/bg_discharged_prototype",
    },
  }),
];

export var ID = {
  portalGunsIds: [
    "ram_portalgun:portal_gun",
    "ram_portalgun:prototype_portal_gun",
    "ram_portalgun:interspatial_prototype_portal_gun",
  ],
  dischargedPortalGuns: [
    "ram_portalgun:portal_gun_discharged",
    "ram_portalgun:prototype_portal_gun_discharged",
  ],
  components: {
    portalGunBases: [
      "ram_portalgun:portal_gun_base",
      "ram_portalgun:prototype_portal_gun_base",
    ],
    emptyTubes: ["ram_portalgun:empty_tube"],
    chargedTubes: [
      "ram_portalgun:portal_fluid",
      "ram_portalgun:extradimensional_portal_fluid",
      "ram_portalgun:interspatial_portal_fluid",
    ],
    bootlegTubes: ["ram_portalgun:bootleg_portal_fluid"],
  },
  projectiles: [
    "ram_portalgun:fluid_projectile",
    "ram_portalgun:fluid_projectile_high_pressure",
    "ram_portalgun:blue_fluid_projectile",
    "ram_portalgun:blue_fluid_projectile_high_pressure",
  ],
  bootlegProjectiles: [
    "ram_portalgun:bootleg_fluid_projectile",
    "ram_portalgun:bootleg_fluid_projectile_high_pressure",
  ],
  portals: ["ram_portalgun:green_portal", "ram_portalgun:interspatial_portal"],
  hair: [
    "ram_portalgun:rick_hair",
    "ram_portalgun:homesteader_rick_hair",
    "ram_portalgun:memory_rick_hair",
  ],
};

export const PORTAL_MODES = {
  FIFO: "FIFO",
  LIFO: "LIFO",
  MULTI_PAIR: "Multi-Pair",
  ROOT: "Root",
  CUSTOM: "CUSTOM",
};

(function (portalSP) {
  portalSP["isLinked"] = "ram_portalgun:is_linked";
  portalSP["rotation"] = "ram_portalgun:rotation";
  portalSP["orientation"] = "ram_portalgun:orientation";
  portalSP["close"] = "ram_portalgun:close";
  portalSP["scale"] = "ram_portalgun:portal_scale";
})(portalSP || (portalSP = {}));

(function (portalDP) {
  portalDP["DualityPortalId"] = "ram_portalgun:dualityPortalId";
  portalDP["lastPortalUsed"] = "ram_portalgun:lastPortalUsed";
  portalDP["locationId"] = "ram_portalgun:location_id";
  portalDP["ownerPortalGun"] = "ram_portalgun:owner_portal_gun";
  portalDP["tickingArea"] = "ram_portalgun:ticking_area_name";
  portalDP["autoClose"] = "ram_portalgun:auto_close";
  portalDP["bootleggedFluid"] = "ram_portalgun:bootlegged_fluid";
  portalDP["isRoot"] = "ram_portalgun:is_root";
  portalDP["childList"] = "ram_portalgun:child_list";
})(portalDP || (portalDP = {}));

(function (playerDP) {
  playerDP["portalGunId"] = "ram_portalgun:portal_gun_id";
})(playerDP || (playerDP = {}));

(function (portalGunDP) {
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
  portalGunDP["scale"] = "ram_portalgun:portal_scale";
  portalGunDP["fastLocationChange"] = "ram_portalgun:fast_location_change";
  portalGunDP["infiniteCharge"] = "ram_portalgun:infinite_charge";
  portalGunDP["bootleggedFluid"] = "ram_portalgun:bootlegged_fluid";
})(portalGunDP || (portalGunDP = {}));
