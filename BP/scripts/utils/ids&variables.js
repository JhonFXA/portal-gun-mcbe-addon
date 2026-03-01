import { PortalGun } from "./classes";

export var portalSP;
export var portalDP;
export var playerDP;
export var portalGunDP;

export var ID = {
  portalGunsIds: [
    "ram_pg:standard_portal_gun",
    "ram_pg:prototype_portal_gun",
    "ram_pg:interspatial_prototype_portal_gun",
  ],

  dischargedPortalGuns: [
    "ram_pg:standard_portal_gun_discharged",
    "ram_pg:prototype_portal_gun_discharged",
  ],

  components: {
    portalGunBases: [
      "ram_pg:standard_portal_gun_base",
      "ram_pg:prototype_portal_gun_base",
    ],

    emptyTubes: [
      "ram_pg:empty_tube",
    ],

    chargedTubes: [
      "ram_pg:green_portal_fluid",
      "ram_pg:yellow_portal_fluid",
      "ram_pg:blue_portal_fluid",
    ],

    bootlegTubes: [
      "ram_pg:bootleg_portal_fluid",
    ],
  },

  projectiles: [
    "ram_pg:fluid_projectile",
    "ram_pg:fluid_projectile_high_pressure",
    "ram_pg:blue_fluid_projectile",
    "ram_pg:blue_fluid_projectile_high_pressure",
  ],

  bootlegProjectiles: [
    "ram_pg:bootleg_fluid_projectile",
    "ram_pg:bootleg_fluid_projectile_high_pressure",
  ],

  portals: [
    "ram_pg:green_portal",
    "ram_pg:interspatial_portal",
  ],

  hair: [
    "ram_pg:rick_hair",
    "ram_pg:homesteader_rick_hair",
    "ram_pg:memory_rick_hair",
  ],
};

/* ======================================================
   PORTAL GUNS (SEM HARDCODE)
====================================================== */

export const portalGuns = [
  // STANDARD PORTAL GUN
  new PortalGun({
    typeId: ID.portalGunsIds[0],
    baseId: ID.components.portalGunBases[0],
    dischargedVersionId: ID.dischargedPortalGuns[0],
    emptyTubeId: ID.components.emptyTubes[0],
    chargedTubeId: ID.components.chargedTubes[0],
    bootlegTubeId: ID.components.bootlegTubes[0],
    projectileId: ID.projectiles[0],
    bootlegProjectileId: ID.bootlegProjectiles[0],
    highPressureProjectileId: ID.projectiles[1],
    highPressureBootlegProjectileId:
      ID.bootlegProjectiles[1],
    portalId: ID.portals[0],
    interfaceTextures: {
      title: "Portal Gun Menu",
      avatar: "saved_locations_ui",
      gun: "standard/standard_portal_gun",
      background:
        "textures/ram_pg/ui/pg_ui/menu/standard_pg",
      dischargedBg:
        "textures/ram_pg/ui/pg_ui/menu/bg_discharged_standard",
    },
  }),

  // INTERSPATIAL PROTOTYPE PORTAL GUN
  new PortalGun({
    typeId: ID.portalGunsIds[2],
    baseId: ID.components.portalGunBases[1],
    dischargedVersionId: ID.dischargedPortalGuns[1],
    emptyTubeId: ID.components.emptyTubes[0],
    chargedTubeId: ID.components.chargedTubes[2],
    bootlegTubeId: ID.components.bootlegTubes[0],
    projectileId: ID.projectiles[2],
    bootlegProjectileId: ID.bootlegProjectiles[0],
    highPressureProjectileId:
      ID.projectiles[3],
    highPressureBootlegProjectileId:
      ID.bootlegProjectiles[1],
    portalId: ID.portals[1],
    interfaceTextures: {
      title: "Prototype",
      avatar: "prototype_sv_ui",
      gun: "prototype/interspatial_prototype_portal_gun",
      background:
        "textures/ram_pg/ui/pg_ui/menu/custom_back_blue_prototype",
      dischargedBg:
        "textures/ram_pg/ui/pg_ui/menu/bg_discharged_prototype",
    },
  }),

  // INTERDIMENSIONAL PROTOTYPE PORTAL GUN
  new PortalGun({
    typeId: ID.portalGunsIds[1],
    baseId: ID.components.portalGunBases[1],
    dischargedVersionId: ID.dischargedPortalGuns[1],
    emptyTubeId: ID.components.emptyTubes[0],
    chargedTubeId: ID.components.chargedTubes[0],
    bootlegTubeId: ID.components.bootlegTubes[0],
    projectileId: ID.projectiles[0],
    bootlegProjectileId: ID.bootlegProjectiles[0],
    highPressureProjectileId:
      ID.projectiles[1],
    highPressureBootlegProjectileId:
      ID.bootlegProjectiles[1],
    portalId: ID.portals[0],
    interfaceTextures: {
      title: "Prototype",
      avatar: "prototype_sv_ui",
      gun: "prototype/prototype_portal_gun",
      background:
        "textures/ram_pg/ui/pg_ui/menu/custom_back_prototype",
      dischargedBg:
        "textures/ram_pg/ui/pg_ui/menu/bg_discharged_prototype",
    },
  }),
];

/* ======================================================
   PORTAL MODES
====================================================== */

export const PORTAL_MODES = {
  FIFO: "FIFO",
  LIFO: "LIFO",
  MULTI_PAIR: "Multi-Pair",
  ROOT: "Root",
  CUSTOM: "CUSTOM",
};

/* ======================================================
   STRING PROPERTIES
====================================================== */

(function (portalSP) {
  portalSP["isLinked"] = "ram_pg:is_linked";
  portalSP["rotation"] = "ram_pg:rotation";
  portalSP["orientation"] = "ram_pg:orientation";
  portalSP["close"] = "ram_pg:close";
  portalSP["scale"] = "ram_pg:portal_scale";
})(portalSP || (portalSP = {}));

(function (portalDP) {
  portalDP["DualityPortalId"] = "ram_pg:dualityPortalId";
  portalDP["lastPortalUsed"] = "ram_pg:lastPortalUsed";
  portalDP["locationId"] = "ram_pg:location_id";
  portalDP["ownerPortalGun"] = "ram_pg:owner_portal_gun";
  portalDP["tickingArea"] = "ram_pg:ticking_area_name";
  portalDP["autoClose"] = "ram_pg:auto_close";
  portalDP["bootleggedFluid"] = "ram_pg:bootlegged_fluid";
  portalDP["isRoot"] = "ram_pg:is_root";
  portalDP["childList"] = "ram_pg:child_list";
})(portalDP || (portalDP = {}));

(function (playerDP) {
  playerDP["portalGunId"] = "ram_pg:portal_gun_id";
})(playerDP || (playerDP = {}));

(function (portalGunDP) {
  portalGunDP["id"] = "ram_pg:portal_gun_id";
  portalGunDP["lastUser"] = "ram_pg:last_user";
  portalGunDP["portalList"] = "ram_pg:portal_list";
  portalGunDP["mode"] = "ram_pg:mode";
  portalGunDP["customLocation"] =
    "ram_pg:custom_location";
  portalGunDP["customLocationIndex"] =
    "ram_pg:custom_location_index";
  portalGunDP["savedLocations"] =
    "ram_pg:saved_locations";
  portalGunDP["historyLocations"] =
    "ram_pg:history_locations";
  portalGunDP["charge"] = "ram_pg:charge";
  portalGunDP["bootleggedFluid"] =
    "ram_pg:bootlegged_fluid";

  portalGunDP["behavior"] = {
    autoClose: "ram_pg:auto_close",
    highPressure: "ram_pg:high_pressure",
    safePlacement: "ram_pg:safe_placement",
    fastLocationChange:
      "ram_pg:fast_location_change",
    scale: "ram_pg:portal_scale",
  };
})(portalGunDP || (portalGunDP = {}));