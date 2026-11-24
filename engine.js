/* US-Vietnam UFLPA (19 U.S.C. § 1307) x CBP CF 28/29 (19 U.S.C. § 1509)
 * Pure Browser-Local / Node.js Deterministic BOM Pre-Scan Engine.
 * Independent non-audit, non-legal documentation readiness tool: not a licensed
 * customs broker under 19 U.S.C. § 1641, not legal advice, does not provide legal
 * representation or CBP filing, never participates in broker fee-splitting under
 * 19 CFR § 111.36(b), fixed $1,695.00 flat non-contingent fee (0% commission).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./rules_data.js"));
  } else {
    root.UflpaBomEngine = factory(root.UFLPA_RULES);
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function (DEFAULT_RULES) {
  "use strict";

  var DEFAULT_BANNED_HEADERS = [
    "ssn",
    "social_security",
    "social_security_number",
    "ein",
    "fein",
    "irs_ein",
    "importer_ein",
    "tax_id",
    "ace_password",
    "ace_pass",
    "ace_login",
    "ace_username",
    "ace_pin",
    "erp_password",
    "erp_pass",
    "erp_login",
    "portal_password",
    "broker_password",
    "cbp_password",
    "password",
    "passwd",
    "pwd",
    "api_key",
    "apikey",
    "secret_key",
    "access_token",
    "auth_token",
    "private_key",
    "email",
    "email_address",
    "phone",
    "phone_number",
    "mobile",
    "dob",
    "date_of_birth",
    "birth_date",
    "employee_name",
    "full_name",
    "first_name",
    "last_name"
  ];

  var SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;
  var EIN_RE = /\b\d{2}-\d{7}\b/;
  var EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  var PHONE_RE = /(?:^|[^\dA-Za-z])((?:\+?1[-.\s]?)?(?:\(\d{3}\)[-.\s]?|\d{3}[-.\s])\d{3}[-.\s]\d{4})(?!\d)/;
  var SECRET_TOKEN_RE = /(?:\bAKIA[0-9A-Z]{16}\b|\bsk-[A-Za-z0-9]{20,}\b|\bghp_[A-Za-z0-9]{20,}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
  var CREDENTIAL_KV_RE = /\b(?:ace|erp|cbp|portal|broker)?[_\s-]*(?:password|passwd|secret_key|api_key|access_token)\s*[:=]\s*\S+/i;

  var ACE_ALIASES = {
    entry_ref: ["entry_ref", "entry_number", "entry_no", "ace_entry", "entry_id", "bol_number", "shipment_id"],
    hts_code: ["hts_code", "hts", "hts_4", "hts4", "hts_10", "hs_code", "tariff_code"],
    cif_usd: ["cif_usd", "entered_value_usd", "entered_value", "cif_value", "customs_value", "value_usd", "amount_usd", "cif"],
    vn_supplier_name: ["vn_supplier_name", "supplier_name", "vn_factory", "factory_name", "manufacturer", "shipper", "vendor_name", "supplier"],
    sku_id: ["sku_id", "sku", "part_number", "item_code", "product_id", "model"],
    declared_origin: ["declared_origin", "country_of_origin", "origin", "coo", "origin_country"]
  };

  var FACTORY_ALIASES = {
    vn_supplier_name: ["vn_supplier_name", "supplier_name", "factory_name", "vn_factory", "manufacturer", "vendor_name", "supplier"],
    factory_code: ["factory_code", "supplier_id", "mid_code", "mid", "vendor_id", "factory_id"],
    province: ["province", "city", "region", "industrial_zone", "location"],
    sector: ["sector", "product_category", "category"],
    notes: ["notes", "remarks", "tier1_notes"]
  };

  var BOM_ALIASES = {
    sku_id: ["sku_id", "sku", "part_number", "item_code", "product_id", "model"],
    component_id: ["component_id", "comp_id", "material_id", "subcomponent_id", "bom_line_id", "part_id"],
    component_hs6: ["component_hs6", "hs6", "component_hts", "component_hs", "material_hs6", "component_hts6"],
    origin_country: ["origin_country", "origin", "country_of_origin", "coo", "material_origin"],
    cost_pct: ["cost_pct", "cost_share_pct", "cost_percent", "cost_share", "value_pct"],
    weight_pct: ["weight_pct", "weight_share_pct", "weight_percent", "weight_share", "mass_pct"],
    tier2_mill_id: ["tier2_mill_id", "mill_id", "tier2_supplier_id", "smelter_id", "tier2_factory_id", "upstream_mill_id"],
    traceability_doc_ref: ["traceability_doc_ref", "doc_ref", "mtc_ref", "cert_ref", "coc_ref", "evidence_ref"]
  };

  var MISSING_TOKENS = { "": 1, "NONE": 1, "N/A": 1, "NA": 1, "TBD": 1, "MISSING": 1, "UNKNOWN": 1, "UNK": 1, "NULL": 1, "-": 1 };
  var XUAR_TOKENS = { "XUAR": 1, "XINJIANG": 1, "CN-XJ": 1, "CN_XJ": 1, "XJ": 1, "XUAR_RISK": 1 };
  var CN_TOKENS = { "CN": 1, "CHN": 1, "CHINA": 1, "PRC": 1, "CN-MAINLAND": 1 };
  var VN_TOKENS = { "VN": 1, "VNM": 1, "VIETNAM": 1, "VIET NAM": 1 };
  var BUCKETS = ["CN", "XUAR_RISK", "UNVERIFIED", "VN", "OTHER"];

  function normCol(name) {
    if (name === null || name === undefined) {
      return "";
    }
    return String(name)
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function parseCSV(text) {
    if (text === null || text === undefined) {
      return { headers: [], rows: [] };
    }
    var src = String(text);
    if (src.charCodeAt(0) === 0xFEFF) {
      src = src.slice(1);
    }
    if (src.trim() === "") {
      return { headers: [], rows: [] };
    }

    var records = [];
    var currentRow = [];
    var currentField = "";
    var inQuotes = false;
    var rowStartLine = 1;
    var currentLine = 1;
    var i = 0;
    var len = src.length;

    while (i < len) {
      var ch = src.charAt(i);
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < len && src.charAt(i + 1) === '"') {
            currentField += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i += 1;
          continue;
        }
        if (ch === "\r") {
          currentLine += 1;
          if (i + 1 < len && src.charAt(i + 1) === "\n") {
            currentField += "\n";
            i += 2;
            continue;
          }
          currentField += "\n";
          i += 1;
          continue;
        }
        if (ch === "\n") {
          currentLine += 1;
        }
        currentField += ch;
        i += 1;
      } else {
        if (ch === '"' && currentField === "") {
          inQuotes = true;
          i += 1;
        } else if (ch === ",") {
          currentRow.push(currentField);
          currentField = "";
          i += 1;
        } else if (ch === "\r" || ch === "\n") {
          currentRow.push(currentField);
          records.push({ fields: currentRow, sourceRow: rowStartLine });
          currentRow = [];
          currentField = "";
          if (ch === "\r" && i + 1 < len && src.charAt(i + 1) === "\n") {
            i += 2;
          } else {
            i += 1;
          }
          currentLine += 1;
          rowStartLine = currentLine;
        } else {
          currentField += ch;
          i += 1;
        }
      }
    }

    if (inQuotes || currentField !== "" || currentRow.length > 0) {
      currentRow.push(currentField);
      records.push({ fields: currentRow, sourceRow: rowStartLine });
    }

    while (records.length > 0) {
      var tail = records[records.length - 1].fields;
      var emptyTail = tail.every(function (cell) { return cell.trim() === ""; });
      if (emptyTail) {
        records.pop();
      } else {
        break;
      }
    }
    if (records.length === 0) {
      return { headers: [], rows: [] };
    }

    var rawHeaders = records[0].fields;
    var headers = [];
    var seen = Object.create(null);
    for (var h = 0; h < rawHeaders.length; h++) {
      var hName = rawHeaders[h].trim() || ("column_" + (h + 1));
      if (hName === "__proto__" || hName === "constructor" || hName === "prototype") {
        hName = "col_" + hName;
      }
      if (seen[hName]) {
        seen[hName] += 1;
        hName = hName + "_" + seen[hName];
      } else {
        seen[hName] = 1;
      }
      headers.push(hName);
    }

    var rows = [];
    for (var r = 1; r < records.length; r++) {
      var rec = records[r];
      var blank = rec.fields.every(function (cell) { return cell.trim() === ""; });
      if (blank) {
        continue;
      }
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = c < rec.fields.length ? rec.fields[c] : "";
      }
      obj.__sourceRow = rec.sourceRow;
      rows.push(obj);
    }
    return { headers: headers, rows: rows };
  }

  function buildColumnMap(headers, aliasSpec) {
    var result = {};
    var normToHeader = Object.create(null);
    for (var i = 0; i < headers.length; i++) {
      var key = normCol(headers[i]);
      if (key && !(key in normToHeader)) {
        normToHeader[key] = headers[i];
      }
    }
    var keys = Object.keys(aliasSpec);
    for (var k = 0; k < keys.length; k++) {
      var canonical = keys[k];
      var aliases = aliasSpec[canonical];
      var matched = null;
      var nc = normCol(canonical);
      if (nc && (nc in normToHeader)) {
        matched = normToHeader[nc];
      } else {
        for (var a = 0; a < aliases.length; a++) {
          var na = normCol(aliases[a]);
          if (na && (na in normToHeader)) {
            matched = normToHeader[na];
            break;
          }
        }
      }
      result[canonical] = matched;
    }
    return result;
  }

  function parseCents(raw) {
    if (raw === null || raw === undefined || typeof raw === "boolean") {
      return null;
    }
    if (typeof raw === "number") {
      if (!isFinite(raw)) {
        return null;
      }
      return parseCents(raw.toFixed(2));
    }
    var s = String(raw).trim();
    if (!s) {
      return null;
    }
    var negative = false;
    if (s.charAt(0) === "(" && s.charAt(s.length - 1) === ")") {
      negative = true;
      s = s.slice(1, -1).trim();
    }
    s = s.replace(/[\$\u20AC\u00A3\u00A5,\s]/g, "");
    if (!s) {
      return null;
    }
    if (s.charAt(0) === "-") {
      negative = !negative;
      s = s.slice(1);
    } else if (s.charAt(0) === "+") {
      s = s.slice(1);
    }
    if (!s) {
      return null;
    }
    var m = /^(?:(\d+)(?:\.(\d*))?|\.(\d+))$/.exec(s);
    if (!m) {
      return null;
    }
    var wholeStr = m[1] || "0";
    var fracStr = m[2] !== undefined ? m[2] : (m[3] || "");
    var wholeDollars = parseInt(wholeStr, 10);
    var padded = (fracStr + "000").slice(0, 3);
    var centsPart = parseInt(padded.slice(0, 2), 10);
    var thirdDigit = parseInt(padded.charAt(2), 10);
    var total = wholeDollars * 100 + centsPart;
    if (thirdDigit >= 5) {
      total += 1;
    }
    if (total === 0) {
      return 0;
    }
    return negative ? -total : total;
  }

  function parseBps(raw) {
    if (raw === null || raw === undefined || typeof raw === "boolean") {
      return null;
    }
    var s = String(raw).trim();
    if (!s) {
      return null;
    }
    s = s.replace(/%/g, "").replace(/,/g, "").trim();
    return parseCents(s);
  }

  function formatCents(cents) {
    var n = Math.round(Number(cents || 0));
    var neg = n < 0;
    var a = Math.abs(n);
    var dollars = Math.floor(a / 100);
    var rem = a % 100;
    var dStr = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var rStr = rem < 10 ? "0" + rem : String(rem);
    return (neg ? "-$" : "$") + dStr + "." + rStr;
  }

  function formatBpsPct(bps) {
    var n = Math.round(Number(bps || 0));
    var neg = n < 0;
    var a = Math.abs(n);
    var whole = Math.floor(a / 100);
    var rem = a % 100;
    return (neg ? "-" : "") + whole + "." + (rem < 10 ? "0" + rem : String(rem)) + "%";
  }

  function applyBps(amountCents, bps) {
    if (amountCents === 0 || bps === 0) {
      return 0;
    }
    var neg = (amountCents < 0) !== (bps < 0);
    var val = Math.floor((Math.abs(amountCents) * Math.abs(bps) + 5000) / 10000);
    return neg ? -val : val;
  }

  function ratioBps(numerator, denominator) {
    if (denominator <= 0 || numerator <= 0) {
      return 0;
    }
    return Math.floor((numerator * 10000 + Math.floor(denominator / 2)) / denominator);
  }

  function roiTenths(numeratorCents, feeCents) {
    if (feeCents <= 0 || numeratorCents <= 0) {
      return 0;
    }
    return Math.floor((numeratorCents * 10 + Math.floor(feeCents / 2)) / feeCents);
  }

  function fnv1aHex(str) {
    var input = str === null || str === undefined ? "" : String(str);
    var hash = 0x811c9dc5;
    for (var i = 0; i < input.length; i++) {
      var code = input.charCodeAt(i);
      if (code < 0x80) {
        hash ^= code;
        hash = Math.imul(hash, 0x01000193);
      } else if (code < 0x800) {
        hash ^= (0xc0 | (code >> 6));
        hash = Math.imul(hash, 0x01000193);
        hash ^= (0x80 | (code & 0x3f));
        hash = Math.imul(hash, 0x01000193);
      } else {
        hash ^= (0xe0 | (code >> 12));
        hash = Math.imul(hash, 0x01000193);
        hash ^= (0x80 | ((code >> 6) & 0x3f));
        hash = Math.imul(hash, 0x01000193);
        hash ^= (0x80 | (code & 0x3f));
        hash = Math.imul(hash, 0x01000193);
      }
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function scanForPii(headers, rows, extraBannedHeaders, sourceLabel) {
    var findings = [];
    var maxFindings = 50;
    var label = sourceLabel || "CSV";
    var banned = Object.create(null);

    for (var i = 0; i < DEFAULT_BANNED_HEADERS.length; i++) {
      banned[normCol(DEFAULT_BANNED_HEADERS[i])] = true;
    }
    if (Array.isArray(extraBannedHeaders)) {
      for (var e = 0; e < extraBannedHeaders.length; e++) {
        var ne = normCol(extraBannedHeaders[e]);
        if (ne) {
          banned[ne] = true;
        }
      }
    }

    for (var h = 0; h < headers.length; h++) {
      var hdr = headers[h];
      var nh = normCol(hdr);
      if (nh && banned[nh]) {
        findings.push({
          type: "banned_header",
          source: label,
          header: hdr,
          row: 1,
          detail: "Prohibited PII or credential column header detected (" + hdr + ") in " + label + "."
        });
      }
    }

    for (var r = 0; r < rows.length && findings.length < maxFindings; r++) {
      var row = rows[r];
      var srcRow = row && row.__sourceRow ? row.__sourceRow : (r + 2);
      for (var c = 0; c < headers.length && findings.length < maxFindings; c++) {
        var col = headers[c];
        var val = row && row[col] !== undefined && row[col] !== null ? String(row[col]) : "";
        if (!val) {
          continue;
        }
        if (SSN_RE.test(val)) {
          findings.push({
            type: "ssn",
            source: label,
            header: col,
            row: srcRow,
            detail: "SSN-like pattern detected in column '" + col + "' at row " + srcRow + " (" + label + ")."
          });
        } else if (EIN_RE.test(val)) {
          findings.push({
            type: "ein",
            source: label,
            header: col,
            row: srcRow,
            detail: "EIN-like pattern detected in column '" + col + "' at row " + srcRow + " (" + label + ")."
          });
        } else if (SECRET_TOKEN_RE.test(val) || CREDENTIAL_KV_RE.test(val)) {
          findings.push({
            type: "credential_secret",
            source: label,
            header: col,
            row: srcRow,
            detail: "ACE/ERP credential or secret token pattern detected in column '" + col + "' at row " + srcRow + " (" + label + ")."
          });
        } else if (EMAIL_RE.test(val)) {
          findings.push({
            type: "email",
            source: label,
            header: col,
            row: srcRow,
            detail: "Email address detected in column '" + col + "' at row " + srcRow + " (" + label + ")."
          });
        } else if (PHONE_RE.test(val)) {
          findings.push({
            type: "phone",
            source: label,
            header: col,
            row: srcRow,
            detail: "Phone number detected in column '" + col + "' at row " + srcRow + " (" + label + ")."
          });
        }
      }
    }
    return { blocked: findings.length > 0, findings: findings };
  }

  function normalizeHts(rawHts) {
    var rawStr = String(rawHts || "").trim();
    var digits = rawStr.replace(/[^0-9]/g, "");
    var chapter = digits.length >= 2 ? digits.slice(0, 2) : "";
    var hts4 = digits.length >= 4 ? digits.slice(0, 4) : "";
    var hts6 = digits.length >= 6 ? digits.slice(0, 6) : "";
    return { raw: rawStr, chapter: chapter, hts4: hts4, hts6: hts6 };
  }

  function normalizeOriginCode(raw) {
    var s = String(raw || "").trim().toUpperCase();
    if (MISSING_TOKENS[s]) {
      return "UNVERIFIED";
    }
    if (XUAR_TOKENS[s] || s.indexOf("XINJIANG") !== -1 || s.indexOf("XUAR") !== -1) {
      return "XUAR_RISK";
    }
    if (CN_TOKENS[s]) {
      return "CN";
    }
    if (VN_TOKENS[s]) {
      return "VN";
    }
    return "OTHER";
  }

  function isPresentId(raw) {
    var s = String(raw || "").trim().toUpperCase();
    return !MISSING_TOKENS[s];
  }

  function makeSet(arr) {
    var obj = Object.create(null);
    for (var i = 0; i < arr.length; i++) {
      obj[arr[i]] = true;
    }
    return obj;
  }

  function buildBilingualChecklists(entries, factoriesByKey, rules) {
    var sectorsCfg = rules.sectors;
    var evidenceCatalog = rules.cf28_evidence_catalog;
    var circ31Set = makeSet(rules.authorities.vietnam_circular_31.applies_to_chapters);
    var circ31Note = rules.authorities.vietnam_circular_31.scope_note;

    var grouped = Object.create(null);
    for (var i = 0; i < entries.length; i++) {
      var ent = entries[i];
      var supName = ent.vn_supplier_name;
      var supKey = supName.trim().toLowerCase();
      if (!grouped[supKey]) {
        var fmeta = factoriesByKey[supKey] || {};
        grouped[supKey] = {
          vn_supplier_name: supName,
          factory_code: fmeta.factory_code || "",
          province: fmeta.province || "",
          entry_count: 0,
          high_risk_entry_count: 0,
          total_cif_cents: 0,
          exposed_cif_cents: 0,
          ad_cvd_low_cents: 0,
          ad_cvd_mid_cents: 0,
          ad_cvd_high_cents: 0,
          hts4_set: Object.create(null),
          sku_set: Object.create(null),
          sector_set: Object.create(null),
          circular31_optional: false
        };
      }
      var g = grouped[supKey];
      g.entry_count += 1;
      g.total_cif_cents += ent.cif_cents;
      if (ent.high_risk) {
        g.high_risk_entry_count += 1;
        g.exposed_cif_cents += ent.cif_cents;
        g.ad_cvd_low_cents += ent.ad_cvd_low_cents;
        g.ad_cvd_mid_cents += ent.ad_cvd_mid_cents;
        g.ad_cvd_high_cents += ent.ad_cvd_high_cents;
        g.sector_set[ent.sector] = true;
      }
      if (ent.hts4) { g.hts4_set[ent.hts4] = true; }
      if (ent.sku_id) { g.sku_set[ent.sku_id] = true; }
      if (circ31Set[ent.chapter]) { g.circular31_optional = true; }
    }

    var facKeys = Object.keys(factoriesByKey).sort();
    for (var fk = 0; fk < facKeys.length; fk++) {
      var key = facKeys[fk];
      if (!grouped[key]) {
        var fm = factoriesByKey[key];
        grouped[key] = {
          vn_supplier_name: fm.vn_supplier_name,
          factory_code: fm.factory_code || "",
          province: fm.province || "",
          entry_count: 0,
          high_risk_entry_count: 0,
          total_cif_cents: 0,
          exposed_cif_cents: 0,
          ad_cvd_low_cents: 0,
          ad_cvd_mid_cents: 0,
          ad_cvd_high_cents: 0,
          hts4_set: Object.create(null),
          sku_set: Object.create(null),
          sector_set: Object.create(null),
          circular31_optional: false
        };
      }
    }

    var groupList = Object.keys(grouped).map(function (k) { return grouped[k]; });
    groupList.sort(function (a, b) {
      if (b.exposed_cif_cents !== a.exposed_cif_cents) {
        return b.exposed_cif_cents - a.exposed_cif_cents;
      }
      if (b.total_cif_cents !== a.total_cif_cents) {
        return b.total_cif_cents - a.total_cif_cents;
      }
      var la = a.vn_supplier_name.toLowerCase();
      var lb = b.vn_supplier_name.toLowerCase();
      return la < lb ? -1 : (la > lb ? 1 : 0);
    });

    var catalogOrder = Object.keys(evidenceCatalog);
    var checklists = [];

    for (var gi = 0; gi < groupList.length; gi++) {
      var grp = groupList[gi];
      var sectorsList = Object.keys(grp.sector_set).sort();
      var hts4List = Object.keys(grp.hts4_set).sort();
      var skuList = Object.keys(grp.sku_set).sort();

      var reqCodes = makeSet([
        "CF28_COMM_INV_PL",
        "CF28_BOL_SEAL_LOG",
        "CF28_TIER1_PROD_RECORDS",
        "CF28_TIER2_MILL_CERT",
        "CF28_PAYMENT_TRAIL",
        "CF28_BOM_RECONCILIATION",
        "CF28_NON_XUAR_SCREEN"
      ]);
      var rawMatEn = [];
      var rawMatVi = [];

      for (var si = 0; si < sectorsList.length; si++) {
        var sc = sectorsCfg[sectorsList[si]];
        if (!sc) { continue; }
        for (var ec = 0; ec < sc.cf28_required_evidence.length; ec++) {
          reqCodes[sc.cf28_required_evidence[ec]] = true;
        }
        for (var me = 0; me < sc.tier2_raw_materials_en.length; me++) {
          if (rawMatEn.indexOf(sc.tier2_raw_materials_en[me]) === -1) {
            rawMatEn.push(sc.tier2_raw_materials_en[me]);
          }
        }
        for (var mv = 0; mv < sc.tier2_raw_materials_vi.length; mv++) {
          if (rawMatVi.indexOf(sc.tier2_raw_materials_vi[mv]) === -1) {
            rawMatVi.push(sc.tier2_raw_materials_vi[mv]);
          }
        }
      }

      if (rawMatEn.length === 0) {
        rawMatEn.push("Primary raw material / sub-assembly Tier-2 mill/plant origin & invoice trail");
        rawMatVi.push("Nguồn gốc nhà máy/xưởng cấp 2 của nguyên liệu chính và bộ hóa đơn mua hàng");
      }

      var reqItems = [];
      for (var ci = 0; ci < catalogOrder.length; ci++) {
        var code = catalogOrder[ci];
        if (reqCodes[code]) {
          var meta = evidenceCatalog[code];
          reqItems.push({
            code: code,
            label_en: meta.label_en,
            label_vi: meta.label_vi,
            cbp_basis: meta.cbp_basis
          });
        }
      }

      var enLines = [
        "SUBJECT: Tier-2 Raw Material Origin & CBP CF 28 Readiness Request — " + grp.vn_supplier_name,
        "Covered HTS-4: " + (hts4List.join(", ") || "N/A") + " | SKUs: " + (skuList.join(", ") || "N/A") + " | Exposed CIF: " + formatCents(grp.exposed_cif_cents),
        "Please provide within 10 business days (ahead of potential 30-day U.S. CBP Form 28 review under 19 U.S.C. § 1307 / § 1509):",
        "Target Tier-2 Raw Materials:"
      ];
      for (var e1 = 0; e1 < rawMatEn.length; e1++) { enLines.push("  - " + rawMatEn[e1]); }
      enLines.push("Required Traceability Documents:");
      for (var e2 = 0; e2 < reqItems.length; e2++) { enLines.push("  [ ] " + (e2 + 1) + ". " + reqItems[e2].label_en); }
      if (grp.circular31_optional) {
        enLines.push("Optional Secondary Note (Electronics/Chemicals Only): " + circ31Note);
      }

      var viLines = [
        "TIÊU ĐỀ: Yêu cầu Hồ sơ Xuất xứ Nguyên liệu Cấp 2 & Chuẩn bị CBP CF 28 — " + grp.vn_supplier_name,
        "Mã HTS-4 liên quan: " + (hts4List.join(", ") || "N/A") + " | Mã SKU: " + (skuList.join(", ") || "N/A") + " | Trị giá CIF rủi ro: " + formatCents(grp.exposed_cif_cents),
        "Vui lòng cung cấp trong vòng 10 ngày làm việc (chủ động trước thời hạn 30 ngày của Hải quan Hoa Kỳ CBP Form 28 theo 19 U.S.C. § 1307 / § 1509):",
        "Nhóm nguyên liệu cấp 2 cần truy xuất:"
      ];
      for (var v1 = 0; v1 < rawMatVi.length; v1++) { viLines.push("  - " + rawMatVi[v1]); }
      viLines.push("Danh mục chứng từ truy xuất nguồn gốc cần nộp:");
      for (var v2 = 0; v2 < reqItems.length; v2++) { viLines.push("  [ ] " + (v2 + 1) + ". " + reqItems[v2].label_vi); }
      if (grp.circular31_optional) {
        viLines.push("Ghi chú phụ trợ không bắt buộc (Chỉ dành cho Điện tử Ch.85 / Hóa chất Ch.28-29-39): Thông tư 31/2026/TT-BCT / VeriGoods chỉ là trường tham khảo tùy chọn, KHÔNG phải yêu cầu bắt buộc cho mọi hàng xuất khẩu Việt Nam.");
      }

      var enText = enLines.join("\n");
      var viText = viLines.join("\n");

      checklists.push({
        vn_supplier_name: grp.vn_supplier_name,
        factory_code: grp.factory_code,
        province: grp.province,
        entry_count: grp.entry_count,
        high_risk_entry_count: grp.high_risk_entry_count,
        total_cif_cents: grp.total_cif_cents,
        exposed_cif_cents: grp.exposed_cif_cents,
        ad_cvd_low_cents: grp.ad_cvd_low_cents,
        ad_cvd_mid_cents: grp.ad_cvd_mid_cents,
        ad_cvd_high_cents: grp.ad_cvd_high_cents,
        hts4_codes: hts4List,
        sku_ids: skuList,
        sectors: sectorsList,
        circular31_optional: grp.circular31_optional,
        tier2_raw_materials_en: rawMatEn,
        tier2_raw_materials_vi: rawMatVi,
        required_documents: reqItems,
        checklist_text_en: enText,
        checklist_text_vi: viText,
        checklist_text_bilingual: enText + "\n\n---\n\n" + viText
      });
    }
    return checklists;
  }

  function runEntryA(aceCsvText, vnFactoryCsvText, rulesInput, extraBannedHeaders) {
    var rules = rulesInput || DEFAULT_RULES;
    var parsed = parseCSV(aceCsvText);
    var piiAce = scanForPii(parsed.headers, parsed.rows, extraBannedHeaders, "ACE Entries CSV");
    if (piiAce.blocked) {
      return {
        mode: "ENTRY_A",
        blocked: true,
        pii_findings: piiAce.findings,
        error: "Blocked by Local PII & Credential Shield. Remove sensitive columns or values and retry."
      };
    }

    var factoriesByKey = Object.create(null);
    if (vnFactoryCsvText && String(vnFactoryCsvText).trim()) {
      var fp = parseCSV(vnFactoryCsvText);
      var piiFac = scanForPii(fp.headers, fp.rows, extraBannedHeaders, "VN Factory CSV");
      if (piiFac.blocked) {
        return {
          mode: "ENTRY_A",
          blocked: true,
          pii_findings: piiFac.findings,
          error: "Blocked by Local PII & Credential Shield in VN Factory CSV."
        };
      }
      var fmap = buildColumnMap(fp.headers, FACTORY_ALIASES);
      for (var f = 0; f < fp.rows.length; f++) {
        var frow = fp.rows[f];
        var sname = fmap.vn_supplier_name ? String(frow[fmap.vn_supplier_name] || "").trim() : "";
        if (!sname) { continue; }
        factoriesByKey[sname.toLowerCase()] = {
          vn_supplier_name: sname,
          factory_code: fmap.factory_code ? String(frow[fmap.factory_code] || "").trim() : "",
          province: fmap.province ? String(frow[fmap.province] || "").trim() : "",
          sector: fmap.sector ? String(frow[fmap.sector] || "").trim() : "",
          notes: fmap.notes ? String(frow[fmap.notes] || "").trim() : ""
        };
      }
    }

    var cmap = buildColumnMap(parsed.headers, ACE_ALIASES);
    var missingReq = [];
    if (!cmap.entry_ref) { missingReq.push("entry_ref"); }
    if (!cmap.hts_code) { missingReq.push("hts_code"); }
    if (!cmap.cif_usd) { missingReq.push("cif_usd"); }
    if (missingReq.length > 0) {
      return {
        mode: "ENTRY_A",
        blocked: false,
        error: "Missing required ACE CSV columns: " + missingReq.join(", ")
      };
    }

    var hts4Rules = rules.hts4_rules;
    var sectorsCfg = rules.sectors;
    var comm = rules.commercial_parameters;
    var circ31Set = makeSet(rules.authorities.vietnam_circular_31.applies_to_chapters);

    var entries = [];
    var sectorTotals = Object.create(null);
    var totalCif = 0;
    var exposedCif = 0;
    var highRiskEntries = 0;
    var adCvdLow = 0;
    var adCvdMid = 0;
    var adCvdHigh = 0;
    var circ31Count = 0;

    for (var i = 0; i < parsed.rows.length; i++) {
      var row = parsed.rows[i];
      var srcRow = row.__sourceRow || (i + 2);
      var entryRef = String(row[cmap.entry_ref] || "").trim() || ("ROW-" + srcRow);
      var hts = normalizeHts(row[cmap.hts_code]);
      var cifCents = parseCents(row[cmap.cif_usd]);
      if (cifCents === null || cifCents < 0) {
        cifCents = 0;
      }
      var vnSupplier = (cmap.vn_supplier_name ? String(row[cmap.vn_supplier_name] || "").trim() : "") || "UNSPECIFIED_VN_SUPPLIER";
      var skuId = (cmap.sku_id ? String(row[cmap.sku_id] || "").trim() : "") || ("SKU-" + entryRef);
      var declaredOrigin = (cmap.declared_origin ? String(row[cmap.declared_origin] || "").trim().toUpperCase() : "") || "VN";

      var rule = hts4Rules[hts.hts4] || null;
      var circFlag = Boolean(circ31Set[hts.chapter]);
      if (circFlag) {
        circ31Count += 1;
      }

      var highRisk, sector, sectorLabel, uflpaRisk, htsDesc, caseRef, lowBps, midBps, highBps, lowC, midC, highC;
      if (rule) {
        highRisk = true;
        sector = rule.sector;
        sectorLabel = sectorsCfg[sector].label;
        uflpaRisk = rule.uflpa_risk;
        htsDesc = rule.description;
        caseRef = rule.case_ref;
        lowBps = Number(rule.ad_cvd_low_bps);
        midBps = Number(rule.ad_cvd_mid_bps);
        highBps = Number(rule.ad_cvd_high_bps);
        lowC = applyBps(cifCents, lowBps);
        midC = applyBps(cifCents, midBps);
        highC = applyBps(cifCents, highBps);
        highRiskEntries += 1;
        exposedCif += cifCents;
        adCvdLow += lowC;
        adCvdMid += midC;
        adCvdHigh += highC;
      } else {
        highRisk = false;
        sector = "OTHER_LOW_RISK";
        sectorLabel = "Other / Non-Priority HTS-4";
        uflpaRisk = "LOW";
        htsDesc = "Not in 2026 UFLPA/VN AD-CVD high-priority HTS-4 list";
        caseRef = "Standard CBP entry recordkeeping (19 U.S.C. § 1509)";
        lowBps = 0; midBps = 0; highBps = 0;
        lowC = 0; midC = 0; highC = 0;
      }

      totalCif += cifCents;

      if (!sectorTotals[sector]) {
        sectorTotals[sector] = {
          sector: sector,
          label: sectorLabel,
          entry_count: 0,
          cif_cents: 0,
          ad_cvd_low_cents: 0,
          ad_cvd_mid_cents: 0,
          ad_cvd_high_cents: 0,
          high_risk: highRisk
        };
      }
      sectorTotals[sector].entry_count += 1;
      sectorTotals[sector].cif_cents += cifCents;
      sectorTotals[sector].ad_cvd_low_cents += lowC;
      sectorTotals[sector].ad_cvd_mid_cents += midC;
      sectorTotals[sector].ad_cvd_high_cents += highC;

      var fmeta = factoriesByKey[vnSupplier.toLowerCase()] || {};
      entries.push({
        source_row: srcRow,
        entry_ref: entryRef,
        sku_id: skuId,
        hts_code: hts.raw,
        chapter: hts.chapter,
        hts4: hts.hts4,
        hts6: hts.hts6,
        declared_origin: declaredOrigin,
        vn_supplier_name: vnSupplier,
        factory_code: fmeta.factory_code || "",
        province: fmeta.province || "",
        cif_cents: cifCents,
        high_risk: highRisk,
        sector: sector,
        sector_label: sectorLabel,
        uflpa_risk: uflpaRisk,
        hts_description: htsDesc,
        case_ref: caseRef,
        ad_cvd_low_bps: lowBps,
        ad_cvd_mid_bps: midBps,
        ad_cvd_high_bps: highBps,
        ad_cvd_low_cents: lowC,
        ad_cvd_mid_cents: midC,
        ad_cvd_high_cents: highC,
        circular31_optional: circFlag
      });
    }

    var flatFee = Number(comm.flat_fee_cents);
    var threshold = Number(comm.qualification_threshold_cents);
    var qualified = exposedCif >= threshold;
    var expShareBps = ratioBps(exposedCif, totalCif);
    var roiMid = roiTenths(adCvdMid, flatFee);
    var roiCif = roiTenths(exposedCif, flatFee);

    var supplierChecklists = buildBilingualChecklists(entries, factoriesByKey, rules);

    var sectorBreakdown = Object.keys(sectorTotals).map(function (k) { return sectorTotals[k]; });
    sectorBreakdown.sort(function (a, b) {
      var ra = a.high_risk ? 0 : 1;
      var rb = b.high_risk ? 0 : 1;
      if (ra !== rb) { return ra - rb; }
      if (b.cif_cents !== a.cif_cents) { return b.cif_cents - a.cif_cents; }
      return a.sector < b.sector ? -1 : (a.sector > b.sector ? 1 : 0);
    });

    var fpPayload = [
      "ENTRY_A",
      entries.length,
      highRiskEntries,
      totalCif,
      exposedCif,
      adCvdLow,
      adCvdMid,
      adCvdHigh,
      supplierChecklists.length
    ].join("|");
    var fingerprint = fnv1aHex(fpPayload);

    return {
      mode: "ENTRY_A",
      blocked: false,
      error: null,
      fingerprint: fingerprint,
      summary: {
        total_entries: entries.length,
        high_risk_entries: highRiskEntries,
        unique_vn_suppliers: supplierChecklists.length,
        total_cif_cents: totalCif,
        exposed_cif_cents: exposedCif,
        exposure_share_bps: expShareBps,
        ad_cvd_low_cents: adCvdLow,
        ad_cvd_mid_cents: adCvdMid,
        ad_cvd_high_cents: adCvdHigh,
        flat_fee_cents: flatFee,
        qualification_threshold_cents: threshold,
        qualified: qualified,
        qualification_verdict: qualified ? "QUALIFIED_FOR_PRE_DETENTION_PACK" : "BELOW_250K_THRESHOLD",
        roi_vs_mid_deposit_tenths: roiMid,
        roi_vs_exposed_cif_tenths: roiCif,
        cf28_response_window_days: Number(comm.cf28_response_window_days),
        circular31_optional_entries: circ31Count,
        circular31_optional_note: circ31Count > 0 ? rules.authorities.vietnam_circular_31.scope_note : ""
      },
      sector_breakdown: sectorBreakdown,
      entries: entries,
      supplier_checklists: supplierChecklists,
      disclaimers: rules.disclaimers
    };
  }

  function runEntryB(aceCsvText, bomCsvText, vnFactoryCsvText, rulesInput, extraBannedHeaders) {
    var rules = rulesInput || DEFAULT_RULES;
    var baseA = runEntryA(aceCsvText, vnFactoryCsvText, rules, extraBannedHeaders);
    if (baseA.blocked || baseA.error) {
      baseA.mode = "ENTRY_B";
      return baseA;
    }

    var parsedBom = parseCSV(bomCsvText);
    var piiBom = scanForPii(parsedBom.headers, parsedBom.rows, extraBannedHeaders, "SKU BOM CSV");
    if (piiBom.blocked) {
      return {
        mode: "ENTRY_B",
        blocked: true,
        pii_findings: piiBom.findings,
        error: "Blocked by Local PII & Credential Shield in SKU BOM CSV."
      };
    }

    var bmap = buildColumnMap(parsedBom.headers, BOM_ALIASES);
    var missingReq = [];
    if (!bmap.sku_id) { missingReq.push("sku_id"); }
    if (!bmap.component_id) { missingReq.push("component_id"); }
    if (!bmap.origin_country) { missingReq.push("origin_country"); }
    if (!bmap.cost_pct) { missingReq.push("cost_pct"); }
    if (!bmap.weight_pct) { missingReq.push("weight_pct"); }
    if (missingReq.length > 0) {
      return {
        mode: "ENTRY_B",
        blocked: false,
        error: "Missing required SKU BOM CSV columns: " + missingReq.join(", ")
      };
    }

    var prioritySet = makeSet(rules.uflpa_priority_component_hs4);
    var circ31Set = makeSet(rules.authorities.vietnam_circular_31.applies_to_chapters);
    var targetBps = Number(rules.commercial_parameters.bom_reconciliation_target_bps);
    var tolBps = Number(rules.commercial_parameters.bom_reconciliation_tolerance_bps);

    var bomBySku = Object.create(null);
    var bomCirc31Hits = 0;

    for (var i = 0; i < parsedBom.rows.length; i++) {
      var row = parsedBom.rows[i];
      var srcRow = row.__sourceRow || (i + 2);
      var skuId = String(row[bmap.sku_id] || "").trim();
      if (!skuId) { continue; }
      var compId = String(row[bmap.component_id] || "").trim() || ("COMP-" + srcRow);
      var chs = normalizeHts(bmap.component_hs6 ? row[bmap.component_hs6] : "");
      var rawOrigin = String(row[bmap.origin_country] || "").trim();
      var originNorm = normalizeOriginCode(rawOrigin);
      var costBps = parseBps(row[bmap.cost_pct]);
      var weightBps = parseBps(row[bmap.weight_pct]);
      costBps = (costBps !== null && costBps >= 0) ? costBps : 0;
      weightBps = (weightBps !== null && weightBps >= 0) ? weightBps : 0;

      var millId = bmap.tier2_mill_id ? String(row[bmap.tier2_mill_id] || "").trim() : "";
      var docRef = bmap.traceability_doc_ref ? String(row[bmap.traceability_doc_ref] || "").trim() : "";
      var hasMill = isPresentId(millId);
      var hasDoc = isPresentId(docRef);
      var isPriority = Boolean(prioritySet[chs.hts4]);
      if (circ31Set[chs.chapter]) {
        bomCirc31Hits += 1;
      }

      var bucket;
      if (originNorm === "XUAR_RISK") {
        bucket = "XUAR_RISK";
      } else if (originNorm === "UNVERIFIED") {
        bucket = "UNVERIFIED";
      } else if (originNorm === "CN") {
        bucket = (isPriority && (!hasMill || !hasDoc)) ? "XUAR_RISK" : "CN";
      } else if (originNorm === "VN") {
        bucket = (hasMill || hasDoc) ? "VN" : "UNVERIFIED";
      } else {
        bucket = (hasMill || hasDoc) ? "OTHER" : "UNVERIFIED";
      }

      if (!bomBySku[skuId]) {
        bomBySku[skuId] = [];
      }
      bomBySku[skuId].push({
        source_row: srcRow,
        sku_id: skuId,
        component_id: compId,
        component_hs6: chs.hts6 || chs.raw,
        component_hs4: chs.hts4,
        component_chapter: chs.chapter,
        raw_origin: rawOrigin,
        origin_norm: originNorm,
        bucket: bucket,
        cost_bps: costBps,
        weight_bps: weightBps,
        tier2_mill_id: hasMill ? millId : "",
        traceability_doc_ref: hasDoc ? docRef : "",
        has_mill: hasMill,
        has_doc: hasDoc,
        is_priority_material: isPriority
      });
    }

    var aceSkuOrder = [];
    var seenSkus = Object.create(null);
    for (var e = 0; e < baseA.entries.length; e++) {
      var sid = baseA.entries[e].sku_id;
      if (!seenSkus[sid]) {
        seenSkus[sid] = true;
        aceSkuOrder.push(sid);
      }
    }
    var bomSkuKeys = Object.keys(bomBySku).sort();
    for (var b = 0; b < bomSkuKeys.length; b++) {
      if (!seenSkus[bomSkuKeys[b]]) {
        seenSkus[bomSkuKeys[b]] = true;
        aceSkuOrder.push(bomSkuKeys[b]);
      }
    }

    var skuSummaries = Object.create(null);
    var skuSplitList = [];

    for (var s = 0; s < aceSkuOrder.length; s++) {
      var sku = aceSkuOrder[s];
      var comps = bomBySku[sku] || [];
      var costSplit = { CN: 0, XUAR_RISK: 0, UNVERIFIED: 0, VN: 0, OTHER: 0 };
      var weightSplit = { CN: 0, XUAR_RISK: 0, UNVERIFIED: 0, VN: 0, OTHER: 0 };
      var missingMills = [];
      var missingDocs = [];
      var totalCostBps = 0;
      var totalWeightBps = 0;

      for (var c = 0; c < comps.length; c++) {
        var comp = comps[c];
        costSplit[comp.bucket] += comp.cost_bps;
        weightSplit[comp.bucket] += comp.weight_bps;
        totalCostBps += comp.cost_bps;
        totalWeightBps += comp.weight_bps;
        if (!comp.has_mill) { missingMills.push(comp.component_id); }
        if (!comp.has_doc) { missingDocs.push(comp.component_id); }
      }

      var hasBom = comps.length > 0;
      var costDelta = hasBom ? (totalCostBps - targetBps) : -targetBps;
      var weightDelta = hasBom ? (totalWeightBps - targetBps) : -targetBps;
      var costRecon = hasBom && Math.abs(costDelta) <= tolBps;
      var weightRecon = hasBom && Math.abs(weightDelta) <= tolBps;
      var bomRecon = costRecon && weightRecon;

      var reconStatus;
      if (!hasBom) {
        reconStatus = "MISSING_BOM";
      } else if (costDelta === 0 && weightDelta === 0) {
        reconStatus = "RECONCILED_100PCT";
      } else if (bomRecon) {
        reconStatus = "RECONCILED_WITHIN_TOLERANCE";
      } else {
        reconStatus = "RECONCILIATION_GAP";
      }

      var rec = {
        sku_id: sku,
        has_bom: hasBom,
        component_count: comps.length,
        cost_split_bps: costSplit,
        weight_split_bps: weightSplit,
        total_cost_bps: totalCostBps,
        total_weight_bps: totalWeightBps,
        cost_delta_bps: costDelta,
        weight_delta_bps: weightDelta,
        cost_reconciled: costRecon,
        weight_reconciled: weightRecon,
        bom_reconciled: bomRecon,
        reconciliation_status: reconStatus,
        missing_mill_ids: missingMills,
        missing_doc_refs: missingDocs,
        missing_mill_count: missingMills.length,
        missing_doc_count: missingDocs.length,
        risk_cost_bps: costSplit.CN + costSplit.XUAR_RISK + costSplit.UNVERIFIED,
        risk_weight_bps: weightSplit.CN + weightSplit.XUAR_RISK + weightSplit.UNVERIFIED
      };
      skuSummaries[sku] = rec;
      skuSplitList.push(rec);
    }

    var gapMatrix = [];
    var totalMissingMills = 0;
    var totalMissingDocs = 0;
    var unreconciledEntries = 0;
    var missingBomEntries = 0;
    var xuarFlaggedEntries = 0;
    var criticalEntries = 0;
    var highEntries = 0;
    var bomAtRiskCif = 0;
    var bomCompRiskCif = 0;
    var sectorsCfg = rules.sectors;

    for (var ei = 0; ei < baseA.entries.length; ei++) {
      var ent = baseA.entries[ei];
      var skuRec = skuSummaries[ent.sku_id];
      var cs = skuRec.cost_split_bps;
      var ws = skuRec.weight_split_bps;
      var gaps = [];

      if (!skuRec.has_bom) {
        gaps.push("MISSING_BOM_FOR_SKU");
        missingBomEntries += 1;
      } else {
        if (!skuRec.cost_reconciled) {
          gaps.push("BOM_COST_RECONCILIATION_GAP(" + formatBpsPct(skuRec.total_cost_bps) + ")");
        }
        if (!skuRec.weight_reconciled) {
          gaps.push("BOM_WEIGHT_RECONCILIATION_GAP(" + formatBpsPct(skuRec.total_weight_bps) + ")");
        }
        if (!skuRec.bom_reconciled) {
          unreconciledEntries += 1;
        }
        if (cs.XUAR_RISK > 0 || ws.XUAR_RISK > 0) {
          gaps.push("XUAR_PRIORITY_NEXUS_RISK");
          xuarFlaggedEntries += 1;
        }
        if (cs.CN > 0) {
          gaps.push("CN_UPSTREAM_AD_CVD_CIRCUMVENTION_RISK");
        }
        if (cs.UNVERIFIED > 0) {
          gaps.push("UNVERIFIED_TIER2_ORIGIN");
        }
        if (skuRec.missing_mill_count > 0) {
          gaps.push("MISSING_TIER2_MILL_ID(" + skuRec.missing_mill_count + ")");
        }
        if (skuRec.missing_doc_count > 0) {
          gaps.push("MISSING_TRACEABILITY_DOC_REF(" + skuRec.missing_doc_count + ")");
        }
      }

      totalMissingMills += skuRec.missing_mill_count;
      totalMissingDocs += skuRec.missing_doc_count;

      var riskCostBps = skuRec.has_bom ? skuRec.risk_cost_bps : 10000;
      var riskTier;
      if (
        cs.XUAR_RISK > 0 ||
        (ent.high_risk && !skuRec.has_bom) ||
        (ent.high_risk && riskCostBps >= 5000) ||
        (ent.uflpa_risk === "CRITICAL" && gaps.length > 0)
      ) {
        riskTier = "CRITICAL";
        criticalEntries += 1;
      } else if (ent.high_risk && gaps.length > 0) {
        riskTier = "HIGH";
        highEntries += 1;
      } else if (ent.high_risk || gaps.length > 0) {
        riskTier = "MODERATE";
      } else {
        riskTier = "LOW";
      }

      var entryAtRisk = (riskTier === "CRITICAL" || riskTier === "HIGH") ? ent.cif_cents : 0;
      bomAtRiskCif += entryAtRisk;

      var effRiskBps = skuRec.has_bom ? Math.min(10000, riskCostBps) : (ent.high_risk ? 10000 : 0);
      var compRiskCents = applyBps(ent.cif_cents, effRiskBps);
      bomCompRiskCif += compRiskCents;

      var scCfg = sectorsCfg[ent.sector];
      var reqEvCodes = scCfg
        ? scCfg.cf28_required_evidence.slice()
        : ["CF28_COMM_INV_PL", "CF28_BOL_SEAL_LOG", "CF28_TIER1_PROD_RECORDS", "CF28_TIER2_MILL_CERT"];

      var remediation;
      if (riskTier === "CRITICAL") {
        remediation = "Immediate 30-day CF 28 freeze-readiness required: resolve XUAR/missing BOM gaps, obtain Tier-2 mill/smelter/gin certificates, and reconcile BOM to 100% before shipment.";
      } else if (riskTier === "HIGH") {
        remediation = "Collect missing Tier-2 mill IDs and traceability doc refs from VN factory; verify Sec. 781 substantial transformation & non-CN substrate records.";
      } else if (riskTier === "MODERATE") {
        remediation = "Maintain signed Tier-1/Tier-2 origin pack on file for 5-year CBP 19 U.S.C. § 1509 recordkeeping.";
      } else {
        remediation = "Standard commercial entry recordkeeping; no urgent UFLPA/AD-CVD gap detected.";
      }

      gapMatrix.push({
        entry_ref: ent.entry_ref,
        sku_id: ent.sku_id,
        hts_code: ent.hts_code,
        hts4: ent.hts4,
        sector: ent.sector,
        sector_label: ent.sector_label,
        vn_supplier_name: ent.vn_supplier_name,
        cif_cents: ent.cif_cents,
        high_risk_hts4: ent.high_risk,
        reconciliation_status: skuRec.reconciliation_status,
        bom_reconciled: skuRec.bom_reconciled,
        total_cost_bps: skuRec.total_cost_bps,
        total_weight_bps: skuRec.total_weight_bps,
        cn_cost_bps: cs.CN,
        xuar_risk_cost_bps: cs.XUAR_RISK,
        unverified_cost_bps: cs.UNVERIFIED,
        vn_cost_bps: cs.VN,
        other_cost_bps: cs.OTHER,
        cn_weight_bps: ws.CN,
        xuar_risk_weight_bps: ws.XUAR_RISK,
        unverified_weight_bps: ws.UNVERIFIED,
        vn_weight_bps: ws.VN,
        other_weight_bps: ws.OTHER,
        missing_mill_count: skuRec.missing_mill_count,
        missing_mill_ids: skuRec.missing_mill_ids,
        missing_doc_count: skuRec.missing_doc_count,
        missing_doc_refs: skuRec.missing_doc_refs,
        gap_count: gaps.length,
        gaps: gaps,
        cf28_required_evidence_codes: reqEvCodes,
        risk_tier: riskTier,
        entry_at_risk_cents: entryAtRisk,
        component_risk_value_cents: compRiskCents,
        ad_cvd_low_cents: ent.ad_cvd_low_cents,
        ad_cvd_mid_cents: ent.ad_cvd_mid_cents,
        ad_cvd_high_cents: ent.ad_cvd_high_cents,
        remediation_action: remediation
      });
    }

    var portfolioCostVal = { CN: 0, XUAR_RISK: 0, UNVERIFIED: 0, VN: 0, OTHER: 0 };
    var portfolioWeightVal = { CN: 0, XUAR_RISK: 0, UNVERIFIED: 0, VN: 0, OTHER: 0 };
    for (var gi = 0; gi < gapMatrix.length; gi++) {
      var gm = gapMatrix[gi];
      if (gm.reconciliation_status === "MISSING_BOM") {
        portfolioCostVal.UNVERIFIED += gm.cif_cents;
        portfolioWeightVal.UNVERIFIED += gm.cif_cents;
      } else {
        portfolioCostVal.CN += applyBps(gm.cif_cents, gm.cn_cost_bps);
        portfolioCostVal.XUAR_RISK += applyBps(gm.cif_cents, gm.xuar_risk_cost_bps);
        portfolioCostVal.UNVERIFIED += applyBps(gm.cif_cents, gm.unverified_cost_bps);
        portfolioCostVal.VN += applyBps(gm.cif_cents, gm.vn_cost_bps);
        portfolioCostVal.OTHER += applyBps(gm.cif_cents, gm.other_cost_bps);
        portfolioWeightVal.CN += applyBps(gm.cif_cents, gm.cn_weight_bps);
        portfolioWeightVal.XUAR_RISK += applyBps(gm.cif_cents, gm.xuar_risk_weight_bps);
        portfolioWeightVal.UNVERIFIED += applyBps(gm.cif_cents, gm.unverified_weight_bps);
        portfolioWeightVal.VN += applyBps(gm.cif_cents, gm.vn_weight_bps);
        portfolioWeightVal.OTHER += applyBps(gm.cif_cents, gm.other_weight_bps);
      }
    }

    var skusReconCount = 0;
    for (var sr = 0; sr < skuSplitList.length; sr++) {
      if (skuSplitList[sr].bom_reconciled) { skusReconCount += 1; }
    }

    var summaryB = Object.assign({}, baseA.summary, {
      bom_rows_parsed: parsedBom.rows.length,
      skus_evaluated: skuSplitList.length,
      skus_reconciled_100pct: skusReconCount,
      unreconciled_entries: unreconciledEntries,
      missing_bom_entries: missingBomEntries,
      xuar_flagged_entries: xuarFlaggedEntries,
      critical_entries: criticalEntries,
      high_entries: highEntries,
      total_missing_tier2_mill_ids: totalMissingMills,
      total_missing_traceability_docs: totalMissingDocs,
      bom_at_risk_cif_cents: bomAtRiskCif,
      bom_component_risk_cif_cents: bomCompRiskCif,
      roi_vs_bom_at_risk_tenths: roiTenths(bomAtRiskCif, baseA.summary.flat_fee_cents),
      portfolio_cost_value_by_bucket_cents: portfolioCostVal,
      portfolio_weight_value_by_bucket_cents: portfolioWeightVal,
      circular31_optional_bom_hits: bomCirc31Hits,
      circular31_optional_note: (baseA.summary.circular31_optional_entries + bomCirc31Hits) > 0
        ? rules.authorities.vietnam_circular_31.scope_note
        : ""
    });

    var fpPayload = [
      "ENTRY_B",
      baseA.fingerprint,
      parsedBom.rows.length,
      skuSplitList.length,
      bomAtRiskCif,
      bomCompRiskCif,
      totalMissingMills,
      totalMissingDocs,
      criticalEntries,
      highEntries
    ].join("|");
    var fingerprint = fnv1aHex(fpPayload);

    return {
      mode: "ENTRY_B",
      blocked: false,
      error: null,
      fingerprint: fingerprint,
      summary: summaryB,
      sector_breakdown: baseA.sector_breakdown,
      entries: baseA.entries,
      supplier_checklists: baseA.supplier_checklists,
      sku_bom_splits: skuSplitList,
      cf28_gap_matrix: gapMatrix,
      disclaimers: rules.disclaimers
    };
  }

  function csvCell(val) {
    var s = val === null || val === undefined ? "" : String(val);
    if (s.indexOf('"') !== -1 || s.indexOf(",") !== -1 || s.indexOf("\n") !== -1 || s.indexOf("\r") !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function toCsv(headers, rows) {
    var lines = [headers.map(csvCell).join(",")];
    for (var i = 0; i < rows.length; i++) {
      lines.push(rows[i].map(csvCell).join(","));
    }
    return lines.join("\n") + "\n";
  }

  function exportEntryAChecklistsCsv(result) {
    var headers = [
      "vn_supplier_name", "factory_code", "province", "entry_count", "high_risk_entry_count",
      "total_cif_usd", "exposed_cif_usd", "ad_cvd_low_usd", "ad_cvd_mid_usd", "ad_cvd_high_usd",
      "hts4_codes", "sku_ids", "sectors", "circular31_optional_note_applicable",
      "required_docs_en", "required_docs_vi"
    ];
    var rows = (result.supplier_checklists || []).map(function (it) {
      return [
        it.vn_supplier_name,
        it.factory_code,
        it.province,
        it.entry_count,
        it.high_risk_entry_count,
        (it.total_cif_cents / 100).toFixed(2),
        (it.exposed_cif_cents / 100).toFixed(2),
        (it.ad_cvd_low_cents / 100).toFixed(2),
        (it.ad_cvd_mid_cents / 100).toFixed(2),
        (it.ad_cvd_high_cents / 100).toFixed(2),
        it.hts4_codes.join(";"),
        it.sku_ids.join(";"),
        it.sectors.join(";"),
        it.circular31_optional ? "YES_OPTIONAL_ELECTRONICS_OR_CHEMICALS" : "NO",
        it.required_documents.map(function (d) { return d.label_en; }).join(" | "),
        it.required_documents.map(function (d) { return d.label_vi; }).join(" | ")
      ];
    });
    return toCsv(headers, rows);
  }

  function exportEntryAChecklistsTxt(result) {
    var blocks = [
      "========================================================================",
      "US-VIETNAM UFLPA x CBP CF 28 BILINGUAL (EN/VI) SUPPLIER DOCUMENT REQUEST",
      "Independent non-audit, non-legal documentation checklist: not legal advice, not a licensed customs broker (19 U.S.C. § 1641), does not offer CBP filing.",
      "Deterministic Fingerprint: " + (result.fingerprint || ""),
      "========================================================================",
      ""
    ];
    var list = result.supplier_checklists || [];
    for (var i = 0; i < list.length; i++) {
      blocks.push("### SUPPLIER #" + (i + 1) + ": " + list[i].vn_supplier_name + " ###");
      blocks.push(list[i].checklist_text_bilingual);
      blocks.push("\n" + "=".repeat(72) + "\n");
    }
    return blocks.join("\n");
  }

  function exportEntryBBomSplitCsv(result) {
    var headers = [
      "sku_id", "component_count", "reconciliation_status", "total_cost_pct", "total_weight_pct",
      "cn_cost_pct", "xuar_risk_cost_pct", "unverified_cost_pct", "vn_cost_pct", "other_cost_pct",
      "cn_weight_pct", "xuar_risk_weight_pct", "unverified_weight_pct", "vn_weight_pct", "other_weight_pct",
      "missing_mill_count", "missing_mill_components", "missing_doc_count", "missing_doc_components"
    ];
    var rows = (result.sku_bom_splits || []).map(function (s) {
      var cs = s.cost_split_bps;
      var ws = s.weight_split_bps;
      return [
        s.sku_id, s.component_count, s.reconciliation_status,
        (s.total_cost_bps / 100).toFixed(2), (s.total_weight_bps / 100).toFixed(2),
        (cs.CN / 100).toFixed(2), (cs.XUAR_RISK / 100).toFixed(2), (cs.UNVERIFIED / 100).toFixed(2),
        (cs.VN / 100).toFixed(2), (cs.OTHER / 100).toFixed(2),
        (ws.CN / 100).toFixed(2), (ws.XUAR_RISK / 100).toFixed(2), (ws.UNVERIFIED / 100).toFixed(2),
        (ws.VN / 100).toFixed(2), (ws.OTHER / 100).toFixed(2),
        s.missing_mill_count, s.missing_mill_ids.join(";"),
        s.missing_doc_count, s.missing_doc_refs.join(";")
      ];
    });
    return toCsv(headers, rows);
  }

  function exportCf28GapMatrixCsv(result) {
    var headers = [
      "entry_ref", "sku_id", "hts_code", "hts4", "sector", "vn_supplier_name", "cif_usd",
      "risk_tier", "reconciliation_status", "cn_cost_pct", "xuar_risk_cost_pct",
      "unverified_cost_pct", "vn_cost_pct", "other_cost_pct",
      "missing_mill_count", "missing_doc_count", "entry_at_risk_usd",
      "ad_cvd_low_usd", "ad_cvd_mid_usd", "ad_cvd_high_usd", "cf28_gaps", "remediation_action"
    ];
    var rows = (result.cf28_gap_matrix || []).map(function (gm) {
      return [
        gm.entry_ref, gm.sku_id, gm.hts_code, gm.hts4, gm.sector, gm.vn_supplier_name,
        (gm.cif_cents / 100).toFixed(2), gm.risk_tier, gm.reconciliation_status,
        (gm.cn_cost_bps / 100).toFixed(2), (gm.xuar_risk_cost_bps / 100).toFixed(2),
        (gm.unverified_cost_bps / 100).toFixed(2), (gm.vn_cost_bps / 100).toFixed(2),
        (gm.other_cost_bps / 100).toFixed(2), gm.missing_mill_count, gm.missing_doc_count,
        (gm.entry_at_risk_cents / 100).toFixed(2),
        (gm.ad_cvd_low_cents / 100).toFixed(2), (gm.ad_cvd_mid_cents / 100).toFixed(2),
        (gm.ad_cvd_high_cents / 100).toFixed(2),
        gm.gaps.length ? gm.gaps.join("; ") : "NONE",
        gm.remediation_action
      ];
    });
    return toCsv(headers, rows);
  }

  return {
    DEFAULT_BANNED_HEADERS: DEFAULT_BANNED_HEADERS.slice(),
    BUCKETS: BUCKETS.slice(),
    parseCSV: parseCSV,
    normCol: normCol,
    buildColumnMap: buildColumnMap,
    parseCents: parseCents,
    parseBps: parseBps,
    formatCents: formatCents,
    formatBpsPct: formatBpsPct,
    applyBps: applyBps,
    ratioBps: ratioBps,
    roiTenths: roiTenths,
    fnv1aHex: fnv1aHex,
    scanForPii: scanForPii,
    runEntryA: runEntryA,
    runEntryB: runEntryB,
    exportEntryAChecklistsCsv: exportEntryAChecklistsCsv,
    exportEntryAChecklistsTxt: exportEntryAChecklistsTxt,
    exportEntryBBomSplitCsv: exportEntryBBomSplitCsv,
    exportCf28GapMatrixCsv: exportCf28GapMatrixCsv
  };
}));
