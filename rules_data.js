(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.UFLPA_RULES = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
  "schema_version": "2026.1.0",
  "engine_id": "us_vietnam_uflpa_cf28_bom_prescan",
  "effective_date": "2026-01-01",
  "authorities": {
    "uflpa_statute": "19 U.S.C. § 1307 (Uyghur Forced Labor Prevention Act, Pub. L. 117-78)",
    "cbp_cf28_cf29": "19 U.S.C. § 1509 & 19 CFR § 151.11 (CBP Form 28 Request for Information / Form 29 Notice of Action)",
    "anti_circumvention": "19 U.S.C. § 1677j (Tariff Act Sec. 781 Anti-Circumvention & AD/CVD Cash Deposit Orders)",
    "customs_broker_boundary": "19 U.S.C. § 1641 & 19 CFR § 111.36(b) (Non-audit tool; not a licensed customs broker; does not offer customs filing or broker fee-splitting)",
    "vietnam_circular_31": {
      "citation": "Vietnam MOIT Circular 31/2026/TT-BCT / VeriGoods",
      "mandatory_universal": false,
      "applies_to_chapters": [
        "28",
        "29",
        "39",
        "85"
      ],
      "scope_note": "Optional secondary reference for electronics (Ch. 85) and chemical/polymer inputs (Ch. 28, 29, 39) only. Never a universal Vietnam-to-US export traceability mandate."
    }
  },
  "commercial_parameters": {
    "flat_fee_cents": 169500,
    "flat_fee_label": "$1,695.00 flat non-contingent fee (0% commission)",
    "qualification_threshold_cents": 25000000,
    "qualification_threshold_label": "$250,000.00 exposed annual or shipment CIF value",
    "cf28_response_window_days": 30,
    "benchmark_avoided_loss_cents": 8500000,
    "bom_reconciliation_target_bps": 10000,
    "bom_reconciliation_tolerance_bps": 50
  },
  "sectors": {
    "WOOD_FURNITURE": {
      "label": "Wood & Furniture (Ch. 44 / 94)",
      "chapters": [
        "44",
        "94"
      ],
      "uflpa_priority_inputs": [
        "hardwood_plywood",
        "veneers",
        "mdf_particleboard",
        "pvc_edge_banding",
        "cotton_upholstery",
        "innerspring_steel"
      ],
      "ad_cvd_default_bps": {
        "low": 3500,
        "mid": 9500,
        "high": 20600
      },
      "ad_cvd_note": "Active US AD/CVD & Sec. 781 anti-circumvention scrutiny on Vietnam-assembled hardwood plywood, wooden cabinets/vanities, and mattresses using Chinese cores, veneers, or innersprings (typical cash deposit exposure 35%-206%+).",
      "tier2_raw_materials_en": [
        "Hardwood plywood core, face/back veneers, MDF/particleboard, or solid lumber logs (forest-of-harvest & mill certificates)",
        "PVC/vinyl coatings, foam, cotton upholstery fabric, and steel springs/fasteners"
      ],
      "tier2_raw_materials_vi": [
        "Cốt gỗ dán (plywood), ván lạng mặt/đáy (veneer), ván MDF/ván dăm hoặc gỗ xẻ nguyên liệu (chứng nhận nguồn gốc khai thác & nhà máy cưa/ép)",
        "Lớp phủ PVC/nhựa, mút xốp, vải bọc sợi bông (cotton) và lò xo/ốc vít thép"
      ],
      "cf28_required_evidence": [
        "CF28_COMM_INV_PL",
        "CF28_BOL_SEAL_LOG",
        "CF28_TIER1_PROD_RECORDS",
        "CF28_TIER2_MILL_CERT",
        "CF28_FORESTRY_TIMBER_COC",
        "CF28_PAYMENT_TRAIL",
        "CF28_BOM_RECONCILIATION",
        "CF28_NON_XUAR_SCREEN"
      ]
    },
    "STEEL_ALUMINUM": {
      "label": "Steel & Aluminum (Ch. 72 / 73 / 76)",
      "chapters": [
        "72",
        "73",
        "76"
      ],
      "uflpa_priority_inputs": [
        "hot_rolled_coil",
        "cold_rolled_steel",
        "wire_rod",
        "aluminum_billet",
        "aluminum_extrusion",
        "aluminum_foil_sheet"
      ],
      "ad_cvd_default_bps": {
        "low": 4500,
        "mid": 11500,
        "high": 25600
      },
      "ad_cvd_note": "Active Commerce AD/CVD & Sec. 781 anti-circumvention orders covering Vietnam-processed CORE steel, cold-rolled steel, steel pipe/tube, fasteners, and aluminum extrusions/sheet/foil melted or cast from Chinese substrate (25%-256%+ deposit bands).",
      "tier2_raw_materials_en": [
        "Primary steel melt/pour heat numbers (HRC/CRC/wire rod) with Mill Test Certificates (MTC / EN 10204 3.1)",
        "Primary aluminum smelter/cast-house country-of-smelt & country-of-cast certificates (billet/ingot/coil)"
      ],
      "tier2_raw_materials_vi": [
        "Số mẻ luyện/đúc thép nguyên liệu (HRC/CRC/thép cuộn) kèm Chứng chỉ thử nghiệm nhà máy luyện thép (MTC / EN 10204 3.1)",
        "Chứng nhận quốc gia luyện (smelt) và đúc (cast) phôi nhôm/nhôm thỏi/nhôm cuộn từ nhà máy luyện nhôm cấp 2"
      ],
      "cf28_required_evidence": [
        "CF28_COMM_INV_PL",
        "CF28_BOL_SEAL_LOG",
        "CF28_TIER1_PROD_RECORDS",
        "CF28_TIER2_MILL_CERT",
        "CF28_SMELT_POUR_HEAT_CERT",
        "CF28_PAYMENT_TRAIL",
        "CF28_BOM_RECONCILIATION",
        "CF28_NON_XUAR_SCREEN"
      ]
    },
    "SOLAR_ELECTRONICS": {
      "label": "Solar & Electronics (Ch. 85)",
      "chapters": [
        "85"
      ],
      "uflpa_priority_inputs": [
        "polysilicon",
        "quartzite_mgs",
        "silicon_wafers",
        "copper_wire_rod",
        "pvc_cable_jacket",
        "lithium_cathode",
        "aluminum_frame"
      ],
      "ad_cvd_default_bps": {
        "low": 5000,
        "mid": 12500,
        "high": 27100
      },
      "ad_cvd_note": "High-priority UFLPA polysilicon/quartzite enforcement plus active Southeast Asia (Vietnam) solar cell/module AD/CVD & Sec. 781 circumvention orders and electronics/battery/cable origin audits (50%-271%+ deposit bands).",
      "tier2_raw_materials_en": [
        "Quartzite -> Metallurgical-Grade Silicon (MGS) -> Polysilicon -> Ingot/Wafer lot traceability & refinery certificates",
        "Aluminum module frames, copper conductors, PVC jacketing, and lithium-ion cell/cathode refinery origin logs"
      ],
      "tier2_raw_materials_vi": [
        "Hồ sơ truy xuất theo lô từ Quặng thạch anh -> Silic cấp luyện kim (MGS) -> Polysilicon -> Thỏi/Tấm wafer kèm chứng nhận nhà máy tinh luyện",
        "Khung nhôm, lõi đồng, vỏ bọc nhựa PVC và nhật ký xuất xứ nhà máy tinh luyện cell/vật liệu cực pin lithium-ion"
      ],
      "cf28_required_evidence": [
        "CF28_COMM_INV_PL",
        "CF28_BOL_SEAL_LOG",
        "CF28_TIER1_PROD_RECORDS",
        "CF28_TIER2_MILL_CERT",
        "CF28_POLYSILICON_BATCH_COC",
        "CF28_PAYMENT_TRAIL",
        "CF28_BOM_RECONCILIATION",
        "CF28_NON_XUAR_SCREEN"
      ]
    },
    "APPAREL_FOOTWEAR": {
      "label": "Apparel & Footwear (Ch. 61 / 62 / 64)",
      "chapters": [
        "61",
        "62",
        "64"
      ],
      "uflpa_priority_inputs": [
        "raw_cotton",
        "cotton_yarn",
        "woven_knit_fabric",
        "pvc_outsole",
        "synthetic_leather_pu"
      ],
      "ad_cvd_default_bps": {
        "low": 2500,
        "mid": 4500,
        "high": 8500
      },
      "ad_cvd_note": "High-volume CBP UFLPA WRO/detention category targeting cotton fiber/yarn/fabric spun in or sourced from China (XUAR nexus) and PVC/synthetic footwear components assembled in Vietnam; risk includes detention, redelivery, and 25%-85%+ penalty/deposit exposure.",
      "tier2_raw_materials_en": [
        "Cotton bale/gin origin certificates, spinning mill yarn lot invoices, and weaving/knitting/dyeing mill records",
        "Footwear PVC/rubber compounder, EVA/PU upper supplier, and textile lining origin affidavits"
      ],
      "tier2_raw_materials_vi": [
        "Chứng nhận nguồn gốc bông thô/nhà máy tách hạt bông, hóa đơn lô sợi từ nhà máy kéo sợi và hồ sơ nhà máy dệt/nhuộm vải",
        "Bản khai xuất xứ nhà cung cấp hợp chất đế PVC/cao su, da tổng hợp EVA/PU và vải lót giày dép"
      ],
      "cf28_required_evidence": [
        "CF28_COMM_INV_PL",
        "CF28_BOL_SEAL_LOG",
        "CF28_TIER1_PROD_RECORDS",
        "CF28_TIER2_MILL_CERT",
        "CF28_COTTON_YARN_GIN_COC",
        "CF28_PAYMENT_TRAIL",
        "CF28_BOM_RECONCILIATION",
        "CF28_NON_XUAR_SCREEN"
      ]
    }
  },
  "hts4_rules": {
    "4412": {
      "sector": "WOOD_FURNITURE",
      "description": "Plywood, veneered panels, and laminated wood",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5000,
      "ad_cvd_mid_bps": 11500,
      "ad_cvd_high_bps": 20600,
      "case_ref": "Hardwood Plywood (VN Sec. 781 Anti-Circumvention)"
    },
    "4418": {
      "sector": "WOOD_FURNITURE",
      "description": "Builders' joinery and carpentry of wood (doors, panels, mouldings)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 7500,
      "ad_cvd_high_bps": 16500,
      "case_ref": "Wood Mouldings & Millwork / Timber Origin"
    },
    "9401": {
      "sector": "WOOD_FURNITURE",
      "description": "Seats and upholstered/wooden/metal seating furniture",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 5500,
      "ad_cvd_high_bps": 12000,
      "case_ref": "Wooden/Upholstered Seating (Cotton/Timber/Steel Subcomponents)"
    },
    "9403": {
      "sector": "WOOD_FURNITURE",
      "description": "Other furniture (wooden bedroom furniture, cabinets, vanities, parts)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4500,
      "ad_cvd_mid_bps": 10500,
      "ad_cvd_high_bps": 21600,
      "case_ref": "Wooden Cabinets/Vanities & Bedroom Furniture (VN Sec. 781)"
    },
    "9404": {
      "sector": "WOOD_FURNITURE",
      "description": "Mattress supports, mattresses, and stuffed bedding articles",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4000,
      "ad_cvd_mid_bps": 9500,
      "ad_cvd_high_bps": 19000,
      "case_ref": "Mattresses from Vietnam (AD/CVD + Cotton/Innerspring Origin)"
    },
    "7208": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled iron or non-alloy steel, hot-rolled, width >= 600mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4500,
      "ad_cvd_mid_bps": 11000,
      "ad_cvd_high_bps": 25600,
      "case_ref": "Flat-Rolled Steel / CORE & CRS Sec. 781"
    },
    "7209": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled iron or non-alloy steel, cold-rolled, width >= 600mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5000,
      "ad_cvd_mid_bps": 12500,
      "ad_cvd_high_bps": 25600,
      "case_ref": "Cold-Rolled Steel Flat Products (VN Sec. 781)"
    },
    "7210": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled iron or non-alloy steel, clad, plated, or coated (CORE)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5500,
      "ad_cvd_mid_bps": 13500,
      "ad_cvd_high_bps": 25600,
      "case_ref": "Corrosion-Resistant Steel (CORE) VN Anti-Circumvention"
    },
    "7211": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled iron or non-alloy steel, width < 600mm, not clad/plated",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4500,
      "ad_cvd_mid_bps": 11000,
      "ad_cvd_high_bps": 22000,
      "case_ref": "Narrow Flat-Rolled Steel Substrate Scrutiny"
    },
    "7212": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled iron or non-alloy steel, width < 600mm, clad/plated/coated",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5000,
      "ad_cvd_mid_bps": 12000,
      "ad_cvd_high_bps": 24000,
      "case_ref": "Coated Strip Steel / CORE Sec. 781"
    },
    "7213": {
      "sector": "STEEL_ALUMINUM",
      "description": "Bars and rods, hot-rolled, in irregularly wound coils, non-alloy steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18000,
      "case_ref": "Carbon Steel Wire Rod Origin & Melt/Pour"
    },
    "7214": {
      "sector": "STEEL_ALUMINUM",
      "description": "Other bars and rods of iron or non-alloy steel, hot-rolled/drawn",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 17500,
      "case_ref": "Steel Rebar & Merchant Bar Melt/Pour"
    },
    "7215": {
      "sector": "STEEL_ALUMINUM",
      "description": "Other bars and rods of iron or non-alloy steel, cold-formed/finished",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 17500,
      "case_ref": "Cold-Finished Steel Bar Melt/Pour"
    },
    "7216": {
      "sector": "STEEL_ALUMINUM",
      "description": "Angles, shapes, and sections of iron or non-alloy steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 17500,
      "case_ref": "Structural Steel Shapes Origin"
    },
    "7217": {
      "sector": "STEEL_ALUMINUM",
      "description": "Wire of iron or non-alloy steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4000,
      "ad_cvd_mid_bps": 9500,
      "ad_cvd_high_bps": 19500,
      "case_ref": "Carbon Steel Wire / Galvanized Wire"
    },
    "7218": {
      "sector": "STEEL_ALUMINUM",
      "description": "Stainless steel in ingots or other primary/semi-finished forms",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4000,
      "ad_cvd_mid_bps": 9500,
      "ad_cvd_high_bps": 20000,
      "case_ref": "Stainless Steel Primary Melt/Pour"
    },
    "7219": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled products of stainless steel, width >= 600mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4500,
      "ad_cvd_mid_bps": 10500,
      "ad_cvd_high_bps": 21000,
      "case_ref": "Stainless Steel Sheet & Strip (AD/CVD)"
    },
    "7220": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled products of stainless steel, width < 600mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4500,
      "ad_cvd_mid_bps": 10500,
      "ad_cvd_high_bps": 21000,
      "case_ref": "Stainless Steel Strip (AD/CVD)"
    },
    "7221": {
      "sector": "STEEL_ALUMINUM",
      "description": "Bars and rods, hot-rolled, in coils, of stainless steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18000,
      "case_ref": "Stainless Wire Rod Melt/Pour"
    },
    "7222": {
      "sector": "STEEL_ALUMINUM",
      "description": "Other bars, rods, angles, shapes, and sections of stainless steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18000,
      "case_ref": "Stainless Bar & Shapes Melt/Pour"
    },
    "7223": {
      "sector": "STEEL_ALUMINUM",
      "description": "Wire of stainless steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18500,
      "case_ref": "Stainless Wire Melt/Pour"
    },
    "7224": {
      "sector": "STEEL_ALUMINUM",
      "description": "Other alloy steel in ingots or semi-finished forms",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18500,
      "case_ref": "Alloy Steel Primary Substrate"
    },
    "7225": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled products of other alloy steel, width >= 600mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5000,
      "ad_cvd_mid_bps": 12000,
      "ad_cvd_high_bps": 25600,
      "case_ref": "Alloy Flat-Rolled / CORE Sec. 781"
    },
    "7226": {
      "sector": "STEEL_ALUMINUM",
      "description": "Flat-rolled products of other alloy steel, width < 600mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4500,
      "ad_cvd_mid_bps": 11000,
      "ad_cvd_high_bps": 22000,
      "case_ref": "Alloy Strip Steel Substrate"
    },
    "7227": {
      "sector": "STEEL_ALUMINUM",
      "description": "Bars and rods, hot-rolled, in coils, of other alloy steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18000,
      "case_ref": "Alloy Wire Rod Melt/Pour"
    },
    "7228": {
      "sector": "STEEL_ALUMINUM",
      "description": "Other bars, rods, angles, shapes, hollow drill bars of alloy steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18000,
      "case_ref": "Alloy Steel Bar Melt/Pour"
    },
    "7229": {
      "sector": "STEEL_ALUMINUM",
      "description": "Wire of other alloy steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4000,
      "ad_cvd_mid_bps": 9500,
      "ad_cvd_high_bps": 19500,
      "case_ref": "Alloy Steel Wire Melt/Pour"
    },
    "7306": {
      "sector": "STEEL_ALUMINUM",
      "description": "Other tubes, pipes, and hollow profiles of iron or steel (welded/riveted)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5000,
      "ad_cvd_mid_bps": 11500,
      "ad_cvd_high_bps": 23000,
      "case_ref": "Circular Welded Pipe & Light-Walled Rectangular Tubing (VN Sec. 781)"
    },
    "7318": {
      "sector": "STEEL_ALUMINUM",
      "description": "Screws, bolts, nuts, coach screws, rivets, washers of iron or steel",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4000,
      "ad_cvd_mid_bps": 9500,
      "ad_cvd_high_bps": 20600,
      "case_ref": "Steel Nails, Threaded Rod & Fasteners (VN AD/CVD)"
    },
    "7326": {
      "sector": "STEEL_ALUMINUM",
      "description": "Other articles of iron or steel (racks, wire hangers, stamped brackets)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18500,
      "case_ref": "Steel Racks / Wire Hangers / Fabricated Steel (VN Sec. 781)"
    },
    "7604": {
      "sector": "STEEL_ALUMINUM",
      "description": "Aluminum bars, rods, and profiles (extrusions)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5500,
      "ad_cvd_mid_bps": 13500,
      "ad_cvd_high_bps": 24000,
      "case_ref": "Aluminum Extrusions (VN AD/CVD & UFLPA XUAR Smelter Risk)"
    },
    "7606": {
      "sector": "STEEL_ALUMINUM",
      "description": "Aluminum plates, sheets, and strip, thickness > 0.2mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 4500,
      "ad_cvd_mid_bps": 11000,
      "ad_cvd_high_bps": 21500,
      "case_ref": "Common Alloy Aluminum Sheet (VN AD/CVD & UFLPA Smelter)"
    },
    "7607": {
      "sector": "STEEL_ALUMINUM",
      "description": "Aluminum foil, thickness <= 0.2mm",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 5000,
      "ad_cvd_mid_bps": 12000,
      "ad_cvd_high_bps": 22500,
      "case_ref": "Aluminum Foil (Sec. 781 Anti-Circumvention & UFLPA)"
    },
    "7615": {
      "sector": "STEEL_ALUMINUM",
      "description": "Table, kitchen, or other household articles of aluminum",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8000,
      "ad_cvd_high_bps": 17000,
      "case_ref": "Aluminum Household/Cookware Articles (Smelt/Cast Origin)"
    },
    "8541": {
      "sector": "SOLAR_ELECTRONICS",
      "description": "Semiconductor devices, photovoltaic cells and solar modules",
      "uflpa_risk": "CRITICAL",
      "ad_cvd_low_bps": 6500,
      "ad_cvd_mid_bps": 15000,
      "ad_cvd_high_bps": 27100,
      "case_ref": "Crystalline Silicon PV Cells/Modules (VN AD/CVD + UFLPA Polysilicon)"
    },
    "8504": {
      "sector": "SOLAR_ELECTRONICS",
      "description": "Electrical transformers, static converters (inverters/power supplies), inductors",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3000,
      "ad_cvd_mid_bps": 7000,
      "ad_cvd_high_bps": 15000,
      "case_ref": "Power Converters/Transformers (Silicon/Aluminum/Steel Subcomponents)"
    },
    "8507": {
      "sector": "SOLAR_ELECTRONICS",
      "description": "Electric accumulators (lithium-ion & lead-acid batteries)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8000,
      "ad_cvd_high_bps": 16500,
      "case_ref": "Lithium-Ion Batteries (UFLPA Critical Minerals / Cathode / Foil)"
    },
    "8517": {
      "sector": "SOLAR_ELECTRONICS",
      "description": "Telephone sets, routers, networking & telecom apparatus",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 5500,
      "ad_cvd_high_bps": 11500,
      "case_ref": "Electronics & Telecom Assemblies (UFLPA Tier-2/3 Component Trace)"
    },
    "8544": {
      "sector": "SOLAR_ELECTRONICS",
      "description": "Insulated wire, cable, optical fiber cables, wire harnesses",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 3500,
      "ad_cvd_mid_bps": 8500,
      "ad_cvd_high_bps": 18500,
      "case_ref": "Aluminum/Copper Wire & PVC Cable Harnesses (VN AD/CVD + UFLPA PVC)"
    },
    "6109": {
      "sector": "APPAREL_FOOTWEAR",
      "description": "T-shirts, singlets, tank tops and similar garments, knitted or crocheted",
      "uflpa_risk": "CRITICAL",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 4500,
      "ad_cvd_high_bps": 8500,
      "case_ref": "UFLPA Priority Cotton Knit Apparel (Gin-to-Garment Trace)"
    },
    "6110": {
      "sector": "APPAREL_FOOTWEAR",
      "description": "Sweaters, pullovers, sweatshirts, waistcoats, knitted or crocheted",
      "uflpa_risk": "CRITICAL",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 4500,
      "ad_cvd_high_bps": 8500,
      "case_ref": "UFLPA Priority Cotton/Blend Knitwear (Yarn & Mill Origin)"
    },
    "6203": {
      "sector": "APPAREL_FOOTWEAR",
      "description": "Men's or boys' suits, trousers, breeches and shorts, woven",
      "uflpa_risk": "CRITICAL",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 4500,
      "ad_cvd_high_bps": 8500,
      "case_ref": "UFLPA Priority Woven Cotton Trousers/Apparel"
    },
    "6204": {
      "sector": "APPAREL_FOOTWEAR",
      "description": "Women's or girls' suits, dresses, skirts, trousers, woven",
      "uflpa_risk": "CRITICAL",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 4500,
      "ad_cvd_high_bps": 8500,
      "case_ref": "UFLPA Priority Woven Apparel (Cotton/Viscose Trace)"
    },
    "6402": {
      "sector": "APPAREL_FOOTWEAR",
      "description": "Footwear with outer soles and uppers of rubber or plastics (PVC/EVA)",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 4500,
      "ad_cvd_high_bps": 8000,
      "case_ref": "Footwear (UFLPA PVC Resin & Synthetic Compounder Trace)"
    },
    "6403": {
      "sector": "APPAREL_FOOTWEAR",
      "description": "Footwear with outer soles of rubber/plastics/leather and leather uppers",
      "uflpa_risk": "HIGH",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 4500,
      "ad_cvd_high_bps": 8000,
      "case_ref": "Footwear (UFLPA Cotton Lining / PVC Sole / Leather Tannery)"
    },
    "6404": {
      "sector": "APPAREL_FOOTWEAR",
      "description": "Footwear with outer soles of rubber/plastics and textile uppers",
      "uflpa_risk": "CRITICAL",
      "ad_cvd_low_bps": 2500,
      "ad_cvd_mid_bps": 5000,
      "ad_cvd_high_bps": 8500,
      "case_ref": "Textile-Upper Footwear (UFLPA Cotton Canvas/Yarn + PVC Sole)"
    }
  },
  "uflpa_priority_component_hs4": [
    "2804",
    "2836",
    "3818",
    "3904",
    "4407",
    "4408",
    "4410",
    "4411",
    "4412",
    "5201",
    "5203",
    "5205",
    "5206",
    "5208",
    "5209",
    "5210",
    "5211",
    "5212",
    "5504",
    "5509",
    "6001",
    "6006",
    "7201",
    "7206",
    "7207",
    "7208",
    "7209",
    "7210",
    "7211",
    "7212",
    "7213",
    "7214",
    "7215",
    "7216",
    "7217",
    "7218",
    "7219",
    "7220",
    "7221",
    "7222",
    "7223",
    "7224",
    "7225",
    "7226",
    "7227",
    "7228",
    "7229",
    "7306",
    "7601",
    "7604",
    "7605",
    "7606",
    "7607",
    "8507",
    "8541"
  ],
  "cf28_evidence_catalog": {
    "CF28_COMM_INV_PL": {
      "label_en": "Commercial Invoice, Packing List & SKU Lot Cross-Reference",
      "label_vi": "Hóa đơn thương mại (Commercial Invoice), Phiếu đóng gói (Packing List) & Bảng đối chiếu mã SKU/lô hàng",
      "cbp_basis": "19 U.S.C. § 1509 / CBP CF 28 Standard Entry File"
    },
    "CF28_BOL_SEAL_LOG": {
      "label_en": "Master/House Ocean Bill of Lading, Container Seal & Export Customs Declaration (VN)",
      "label_vi": "Vận đơn đường biển (MBL/HBL), nhật ký số chì container & Tờ khai hải quan xuất khẩu Việt Nam",
      "cbp_basis": "CBP UFLPA Operational Guidance — Transaction & Transport Chain"
    },
    "CF28_TIER1_PROD_RECORDS": {
      "label_en": "Vietnam Tier-1 Factory Production Batch Logs, Cutting/Assembly Work Orders & Substantial Transformation Proof",
      "label_vi": "Nhật ký lệnh sản xuất theo lô tại nhà máy cấp 1 Việt Nam, phiếu cắt/lắp ráp & hồ sơ chứng minh gia công chuyển đổi cơ bản",
      "cbp_basis": "19 CFR § 102 / Substantial Transformation & UFLPA Tier-1 Verification"
    },
    "CF28_TIER2_MILL_CERT": {
      "label_en": "Tier-2 Raw Material Supplier Identity (Legal Name, Address, Mill/Plant ID) & Certificate of Origin",
      "label_vi": "Thông tin nhà cung cấp nguyên liệu cấp 2 (Tên pháp lý, địa chỉ, mã nhà máy/xưởng) & Chứng nhận xuất xứ nguyên liệu",
      "cbp_basis": "CBP UFLPA Entity List & Upstream Supplier Mapping"
    },
    "CF28_PAYMENT_TRAIL": {
      "label_en": "Tier-1 to Tier-2 Purchase Orders, Material Receiving Notes & Bank Wire / L/C Payment Proof",
      "label_vi": "Đơn đặt hàng (PO), phiếu nhập kho nguyên liệu & chứng từ thanh toán ngân hàng/L/C giữa nhà máy cấp 1 và nhà cung cấp cấp 2",
      "cbp_basis": "CBP CF 28 Chain-of-Custody Payment Verification"
    },
    "CF28_BOM_RECONCILIATION": {
      "label_en": "100% Cost & Weight Multi-Tier BOM Reconciliation Tied to Commercial Invoice Quantities",
      "label_vi": "Bảng đối chiếu định mức nguyên vật liệu (BOM) đa cấp đủ 100% theo chi phí và khối lượng khớp với số lượng hóa đơn",
      "cbp_basis": "CBP CF 28 Quantitative Input-to-Output Reconciliation"
    },
    "CF28_NON_XUAR_SCREEN": {
      "label_en": "Written Tier-1 & Tier-2 Non-XUAR / Non-UFLPA Entity List Screening Declaration",
      "label_vi": "Bản cam kết rà soát không sử dụng nguyên liệu từ khu vực bị hạn chế UFLPA / danh sách thực thể UFLPA từ cấp 1 & cấp 2",
      "cbp_basis": "19 U.S.C. § 1307 / UFLPA Entity List Due Diligence"
    },
    "CF28_FORESTRY_TIMBER_COC": {
      "label_en": "Timber Harvest Origin, Veneer/Plywood Mill Pressing Logs & Non-CN Core Statement",
      "label_vi": "Chứng nhận nguồn gốc khai thác gỗ, nhật ký ép ván dán/veneer & xác nhận không dùng cốt gỗ dán xuất xứ Trung Quốc",
      "cbp_basis": "Sec. 781 Hardwood Plywood / Cabinets Anti-Circumvention & Lacey/UFLPA"
    },
    "CF28_SMELT_POUR_HEAT_CERT": {
      "label_en": "Steel Mill Test Certificate (EN 10204 3.1 Melt/Pour Heat#) or Primary Aluminum Country-of-Smelt & Cast Certificate",
      "label_vi": "Chứng chỉ nhà máy thép (MTC EN 10204 3.1 ghi rõ số mẻ luyện/đúc) hoặc Chứng nhận quốc gia luyện & đúc phôi nhôm sơ cấp",
      "cbp_basis": "CBP Steel/Aluminum Sec. 781 AD/CVD & UFLPA Smelter Traceability"
    },
    "CF28_POLYSILICON_BATCH_COC": {
      "label_en": "Quartzite -> MGS -> Polysilicon -> Wafer/Cell Lot Chain-of-Custody & Mass Balance Sheet",
      "label_vi": "Hồ sơ chuỗi hành trình theo lô Quặng thạch anh -> MGS -> Polysilicon -> Wafer/Cell & Bảng cân đối khối lượng",
      "cbp_basis": "CBP UFLPA Polysilicon Traceability & VN Solar AD/CVD Order"
    },
    "CF28_COTTON_YARN_GIN_COC": {
      "label_en": "Cotton Bale/Gin Origin Record, Spinning Mill Yarn Lot Invoice & Fabric Weaving/Dyeing Lot Trace",
      "label_vi": "Hồ sơ kiện bông/nhà máy tách hạt bông, hóa đơn lô sợi nhà máy kéo sợi & truy xuất lô vải dệt/nhuộm",
      "cbp_basis": "CBP UFLPA Cotton Apparel & Textile Footwear Operational Guidance"
    }
  },
  "disclaimers": {
    "non_licensed_broker": "Independent non-audit, non-legal documentation readiness tool: we are not a licensed customs broker under 19 U.S.C. § 1641, do not offer CBP Form 7501 or Form 3461 entry filing, and never participate in broker fee-splitting under 19 CFR § 111.36(b).",
    "non_legal_upl": "Independent non-audit BOM and traceability gap workpaper only: this output is not legal advice, does not provide legal representation or admissibility rulings, and does not perform direct CBP Form 28 or Form 29 filing; provide workpapers to your compliance officer, customs broker, or trade counsel.",
    "flat_non_contingent_fee": "Fixed $1,695.00 flat non-contingent fee (0% commission; never a contingent fee, never percentage-based on duties avoided or shipment value).",
    "zero_password_zero_upload": "100% browser-local pre-scan: zero data uploaded to any server; never share ACE, ERP, or customs broker portal passwords.",
    "circular_31_boundary": "Optional Secondary Note: Vietnam Circular 31/2026/TT-BCT / VeriGoods is referenced only as an optional secondary field for electronics (Ch. 85) and chemical/polymer inputs (Ch. 28/29/39) and is never a universal Vietnam-to-US export traceability mandate."
  }
};
}));
