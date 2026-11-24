/* Pure Browser-Local UI Controller for US-Vietnam UFLPA x CBP CF 28 Pre-Scan.
 * Zero network calls; local FileReader parsing and local Blob downloads only.
 */
(function () {
  "use strict";

  var engine = window.UflpaBomEngine;
  var samples = window.UFLPA_SAMPLES;
  var rules = window.UFLPA_RULES;

  var state = {
    mode: "ENTRY_A",
    aceText: "",
    aceName: "",
    factoryText: "",
    factoryName: "",
    bomText: "",
    bomName: "",
    lastResult: null,
    activeTab: "overview"
  };

  function el(id) {
    return document.getElementById(id);
  }

  function escHtml(str) {
    return String(str === null || str === undefined ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtRoi(tenths) {
    return Math.floor(tenths / 10) + "." + (tenths % 10) + "x";
  }

  function setMode(newMode) {
    state.mode = newMode === "ENTRY_B" ? "ENTRY_B" : "ENTRY_A";
    el("mode-entry-a").classList.toggle("is-active", state.mode === "ENTRY_A");
    el("mode-entry-b").classList.toggle("is-active", state.mode === "ENTRY_B");
    el("dropzone-bom").hidden = state.mode !== "ENTRY_B";
    el("upload-grid").classList.toggle("cols-3", state.mode === "ENTRY_B");
    if (state.aceText && (state.mode === "ENTRY_A" || state.bomText)) {
      runScan();
    }
  }

  function updateDropzoneStatus(kind, name, text) {
    var dz = el("dropzone-" + kind);
    var st = el("status-" + kind);
    if (text && text.trim()) {
      dz.classList.add("is-loaded");
      st.textContent = "Loaded locally: " + name + " (" + text.length + " chars)";
      st.className = "file-status is-ok";
    } else {
      dz.classList.remove("is-loaded");
      st.textContent = kind === "factory" ? "Optional — enriches bilingual checklists." : "Not loaded yet.";
      st.className = "file-status";
    }
  }

  function wireDropzone(kind, inputId) {
    var dz = el("dropzone-" + kind);
    var inp = el(inputId);

    function handleFile(file) {
      if (!file) { return; }
      var reader = new FileReader();
      reader.onload = function (ev) {
        var text = String(ev.target && ev.target.result ? ev.target.result : "");
        if (kind === "ace") {
          state.aceText = text;
          state.aceName = file.name;
        } else if (kind === "factory") {
          state.factoryText = text;
          state.factoryName = file.name;
        } else if (kind === "bom") {
          state.bomText = text;
          state.bomName = file.name;
        }
        updateDropzoneStatus(kind, file.name, text);
        if (state.aceText && (state.mode === "ENTRY_A" || state.bomText)) {
          runScan();
        }
      };
      reader.readAsText(file);
    }

    inp.addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      handleFile(f);
    });

    dz.addEventListener("dragover", function (e) {
      e.preventDefault();
      dz.classList.add("is-dragover");
    });
    dz.addEventListener("dragleave", function () {
      dz.classList.remove("is-dragover");
    });
    dz.addEventListener("drop", function (e) {
      e.preventDefault();
      dz.classList.remove("is-dragover");
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      handleFile(f);
    });
  }

  function showTab(tabName) {
    state.activeTab = tabName;
    var tabs = el("result-tabs").querySelectorAll(".tab-btn");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("is-active", tabs[i].getAttribute("data-tab") === tabName);
    }
    var panels = ["overview", "checklists", "bom", "gaps"];
    for (var p = 0; p < panels.length; p++) {
      var panelEl = el("panel-" + panels[p]);
      if (panelEl) {
        panelEl.hidden = panels[p] !== tabName;
      }
    }
  }

  function triggerLocalDownload(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function buildPrintableHtmlMemo(res) {
    var s = res.summary;
    var isB = res.mode === "ENTRY_B";
    var rowsHtml = (res.sector_breakdown || []).map(function (sec) {
      return "<tr><td>" + escHtml(sec.label) + "</td><td style='text-align:right'>" + sec.entry_count +
        "</td><td style='text-align:right'>" + escHtml(engine.formatCents(sec.cif_cents)) +
        "</td><td style='text-align:right'>" + escHtml(engine.formatCents(sec.ad_cvd_low_cents)) +
        " - " + escHtml(engine.formatCents(sec.ad_cvd_high_cents)) + "</td></tr>";
    }).join("");

    return "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>" +
      "<title>Executive UFLPA &amp; CF 28 Risk Memo</title>" +
      "<style>@page{size:letter;margin:0.35in;}body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;font-size:10px;color:#0f172a;margin:0;}" +
      "h1{font-size:15px;margin:0 0 4px 0;}table{width:100%;border-collapse:collapse;margin:8px 0;}th,td{border-bottom:1px solid #cbd5e1;padding:4px 6px;text-align:left;}th{background:#f1f5f9;}" +
      ".kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0;}.kpi{border:1px solid #cbd5e1;padding:8px;border-radius:6px;background:#f8fafc;}" +
      ".disc{background:#fef3c7;border:1px solid #d97706;padding:8px;border-radius:5px;font-size:8.5px;margin-top:10px;}</style></head><body>" +
      "<h1>Executive UFLPA (19 U.S.C. &sect; 1307) &amp; CBP CF 28 Risk Memo</h1>" +
      "<p><strong>Mode:</strong> " + escHtml(res.mode) + " | <strong>Fingerprint:</strong> <code>" + escHtml(res.fingerprint) +
      "</code> | <strong>Verdict:</strong> " + escHtml(s.qualification_verdict) + "</p>" +
      "<div class='kpis'>" +
      "<div class='kpi'><div>High-Risk Exposed CIF</div><strong>" + escHtml(engine.formatCents(s.exposed_cif_cents)) + "</strong></div>" +
      "<div class='kpi'><div>AD/CVD Mid Risk</div><strong>" + escHtml(engine.formatCents(s.ad_cvd_mid_cents)) + "</strong></div>" +
      "<div class='kpi'><div>" + (isB ? "Critical / High Entries" : "VN Suppliers") + "</div><strong>" +
      (isB ? (s.critical_entries + " / " + s.high_entries) : s.unique_vn_suppliers) + "</strong></div>" +
      "<div class='kpi'><div>Flat Fee (0% Commission)</div><strong>$1,695.00 (" + escHtml(fmtRoi(s.roi_vs_mid_deposit_tenths)) + ")</strong></div>" +
      "</div>" +
      "<table><thead><tr><th>Sector</th><th style='text-align:right'>Entries</th><th style='text-align:right'>CIF USD</th><th style='text-align:right'>AD/CVD Band</th></tr></thead><tbody>" +
      rowsHtml + "</tbody></table>" +
      "<div class='disc'><strong>MANDATORY DISCLOSURE:</strong> " + escHtml(res.disclaimers.non_licensed_broker) + " " +
      escHtml(res.disclaimers.non_legal_upl) + " " + escHtml(res.disclaimers.flat_non_contingent_fee) + "</div>" +
      "</body></html>";
  }

  function renderResult(res, elapsedMs) {
    state.lastResult = res;
    var s = res.summary;
    var isB = res.mode === "ENTRY_B";

    el("step-3").hidden = false;
    el("res-mode").textContent = isB ? "Entry B (Full Multi-Tier BOM Penetration)" : "Entry A (Cold-Start No-BOM Pre-Screen)";
    el("res-source").textContent = state.aceName + (isB && state.bomName ? " + " + state.bomName : "");
    el("res-elapsed").textContent = elapsedMs + " ms";
    el("res-fingerprint").textContent = res.fingerprint;

    var vb = el("verdict-badge");
    if (s.qualified) {
      vb.textContent = "QUALIFIED (>= $250K EXPOSED CIF)";
      vb.className = "verdict-badge badge-qualified";
    } else {
      vb.textContent = "BELOW $250K THRESHOLD (SELF-SERVE CHECKLISTS)";
      vb.className = "verdict-badge badge-below";
    }

    el("kpi-exposed-cif").textContent = engine.formatCents(s.exposed_cif_cents);
    el("kpi-total-cif-sub").textContent = "Of " + engine.formatCents(s.total_cif_cents) + " total (" + engine.formatBpsPct(s.exposure_share_bps) + ")";
    el("kpi-adcvd-mid").textContent = engine.formatCents(s.ad_cvd_mid_cents);
    el("kpi-adcvd-band").textContent = "Band: " + engine.formatCents(s.ad_cvd_low_cents) + " - " + engine.formatCents(s.ad_cvd_high_cents);
    el("kpi-roi-sub").textContent = "0% commission • " + fmtRoi(s.roi_vs_mid_deposit_tenths) + " vs mid deposit risk";

    if (isB) {
      el("kpi-gaps-main").textContent = s.critical_entries + " Crit / " + s.high_entries + " High";
      el("kpi-gaps-sub").textContent = "Missing: " + s.total_missing_tier2_mill_ids + " Mill IDs, " + s.total_missing_traceability_docs + " Docs • " + s.unreconciled_entries + " recon gap";
    } else {
      el("kpi-gaps-main").textContent = s.high_risk_entries + " / " + s.total_entries + " Entries";
      el("kpi-gaps-sub").textContent = s.unique_vn_suppliers + " VN suppliers • EN/VI checklists ready";
    }

    // Entry B bucket strip
    var bktStrip = el("bom-bucket-strip");
    if (isB && s.portfolio_cost_value_by_bucket_cents) {
      var pb = s.portfolio_cost_value_by_bucket_cents;
      el("bkt-xuar").textContent = engine.formatCents(pb.XUAR_RISK || 0);
      el("bkt-cn").textContent = engine.formatCents(pb.CN || 0);
      el("bkt-unver").textContent = engine.formatCents(pb.UNVERIFIED || 0);
      el("bkt-vn").textContent = engine.formatCents(pb.VN || 0);
      el("bkt-other").textContent = engine.formatCents(pb.OTHER || 0);
      bktStrip.hidden = false;
    } else {
      bktStrip.hidden = true;
    }

    // Optional Circular 31 note (only when Ch. 85 or Ch. 28/29/39 present)
    var cBox = el("circular31-box");
    if (s.circular31_optional_note) {
      el("circular31-text").textContent = s.circular31_optional_note;
      cBox.hidden = false;
    } else {
      cBox.hidden = true;
    }

    // Toggle Entry B controls
    el("btn-dl-bom-csv").hidden = !isB;
    el("btn-dl-gap-csv").hidden = !isB;
    el("tab-btn-bom").hidden = !isB;
    el("tab-btn-gaps").hidden = !isB;
    if (!isB && (state.activeTab === "bom" || state.activeTab === "gaps")) {
      showTab("overview");
    }

    // Render Sectors table
    el("tbody-sectors").innerHTML = (res.sector_breakdown || []).map(function (sec) {
      return "<tr>" +
        "<td><strong>" + escHtml(sec.label) + "</strong></td>" +
        "<td class='num'>" + sec.entry_count + "</td>" +
        "<td class='num'>" + escHtml(engine.formatCents(sec.cif_cents)) + "</td>" +
        "<td class='num'>" + escHtml(engine.formatCents(sec.ad_cvd_low_cents)) + "</td>" +
        "<td class='num'>" + escHtml(engine.formatCents(sec.ad_cvd_mid_cents)) + "</td>" +
        "<td class='num'>" + escHtml(engine.formatCents(sec.ad_cvd_high_cents)) + "</td>" +
        "<td><span class='pill " + (sec.high_risk ? "pill-CRITICAL" : "pill-LOW") + "'>" + (sec.high_risk ? "HIGH-RISK" : "LOW-RISK") + "</span></td>" +
        "</tr>";
    }).join("");

    // Render Entries table
    el("tbody-entries").innerHTML = (res.entries || []).map(function (ent) {
      return "<tr>" +
        "<td><code>" + escHtml(ent.entry_ref) + "</code></td>" +
        "<td>" + escHtml(ent.sku_id) + "</td>" +
        "<td><strong>" + escHtml(ent.hts4 || ent.hts_code) + "</strong></td>" +
        "<td>" + escHtml(ent.vn_supplier_name) + (ent.province ? " <span style='color:#64748b'>(" + escHtml(ent.province) + ")</span>" : "") + "</td>" +
        "<td class='num'>" + escHtml(engine.formatCents(ent.cif_cents)) + "</td>" +
        "<td><span class='pill pill-" + escHtml(ent.uflpa_risk) + "'>" + escHtml(ent.uflpa_risk) + "</span></td>" +
        "<td class='num'>" + escHtml(engine.formatCents(ent.ad_cvd_mid_cents)) + "</td>" +
        "<td style='font-size:12px; color:#334155;'>" + escHtml(ent.case_ref) + "</td>" +
        "</tr>";
    }).join("");

    // Render Bilingual EN/VI Checklists
    var cCont = el("checklists-container");
    cCont.innerHTML = "";
    (res.supplier_checklists || []).forEach(function (sup, idx) {
      var card = document.createElement("div");
      card.className = "checklist-card";
      var head = document.createElement("div");
      head.className = "checklist-head";
      head.innerHTML = "<div><strong>" + (idx + 1) + ". " + escHtml(sup.vn_supplier_name) + "</strong>" +
        (sup.factory_code ? " <code>" + escHtml(sup.factory_code) + "</code>" : "") +
        " &bull; Exposed CIF: <strong>" + escHtml(engine.formatCents(sup.exposed_cif_cents)) + "</strong>" +
        " &bull; HTS-4: " + escHtml(sup.hts4_codes.join(", ")) + "</div>";

      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-outline btn-sm";
      copyBtn.textContent = "Copy EN/VI Request";
      copyBtn.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(sup.checklist_text_bilingual);
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy EN/VI Request"; }, 1500);
        }
      });
      head.appendChild(copyBtn);

      var pre = document.createElement("pre");
      pre.className = "checklist-pre";
      pre.textContent = sup.checklist_text_bilingual;

      card.appendChild(head);
      card.appendChild(pre);
      cCont.appendChild(card);
    });

    // Render Entry B tables
    if (isB) {
      el("tbody-bom").innerHTML = (res.sku_bom_splits || []).map(function (sk) {
        var cs = sk.cost_split_bps;
        return "<tr>" +
          "<td><strong>" + escHtml(sk.sku_id) + "</strong></td>" +
          "<td><span class='pill pill-" + escHtml(sk.reconciliation_status) + "'>" + escHtml(sk.reconciliation_status) + "</span></td>" +
          "<td class='num'>" + escHtml(engine.formatBpsPct(sk.total_cost_bps)) + "</td>" +
          "<td class='num'>" + escHtml(engine.formatBpsPct(cs.XUAR_RISK)) + "</td>" +
          "<td class='num'>" + escHtml(engine.formatBpsPct(cs.CN)) + "</td>" +
          "<td class='num'>" + escHtml(engine.formatBpsPct(cs.UNVERIFIED)) + "</td>" +
          "<td class='num'>" + escHtml(engine.formatBpsPct(cs.VN)) + "</td>" +
          "<td class='num'>" + escHtml(engine.formatBpsPct(cs.OTHER)) + "</td>" +
          "<td class='num'>" + sk.missing_mill_count + " / " + sk.missing_doc_count + "</td>" +
          "</tr>";
      }).join("");

      el("tbody-gaps").innerHTML = (res.cf28_gap_matrix || []).map(function (gm) {
        return "<tr>" +
          "<td><code>" + escHtml(gm.entry_ref) + "</code><br>" + escHtml(gm.sku_id) + "</td>" +
          "<td><strong>" + escHtml(gm.hts4) + "</strong></td>" +
          "<td>" + escHtml(gm.vn_supplier_name) + "</td>" +
          "<td class='num'>" + escHtml(engine.formatCents(gm.cif_cents)) + "</td>" +
          "<td><span class='pill pill-" + escHtml(gm.risk_tier) + "'>" + escHtml(gm.risk_tier) + "</span></td>" +
          "<td><span class='pill pill-" + escHtml(gm.reconciliation_status) + "'>" + escHtml(gm.reconciliation_status) + "</span></td>" +
          "<td style='font-size:12px;'>" + escHtml(gm.gaps.length ? gm.gaps.join("; ") : "None") + "</td>" +
          "<td class='num'>" + escHtml(engine.formatCents(gm.ad_cvd_mid_cents)) + "</td>" +
          "</tr>";
      }).join("");
    }

    // Build mailto CTA summary (aggregate KPIs & fingerprint ONLY — zero raw CSV!)
    var summaryLines = [
      "US-Vietnam UFLPA x CBP CF 28 Pre-Scan Summary (Zero Raw CSV Attached)",
      "Mode: " + res.mode + " | Fingerprint: " + res.fingerprint,
      "Verdict: " + s.qualification_verdict,
      "Entries Screened: " + s.total_entries + " (" + s.high_risk_entries + " high-risk HTS-4) across " + s.unique_vn_suppliers + " VN suppliers",
      "High-Risk Exposed CIF: " + engine.formatCents(s.exposed_cif_cents) + " (of " + engine.formatCents(s.total_cif_cents) + ")",
      "Est. AD/CVD & Sec. 781 Deposit Band: " + engine.formatCents(s.ad_cvd_low_cents) + " - " + engine.formatCents(s.ad_cvd_high_cents) + " (Mid: " + engine.formatCents(s.ad_cvd_mid_cents) + ")",
      isB ? ("Entry B BOM Gaps: " + s.critical_entries + " Critical / " + s.high_entries + " High | Missing Mill IDs: " + s.total_missing_tier2_mill_ids + " | Missing Docs: " + s.total_missing_traceability_docs) : "Entry A Bilingual (EN/VI) Tier-2 Supplier Checklists generated locally.",
      "Engagement Inquiry: $1,695.00 Flat Non-Contingent Fee (0% commission; non-audit, non-legal preparation workpaper)."
    ];
    var bodyStr = summaryLines.join("\n");
    el("mailto-preview").textContent = bodyStr;
    var subject = "UFLPA x CF 28 Pre-Detention Pack Request [" + res.fingerprint + "]";
    el("mailto-link").setAttribute(
      "href",
      "mailto:trace@uflpa.far31prescan.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyStr)
    );
  }

  function runScan() {
    el("pii-alert").hidden = true;
    el("error-alert").hidden = true;

    if (!state.aceText || !state.aceText.trim()) {
      el("error-alert-text").textContent = "Please load an ACE Entry Summary CSV or click 'Load Qualified Multi-Sector Sample' first.";
      el("error-alert").hidden = false;
      el("step-3").hidden = true;
      return;
    }
    if (state.mode === "ENTRY_B" && (!state.bomText || !state.bomText.trim())) {
      el("error-alert-text").textContent = "Entry B requires a sku_bom.csv file. Upload your BOM CSV, switch to Entry A, or load the embedded sample.";
      el("error-alert").hidden = false;
      el("step-3").hidden = true;
      return;
    }

    var t0 = performance.now();
    var res = state.mode === "ENTRY_B"
      ? engine.runEntryB(state.aceText, state.bomText, state.factoryText, rules)
      : engine.runEntryA(state.aceText, state.factoryText, rules);
    var elapsed = Math.max(1, Math.round(performance.now() - t0));

    if (res.blocked) {
      var listEl = el("pii-findings-list");
      listEl.innerHTML = (res.pii_findings || []).map(function (f) {
        return "<li>" + escHtml(f.detail) + "</li>";
      }).join("");
      el("pii-alert").hidden = false;
      el("step-3").hidden = true;
      return;
    }
    if (res.error) {
      el("error-alert-text").textContent = res.error;
      el("error-alert").hidden = false;
      el("step-3").hidden = true;
      return;
    }

    renderResult(res, elapsed);
  }

  function init() {
    el("mode-entry-a").addEventListener("click", function () { setMode("ENTRY_A"); });
    el("mode-entry-b").addEventListener("click", function () { setMode("ENTRY_B"); });

    wireDropzone("ace", "file-ace");
    wireDropzone("factory", "file-factory");
    wireDropzone("bom", "file-bom");

    el("load-sample-qualified").addEventListener("click", function () {
      state.aceText = samples.qualified_ace_csv;
      state.aceName = "sample_ace_entries_qualified.csv (embedded)";
      state.factoryText = samples.qualified_factories_csv;
      state.factoryName = "sample_vn_factories.csv (embedded)";
      state.bomText = samples.qualified_bom_csv;
      state.bomName = "sample_sku_bom_qualified.csv (embedded)";
      updateDropzoneStatus("ace", state.aceName, state.aceText);
      updateDropzoneStatus("factory", state.factoryName, state.factoryText);
      updateDropzoneStatus("bom", state.bomName, state.bomText);
      runScan();
    });

    el("load-sample-below").addEventListener("click", function () {
      state.aceText = samples.below_threshold_ace_csv;
      state.aceName = "sample_ace_entries_below_threshold.csv (embedded)";
      state.factoryText = "";
      state.factoryName = "";
      state.bomText = "";
      state.bomName = "";
      updateDropzoneStatus("ace", state.aceName, state.aceText);
      updateDropzoneStatus("factory", "", "");
      updateDropzoneStatus("bom", "", "");
      setMode("ENTRY_A");
      runScan();
    });

    el("run-prescan-btn").addEventListener("click", runScan);

    var tabBtns = el("result-tabs").querySelectorAll(".tab-btn");
    for (var t = 0; t < tabBtns.length; t++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          showTab(btn.getAttribute("data-tab"));
        });
      }(tabBtns[t]));
    }

    el("btn-print-memo").addEventListener("click", function () { window.print(); });
    el("btn-dl-memo-html").addEventListener("click", function () {
      if (!state.lastResult) { return; }
      triggerLocalDownload("Executive_UFLPA_CF28_Risk_Memo.html", buildPrintableHtmlMemo(state.lastResult), "text/html;charset=utf-8");
    });
    el("btn-dl-checklists-txt").addEventListener("click", function () {
      if (!state.lastResult) { return; }
      triggerLocalDownload("EntryA_Bilingual_EN_VI_Supplier_Checklists.txt", engine.exportEntryAChecklistsTxt(state.lastResult), "text/plain;charset=utf-8");
    });
    el("btn-dl-checklists-csv").addEventListener("click", function () {
      if (!state.lastResult) { return; }
      triggerLocalDownload("EntryA_Bilingual_EN_VI_Supplier_Checklists.csv", engine.exportEntryAChecklistsCsv(state.lastResult), "text/csv;charset=utf-8");
    });
    el("btn-dl-bom-csv").addEventListener("click", function () {
      if (!state.lastResult) { return; }
      triggerLocalDownload("EntryB_BOM_Origin_Split.csv", engine.exportEntryBBomSplitCsv(state.lastResult), "text/csv;charset=utf-8");
    });
    el("btn-dl-gap-csv").addEventListener("click", function () {
      if (!state.lastResult) { return; }
      triggerLocalDownload("CF28_30Day_Gap_Matrix.csv", engine.exportCf28GapMatrixCsv(state.lastResult), "text/csv;charset=utf-8");
    });
    el("btn-dl-summary-json").addEventListener("click", function () {
      if (!state.lastResult) { return; }
      var payload = {
        mode: state.lastResult.mode,
        fingerprint: state.lastResult.fingerprint,
        summary: state.lastResult.summary,
        sector_breakdown: state.lastResult.sector_breakdown,
        disclaimers: state.lastResult.disclaimers
      };
      triggerLocalDownload("audit_summary.json", JSON.stringify(payload, null, 2) + "\n", "application/json;charset=utf-8");
    });
    el("copy-summary-btn").addEventListener("click", function () {
      var txt = el("mailto-preview").textContent || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt);
        el("copy-summary-btn").textContent = "Copied!";
        setTimeout(function () { el("copy-summary-btn").textContent = "Copy Summary Text"; }, 1500);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
