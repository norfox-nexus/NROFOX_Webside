/* global React, ReactDOM */
const { useState, useEffect, useContext, createContext } = React;

// ═════════════════════════════════════════════════════════════════════════════
// ░░  NORFOX NEXUS — Your apps list  ░░
//
// This is the ONLY place you need to edit to add, remove, or update an app.
// Each app is one object in the array below. To add a 6th app, copy one of
// the existing blocks, paste it at the end, and change the values.
//
//   code        — the app name shown on the card                  (any text)
//   category    — short label under the name                      (any text)
//   description — 1–2 sentences explaining what the app does      (any text)
//   url         — folder/file the "Launch" button links to        (relative path)
//   logo        — path to the app's logo image                    (optional)
//   status      — "live" | "beta" | "soon"   (controls the badge + button state)
//   accent      — card accent color, "orange" | "blue" | "steel"  (optional)
//
// To wire an app up, just drop its files into the matching folder
// (e.g. apps/optifox/index.html) and the link below will work.
// ═════════════════════════════════════════════════════════════════════════════
const NEXUS_APPS = [
  {
    code:        "OptiFOX",
    category:    "DOE & Optimization",
    description: "Design-of-experiment workflows, virtual trials, and process-window discovery for casting parameters.",
    url:         "apps/optifox/index.html",
    logo:        "apps/optifox/optifox.png",
    status:      "live",
    accent:      "orange",
  },
  {
    code:        "YieldFOX",
    category:    "Tensile Analysis",
    description: "Tensile-curve fitting, strength-property mapping, and yield characterization from test data.",
    url:         "apps/yieldfox/index.html",
    logo:        "apps/yieldfox/yieldfox.png",
    status:      "live",
    accent:      "blue",
  },
  {
    code:        "EnduraFOX",
    category:    "Fatigue & Durability",
    description: "S-N curves, fatigue life prediction, and durability assessment for cast components under cyclic load.",
    url:         "apps/endurafox/index.html",
    logo:        "apps/endurafox/endurafox.png",
    status:      "live",
    accent:      "orange",
  },
  {
    code:        "StatFOX",
    category:    "Statistics & Reliability",
    description: "Statistical analysis, Weibull distributions, and reliability metrics for foundry process data.",
    url:         "apps/statfox/index.html",
    logo:        "apps/statfox/statfox.png",
    status:      "live",
    accent:      "steel",
  },
  {
    code:        "MeshFOX",
    category:    "MAGMA ↔ FEM Bridging",
    description: "Transfer MAGMASOFT® results — temperature fields, residual stress, microstructure — onto FEM meshes.",
    url:         "apps/meshfox/index.html",
    logo:        "apps/meshfox/assets/meshfox-logo.png",
    status:      "live",
    accent:      "blue",
  },
  // ── Add a new app below by copying one of the blocks above ────────────────
];
// ═════════════════════════════════════════════════════════════════════════════

// ─── Router ──────────────────────────────────────────────────────────────────
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, "") || "home");
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.replace(/^#\/?/, "") || "home");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

// ─── Mobile context — ONE resize listener, shared by all components ───────────
const MobileContext = createContext(false);
function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return m;
}
const useMobile = () => useContext(MobileContext);

// ─── Language context ─────────────────────────────────────────────────────────
const LangContext = createContext({ lang: "en", setLang: () => {} });
const useLang = () => useContext(LangContext);
const LINKEDIN_URL = "https://www.linkedin.com/in/mostafa-payandeh-8b943236/";

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    nav_links: [["Solutions","solutions"],["MAGMASOFT®","magmasoft"],["Academy","academy"],["Capabilities","capabilities"],["Process","process"],["Nexus","nexus"],["About","about"]],
    nav_contact: "Contact →",
    academy_kicker: "NORFOX ACADEMY",
    academy_title: ["Learn Casting", "Simulation."],
    academy_lede: "Practical training in casting simulation and MAGMASOFT®, delivered in the Nordics — in your language, close to your production reality. Built for engineers who want to use simulation in daily work, not just in theory.",
    academy_mission_kicker: "— PHILOSOPHY",
    academy_mission_heading: "Lifelong Learning For The Foundry.",
    academy_mission_body: "NORFOX Academy exists to help Nordic foundries and component manufacturers build simulation competence in-house. We combine software-focused user training with targeted education for designers, quality teams, and management — so casting simulation supports decisions across the whole organisation.",
    academy_courses_kicker: "— COURSES",
    academy_courses_heading: "Course Catalogue.",
    academy_note: "Course catalogue in development — dates and content are being finalised. Contact us to register interest or request tailored, on-site training for your team.",
    academy_formats_kicker: "— FORMATS",
    academy_formats_heading: "Three Ways To Learn.",
    academy_level_label: "Level",
    academy_duration_label: "Duration",
    academy_cta: "Register Interest →",
    academy_courses: [
      { code:"C/01", fmt:"Training", level:"Foundation", dur:"2 days", icon:"cpu",
        title:"MAGMASOFT® Fundamentals",
        body:"Set up, run, and interpret your first casting simulations — geometry, mesh, materials, boundary conditions, and result evaluation." },
      { code:"C/02", fmt:"Training", level:"Process", dur:"2 days", icon:"droplet",
        title:"High-Pressure Die Casting",
        body:"Shot curve, gate velocity, overflow and venting layout, air entrapment, and thermal die balance for robust HPDC." },
      { code:"C/03", fmt:"Training", level:"Process", dur:"2 days", icon:"layers",
        title:"Sand Casting Simulation",
        body:"Gating and feeding design, mould filling, directional solidification, and shrinkage porosity for iron and steel." },
      { code:"C/04", fmt:"Workshop", level:"Process", dur:"1 day", icon:"box",
        title:"Core Shooting & Core / Mould",
        body:"Core box filling, sand compaction, gassing and curing, and venting layout to understand and reduce core defects." },
      { code:"C/05", fmt:"Workshop", level:"Advanced", dur:"2 days", icon:"adjustments-horizontal",
        title:"Autonomous Optimization (DoE)",
        body:"Define design variables and objectives, run virtual experiments, and read the results to find robust process windows." },
      { code:"C/06", fmt:"Seminar", level:"Advanced", dur:"1 day", icon:"arrows-move",
        title:"Stress, Distortion & Heat Treatment",
        body:"Residual stress, distortion prediction, and the casting-to-heat-treatment process chain for dimensional stability." },
    ],
    academy_formats: [
      { n:"F/01", t:"Training",  b:"Hands-on, software-focused sessions where your engineers run MAGMASOFT® on real cases — at your site or ours." },
      { n:"F/02", t:"Workshops", b:"Focused, practical sessions on a single process or method, combining short theory with guided exercises." },
      { n:"F/03", t:"Seminars",  b:"Knowledge sessions for design, quality, and management — the value of simulation without the full software depth." },
    ],
    area_desc: {
      solutions:    "Simulation, defect investigation, process improvement, and decision support from early concept to stable production.",
      magmasoft:    "The software platform we supply, teach, and support locally as the authorized Nordic partner.",
      capabilities: "Ferrous and non-ferrous casting processes — sand casting, HPDC, LPDC, investment casting, and more, simulated and optimized.",
      process:      "A clear five-step way of working, from the first question to a casting process you can trust.",
      nexus:        "Five focused engineering apps for DOE, tensile, fatigue, statistics, and FEM bridging — one integrated platform.",
      about:        "Direct engineering support from the person doing the work. No layers, no handovers.",
    },
    nexus_kicker: "NORFOX NEXUS",
    nexus_title: ["Integrated Engineering", "Platform."],
    nexus_lede: "A connected suite of focused engineering apps — built around the questions our customers ask every day. Each app does one thing well, and they share data so your analysis flows from one step to the next without re-typing.",
    nexus_apps_kicker: "— THE APPS",
    nexus_apps_heading: "Five Apps. One Workflow.",
    nexus_status: { live: "LIVE", beta: "BETA", soon: "COMING SOON" },
    nexus_launch: "Launch App →",
    nexus_launch_soon: "Coming Soon",
    nexus_flow_kicker: "— HOW THEY CONNECT",
    nexus_flow_heading: "From Data In, To Decisions Out.",
    nexus_flow_body: "The Nexus apps share a common data layer so results from one app flow into the next. Test data goes into YieldFOX and StatFOX, properties feed EnduraFOX, MAGMASOFT® results pass through MeshFOX into your FEM workflow, and OptiFOX ties the whole loop together as a DOE.",
    home_kicker: "AUTHORIZED MAGMASOFT® PARTNER IN NORDICS",
    home_headline: ["CASTING DECISIONS,", "MADE WITH", "CERTAINTY"],
    home_intro: "Casting simulation and engineering tools for Nordic foundries and component manufacturers — to reduce defects, improve processes, and make better decisions.",
    home_btn_solutions: "Explore Solutions →",
    home_btn_magmasoft: "MAGMASOFT®",
    home_stats: [["12+","Years foundry experience"],["Proficiency ","Ferrous & non-ferrous"],["5","Nordic Countries"]],
    home_tagline: ["SIMULATE · OPTIMIZE ·", "DECIDE", "EST. 2026 — SWEDEN"],
    home_reseller_kicker: "OFFICIAL STATUS",
    home_reseller_heading: "Authorized MAGMASOFT® Partner in Nordics.",
    home_reseller_body: "NORFOX provides licenses, training, and first-line technical support across the Nordic region, close to your language, time zone, and daily production reality.",
    home_explore_kicker: "— EXPLORE",
    home_explore_heading: "Six Ways We Can Help.",
    cta_kicker: "— READY TO TALK?",
    cta_heading: "Bring Your Hardest Casting Question.",
    cta_btn: "Get In Touch →",
    sol_kicker: "SOLUTIONS",
    sol_title: ["Simulation-Based Support.", "From Concept To Production."],
    sol_lede: "We support the full casting development cycle through casting simulation — from early concept studies and virtual trials to defect investigation and process improvement. Every analysis is based on simulation results and engineering experience, not physical trials.",
    services: [
      { n:"01", t:"Casting Simulation",   b:"Flow, solidification, and stress simulation before the first pour.",       detail:"We model the real casting process: gating, filling, solidification, residual stress, and microstructure. The goal is simple: test ideas digitally before time and money are locked into tooling." },
      { n:"02", t:"Defect Analysis",      b:"Root-cause investigation for porosity, cold shuts, misruns, hot tears, and shrinkage.",         detail:"We combine casting simulation results, metallurgical knowledge, and production data to identify what is actually driving the defect, then translate those simulation-based findings into clear recommendations for corrective action." },
      { n:"03", t:"Process Optimization", b:"Gating, feeding, cycle time, yield, and process robustness.",                        detail:"We improve gating, feeding, thermal management, and process windows so production becomes more stable without sacrificing quality." },
      { n:"04", t:"Decision Support",     b:"Clear engineering input for concept reviews, TEA, and LCA work.",                                            detail:"We help compare part performance, manufacturing cost, weight, feasibility, and CO₂ impact so teams can choose a direction with fewer assumptions." },
      { n:"05", t:"Industrial R&D",       b:"Longer-term development of alloys, thin-wall aluminium, and hybrid castings.",             detail:"For larger development programs, we bring metallurgical depth, simulation discipline, and production engineering knowledge into the same project — analysis delivered through simulation, informed by years of foundry experience." },
    ],
    sol_who_kicker: "— WHO WE WORK WITH",
    sol_who_heading: "Different Teams. The Same Need For Clarity.",
    sectors: [
      { n:"01", k:"Foundries",         v:"Ferrous & Non-Ferrous",       body:"For technical managers, process engineers, simulation engineers, and quality teams who need fewer defects, more stable production, and faster troubleshooting.",             needs:["Better casting quality","Fewer defects","Process stability","Faster troubleshooting"] },
      { n:"02", k:"OEMs & Tier 1",     v:"Automotive & Heavy Industry", body:"For R&D, design, supplier quality, and manufacturing teams making early decisions about castability, alloy choice, and supplier capability.",                 needs:["Lightweight, high-performance parts","Concept-phase decision support","Understanding of casting limits","Reliable supplier review"] },
      { n:"03", k:"Leadership",        v:"CTO · Technical Director",    body:"For leaders who need clear technical input before committing to investments, technology direction, or sustainability targets.",                                         needs:["Cost vs performance trade-offs","Sustainability (LCA / CO₂)","Long-term tech direction","Clear technical decisions"] },
      { n:"04", k:"Engineering Teams", v:"Simulation · Production",     body:"For engineers adopting modern digital foundry tools and looking for practical guidance that connects theory with daily production.",                                      needs:["Practical, hands-on guidance","Workflow mentoring","Bridge between theory and production"] },
    ],
    magma_kicker: "MAGMASOFT®",
    magma_title: "The Platform Our Customers Trust For Casting Simulation.",
    magma_lede: "MAGMASOFT® is a leading simulation platform for foundries and component manufacturers. As the authorized Nordic partner, NORFOX helps teams choose it, deploy it, learn it, and use it in real engineering work.",
    magma_modules_kicker: "MODULES WE SUPPORT",
    magma_modules: [
      { k:"Filling",        v:"Understand how molten metal moves through the gating system and cavity, including air entrainment, cold shuts, misruns, and surface-related risks.",    video:"images/magmasoft-filling_process.mp4" },
      { k:"Solidification", v:"Identify hot spots, shrinkage risk, feeder performance, and porosity formation before the process reaches production.", video:"images/magma_solidification.mp4" },
      { k:"Stress",         v:"Predict residual stress, distortion, and crack risk so geometry, machining behavior, and fatigue performance can be considered earlier.",              img:"images/magmasoft_stress.png" },
      { k:"Optimization",   v:"Use DoE-based virtual experiments to compare alternatives and find process windows that are more robust in real production.",         img:"images/magmasoft_optimized.png" },
    ],
    magma_programs_kicker: "SUPPORT PROGRAMS",
    magma_programs: [
      { n:"P/01", t:"Project Support",  b:"We can run a complete simulation project: setup, calculation, interpretation, and recommendations." },
      { n:"P/02", t:"Training",         b:"Hands-on training for your engineers, adapted to your alloys, parts, and casting processes." },
      { n:"P/03", t:"Ongoing Support",  b:"Technical support, model review, and method guidance for teams building capability in-house." },
    ],
    magma_stats_kicker: "WHAT IT DELIVERS",
    magma_stats: [
      { n:"20–40", u:"%", l:"Typical scrap reduction from simulation-driven gating redesign." },
      { n:"−70",   u:"%", l:"Fewer physical trials before achieving a production-ready casting." },
      { n:"3 500", u:"+", l:"Active users across 50 countries — the most-used casting simulation globally." },
    ],
    magma_why_kicker: "WHY MAGMASOFT®",
    magma_why_heading: "Why We Recommend MAGMASOFT®.",
    magma_why_filters: [["all","All"],["unique","Unique"],["strength","Strengths"],["exclusive","Exclusive"]],
    magma_why: [
      { tag:"unique",    name:"Autonomous Optimization (DoE)",        body:"MAGMASOFT® can run many virtual trials and compare yield, porosity, cycle time, and CO₂ impact together, helping teams move from one promising design to a stronger process window.",          foot:"Useful when several process variables interact." },
      { tag:"strength",  name:"MAGMAiron — Iron Microstructure",      body:"For grey iron, CGI, ductile iron, and ADI, MAGMAiron connects microstructure, graphite formation, inoculation effects, and porosity prediction.", foot:"Materials: Grey · CGI · GJS ductile · ADI · SiMo" },
      { tag:"exclusive", name:"CO₂ & Economics Perspective",          body:"MAGMASOFT® Economics connects technical results with cost, energy, scrap, and CO₂ impact, so quality and sustainability can be evaluated together.",                                            foot:"Relevant for customer ESG and investment discussions." },
      { tag:"exclusive", name:"SSM / Rheocasting Support",            body:"The only major casting simulation platform with explicit semi-solid manufacturing — directly applicable to rheocasting (Comptech SLC) and thixocasting for aluminium and magnesium.",       foot:"Unique to: Comptech, Idra, and other SSM processes." },
      { tag:"strength",  name:"Industry-Leading HPDC",                body:"Full shot chamber, plunger dynamics, gate velocity, and overflow layout — all optimizable via autonomous DoE. Cold-chamber Al and Mg from fill through solidification and distortion.",    foot:"Coverage: HPDC · LPDC · Gravity · Sand · Investment · SSM" },
      { tag:"strength",  name:"Full Process Chain to Heat Treatment", body:"Integrated simulation from melt metallurgy through solidification, ejection, and full T6 heat treatment — predicting local mechanical properties without software switching.",             foot:"Predicted: UTS · Elongation · Hardness · Residual stress" },
      { tag:"unique",    name:"Foundry-Native Workflow",              body:"The workflow is designed around foundry questions, not only simulation theory. That makes it easier for production and metallurgy teams to use results in daily work.",            foot:"Nordic support: Local engineering & training via NORFOX." },
      { tag:"strength",  name:"CGI & Inoculation Modeling",          body:"Direct inoculation practice input — models under-inoculation, chilled formation, and CGI Mg-fading risk as a function of wall thickness and solidification time.",                         foot:"Cases: Volvo, Scania, MAN engine block & cylinder head programs." },
      { tag:"exclusive", name:"Simulation Readiness Assessment",     body:"As your Nordic partner, NORFOX offers a structured SRA — identifying the highest-ROI simulation use cases before committing to a full software investment.",                               foot:"Delivered with: Dr. Mostafa Payandeh · RISE Sweden" },
    ],
    magma_auto_kicker: "HOW AUTONOMOUS ENGINEERING WORKS",
    magma_auto_heading: ["Overnight Optimization.", "Zero Manual Trials."],
    magma_auto_body: "Define the challenge, choose the variables, and let MAGMASOFT® explore the design space. Instead of guessing one change at a time, your team can compare many virtual casting trials and see which parameters matter most.",
    magma_auto_counters: [["200+","Virtual trials per overnight run"],["0","Engineer hours per trial"],["∞","Objectives evaluated at once"]],
    magma_proc_steps: [
      ["Define design variables",    "Select which parameters to vary — riser count, gate size, injection speed, alloy chemistry, chill placement."],
      ["Automatic DoE generation",   "The software builds a statistically valid set of virtual experiments covering the full parameter space."],
      ["Batch simulations overnight","The trials run unattended, often overnight, so engineers can review a broad design space instead of one isolated result."],
      ["Correlation analysis",       "The results show which variables drive quality, yield, porosity, cost, and CO₂ impact."],
      ["Optimal process window",     "The strongest process window is identified, ranked, and translated into practical engineering recommendations."],
    ],
    magma_mat_kicker: "MATERIAL COVERAGE",
    magma_mat_heading: "Purpose-Built For Every Casting Alloy.",
    magma_mats: {
      iron:  { tab:"Cast Iron",  module:"MAGMAiron Module",       title:"The deepest iron simulation in the market.",     body:"The only commercial casting simulation module that combines inoculation practice modeling with microstructure-coupled porosity prediction across all graphitic iron grades.", badges:["Grey GJL","CGI GJV","Ductile GJS","ADI","SiMo","High-Si GJS"],          feats:[["Graphite morphology","Flake (grey), vermicular (CGI), and nodular (ductile) graphite predicted from composition and inoculation state."],["Inoculation effects","Direct input of inoculation type, amount, and timing. Models under-inoculation and Mg-fading risk in CGI."],["Graphite–porosity coupling","Graphite expansion during solidification is coupled to shrinkage prediction — critical for ductile iron soundness."],["Heavy-section validation","Validated against 12-tonne GJS-400-18LT wind turbine frames and automotive CGI engine blocks."]] },
      steel: { tab:"Steel",      module:"MAGMAsteel Module",      title:"From solidification to finished properties.",    body:"Covers the complete chain from pouring through heat treatment — predicting local microstructure and mechanical properties without destructive testing.",                   badges:["Carbon steel","Alloy steel","Stainless","Tool steel","Sand","Investment"], feats:[["Macrosegregation","Carbon and alloy distribution predicted from solidification — maps microstructure variation across cross-sections."],["Heat treatment","Full quench-and-temper simulation predicts martensite, bainite, and ferrite fractions and hardness post-HT."],["Sand inclusion tracking","Reoxidation and inclusion formation during filling predicted — critical for structural steel quality."],["Riser/feeding DoE","Highest ROI in steel — overnight DoE on riser placement where physical trial costs are extreme."]] },
      al:    { tab:"Aluminium",  module:"MAGMAnonferrous",         title:"From thin-wall HPDC to structural BIW.",        body:"Handles the full range of aluminium casting — from high-speed HPDC gating optimization to post-heat-treatment property prediction for structural EV components.",       badges:["A380 / ADC12","A356 / A357","Al-Zn-Mg-Cu","HPDC","LPDC","SSM/Rheo"],     feats:[["SDAS & property mapping","Secondary dendrite arm spacing maps directly to local UTS, elongation, and hardness."],["HPDC autonomous DoE","Shot chamber, plunger, gate velocity, overflow placement — all optimized in overnight batch runs."],["SSM / Rheocasting","The only major tool applicable to Comptech SLC and thixocasting for aluminium."],["T6 chain","Solution treatment, quench, and aging simulated in sequence — predicts post-HT property distribution."]] },
      mg:    { tab:"Magnesium",  module:"Mg — MAGMAnonferrous",    title:"Optimized for the lightest structural metal.",   body:"Magnesium HPDC demands the tightest process control of any casting alloy. Autonomous DoE delivers a robust process window without physical trial runs.",                      badges:["AZ91D","AM60B","AM50 / AM20","AZ31","Mg-RE","Cold-chamber HPDC"],           feats:[["Cold-chamber HPDC","Full simulation for AZ91D, AM60B, AM50 — thin-wall filling, cold shut, and misrun prediction."],["Mg thin-wall DoE","Gate count, injection speed, overflow geometry, die temperature — all optimized overnight."],["Die thermal cycling","Predicts die temperature distribution — identifies hot spots in 1.2–1.8 mm Mg sections."],["Automotive validation","Validated for instrument panels, door inners, seat frames, and steering columns."]] },
    },
    magma_disclaimer: "MAGMASOFT® IS A REGISTERED TRADEMARK OF MAGMA GIESSEREITECHNOLOGIE GMBH. NORFOX IS THE AUTHORIZED NORDIC PARTNER.",
    magma_slides: [
      { src: "images/magmasoft-wordmark_61.png", alt: "MAGMASOFT 6.1",   title: "MAGMASOFT®\n6.1",        caption: "The next generation of autonomous casting simulation — smarter, faster, and more powerful than ever." },
      { src: "images/HPDC.jpeg",                alt: "HPDC",            title: "HPDC",                   caption: "Precision simulation for flawless high-pressure die cast parts — from filling to defect-free results." },
      { src: "images/Iron.jpeg",                alt: "Iron",            title: "Iron",                   caption: "Superior casting quality for gray, ductile, and compacted graphite iron, every time." },
      { src: "images/non-ferrous.jpeg",         alt: "Non Ferrous",     title: "Non\nFerrous",           caption: "Unlock peak performance in aluminum, magnesium, and copper alloys with minimal defects." },
      { src: "images/Steel.jpeg",               alt: "Steel",           title: "Steel",                  caption: "High-integrity steel castings with deep insights into solidification, stress, and microstructure." },
      { src: "images/investment.png",           alt: "Investment",      title: "Investment\nCasting",    caption: "Optimize all aspects of the production of investment castings and find the best solution for your requirements." },
    ],
    cap_kicker: "CAPABILITIES",
    cap_title: "Built Around Real Casting Work.",
    cap_lede: "NORFOX supports casting processes across alloys, geometries, and production scales through casting simulation. Every analysis is grounded in simulation results — identifying what can be improved, and what the simulation evidence says about the risk and benefit of each change.",
    cap_mat_kicker: "— MATERIALS",
    cap_mat_heading: "Ferrous and Non-Ferrous Metals",
    cap_materials: [
      { sym:"Al",   k:"Aluminium",    v:"HPDC · LPDC · Gravity · Sand",          detail:"Full coverage of aluminium casting processes: high-pressure die casting (HPDC), low-pressure die casting (LPDC), gravity die casting, and sand casting. From thin-wall structural parts to complex powertrain components and battery housings.", tags:["AlSi9Cu3","AlSi7Mg","AlSi10MnMg","Structural & powertrain","Battery enclosures"] },
      { sym:"Fe",   k:"Cast Iron",    v:"Grey · Compacted Graphite · Ductile",    detail:"Grey iron, compacted graphite iron (CGI), and ductile (SG) iron — sand cast, lost foam, and shell mould processes. Mechanical property prediction, microstructure modelling, and machining-induced distortion.",                              tags:["GJL grades","GJV CGI","GJS ductile","Engine blocks","Heavy industrial"] },
      { sym:"Fe·C", k:"Steel",        v:"Carbon · Alloy · Stainless",             detail:"Carbon, low-alloy and stainless steel castings. Sand, shell, and investment processes. Solidification cracking, segregation, and heat-treatment distortion prediction. Pipeline, energy, and heavy-equipment applications.",              tags:["Carbon steel","Low-alloy","Stainless","Energy & oil-gas","Heavy equipment"] },
      { sym:"Mg",   k:"Other Alloys", v:"Magnesium · Zinc · Tin",                 detail:"Magnesium for ultra-light structural parts, zinc for high-precision die-cast components, and tin for specialist applications. Process windows for reactive and low-melting-point alloys.",                                                   tags:["Mg alloys","Zn die-cast","Sn specialist","Hot/cold chamber","Lightweight design"] },
    ],
    cap_proc_kicker: "— CASTING PROCESSES",
    cap_proc_heading: "From Sand to Investment Casting — Simulated and Optimized.",
    cap_processes: [
      { n:"P/01", k:"Sand Casting",              v:"Green sand · Chemically bonded · Lost foam", b:"Sand-binder optimization, mould stability, gating-system design and yield improvement for medium-to-large series sand castings." },
      { n:"P/02", k:"High-Pressure Die Casting", v:"HPDC · Cold chamber · Vacuum",               b:"Filling pattern, air entrapment, die thermal balance, and porosity prediction for thin-wall structural HPDC parts.", featured:true },
      { n:"P/03", k:"Low-Pressure & Gravity",    v:"LPDC · Gravity · Tilt-pour",                 b:"Mould thermal management, controlled filling, and feeding strategy for high-integrity automotive and aerospace parts." },
      { n:"P/04", k:"Investment Casting",        v:"Lost-wax · Precision casting",               b:"Shell-mould thermal behaviour, directional solidification, and grain-structure prediction for aerospace, energy, and medical investment castings.", featured:true },
      { n:"P/05", k:"Sand Optimization",         v:"Binder · Reclamation · CO₂",                b:"Sand mixture analysis, reclamation strategy, and binder-system optimization to reduce CO₂ footprint and improve dimensional accuracy." },
      { n:"P/06", k:"Continuous & Centrifugal",  v:"Specialist processes",                       b:"Continuous casting and centrifugal casting modelling for tubes, sleeves, rolls, and rotationally symmetric parts.", featured:true },
    ],
    cap_spot_kicker: "— SPOTLIGHT",
    cap_spot_heading: "MAGMASOFT® Economics.",
    cap_spot_body: "MAGMASOFT® Economics helps connect simulation results to cost, energy use, scrap rate, and CO₂ impact. That makes it easier to compare process alternatives before committing to tooling or production changes.",
    cap_spot_items: ["Cost-per-good-casting across all simulated variants","CO₂ and energy footprint per kg of output","Yield and scrap rate linked to process parameters","Simultaneous quality & economics optimization","Supports EU taxonomy and customer ESG reporting"],
    cap_spot_link: "Learn More at MAGMASOFT® →",
    cap_sim_kicker: "— SIMULATION CAPABILITIES",
    cap_sim_heading: "What we model. What we can answer.",
    cap_simcaps: [
      { k:"Filling",             v:"Flow dynamics · Air entrainment · Cold-shut prevention" },
      { k:"Solidification",      v:"Thermal gradients · Hot spots · Shrinkage porosity" },
      { k:"Microstructure",      v:"Grain structure · Phase distribution · Mechanical properties" },
      { k:"Stress & Distortion", v:"Residual stress · Crack risk · Heat-treatment distortion" },
      { k:"Process Windows",     v:"DOE · Robust optimization · Sensitivity analysis" },
      { k:"Sustainability",      v:"Yield · Energy use · CO₂ per kg of good casting" },
    ],
    cap_ml_kicker: "— MAGMALINK",
    cap_ml_heading: "Connect Casting Simulation With Structural Analysis.",
    cap_ml_intro: "NORFOX helps foundries and OEMs carry simulation data beyond casting by transferring MAGMASOFT® results into FEM tools for more realistic structural and thermal analysis.",
    cap_ml_items: [
      { n:"ML/01", t:"Seamless Data Transfer",         b:"Transfer thermal and process data directly from MAGMASOFT® into FEM software such as ABAQUS and Simufact for advanced engineering analysis." },
      { n:"ML/02", t:"Accurate Temperature Mapping",   b:"MAGMAlink maps cooling histories, temperature fields, and solidification results from casting simulations onto structural analysis meshes for realistic predictions." },
      { n:"ML/03", t:"Residual Stress Prediction",     b:"Evaluate residual stresses after casting, heat treatment, or machining to reduce distortion and improve component performance." },
      { n:"ML/04", t:"Distortion & Warpage Analysis",  b:"Simulate dimensional changes and deformation caused by thermal gradients and manufacturing processes before production begins." },
      { n:"ML/05", t:"Integrated Process Chain",       b:"Continue simulations beyond casting by connecting MAGMASOFT® results to downstream processes such as heat treatment, machining, and forming operations." },
      { n:"ML/06", t:"Optimized Product Performance",  b:"Design more reliable cast components with improved dimensional stability, reduced failure risks, and faster development cycles through integrated simulation workflows." },
    ],
    proc_kicker: "PROCESS",
    proc_title: ["From First Question", "To Stable Production."],
    proc_lede: "NORFOX works through the full development cycle, from the first technical question to a casting process that is ready for production.",
    proc_how_kicker: "— HOW WE WORK",
    proc_how_heading: "A Clear Process, With Engineering Continuity.",
    process_steps: [
      { t:"Listen",      b:"We start with your process, your part, and the decision you need to make.",                                 detail:"Before any simulation setup, we define the question together. A good model should support a real decision, not just produce attractive result images." },
      { t:"Model",       b:"Geometry, alloy, thermal boundaries, and process parameters built into a simulation that mirrors your real foundry.",   detail:"Real CAD geometry, real alloy databases, real thermal boundary conditions measured from your tooling. The simulation models your process, not a textbook one." },
      { t:"Investigate", b:"Flow, solidification, stress, and process sensitivity analysed together — alongside production data.",                  detail:"We run the analyses that answer your question and cross-check them against actual castings, X-rays, and production yield data." },
      { t:"Decide",      b:"Results are translated into clear recommendations: gating changes, process windows, alloy choices, and trade-offs.",            detail:"You get a focused engineering report with the recommendation, the reasoning, the risks, and the next steps written for people who need to act." },
      { t:"Support",     b:"We provide simulation-based guidance, training, and process review until the recommended solution reaches stable production.",         detail:"Implementation is where most projects slip. We support the transition through simulation review of trial results, refinement of process windows, and training — so the recommendations derived from simulation actually reach production." },
    ],
    proc_audience_tabs: [["For Foundries", "foundry"], ["For OEMs & Tier 1", "oem"]],
    proc_foundry_context: "You bring the defect or process issue. Simulation identifies the root cause and what to change.",
    proc_oem_context: "You bring the part design or supplier question. Simulation tests castability before tooling is committed.",
    process_steps_foundry: [
      { t:"Listen",      b:"You describe the defect — where it appears, how often, and what the process looks like.",                detail:"We need to understand your casting, your tooling, and your process before touching any simulation. The question we agree on here determines what we simulate and what we measure." },
      { t:"Model",       b:"We build a simulation of your actual gating, tooling geometry, alloy, and thermal setup.",              detail:"Real geometry from your CAD or tooling drawings, your actual alloy, and thermal boundary conditions based on your process parameters. The simulation mirrors your foundry, not a textbook scenario." },
      { t:"Investigate", b:"We run filling, solidification, and stress simulation to find where and why the defect forms.",          detail:"We run the simulations that answer your specific question — filling pattern, solidification hot spots, stress concentrations — and cross-reference results with your defect data and X-rays." },
      { t:"Decide",      b:"You receive a simulation-backed root-cause analysis with specific process change recommendations.",      detail:"The output is a focused engineering report: what the simulation shows is causing the defect, which parameters to change, what improvement to expect, and what the risk of each change is." },
      { t:"Support",     b:"We review trial results against simulation predictions and refine the process window if needed.",        detail:"After the recommended changes are tested, we compare trial outcomes against simulation predictions — confirming the root cause or refining the model for the next iteration." },
    ],
    process_steps_oem: [
      { t:"Listen",      b:"You share the part design, alloy requirements, tolerances, and what the component must deliver.",        detail:"Before any simulation, we need to understand the performance requirements, the geometry constraints, and where in the development phase you are. Early castability review is very different from pre-production validation." },
      { t:"Model",       b:"We simulate casting for your geometry — wall thickness, gate locations, and feeding strategy.",          detail:"We use your CAD model and target alloy to set up a casting simulation that reflects realistic gating and feeding options — before tooling is committed or a foundry is nominated." },
      { t:"Investigate", b:"We identify castability risks, porosity-prone areas, and how sensitive the process is to variation.",   detail:"We map where shrinkage porosity or filling defects are most likely, which design features are problematic, and how sensitive the process is to common variables — the information that belongs in the design review, not the quality report." },
      { t:"Decide",      b:"You receive a structured brief: design recommendations, alloy guidance, and a clear risk rating.",      detail:"The output is written for engineering decisions. It tells you which features to change, what the simulation evidence shows, and what the risk is if the current design goes to tooling as-is." },
      { t:"Support",     b:"We transfer simulation results into your FEM workflow and support supplier evaluation with simulation data.", detail:"Via MAGMAlink, we transfer temperature fields, microstructure predictions, and residual stress data into your structural analysis. We can also support supplier qualification by simulating a nominated foundry's proposed process." },
    ],
    about_kicker: "ABOUT",
    about_title: "The Person Behind NORFOX.",
    about_lede: "NORFOX is a focused engineering company built around casting simulation and engineering experience. The person you speak with is the person running the simulations and interpreting the results.",
    about_bg_kicker: "— BACKGROUND",
    about_p1: "I have spent more than fifteen years working with metallurgy, casting technology, and industrial development, from practical foundry work to advanced R&D. What has stayed constant is my interest in understanding why a casting behaves the way it does, and how the process can be improved.",
    about_p2: "During my PhD at Jönköping University, I focused on rheocasting of aluminium alloys. Later, at Scania, I worked with cast iron and aluminium components for trucks and buses, where production stability, repeatability, automation, and data-driven manufacturing became central parts of my work.",
    about_p3: "That combination of metallurgy, simulation, and production engineering experience is the foundation of NORFOX. All work at NORFOX is conducted through simulation tools and engineering judgement — not hands-on or on-site foundry work. The experience informs the simulation; the simulation drives the recommendation.",
    about_p4: "Through NORFOX, my aim is to help the casting industry use simulation and digital manufacturing in a practical way: to reduce uncertainty, improve robustness, and make better engineering decisions.",
    about_cred_kicker: "— CREDENTIALS",
    about_creds: [
      { label:"PhD — Rheocasting of Aluminium Alloys", sub:"Jönköping University" },
      { label:"Aluminium Casting Specialist",           sub:"Scania Technical Center, Södertälje" },
      { label:"Researcher",                             sub:"RISE Research Institutes of Sweden, Jönköping" },
      { label:"Cast Iron lead metallurgist",            sub:"Scania New Foundry, Södertälje" },
    ],
    about_principle_kicker: "— OPERATING PRINCIPLE",
    about_quote: ["The goal is not only to deliver analysis. It is to help customers ", "understand the result", ", make better decisions, and create long-term industrial value."],
    about_cite: "— NORFOX OPERATING PRINCIPLE · 2026",
    about_location_label: "Location",
    about_location: "Stockholm, Sweden",
    about_founder: "Mostafa Payandeh",
    about_role: "Founder · NORFOX AB",
    contact_kicker: "CONTACT",
    contact_title: "Tell Us What You Are Trying To Solve.",
    contact_lede: "Share a few details about your part, process, or challenge. We read every message and reply within one working day.",
    contact_direct_kicker: "— DIRECT CONTACT",
    contact_fields: [["name","Name","text"],["company","Company","text"],["email","Email","email"]],
    contact_topics: ["Simulation","MAGMASOFT®","Defects","Training","R&D","Other"],
    contact_message_label: "Message",
    contact_send: "Send Request →",
    contact_sent_kicker: "✓ MESSAGE SENT",
    contact_sent_body: "Your email app should now open with the message ready to send.",
    contact_error_required: "Please add your name, email, and message before sending.",
    contact_error_email: "Please enter a valid email address.",
    contact_mail_subject: "NORFOX contact request",
    sec_kicker: "SECTORS",
    sec_title: "Simulation Is The Tool. Clarity Is The Outcome.",
    sec_lede: "Our customers range from production teams to leadership groups. What they share is the need to make difficult casting decisions with better evidence.",
    contact_topic_label: "Topic",
    contact_sent_thanks: "Thank you,",
    contact_sent_engineer: "engineer",
    contact_info: [["Email","info@norfox.se"],["Personal","mostafa.payandeh@norfox.se"],["Location","Stockholm, Sweden"],["Phone","+46 76 284 4244"]],
    linkedin_label: "Connect on LinkedIn",
    footer_nav_contact: "Contact",
    footer_tagline: "Authorized MAGMASOFT® Partner for the Nordic region.",
    footer_contact: "Get in touch",
    footer_region: "Region",
    footer_countries: ["Norway","Sweden","Finland","Denmark","Iceland"],
    footer_copyright: "© 2026 NORFOX AB · ALL RIGHTS RESERVED",
    footer_tagline_bottom: ["SIMULATE · OPTIMIZE ·", "DECIDE"],
  },
  sv: {
    nav_links: [["Lösningar","solutions"],["MAGMASOFT®","magmasoft"],["Akademi","academy"],["Kompetens","capabilities"],["Process","process"],["Nexus","nexus"],["Om oss","about"]],
    nav_contact: "Kontakt →",
    academy_kicker: "NORFOX ACADEMY",
    academy_title: ["Lär dig", "gjutsimulering."],
    academy_lede: "Praktisk utbildning i gjutsimulering och MAGMASOFT®, levererad i Norden — på ditt språk och nära din produktionsverklighet. För ingenjörer som vill använda simulering i det dagliga arbetet, inte bara i teorin.",
    academy_mission_kicker: "— FILOSOFI",
    academy_mission_heading: "Livslångt lärande för gjuteriet.",
    academy_mission_body: "NORFOX Academy hjälper nordiska gjuterier och komponenttillverkare att bygga simuleringskompetens internt. Vi kombinerar programfokuserad användarutbildning med riktad utbildning för konstruktörer, kvalitetsteam och ledning — så att gjutsimulering stöttar beslut i hela organisationen.",
    academy_courses_kicker: "— KURSER",
    academy_courses_heading: "Kurskatalog.",
    academy_note: "Kurskatalogen är under utveckling — datum och innehåll håller på att färdigställas. Kontakta oss för att anmäla intresse eller begära skräddarsydd utbildning på plats för ert team.",
    academy_formats_kicker: "— FORMAT",
    academy_formats_heading: "Tre sätt att lära sig.",
    academy_level_label: "Nivå",
    academy_duration_label: "Längd",
    academy_cta: "Anmäl intresse →",
    academy_courses: [
      { code:"C/01", fmt:"Utbildning", level:"Grund", dur:"2 dagar", icon:"cpu",
        title:"MAGMASOFT®-grunder",
        body:"Skapa, kör och tolka dina första gjutsimuleringar — geometri, beräkningsnät, material, randvillkor och resultatutvärdering." },
      { code:"C/02", fmt:"Utbildning", level:"Process", dur:"2 dagar", icon:"droplet",
        title:"Högtryckspressgjutning (HPDC)",
        body:"Skottkurva, ingjutshastighet, överlopps- och avluftningslayout, luftinneslutning och termisk formbalans för robust HPDC." },
      { code:"C/03", fmt:"Utbildning", level:"Process", dur:"2 dagar", icon:"layers",
        title:"Simulering av sandgjutning",
        body:"Design av ingjutssystem och matning, formfyllning, riktad stelning och krymphåligheter för järn och stål." },
      { code:"C/04", fmt:"Workshop", level:"Process", dur:"1 dag", icon:"box",
        title:"Kärnskjutning & kärna / form",
        body:"Kärnlådefyllning, sandkompaktering, gasning och härdning samt avluftning för att förstå och minska kärndefekter." },
      { code:"C/05", fmt:"Workshop", level:"Avancerad", dur:"2 dagar", icon:"adjustments-horizontal",
        title:"Autonom optimering (DoE)",
        body:"Definiera designvariabler och mål, kör virtuella försök och tolka resultaten för att hitta robusta processfönster." },
      { code:"C/06", fmt:"Seminarium", level:"Avancerad", dur:"1 dag", icon:"arrows-move",
        title:"Spänning, deformation & värmebehandling",
        body:"Restspänningar, deformationsförutsägelse och processkedjan från gjutning till värmebehandling för måttstabilitet." },
    ],
    academy_formats: [
      { n:"F/01", t:"Utbildning", b:"Praktiska, programfokuserade pass där dina ingenjörer kör MAGMASOFT® på verkliga fall — hos er eller hos oss." },
      { n:"F/02", t:"Workshops",  b:"Fokuserade, praktiska pass om en enskild process eller metod, som kombinerar kort teori med handledda övningar." },
      { n:"F/03", t:"Seminarier", b:"Kunskapspass för konstruktion, kvalitet och ledning — värdet av simulering utan full programdjup." },
    ],
    area_desc: {
      solutions:    "Simulering, defektutredning, processförbättring och beslutsstöd från första idé till stabil produktion.",
      magmasoft:    "Plattformen vi levererar, utbildar i och ger lokal support för som auktoriserad nordisk partner.",
      capabilities: "Järnbaserade och icke-järnbaserade gjutprocesser — sandgjutning, HPDC, LPDC, precisionsgjutning och mer, simulerade och optimerade.",
      process:      "Ett tydligt arbetssätt i fem steg, från första frågan till en gjutprocess du kan lita på.",
      nexus:        "Fem fokuserade ingenjörsappar för DoE, draghållfasthet, utmattning, statistik och FEM-koppling — en integrerad plattform.",
      about:        "Direkt tekniskt stöd från personen som gör arbetet. Inga onödiga led eller överlämningar.",
    },
    nexus_kicker: "NORFOX NEXUS",
    nexus_title: ["Integrerad Ingenjörs-", "plattform."],
    nexus_lede: "En sammankopplad svit av fokuserade ingenjörsappar — byggda kring de frågor våra kunder ställer varje dag. Varje app gör en sak bra, och de delar data så att din analys flyter från ett steg till nästa utan att skrivas om.",
    nexus_apps_kicker: "— APPARNA",
    nexus_apps_heading: "Fem Appar. Ett Arbetsflöde.",
    nexus_status: { live: "LIVE", beta: "BETA", soon: "KOMMER SNART" },
    nexus_launch: "Öppna appen →",
    nexus_launch_soon: "Kommer snart",
    nexus_flow_kicker: "— HUR DE HÄNGER IHOP",
    nexus_flow_heading: "Från Data In, Till Beslut Ut.",
    nexus_flow_body: "Nexus-apparna delar ett gemensamt datalager så att resultat från en app flyter in i nästa. Provdata går in i YieldFOX och StatFOX, egenskaper matar EnduraFOX, MAGMASOFT®-resultat förs genom MeshFOX till ditt FEM-arbetsflöde, och OptiFOX binder ihop hela loopen som ett DoE.",
    home_kicker: "AUKTORISERAD MAGMASOFT® PARTNER I NORDEN",
    home_headline: ["GJUTBESLUT,", "MED STÖRRE", "SÄKERHET"],
    home_intro: "Gjutsimulering och ingenjörsverktyg för nordiska gjuterier och komponenttillverkare — för att minska defekter, förbättra processer och fatta bättre beslut.",
    home_btn_solutions: "Utforska lösningar →",
    home_btn_magmasoft: "MAGMASOFT®",
    home_stats: [["12+","Års erfarenhet från gjuteri"],["Färdighet","Järnbaserade och icke-järnbaserade"],["5","Nordiska marknader"]],
    home_tagline: ["SIMULERA · OPTIMERA ·", "BESLUTA", "GRUNDAT 2026 — SVERIGE"],
    home_reseller_kicker: "OFFICIELL STATUS",
    home_reseller_heading: "Auktoriserad MAGMASOFT®-partner i Norden.",
    home_reseller_body: "NORFOX erbjuder licenser, utbildning och första linjens tekniska support i Norden, nära din vardag, din tidszon och din produktion.",
    home_explore_kicker: "— UTFORSKA",
    home_explore_heading: "Sex Sätt Vi Kan Hjälpa.",
    cta_kicker: "— REDO ATT PRATA?",
    cta_heading: "Berätta Om Din Svåraste Gjutfråga.",
    cta_btn: "Kontakta Oss →",
    sol_kicker: "LÖSNINGAR",
    sol_title: ["Simuleringsbaserat Stöd.", "Från Koncept Till Produktion."],
    sol_lede: "Vi stöttar hela gjututvecklingen genom gjutsimulering — från tidiga konceptstudier och virtuella försök till defektutredningar och processförbättringar. Varje analys baseras på simuleringsresultat och ingenjörserfarenhet, inte fysiska försök.",
    services: [
      { n:"01", t:"Gjutsimulering",   b:"Flödes-, stelnings- och spänningssimulering innan första gjutningen.",      detail:"Vi modellerar den verkliga gjutprocessen: angjutning, fyllning, stelning, restspänningar och mikrostruktur. Målet är att testa idéer digitalt innan tid och pengar binds i verktyg." },
      { n:"02", t:"Defektutredning",   b:"Grundorsaksanalys av porositet, kallflytning, missfyllnad, varmsprickor och krympning.",         detail:"Vi kombinerar gjutsimuleringsresultat, metallurgisk kunskap och produktionsdata för att identifiera vad som faktiskt driver defekten, och omsätter de simuleringsbaserade fynden till tydliga rekommendationer för korrigerande åtgärder." },
      { n:"03", t:"Processoptimering", b:"Angjutning, matning, cykeltid, utbyte och robustare processfönster.",                  detail:"Vi förbättrar angjutning, matning, termisk styrning och processfönster så att produktionen blir stabilare utan att kvaliteten offras." },
      { n:"04", t:"Beslutsstöd",       b:"Tydligt tekniskt underlag för konceptgranskning, TEA och LCA.",                                            detail:"Vi hjälper team att jämföra prestanda, tillverkningskostnad, vikt, gjutbarhet och CO₂-påverkan så att beslut kan fattas med färre antaganden." },
      { n:"05", t:"Industriell FoU",   b:"Långsiktig utveckling av legeringar, tunnväggigt aluminium och hybridgjutgods.",             detail:"I större utvecklingsprogram kombinerar vi metallurgisk förståelse, simulering och produktionsteknisk kunskap i samma projekt — analys levererad genom simulering, baserad på mångårig branscherfarenhet." },
    ],
    sol_who_kicker: "— VILKA VI ARBETAR MED",
    sol_who_heading: "Olika Team. Samma Behov Av Tydlighet.",
    sectors: [
      { n:"01", k:"Gjuterier",         v:"Järnbaserade & icke-järnbaserade", body:"För tekniska chefer, processingenjörer, simuleringsingenjörer och kvalitetsteam som behöver färre gjutfel, stabilare produktion och snabbare felsökning.",            needs:["Bättre gjutkvalitet","Färre gjutfel","Processstabilitet","Snabbare felsökning"] },
      { n:"02", k:"OEM & Tier 1",      v:"Fordon & tung industri",    body:"För FoU-, konstruktions-, leverantörskvalitets- och produktionsteam som fattar tidiga beslut om gjutbarhet, legeringsval och leverantörsförmåga.",                                         needs:["Lätta, högpresterande komponenter","Beslutsstöd i konceptfasen","Förståelse för gjutbegränsningar","Tillförlitlig leverantörsbedömning"] },
      { n:"03", k:"Ledning",           v:"CTO · Teknisk direktör",    body:"För ledare som behöver tydligt tekniskt underlag innan investeringar, teknikval eller hållbarhetsmål beslutas.",                                                                needs:["Kostnad kontra prestanda","Hållbarhet (LCA / CO₂)","Långsiktig teknikriktning","Tydliga tekniska beslut"] },
      { n:"04", k:"Ingenjörsteam",     v:"Simulering · Produktion",   body:"För ingenjörer som inför moderna digitala gjuteriverktyg och behöver praktisk vägledning mellan teori och daglig produktion.",                                          needs:["Praktisk vägledning","Metodstöd i arbetsflödet","Brygga mellan teori och produktion"] },
    ],
    magma_kicker: "MAGMASOFT®",
    magma_title: "Plattformen våra kunder litar på för gjutsimulering.",
    magma_lede: "MAGMASOFT® är en ledande simuleringsplattform för gjuterier och komponenttillverkare. Som auktoriserad nordisk partner hjälper NORFOX team att välja, införa, lära sig och använda programvaran i verkligt ingenjörsarbete.",
    magma_modules_kicker: "MODULER VI STÖTTAR",
    magma_modules: [
      { k:"Fyllning",   v:"Förstå hur smält metall rör sig genom ingjutssystem och kavitet, inklusive luftinneslutning, kallflytning, missfyllnad och ytrelaterade risker.", video:"images/magmasoft-filling_process.mp4" },
      { k:"Stelning",   v:"Identifiera varma områden, risk för krymphåligheter, matningsverkan och porositetsbildning innan processen når produktion.", video:"images/magma_solidification.mp4" },
      { k:"Spänning",   v:"Förutsäg restspänningar, deformation och sprickrisk så att geometri, bearbetning och utmattningsprestanda kan bedömas tidigare.", img:"images/magmasoft_stress.png" },
      { k:"Optimering", v:"Använd DoE-baserade virtuella försök för att jämföra alternativ och hitta processfönster som är robustare i verklig produktion.", img:"images/magmasoft_optimized.png" },
    ],
    magma_programs_kicker: "SUPPORTPROGRAM",
    magma_programs: [
      { n:"P/01", t:"Projektstöd",        b:"Vi kan driva ett komplett simuleringsprojekt: modelluppsättning, beräkning, tolkning och rekommendationer." },
      { n:"P/02", t:"Utbildning",         b:"Praktisk utbildning för dina ingenjörer, anpassad till era legeringar, komponenter och processer." },
      { n:"P/03", t:"Löpande support",    b:"Teknisk support, modellgranskning och metodstöd för team som bygger egen kompetens inom simulering." },
    ],
    magma_stats_kicker: "VAD DET LEVERERAR",
    magma_stats: [
      { n:"20–40", u:"%", l:"Typisk minskning av kassation genom simuleringsdriven redesign av ingjutssystem." },
      { n:"−70",   u:"%", l:"Färre fysiska försök innan ett produktionsklart gjutgods uppnås." },
      { n:"3 500", u:"+", l:"Aktiva användare i 50 länder – den mest använda gjutsimulatorn globalt." },
    ],
    magma_why_kicker: "VARFÖR MAGMASOFT®",
    magma_why_heading: "Därför Rekommenderar Vi MAGMASOFT®.",
    magma_why_filters: [["all","Alla"],["unique","Unika"],["strength","Styrkor"],["exclusive","Exklusiva"]],
    magma_why: [
      { tag:"unique",    name:"Autonom optimering (DoE)",            body:"MAGMASOFT® kan köra många virtuella försök och jämföra utbyte, porositet, cykeltid och CO₂-påverkan samtidigt. Det hjälper team att gå från en möjlig lösning till ett starkare processfönster.",         foot:"Särskilt värdefullt när flera processvariabler samverkar." },
      { tag:"strength",  name:"MAGMAiron – mikrostruktur i gjutjärn", body:"För gråjärn, CGI, segjärn och ADI kopplar MAGMAiron samman mikrostruktur, grafitbildning, ympningseffekter och porositetsrisk.",                          foot:"Material: gråjärn · CGI · GJS segjärn · ADI · SiMo" },
      { tag:"exclusive", name:"CO₂- och ekonomiperspektiv",          body:"MAGMASOFT® Economics kopplar tekniska resultat till kostnad, energi, kassation och CO₂-påverkan, så att kvalitet och hållbarhet kan utvärderas tillsammans.",                                                          foot:"Relevant för kundkrav, ESG och investeringsbeslut." },
      { tag:"exclusive", name:"SSM / Reogjutningssupport",           body:"Den enda stora gjutsimuleringsplattformen med explicit stöd för halvfast tillverkning – direkt tillämpbar på reogjutning (Comptech SLC) och tixogjutning för aluminium och magnesium.",             foot:"Unikt för: Comptech, Idra och andra SSM-processer." },
      { tag:"strength",  name:"Branschledande HPDC",                 body:"Fullständig skottkammare, kolvdynamik, ingjutshastighet och överloppsgeometri – allt optimerbart via autonom DoE. Kallkammar-HPDC för Al och Mg från fyllning till stelning och deformation.",              foot:"Täckning: HPDC · LPDC · kokillgjutning · sandgjutning · precisionsgjutning · SSM" },
      { tag:"strength",  name:"Fullständig processkedja till värmebehandling", body:"Integrerad simulering från smältmetallurgi genom stelning, utstötning och fullständig T6-värmebehandling – förutsäger lokala mekaniska egenskaper utan att byta programvara.",               foot:"Förutsäger: brottgräns · töjning · hårdhet · restspänning" },
      { tag:"unique",    name:"Gjuterinära arbetsflöde",             body:"Arbetsflödet är byggt kring gjuterifrågor, inte bara simuleringsteori. Det gör det lättare för produktion och metallurgi att använda resultaten i vardagen.",          foot:"Nordisk support: Lokal ingenjörskunskap och utbildning via NORFOX." },
      { tag:"strength",  name:"CGI och ympningsmodellering",         body:"Ympningspraxis kan användas direkt som indata för att bedöma underympning, kylning mot vitt järn och risk för Mg-avklingning i CGI.",                              foot:"Tillämpbart för motorblock, topplock och tunga gjutgods." },
      { tag:"exclusive", name:"Bedömning av simuleringsbehov",       body:"Som nordisk partner kan NORFOX hjälpa till att identifiera vilka simuleringsfall som ger störst tekniskt och ekonomiskt värde innan en större investering görs.",                                               foot:"Levereras av Dr. Mostafa Payandeh, NORFOX." },
    ],
    magma_auto_kicker: "HUR AUTONOM INGENJÖRSOPTIMERING FUNGERAR",
    magma_auto_heading: ["Optimering Över Natten.", "Färre Gissningar."],
    magma_auto_body: "Definiera utmaningen, välj variablerna och låt MAGMASOFT® utforska designutrymmet. I stället för att gissa en ändring i taget kan teamet jämföra många virtuella gjutförsök och se vilka parametrar som betyder mest.",
    magma_auto_counters: [["200+","Virtuella försök per nattomgång"],["0","Ingenjörstimmar per försök"],["∞","Mål utvärderade på en gång"]],
    magma_proc_steps: [
      ["Definiera designvariabler",     "Välj vilka parametrar som ska varieras – antal sjunkhuvuden, ingjutsarea, insprutningshastighet, legeringskemi och placering av kylkroppar."],
      ["Automatisk DoE-generering",     "Programvaran bygger en statistiskt giltig uppsättning virtuella experiment som täcker hela parameterrymden."],
      ["Batch-simuleringar över natten","Försöken körs obevakat, ofta över natten, så att ingenjörerna kan granska ett brett designutrymme i stället för ett enskilt resultat."],
      ["Korrelationsanalys",            "Resultaten visar vilka variabler som påverkar kvalitet, utbyte, porositet, kostnad och CO₂-påverkan."],
      ["Optimalt processfönster",       "Det starkaste processfönstret identifieras, rangordnas och översätts till praktiska rekommendationer."],
    ],
    magma_mat_kicker: "MATERIALTÄCKNING",
    magma_mat_heading: "Utvecklad För Varje Gjutlegering.",
    magma_mats: {
      iron:  { tab:"Gjutjärn",  module:"MAGMAiron-modul",       title:"En av marknadens mest avancerade moduler för gjutjärn.",       body:"En kommersiell gjutsimuleringsmodul som kombinerar modellering av ympningspraxis med mikrostrukturkopplad porositetsförutsägelse för grafitiska gjutjärnssorter.", badges:["Gråjärn GJL","CGI GJV","Segjärn GJS","ADI","SiMo","Hög-Si GJS"],         feats:[["Grafitmorfologi","Fjällig grafit i gråjärn, vermikulär grafit i CGI och nodulär grafit i segjärn förutsägs från sammansättning och ympningstillstånd."],["Ympningseffekter","Direkt inmatning av ympningstyp, mängd och tidpunkt. Modellerar underympning och risk för Mg-avklingning i CGI."],["Grafit–porositetskoppling","Grafitexpansion under stelning kopplas till krympningsförutsägelse – kritiskt för segjärnets sundhet."],["Validering av grova sektioner","Validerad mot 12-tons GJS-400-18LT vindturbinramar och CGI-motorblock."]] },
      steel: { tab:"Stål",      module:"MAGMAsteel-modul",      title:"Från stelning till färdiga egenskaper.",          body:"Täcker hela kedjan från gjutning till värmebehandling – förutsäger lokal mikrostruktur och mekaniska egenskaper utan destruktiv provning.",                            badges:["Kolstål","Legerat stål","Rostfritt","Verktygsstål","Sand","Precisionsgjutning"],feats:[["Makrosegring","Kol- och legeringsfördelning förutsägs från stelning – kartlägger mikrostrukturvariationer i tvärsnitt."],["Värmebehandling","Fullständig härdnings- och anlöpningssimulering förutsäger martensit-, bainit- och ferritandelar och hårdhet."],["Inklusioner från sand och reoxidation","Reoxidation och inklusionsbildning under fyllning förutsägs – kritiskt för strukturellt stålgjutgods."],["Sjunkhuvuden och matning","Hög potential i stål – DoE för placering av sjunkhuvuden där fysiska försök kan vara mycket kostsamma."]] },
      al:    { tab:"Aluminium", module:"MAGMAnonferrous",        title:"Från tunnväggig HPDC till strukturella BIW-komponenter.",     body:"Hanterar hela spektrumet av aluminiumgjutning – från optimering av ingjutssystem i höghastighets-HPDC till egenskapsförutsägelse efter värmebehandling för strukturella EV-komponenter.",  badges:["A380 / ADC12","A356 / A357","Al-Zn-Mg-Cu","HPDC","LPDC","SSM/Reo"],    feats:[["SDAS och egenskapskartläggning","Sekundärt dendritarmavstånd kopplas direkt till lokal brottgräns, töjning och hårdhet."],["Autonom DoE för HPDC","Skottkammare, kolv, ingjutshastighet och överloppsplacering optimeras i batchkörningar över natten."],["SSM / Reogjutning","Ett av få större verktyg som kan tillämpas på Comptech SLC och tixogjutning för aluminium."],["T6-kedja","Lösningsbehandling, kylning och åldring simuleras i sekvens – förutsäger egenskapsfördelning efter värmebehandling."]] },
      mg:    { tab:"Magnesium", module:"Mg — MAGMAnonferrous",   title:"Optimerad för den lättaste strukturmetallen.",    body:"HPDC av magnesium kräver mycket noggrann processkontroll. Autonom DoE hjälper till att hitta ett robust processfönster utan omfattande fysiska försöksomgångar.",              badges:["AZ91D","AM60B","AM50 / AM20","AZ31","Mg-RE","Kallkammar-HPDC"],          feats:[["Kallkammar-HPDC","Fullständig simulering för AZ91D, AM60B och AM50 – tunnväggig fyllning, kallflytning och missfyllnad."],["DoE för tunnväggigt Mg","Antal ingjut, insprutningshastighet, överloppsgeometri och formtemperatur optimeras över natten."],["Termisk formcykling","Förutsäger formtemperaturfördelning och identifierar varma områden i 1,2–1,8 mm Mg-sektioner."],["Fordonsvalidering","Validerad för instrumentpaneler, dörrinnersidor, sätesramar och rattstänger."]] },
    },
    magma_disclaimer: "MAGMASOFT® ÄR ETT REGISTRERAT VARUMÄRKE TILLHÖRANDE MAGMA GIESSEREITECHNOLOGIE GMBH. NORFOX ÄR DEN AUKTORISERADE NORDISKA PARTNERN.",
    magma_slides: [
      { src: "images/magmasoft-wordmark_61.png", alt: "MAGMASOFT 6.1",   title: "MAGMASOFT®\n6.1",        caption: "Nästa generation av autonom gjutsimulering — smartare, snabbare och kraftfullare än någonsin." },
      { src: "images/HPDC.jpeg",                alt: "HPDC",            title: "HPDC",                   caption: "Precisionssimulering för felfria högtrycksgjutna detaljer — från fyllning till defektfria resultat." },
      { src: "images/Iron.jpeg",                alt: "Järn",            title: "Järn",                   caption: "Överlägsen gjutkvalitet för grått järn, segjärn och kompaktgrafitjärn — varje gång." },
      { src: "images/non-ferrous.jpeg",         alt: "Icke-järnmetaller", title: "Icke-järn-\nmetaller", caption: "Maximera prestanda i aluminium-, magnesium- och kopparlegeringar med minimala defekter." },
      { src: "images/Steel.jpeg",               alt: "Stål",            title: "Stål",                   caption: "Stålgods med hög integritet och djupgående insikter om stelning, spänning och mikrostruktur." },
      { src: "images/investment.png",           alt: "Precisionsgjutning", title: "Precisionsgjutning",  caption: "Optimera alla aspekter av tillverkningen av precisionsgjutgods och hitta den bästa lösningen för dina krav." },
    ],
    cap_kicker: "KOMPETENS",
    cap_title: "Byggt Kring Verkligt Gjuteriarbete.",
    cap_lede: "NORFOX stöttar gjutprocesser över legeringar, geometrier och produktionsskalor genom gjutsimulering. Varje analys grundas på simuleringsresultat — med fokus på vad som kan förbättras och vad simuleringsresultaten säger om risken och nyttan av varje förändring.",
    cap_mat_kicker: "— MATERIAL",
    cap_mat_heading: "Järnbaserade och icke-järnbaserade metaller",
    cap_materials: [
      { sym:"Al",   k:"Aluminium",       v:"HPDC · LPDC · Kokill · Sand",       detail:"Bred täckning av aluminiumgjutprocesser: HPDC, LPDC, kokillgjutning och sandgjutning. Från tunnväggiga strukturdelar till komplexa drivlinjekomponenter och batterihöljen.", tags:["AlSi9Cu3","AlSi7Mg","AlSi10MnMg","Struktur & drivlina","Batterihöljen"] },
      { sym:"Fe",   k:"Gjutjärn",        v:"Gråjärn · CGI · Segjärn",                 detail:"Gråjärn, CGI och segjärn i sandgjutning, fullformsgjutning och skalformsprocesser. Förutsägelse av mekaniska egenskaper, mikrostrukturmodellering och bearbetningsorsakad deformation.",            tags:["GJL-kvaliteter","GJV CGI","GJS segjärn","Motorblock","Tung industri"] },
      { sym:"Fe·C", k:"Stål",            v:"Kolstål · Legerat · Rostfritt",           detail:"Kolstål, legerade stål och rostfria stålgjutgods. Sand-, skal- och precisionsgjutprocesser. Förutsägelse av stelningssprickor, segring och värmebehandlingsdeformation.",                  tags:["Kolstål","Legerat stål","Rostfritt","Energi & olje/gas","Tung utrustning"] },
      { sym:"Mg",   k:"Övriga legeringar",v:"Magnesium · Zink · Tenn",                detail:"Magnesium för ultralätta strukturdelar, zink för högprecisionsgjutna komponenter och tenn för specialtillämpningar. Processfönster för reaktiva och lågsmältande legeringar.",    tags:["Mg-legeringar","Zn-pressgjutning","Sn-special","Varm-/kallkammare","Lättviktsdesign"] },
    ],
    cap_proc_kicker: "— GJUTPROCESSER",
    cap_proc_heading: "Från Sand till Precisionsgjutning – Simulerad och Optimerad.",
    cap_processes: [
      { n:"P/01", k:"Sandgjutning",              v:"Grön sand · Kemiskt bunden · Fullformsgjutning", b:"Optimering av sand och bindemedel, formstabilitet, design av ingjutssystem och förbättrat utbyte för medelstora till stora serier av sandgjutgods." },
      { n:"P/02", k:"Högtryckspressgjutning",     v:"HPDC · Kallkammare · Vakuum",               b:"Fyllningsmönster, luftinneslutning, termisk formbalans och porositetsförutsägelse för tunnväggiga strukturella HPDC-komponenter.", featured:true },
      { n:"P/03", k:"Lågtryck & kokill",          v:"LPDC · Kokill · Tippgjutning",              b:"Termisk formhantering, kontrollerad fyllning och matningsstrategi för högintegritetskomponenter inom fordon och flyg." },
      { n:"P/04", k:"Precisionsgjutning",         v:"Vaxursmältning · Precisionsgjutning",       b:"Termiskt formbeteende, riktad stelning och kornstrukturförutsägelse för flyg-, energi- och medicinska precisionsgjutgods.", featured:true },
      { n:"P/05", k:"Sandoptimering",             v:"Bindemedel · Återvinning · CO₂",            b:"Analys av sandblandning, återvinningsstrategi och optimering av bindemedelssystem för att minska CO₂-avtryck och förbättra dimensionsnoggrannhet." },
      { n:"P/06", k:"Stränggjutning & centrifugalgjutning", v:"Specialistprocesser",              b:"Modellering av kontinuerlig gjutning, kallad stränggjutning, och centrifugalgjutning för rör, hylsor, valsar och rotationssymmetriska delar.", featured:true },
    ],
    cap_spot_kicker: "— SPOTLIGHT",
    cap_spot_heading: "MAGMASOFT® Economics.",
    cap_spot_body: "MAGMASOFT® Economics kopplar simuleringsresultat till kostnad, energianvändning, skrotandel och CO₂-påverkan. Det gör det lättare att jämföra processalternativ innan verktyg eller produktionsändringar låses.",
    cap_spot_items: ["Kostnad per godkänt gjutgods för alla simulerade varianter","CO₂- och energiavtryck per kg produktion","Utbyte och skrotandel kopplade till processparametrar","Kvalitets- och ekonomioptimering i samma underlag","Stödjer EU-taxonomi och kunders ESG-rapportering"],
    cap_spot_link: "Läs mer på MAGMASOFT® →",
    cap_sim_kicker: "— DET VI KAN SIMULERA",
    cap_sim_heading: "Vad vi modellerar. Vad vi kan svara på.",
    cap_simcaps: [
      { k:"Fyllning",              v:"Flödesdynamik · Luftinneslutning · Förebyggande av kallflytning" },
      { k:"Stelning",              v:"Termiska gradienter · Varma områden · Krymphåligheter och porositet" },
      { k:"Mikrostruktur",         v:"Kornstruktur · Fasfördelning · Mekaniska egenskaper" },
      { k:"Spänning & deformation",v:"Restspänning · Sprickrisk · Värmebehandlingsdeformation" },
      { k:"Processfönster",        v:"DoE · Robust optimering · Känslighetsanalys" },
      { k:"Hållbarhet",            v:"Utbyte · Energianvändning · CO₂ per kg godkänt gjutgods" },
    ],
    cap_ml_kicker: "— MAGMALINK",
    cap_ml_heading: "Koppla Gjutsimulering Till Strukturanalys.",
    cap_ml_intro: "NORFOX hjälper gjuterier och OEM-företag att ta simuleringsdata vidare efter gjutningen genom att överföra MAGMASOFT®-resultat till FEM-verktyg för mer realistisk strukturell och termisk analys.",
    cap_ml_items: [
      { n:"ML/01", t:"Sömlös dataöverföring",            b:"Överför termiska data och processdata direkt från MAGMASOFT® till FEM-program som ABAQUS och Simufact för avancerad ingenjörsanalys." },
      { n:"ML/02", t:"Korrekt temperaturmappning",       b:"MAGMAlink överför svalningsförlopp, temperaturfält och stelningsresultat från gjutsimuleringar till strukturanalysens beräkningsnät för mer realistiska förutsägelser." },
      { n:"ML/03", t:"Restspänningsförutsägelse",        b:"Utvärdera restspänningar efter gjutning, värmebehandling eller bearbetning för att minska deformation och förbättra komponentprestanda." },
      { n:"ML/04", t:"Deformations- & vridningsanalys",  b:"Simulera dimensionella förändringar och deformationer orsakade av termiska gradienter och tillverkningsprocesser innan produktionen börjar." },
      { n:"ML/05", t:"Integrerad processkedjesimulering",b:"Fortsätt simuleringen efter gjutningen genom att koppla MAGMASOFT®-resultat till efterföljande processer som värmebehandling, bearbetning och formning." },
      { n:"ML/06", t:"Optimerad produktprestanda",       b:"Designa mer tillförlitliga gjutna komponenter med förbättrad dimensionsstabilitet, minskade felrisker och snabbare utvecklingscykler." },
    ],
    proc_kicker: "PROCESS",
    proc_title: ["Från Första Frågan", "Till Stabil Produktion."],
    proc_lede: "NORFOX arbetar genom hela utvecklingscykeln, från den första tekniska frågan till en gjutprocess som är redo för produktion.",
    proc_how_kicker: "— HUR VI ARBETAR",
    proc_how_heading: "En Tydlig Process Med Teknisk Kontinuitet.",
    process_steps: [
      { t:"Lyssna",     b:"Vi börjar med din process, din komponent och det beslut du behöver fatta.",                                              detail:"Innan modellen sätts upp definierar vi frågan tillsammans. En bra simulering ska stödja ett verkligt beslut, inte bara skapa snygga resultatbilder." },
      { t:"Modellera",  b:"Geometri, legering, termiska randvillkor och processparametrar som speglar ditt verkliga gjuteri.",                            detail:"Riktig CAD-geometri, riktiga legeringsdatabaser, riktiga termiska randvillkor mätta från ditt verktyg. Simuleringen modellerar din process, inte en läroboksprocess." },
      { t:"Undersöka",  b:"Flöde, stelning, spänning och processkänslighet analyseras tillsammans med produktionsdata.",                             detail:"Vi kör de analyser som svarar på din fråga och stämmer av dem mot verkliga gjutgods, röntgenbilder och produktionsdata för utbyte." },
      { t:"Besluta",    b:"Resultaten översätts till tydliga rekommendationer: ändringar i angjutning, processfönster, legeringsval och avvägningar.",           detail:"Du får en fokuserad teknisk rapport med rekommendation, bakgrund, risker och nästa steg, skriven för människor som behöver agera." },
      { t:"Stötta",     b:"Vi ger simuleringsbaserad vägledning, utbildning och processgranskning tills den rekommenderade lösningen når stabil produktion.",              detail:"Implementering är ofta där projekt tappar fart. Vi stödjer övergången genom simuleringsgenomgångar av provresultat, förfining av processfönster och utbildning — så att rekommendationerna från simuleringen faktiskt når produktion." },
    ],
    proc_audience_tabs: [["För Gjuterier", "foundry"], ["För OEM & Tier 1", "oem"]],
    proc_foundry_context: "Ni kommer med defekten eller processproblemet. Simuleringen identifierar grundorsaken och vad som behöver ändras.",
    proc_oem_context: "Ni kommer med komponentdesignen eller leverantörsfrågan. Simuleringen testar gjutbarhet innan verktyg beställts.",
    process_steps_foundry: [
      { t:"Lyssna",     b:"Ni beskriver defekten — var den uppträder, hur ofta och hur processen ser ut.",                              detail:"Vi behöver förstå er gjutdel, ert verktyg och er process innan vi börjar någon simulering. Frågan vi enas om här avgör vad vi simulerar och vad vi mäter." },
      { t:"Modellera",  b:"Vi bygger en simulering av er verkliga angjutning, verktygsgeometri, legering och termiska setup.",          detail:"Riktig geometri från era CAD-filer eller verktygsteckningar, er faktiska legering och termiska randvillkor baserade på era processparametrar. Simuleringen speglar ert gjuteri, inte ett läroboksscenario." },
      { t:"Undersöka",  b:"Vi kör fyllnings-, stelnings- och spänningssimulering för att hitta var och varför defekten uppstår.",      detail:"Vi kör de simuleringar som svarar på er specifika fråga — fyllningsmönster, stelningsvarma zoner, spänningskoncentrationer — och jämför resultaten med er defektdata och röntgenbilder." },
      { t:"Besluta",    b:"Ni får en simuleringsbaserad grundorsaksanalys med specifika rekommendationer för processförändringar.",     detail:"Resultatet är en fokuserad teknisk rapport: vad simuleringen visar orsakar defekten, vilka parametrar som bör ändras, vilken förbättring som kan förväntas och vilken risk varje förändring innebär." },
      { t:"Stötta",     b:"Vi granskar provresultat mot simuleringsförutsägelser och förfinar processfönstret vid behov.",               detail:"Efter att de rekommenderade förändringarna testats jämför vi provresultaten mot simuleringsförutsägelserna — bekräftar grundorsaken eller förfinar modellen inför nästa iteration." },
    ],
    process_steps_oem: [
      { t:"Lyssna",     b:"Ni delar komponentdesign, legeringskrav, toleranser och vad komponenten ska klara.",                        detail:"Innan någon simulering behöver vi förstå prestandakraven, geometribegränsningarna och var ni befinner er i utvecklingsfasen. Tidig gjutbarhetsgranskning skiljer sig väsentligt från förproduktionsvalidering." },
      { t:"Modellera",  b:"Vi simulerar gjutning för er geometri — väggtjocklek, ingjutsplacering och matningsstrategi.",              detail:"Vi använder er CAD-modell och mållegering för att sätta upp en gjutsimulering med realistiska angjutnings- och matningsalternativ — innan verktyg beställts eller gjuteri nominerats." },
      { t:"Undersöka",  b:"Vi identifierar gjutbarhetsrisker, porositetsbenägna zoner och hur känslig processen är för variation.",    detail:"Vi kartlägger var krympporositet eller fyllningsdefekter är mest sannolika, vilka konstruktionsfunktioner som är problematiska och hur känslig processen är — information som hör hemma i konstruktionsgranskningen, inte i kvalitetsrapporten." },
      { t:"Besluta",    b:"Ni får ett strukturerat underlag: konstruktionsrekommendationer, legeringsvägledning och tydlig riskvärdering.", detail:"Resultatet är skrivet för ingenjörsbeslut. Det talar om vilka konstruktionsfunktioner som bör ändras, vad simuleringsresultaten visar och vilken risk det innebär om nuvarande design går till verktyg." },
      { t:"Stötta",     b:"Vi överför simuleringsresultat till ert FEM-arbetsflöde och stödjer leverantörsutvärdering med simuleringsdata.", detail:"Via MAGMAlink överför vi temperaturfält, mikrostrukturförutsägelser och restspänningsdata till er strukturanalys. Vi kan också stödja leverantörskvalificering genom att simulera en nominerad gjuteris föreslagna process." },
    ],
    about_kicker: "OM OSS",
    about_title: "Personen Bakom NORFOX.",
    about_lede: "NORFOX är ett fokuserat ingenjörsföretag byggt kring gjutsimulering och ingenjörserfarenhet. Personen du pratar med är personen som kör simuleringarna och tolkar resultaten.",
    about_bg_kicker: "— BAKGRUND",
    about_p1: "Jag har arbetat i mer än femton år med metallurgi, gjutteknik och industriell utveckling, från praktiskt gjuteriarbete till avancerad FoU. Det som alltid har drivit mig är viljan att förstå varför ett gjutgods beter sig som det gör, och hur processen kan förbättras.",
    about_p2: "Under min doktorsexamen vid Jönköping University fokuserade jag på reogjutning av aluminiumlegeringar. Senare, på Scania, arbetade jag med både gjutjärn och aluminiumkomponenter för lastbilar och bussar, där processstabilitet, repeterbarhet, automation och datadriven tillverkning blev centrala delar av mitt arbete.",
    about_p3: "Den kombinationen av metallurgi, simulering och produktionsteknisk erfarenhet är grunden för NORFOX. Allt arbete på NORFOX utförs med simuleringsverktyg och ingenjörsmässigt omdöme — inte som fysiskt arbete på plats i gjuterierna. Erfarenheten informerar simuleringen; simuleringen driver rekommendationen.",
    about_p4: "Genom NORFOX vill jag hjälpa gjutindustrin att använda simulering och digital tillverkning på ett praktiskt sätt: för att minska osäkerhet, förbättra robusthet och fatta bättre tekniska beslut.",
    about_cred_kicker: "— MERITER",
    about_creds: [
      { label:"Doktorsexamen – Reogjutning av aluminiumlegeringar", sub:"Jönköpings tekniska högskola" },
      { label:"Specialist på aluminiumgjutning",                    sub:"Scania Technical Center, Södertälje" },
      { label:"Forskare",                                           sub:"RISE Research Institutes of Sweden, Jönköping" },
      { label:"Ledande metallurg för gjutjärn",                     sub:"Scanias nya gjuteri, Södertälje" },
    ],
    about_principle_kicker: "— ARBETSPRINCIP",
    about_quote: ["Målet är inte bara att leverera analys. Det är att hjälpa kunder att ", "förstå resultatet", ", fatta bättre beslut och skapa långsiktigt industriellt värde."],
    about_cite: "— NORFOX ARBETSPRINCIP · 2026",
    about_location_label: "Plats",
    about_location: "Stockholm, Sverige",
    about_founder: "Mostafa Payandeh",
    about_role: "Grundare · NORFOX AB",
    contact_kicker: "KONTAKT",
    contact_title: "Berätta Vad Du Försöker Lösa.",
    contact_lede: "Dela några rader om din komponent, process eller utmaning. Vi läser varje meddelande och svarar inom en arbetsdag.",
    contact_direct_kicker: "— DIREKTKONTAKT",
    contact_fields: [["name","Namn","text"],["company","Företag","text"],["email","E-post","email"]],
    contact_topics: ["Simulering","MAGMASOFT®","Gjutfel","Utbildning","FoU","Annat"],
    contact_message_label: "Meddelande",
    contact_send: "Skicka förfrågan →",
    contact_sent_kicker: "✓ MEDDELANDE SKICKAT",
    contact_sent_body: "Din e-postapp bör nu öppnas med meddelandet klart att skicka.",
    contact_error_required: "Fyll i namn, e-post och meddelande innan du skickar.",
    contact_error_email: "Ange en giltig e-postadress.",
    contact_mail_subject: "Kontaktförfrågan till NORFOX",
    sec_kicker: "SEKTORER",
    sec_title: "Simulering Är Verktyget. Tydlighet Är Resultatet.",
    sec_lede: "Våra kunder finns både i produktionen och i ledningsrummet. Det de har gemensamt är behovet av bättre underlag för svåra gjutbeslut.",
    contact_topic_label: "Ämne",
    contact_sent_thanks: "Tack,",
    contact_sent_engineer: "ingenjör",
    contact_info: [["E-post","info@norfox.se"],["Direkt","mostafa.payandeh@norfox.se"],["Plats","Stockholm, Sverige"],["Telefon","+46 76 284 4244"]],
    linkedin_label: "Kontakta via LinkedIn",
    footer_nav_contact: "Kontakt",
    footer_tagline: "Auktoriserad MAGMASOFT®-partner för Norden.",
    footer_contact: "Kontakt",
    footer_region: "Region",
    footer_countries: ["Norge","Sverige","Finland","Danmark","Island"],
    footer_copyright: "© 2026 NORFOX AB · ALLA RÄTTIGHETER FÖRBEHÅLLNA",
    footer_tagline_bottom: ["SIMULERA · OPTIMERA ·", "BESLUTA"],
  },
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ dark = true, withTagline = false, markSize = 52, size }) {
  const h = (size ? size / 1.5 : markSize) * (withTagline ? 2.2 : 1.5);
  const img = <img src="images/norfox-logo-fox.png" alt="NORFOX — Nordic Foundry Excellence"
    style={{ display: "block", height: h, width: "auto", objectFit: "contain" }} />;
  return dark
    ? <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", borderRadius: 8, padding: withTagline ? "8px 14px" : "4px 10px" }}>{img}</div>
    : img;
}

function SectionLabel({ children, color = "#F05A1A" }) {
  return <div style={{ fontFamily: "var(--f-body)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, color, fontSize: 13 }}>{children}</div>;
}

function Icon({ name, size = 20, color = "currentColor", style }) {
  return <i className={"ti ti-" + name} style={{ fontSize: size, color, display: "inline-block", lineHeight: 1, flexShrink: 0, ...style }} />;
}

// ── Icon maps (index-aligned to data arrays) ──────────────────────────────────
const EXPLORE_ICONS  = { solutions: "tool", magmasoft: "cpu", academy: "school", capabilities: "atom", process: "list-check", nexus: "apps", about: "user-circle" };
const ACADEMY_FORMAT_ICONS = ["device-desktop", "tools", "presentation"];
const SERVICE_ICONS  = ["3d-cube-sphere", "zoom-scan", "adjustments-horizontal", "chart-bar", "flask"];
const SECTOR_ICONS   = ["building-factory-2", "car", "briefcase", "code"];
const PROCESS_ICONS  = ["ear", "vector", "search", "check", "tool"];
const MODULE_ICONS   = ["droplet", "snowflake", "arrows-move", "adjustments-horizontal"];
const PROGRAM_ICONS  = ["file-check", "school", "headset"];
const ML_ICONS       = ["database-import", "temperature", "arrows-maximize", "ruler-measure", "git-branch", "chart-line"];
const CAP_PROC_ICONS = ["layers", "bolt", "droplet", "diamond", "recycle", "rotate-clockwise"];
const SIMCAP_ICONS   = ["droplet", "snowflake", "hexagon", "arrows-move", "adjustments-horizontal", "leaf"];
const CONTACT_ICONS  = ["mail", "mail", "map-pin", "phone"];

// ─── Lang toggle ─────────────────────────────────────────────────────────────
function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: "flex", border: "1px solid #363C44", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
      {["en","sv"].map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{ padding: "5px 10px", background: lang === l ? "#F05A1A" : "transparent", color: "#FFFFFF", border: "none", fontFamily: "var(--f-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.15s" }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ route }) {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  const [open, setOpen] = useState(false);
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 30, background: "#1F2529", borderBottom: "1px solid #363C44" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: mobile ? 60 : 72 }}>
        <a href="#/home" onClick={() => setOpen(false)}><Logo dark size={mobile ? 52 : 72} /></a>
        {mobile ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <LangToggle />
              <button onClick={() => setOpen(o => !o)}
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={open}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                {[0,1,2].map(i => <span key={i} style={{
                  display: "block", width: 22, height: 2, background: "#FFFFFF", transition: "all 0.2s",
                  transform: open && i === 0 ? "rotate(45deg) translate(5px,5px)" : open && i === 1 ? "scaleX(0)" : open && i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "none"
                }} />)}
              </button>
            </div>
            {open && (
              <div role="menu" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1F2529", borderBottom: "1px solid #363C44", padding: "16px 0", zIndex: 50 }}>
                {t.nav_links.map(([l, slug]) => (
                  <a key={slug} href={"#/" + slug} role="menuitem"
                    aria-current={route === slug ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={slug === "magmasoft" ? "magma-nav-link" : ""}
                    style={{ display: "block", padding: "14px 24px", fontSize: 14, fontFamily: "var(--f-body)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: route === slug ? "#F05A1A" : "#FFFFFF", borderLeft: route === slug ? ("3px solid " + (slug === "magmasoft" ? "#FF2D20" : "#F05A1A")) : "3px solid transparent" }}>{l}</a>
                ))}
                <div style={{ padding: "14px 24px" }}>
                  <a href="#/contact" onClick={() => setOpen(false)} className="btn-primary" style={{ display: "inline-block", padding: "10px 22px", fontSize: 12 }}>{t.nav_contact}</a>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 32 }}>
              {t.nav_links.map(([l, slug]) => (
                <a key={slug} href={"#/" + slug}
                  className={"nav-link" + (slug === "magmasoft" ? " magma-nav-link" : "")}
                  aria-current={route === slug ? "page" : undefined}
                  style={{ position: "relative", borderBottom: route === slug ? ("2px solid " + (slug === "magmasoft" ? "#FF2D20" : "#F05A1A")) : "2px solid transparent" }}>
                  {l}
                  {slug === "magmasoft" && <span className="magma-nav-dot" aria-hidden="true" />}
                </a>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <LangToggle />
              <a href="#/contact" className="btn-primary" style={{ padding: "10px 22px", fontSize: 12 }}>{t.nav_contact}</a>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ kicker, title, lede, secondaryMark, markOpacity = 0.32 }) {
  const mobile = useMobile();
  return (
    <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: mobile ? 60 : 100, paddingBottom: mobile ? 60 : 100, overflow: "hidden" }}>
      <div className="container" style={{ position: "relative" }}>
      <div aria-hidden="true" style={{ position: "absolute", right: "-80px", top: 0, bottom: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}>
        {secondaryMark
          ? <img src={secondaryMark} alt="" style={{ width: 760, height: 760, objectFit: "contain", opacity: markOpacity, transform: "translateY(80px)" }} />
          : <img src="images/norfox-logo-fox-ladle.png" alt="" style={{ width: 760, height: 760, objectFit: "contain", opacity: 0.09 }} />}
      </div>
        <SectionLabel color="#F05A1A">{kicker}</SectionLabel>
        <h1 className="display" style={{ fontSize: "clamp(40px, 7vw, 96px)", margin: "20px 0 28px", maxWidth: 1100 }}>{title}</h1>
        {lede && <p style={{ fontSize: 17, lineHeight: 1.7, color: "#8A9099", maxWidth: 700, margin: 0 }}>{lede}</p>}
      </div>
    </section>
  );
}

// ─── CTA Band ─────────────────────────────────────────────────────────────────
function CTABand() {
  const { lang } = useLang();
  const t = T[lang];
  return (
    <section style={{ background: "#161A1D", color: "#FFFFFF", paddingTop: 80, paddingBottom: 80 }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
        <div>
          <SectionLabel color="#F05A1A">{t.cta_kicker}</SectionLabel>
          <h3 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 0", maxWidth: 700 }}>{t.cta_heading}</h3>
        </div>
        <a href="#/contact" className="btn-primary">{t.cta_btn}</a>
      </div>
    </section>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
const HOME_PILLARS = {
  en: [
    { icon: "3d-cube-sphere", title: "Casting Simulation",   body: "Flow, solidification, stress, and microstructure — modelled before the first pour." },
    { icon: "zoom-scan",      title: "Defect Investigation", body: "Root-cause analysis for porosity, cold shuts, misruns, and hot tears." },
    { icon: "apps",           title: "Engineering Platform", body: "Five Nexus apps — DOE, tensile, fatigue, statistics, and FEM bridging — in one suite." },
  ],
  sv: [
    { icon: "3d-cube-sphere", title: "Gjutsimulering",       body: "Flöde, stelning, spänning och mikrostruktur — modelleras innan första gjutningen." },
    { icon: "zoom-scan",      title: "Defektutredning",      body: "Grundorsaksanalys av porositet, kallflytning, missfyllnad och varmsprickor." },
    { icon: "apps",           title: "Ingenjörsplattform",   body: "Fem Nexus-appar — DoE, dragkraft, utmattning, statistik och FEM — i ett system." },
  ],
};

const STAT_ICONS = ["award", "atom", "map-2"];
function Stat({ k, v, idx = 0 }) {
  return (
    <div>
      <Icon name={STAT_ICONS[idx]} size={26} color="#F05A1A" style={{ marginBottom: 10 }} />
      <div className="display" style={{ fontSize: 36, color: "#F05A1A" }}>{k}</div>
      <div style={{ fontSize: 12, color: "#8A9099", marginTop: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>{v}</div>
    </div>
  );
}

function HomePage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  return (
    <>
      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: mobile ? 60 : 100, paddingBottom: mobile ? 72 : 120, overflow: "hidden" }}>
        <div className="container" style={{ position: "relative" }}>
        <img src="images/norfox-logo-fox-ladle.png" alt="" aria-hidden="true" loading="lazy"
          style={{ position: "absolute", right: -120, top: 40, width: 700, height: 700, opacity: 0.07, objectFit: "contain", pointerEvents: "none" }} />
          <SectionLabel color="#F05A1A">{t.home_kicker}</SectionLabel>
          <h1 className="display" style={{ fontSize: "clamp(40px, 7vw, 110px)", margin: "28px 0 0", maxWidth: 900, lineHeight: 0.92 }}>
            {t.home_headline[0]}<br />{t.home_headline[1]} <span style={{ color: "#F05A1A" }}>{t.home_headline[2]}</span>.
          </h1>
          <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 0.95fr) minmax(0, 1fr)", gap: mobile ? 40 : 80, alignItems: "start" }}>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "#8A9099", margin: 0, maxWidth: 520 }}>{t.home_intro}</p>
            <div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <a href="#/solutions" className="btn-primary">{t.home_btn_solutions}</a>
                <a href="#/magmasoft" className="btn-outline">{t.home_btn_magmasoft}</a>
              </div>
              <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 24, borderTop: "1px solid #F05A1A", paddingTop: 28 }}>
                {t.home_stats.map(([k, v], i) => <Stat key={k} k={k} v={v} idx={i} />)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 80, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderTop: "1px solid #363C44", paddingTop: 24 }}>
            <div className="label" style={{ color: "#8A9099" }}>{t.home_tagline[0]} <span style={{ color: "#F05A1A" }}>{t.home_tagline[1]}</span></div>
            <div className="label" style={{ color: "#8A9099" }}>{t.home_tagline[2]}</div>
          </div>
        </div>
      </section>

      <section style={{ background: "#FFFFFF", paddingTop: mobile ? 48 : 72, paddingBottom: mobile ? 60 : 100 }}>
        <div className="container">

        {/* ── What NORFOX does — three pillars ── */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: mobile ? 40 : 64 }}>
          {HOME_PILLARS[lang].map((p, i) => (
            <div key={i} style={{ background: "#F4F5F6", borderTop: "3px solid #F05A1A", borderRadius: 4, padding: mobile ? "28px 24px" : "36px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 44, height: 44, background: "#1F2529", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={p.icon} size={22} color="#F05A1A" />
              </div>
              <h3 className="heading" style={{ fontSize: 18, textTransform: "uppercase", margin: 0, color: "#1F2529" }}>{p.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4A5158", margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "#000306", border: "1px solid #363C44", borderLeft: "4px solid #F05A1A", padding: mobile ? "24px 20px" : "32px 36px", borderRadius: 4, display: "grid", gridTemplateColumns: mobile ? "1fr" : "auto 1fr auto auto", gap: mobile ? 20 : 32, alignItems: "center" }}>
          <img src="images/norfox-mark-light.png" alt="NORFOX" width="222" height="222" style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }} loading="lazy" />
          <div>
            <SectionLabel color="#F05A1A">{t.home_reseller_kicker}</SectionLabel>
            <h3 className="heading" style={{ fontSize: "clamp(22px, 2.6vw, 30px)", textTransform: "uppercase", margin: "10px 0", color: "#FFFFFF" }}>{t.home_reseller_heading}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#8A9099", margin: 0, maxWidth: 620 }}>{t.home_reseller_body}</p>
          </div>
          <a href="https://www.magmasoft.de/en/" target="_blank" rel="noopener noreferrer" style={{ background: "#FFFFFF", border: "1px solid #363C44", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 4 }}>
            <img src="images/magmasoft-wordmark.png" alt="MAGMASOFT®" width="120" style={{ height: "auto", objectFit: "contain" }} loading="lazy" />
          </a>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, borderLeft: mobile ? "none" : "1px solid #363C44", paddingLeft: mobile ? 0 : 28 }}>
            {[["NO",t.footer_countries[0]],["SE",t.footer_countries[1]],["FI",t.footer_countries[2]],["DK",t.footer_countries[3]],["IS",t.footer_countries[4]]].map(([c,n]) => (
              <div key={c} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "#F05A1A", width: 22 }}>{c}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#FFFFFF" }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
        </div>

        <div className="container" style={{ marginTop: 80 }}>
          <SectionLabel color="#F05A1A">{t.home_explore_kicker}</SectionLabel>
          <h2 className="heading" style={{ fontSize: "clamp(22px, 3vw, 40px)", textTransform: "uppercase", margin: "24px 0 36px", maxWidth: 900 }}>{t.home_explore_heading}</h2>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 16 }}>
            {t.nav_links.map(([l, slug]) => (
              <a key={slug} href={"#/" + slug} className="svc-card" style={{ background: "#F4F5F6", borderLeft: "4px solid #F05A1A", padding: mobile ? "24px 20px" : "32px 28px", borderRadius: 4, minHeight: mobile ? 140 : 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: "#1F2529", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={EXPLORE_ICONS[slug]} size={22} color="#F05A1A" />
                  </div>
                  <SectionLabel color="#3A6C8C">{l.toUpperCase()}</SectionLabel>
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: "#4A5158", margin: 0 }}>{t.area_desc[slug]}</p>
                </div>
                <div className="heading" style={{ fontSize: mobile ? 20 : 28, textTransform: "uppercase", color: "#1F2529", marginTop: 16 }}>→</div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────
function ServicesPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  return (
    <>
      <PageHeader kicker={t.sol_kicker} title={<>{t.sol_title[0]}<br />{t.sol_title[1]}</>} lede={t.sol_lede} />
      <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {t.services.map((s, si) => (
              <div key={s.n} className="svc-card" style={{ background: "#F4F5F6", borderLeft: "4px solid #F05A1A", borderRadius: 4, padding: mobile ? "28px 24px" : "40px 48px", display: "grid", gridTemplateColumns: mobile ? "1fr" : "120px 1fr 2fr", gap: mobile ? 12 : 40, alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: mobile ? "flex-start" : "center" }}>
                  <div style={{ width: 52, height: 52, background: "#1F2529", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={SERVICE_ICONS[si]} size={24} color="#F05A1A" />
                  </div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "#8A9099", letterSpacing: "0.12em" }}>S/{s.n}</div>
                </div>
                <h3 className="heading" style={{ fontSize: mobile ? 22 : 28, textTransform: "uppercase", margin: 0, color: "#1F2529" }}>{s.t}</h3>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: "#4A5158", margin: 0 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#F4F5F6", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#F05A1A">{t.sol_who_kicker}</SectionLabel>
          <h2 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 40px", color: "#1F2529", maxWidth: 800 }}>{t.sol_who_heading}</h2>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 24 }}>
            {t.sectors.map((s, si) => (
              <div key={s.n} style={{ background: "#FFFFFF", borderLeft: "4px solid #F05A1A", padding: mobile ? "28px 24px" : "36px 32px", borderRadius: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, background: "#F4F5F6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={SECTOR_ICONS[si]} size={22} color="#F05A1A" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <SectionLabel color="#F05A1A">S/{s.n}</SectionLabel>
                      <span className="label" style={{ color: "#3A6C8C" }}>{s.v}</span>
                    </div>
                  </div>
                </div>
                <h3 className="heading" style={{ fontSize: mobile ? 20 : 26, textTransform: "uppercase", margin: "0 0 10px", color: "#1F2529" }}>{s.k}</h3>
                <p style={{ fontSize: 14, color: "#4A5158", margin: 0, lineHeight: 1.6 }}>{s.body}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                  {s.needs.map(n => (
                    <li key={n} style={{ display: "flex", gap: 8, fontSize: 12, color: "#4A5158", lineHeight: 1.4, alignItems: "flex-start" }}>
                      <Icon name="check" size={13} color="#F05A1A" style={{ marginTop: 1, flexShrink: 0 }} />{n}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

// ─── ACADEMY PAGE ───────────────────────────────────────────────────────────
function AcademyPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  return (
    <>
      <PageHeader
        kicker={t.academy_kicker}
        title={<>{t.academy_title[0]}<br />{t.academy_title[1]}</>}
        lede={t.academy_lede}
      />

      {/* Philosophy / mission — white */}
      <section style={{ background: "#FFFFFF", paddingTop: mobile ? 56 : 80, paddingBottom: mobile ? 56 : 80 }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "0.85fr 1.15fr", gap: mobile ? 20 : 64, alignItems: "start" }}>
          <div>
            <SectionLabel color="#F05A1A">{t.academy_mission_kicker}</SectionLabel>
            <h2 className="heading" style={{ fontSize: "clamp(26px, 3.4vw, 42px)", textTransform: "uppercase", color: "#1F2529", margin: "16px 0 0" }}>{t.academy_mission_heading}</h2>
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.8, color: "#4A5158", margin: 0 }}>{t.academy_mission_body}</p>
        </div>
      </section>

      {/* Course catalogue — light */}
      <section style={{ background: "#F4F5F6", paddingTop: 80, paddingBottom: 100, overflow: "hidden" }}>
        <div className="container" style={{ position: "relative" }}>
          <div className="hex-pattern" style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <SectionLabel color="#F05A1A">{t.academy_courses_kicker}</SectionLabel>
            <h2 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", color: "#1F2529", margin: "16px 0 28px" }}>{t.academy_courses_heading}</h2>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#FFFFFF", border: "1px solid #E6E8EA", borderLeft: "4px solid #F05A1A", borderRadius: 4, padding: "18px 22px", marginBottom: 40, maxWidth: 900 }}>
              <Icon name="info-circle" size={20} color="#F05A1A" style={{ marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#4A5158" }}>{t.academy_note}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
              {t.academy_courses.map(c => (
                <div key={c.code} className="svc-card" style={{ background: "#FFFFFF", border: "1px solid #E6E8EA", borderTop: "3px solid #F05A1A", borderRadius: 4, padding: mobile ? "24px 20px" : "28px 26px", display: "flex", flexDirection: "column", gap: 16, minHeight: 288 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ width: 48, height: 48, background: "#1F2529", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={c.icon} size={24} color="#F05A1A" />
                    </div>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFFFFF", background: "#1F2529", padding: "4px 10px", borderRadius: 2 }}>{c.fmt}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.12em", color: "#8A9099", marginBottom: 6 }}>{c.code}</div>
                    <h3 className="heading" style={{ fontSize: 19, textTransform: "uppercase", margin: 0, color: "#1F2529" }}>{c.title}</h3>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: "#4A5158", margin: 0, flexGrow: 1 }}>{c.body}</p>
                  <div style={{ display: "flex", gap: 24, paddingTop: 14, borderTop: "1px solid #E6E8EA" }}>
                    <div>
                      <div className="label" style={{ color: "#8A9099", fontSize: 10 }}>{t.academy_level_label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2529", marginTop: 2 }}>{c.level}</div>
                    </div>
                    <div>
                      <div className="label" style={{ color: "#8A9099", fontSize: 10 }}>{t.academy_duration_label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2529", marginTop: 2 }}>{c.dur}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Formats — dark */}
      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: 80, paddingBottom: 100, overflow: "hidden" }}>
        <div className="container" style={{ position: "relative" }}>
          <div className="hex-pattern" style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <SectionLabel color="#8A9099">{t.academy_formats_kicker}</SectionLabel>
            <h2 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 40px", maxWidth: 760 }}>{t.academy_formats_heading}</h2>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
              {t.academy_formats.map((f, i) => (
                <div key={f.n} style={{ background: "#262C32", border: "1px solid #363C44", borderRadius: 4, padding: mobile ? "28px 24px" : "36px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: "rgba(240,90,26,0.15)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={ACADEMY_FORMAT_ICONS[i]} size={22} color="#F05A1A" />
                    </div>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "#8A9099", letterSpacing: "0.12em" }}>{f.n}</span>
                  </div>
                  <h3 className="heading" style={{ fontSize: 22, textTransform: "uppercase", margin: 0 }}>{f.t}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "#8A9099", margin: 0 }}>{f.b}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 48 }}>
              <a href="#/contact" className="btn-primary">{t.academy_cta}</a>
            </div>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

// ─── MAGMASOFT PAGE ────────────────────────────────────────────────────────────
function MagmasoftPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  const [tab, setTab] = useState(0);
  const [whyFilter, setWhyFilter] = useState("all");
  const [matTab, setMatTab] = useState("iron");
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlideIdx(i => (i + 1) % t.magma_slides.length), 5000);
    return () => clearInterval(timer);
  }, [slideIdx]);

  return (
    <>
      <PageHeader kicker={t.magma_kicker} title={t.magma_title} lede={t.magma_lede} />

      {/* ── Slideshow ── */}
      <section style={{ background: "#0F1215", overflow: "hidden", position: "relative" }}>
        {/* Prev arrow */}
        <button onClick={() => setSlideIdx(i => (i - 1 + t.magma_slides.length) % t.magma_slides.length)} aria-label="Previous slide"
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(240,90,26,0.7)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {/* Next arrow */}
        <button onClick={() => setSlideIdx(i => (i + 1) % t.magma_slides.length)} aria-label="Next slide"
          style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(240,90,26,0.7)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div style={{ width: "100%", height: mobile ? 400 : 580, overflow: "hidden" }}>
          <div style={{ display: "flex", height: "100%", width: `${t.magma_slides.length * 100}%`, transform: `translateX(-${slideIdx * (100 / t.magma_slides.length)}%)`, transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            {t.magma_slides.map(s => (
              <div key={s.src} style={{ width: `${100 / t.magma_slides.length}%`, flexShrink: 0, height: "100%", display: "flex", flexDirection: mobile ? "column" : "row" }}>

                {/* Image — left */}
                <div style={{ width: mobile ? "100%" : "52%", height: mobile ? "58%" : "100%", flexShrink: 0, background: "#000000", overflow: "hidden" }}>
                  <img src={s.src} alt={s.alt} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>

                {/* Text — right */}
                <div style={{ flex: 1, height: mobile ? "42%" : "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: mobile ? "20px 28px" : "52px 72px", background: "#1F2529", overflow: "hidden", minWidth: 0 }}>
                  <div style={{ width: 40, height: 3, background: "#F05A1A", marginBottom: mobile ? 14 : 28, borderRadius: 2 }} />
                  <div className="display" style={{ fontSize: mobile ? 38 : "clamp(44px, 5vw, 80px)", color: "#FFFFFF", lineHeight: 0.9, whiteSpace: "pre-line", wordBreak: "break-word", marginBottom: mobile ? 12 : 22, textTransform: "uppercase" }}>
                    {s.title}
                  </div>
                  <p style={{ margin: 0, fontSize: mobile ? 12 : "clamp(14px, 1.2vw, 16px)", lineHeight: 1.75, color: "#8A9099", maxWidth: 400 }}>
                    {s.caption}
                  </p>
                  {/* Dots — anchored inside text panel */}
                  <div style={{ display: "flex", gap: 8, marginTop: mobile ? 16 : 40 }}>
                    {t.magma_slides.map((_, i) => (
                      <button key={i} onClick={() => setSlideIdx(i)} aria-label={"Go to slide " + (i + 1)}
                        style={{ width: i === slideIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === slideIdx ? "#F05A1A" : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s ease" }} />
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules — dark ── */}
      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: 80, paddingBottom: 100, overflow: "hidden" }}>
        <div className="container" style={{ position: "relative" }}>
          <div className="hex-pattern" style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }} />
          <SectionLabel color="#8A9099">{t.magma_modules_kicker}</SectionLabel>
          <div role="tablist" aria-label="MAGMASOFT modules" style={{ marginTop: 20, display: "grid", gridTemplateColumns: mobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", border: "1px solid #363C44", background: "#262C32" }}>
            {t.magma_modules.map((m, i) => (
              <button key={m.k} role="tab" aria-selected={tab === i} aria-controls={"mod-panel-"+i} id={"mod-tab-"+i} onClick={() => setTab(i)}
                style={{ padding: "24px 22px", textAlign: "left", cursor: "pointer", border: "none", borderRight: i < 3 ? "1px solid #363C44" : "none", background: tab === i ? "#F05A1A" : "transparent", color: "#FFFFFF", fontFamily: "var(--f-display)", display: "flex", flexDirection: "column", gap: 6 }}>
                <Icon name={MODULE_ICONS[i]} size={20} color={tab === i ? "#FFFFFF" : "#F05A1A"} style={{ marginBottom: 2 }} />
                <span className="label" style={{ color: tab === i ? "#FFFFFF" : "#F05A1A" }}>M/0{i+1}</span>
                <span className="heading" style={{ fontSize: 18, textTransform: "uppercase" }}>{m.k}</span>
              </button>
            ))}
          </div>
          <div role="tabpanel" id={"mod-panel-"+tab} aria-labelledby={"mod-tab-"+tab}
            style={{ marginTop: 24, display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", border: "1px solid #363C44", borderLeft: "4px solid #F05A1A", background: "#262C32" }}>
            <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <SectionLabel color="#F05A1A">M/0{tab+1}</SectionLabel>
              <h4 className="heading" style={{ fontSize: 32, textTransform: "uppercase", margin: "10px 0 18px", color: "#FFFFFF" }}>{t.magma_modules[tab].k}</h4>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "#8A9099", margin: 0 }}>{t.magma_modules[tab].v}</p>
            </div>
            <div style={{ minHeight: 360, background: "#1F2529", borderLeft: mobile ? "none" : "1px solid #363C44", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#363C44", fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 9px)" }}>
                IMG / M-0{tab+1} · {t.magma_modules[tab].k.toUpperCase()}
              </div>
              {t.magma_modules[tab].img && <img key={tab} src={t.magma_modules[tab].img} alt={t.magma_modules[tab].k} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", inset: 0, padding: "24px" }} onError={e => { e.currentTarget.style.display = "none"; }} />}
              {t.magma_modules[tab].video && <video key={"v"+tab} src={t.magma_modules[tab].video} autoPlay loop muted playsInline preload="none" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />}
            </div>
          </div>
        </div>
      </section>

      {/* ── Programs + Stats — light ── */}
      <section style={{ background: "#F4F5F6", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#F05A1A">{t.magma_programs_kicker}</SectionLabel>
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            {t.magma_programs.map((p, pi) => (
              <div key={p.n} style={{ background: "#FFFFFF", borderLeft: "4px solid #F05A1A", padding: 32, borderRadius: 4, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, background: "#FFF4EE", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={PROGRAM_ICONS[pi]} size={20} color="#F05A1A" />
                  </div>
                  <SectionLabel color="#F05A1A">{p.n}</SectionLabel>
                </div>
                <h4 className="heading" style={{ fontSize: 22, textTransform: "uppercase", margin: "0 0 10px", color: "#1F2529" }}>{p.t}</h4>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#4A5158", margin: 0 }}>{p.b}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 80 }}>
            <SectionLabel color="#F05A1A">{t.magma_stats_kicker}</SectionLabel>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", border: "1px solid #E6E8EA" }}>
              {t.magma_stats.map((s, i) => (
                <div key={i} style={{ background: "#FFFFFF", padding: "36px 32px", borderRight: !mobile && i < 2 ? "1px solid #E6E8EA" : "none", borderTop: "3px solid #F05A1A" }}>
                  <div style={{ fontFamily: "var(--f-display)", fontSize: 56, fontWeight: 900, color: "#F05A1A", lineHeight: 1, letterSpacing: "-0.01em" }}>{s.n}<span style={{ fontSize: 26, marginLeft: 4 }}>{s.u}</span></div>
                  <div style={{ fontSize: 14, lineHeight: 1.55, color: "#4A5158", marginTop: 14, maxWidth: 320 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why MAGMASOFT — white ── */}
      <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <SectionLabel color="#F05A1A">{t.magma_why_kicker}</SectionLabel>
              <h3 className="heading" style={{ fontSize: "clamp(26px, 3vw, 36px)", textTransform: "uppercase", margin: "10px 0 0", color: "#1F2529", maxWidth: 640 }}>{t.magma_why_heading}</h3>
            </div>
            <div role="group" aria-label="Filter capabilities" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {t.magma_why_filters.map(([k,label]) => (
                <button key={k} aria-pressed={whyFilter === k} onClick={() => setWhyFilter(k)}
                  style={{ padding: "8px 16px", border: "1px solid " + (whyFilter===k?"#F05A1A":"#E6E8EA"), background: whyFilter===k?"rgba(240,90,26,0.08)":"transparent", color: whyFilter===k?"#F05A1A":"#4A5158", fontFamily: "var(--f-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 2 }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 2, background: "#E6E8EA", border: "1px solid #E6E8EA" }}>
            {t.magma_why.map((w, i) => {
              const dim = whyFilter !== "all" && w.tag !== whyFilter;
              const tc = w.tag==="unique"?"#F05A1A":w.tag==="strength"?"#5B9BD5":"#3FB88A";
              return (
                <div key={i} style={{ background: "#FFFFFF", padding: "26px 24px", display: "flex", flexDirection: "column", gap: 12, opacity: dim?0.18:1, transition: "opacity 0.25s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "#F05A1A" }}>W/{String(i+1).padStart(2,"0")}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 2, color: tc, border: "1px solid "+tc+"55", background: tc+"14" }}>{w.tag}</span>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: "#1F2529", lineHeight: 1.3 }}>{w.name}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "#4A5158" }}>{w.body}</div>
                  <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #E6E8EA", fontSize: 11.5, color: "#8A9099", lineHeight: 1.5 }}>{w.foot}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Autonomous Engineering — dark ── */}
      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#8A9099">{t.magma_auto_kicker}</SectionLabel>
          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 56, alignItems: "start" }}>
            <div>
              <h3 className="heading" style={{ fontSize: "clamp(26px, 3vw, 36px)", textTransform: "uppercase", margin: 0, color: "#FFFFFF", maxWidth: 460 }}>{t.magma_auto_heading[0]} <span style={{ color: "#F05A1A" }}>{t.magma_auto_heading[1]}</span></h3>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#8A9099", marginTop: 18, maxWidth: 460 }}>{t.magma_auto_body}</p>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr 1fr" : "repeat(3, auto)", gap: mobile ? 16 : 36, marginTop: 32 }}>
                {t.magma_auto_counters.map(([n,l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: "var(--f-display)", fontSize: 38, fontWeight: 900, color: "#F05A1A", lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.45, color: "#8A9099", marginTop: 6, maxWidth: 130 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              {t.magma_proc_steps.map(([title,body], i) => (
                <div key={i} style={{ display: "flex", gap: 20, padding: "18px 0", borderBottom: i < t.magma_proc_steps.length-1 ? "1px solid #363C44" : "none", alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #F05A1A", color: "#F05A1A", background: "rgba(240,90,26,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i+1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "#8A9099" }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Material Coverage — light ── */}
      <section style={{ background: "#F4F5F6", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#F05A1A">{t.magma_mat_kicker}</SectionLabel>
          <h3 className="heading" style={{ fontSize: "clamp(26px, 3vw, 36px)", textTransform: "uppercase", margin: "10px 0 0", color: "#1F2529" }}>{t.magma_mat_heading}</h3>
          <div role="tablist" aria-label="Alloy material types" style={{ display: "flex", marginTop: 28, borderBottom: "2px solid #E6E8EA", flexWrap: "wrap" }}>
            {Object.entries(t.magma_mats).map(([k,m]) => (
              <button key={k} role="tab" aria-selected={matTab===k} aria-controls={"mat-panel-"+k} id={"mat-tab-"+k} onClick={() => setMatTab(k)}
                style={{ padding: "14px 22px", background: "none", border: "none", borderBottom: "2px solid "+(matTab===k?"#F05A1A":"transparent"), marginBottom: -2, fontFamily: "var(--f-body)", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", color: matTab===k?"#F05A1A":"#4A5158", cursor: "pointer" }}>{m.tab}</button>
            ))}
          </div>
          <div role="tabpanel" id={"mat-panel-"+matTab} aria-labelledby={"mat-tab-"+matTab}
            style={{ marginTop: 36, display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 48, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {t.magma_mats[matTab].feats.map(([ft,fb], i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 18, background: "#FFFFFF", border: "1px solid #E6E8EA", borderLeft: "3px solid #F05A1A", borderRadius: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F05A1A", marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1F2529", marginBottom: 4 }}>{ft}</div>
                    <div style={{ fontSize: 12.5, color: "#4A5158", lineHeight: 1.6 }}>{fb}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <SectionLabel color="#F05A1A">{t.magma_mats[matTab].module}</SectionLabel>
              <h4 className="heading" style={{ fontSize: 28, lineHeight: 1.2, color: "#1F2529", margin: "14px 0 16px", textTransform: "uppercase" }}>{t.magma_mats[matTab].title}</h4>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4A5158", margin: 0 }}>{t.magma_mats[matTab].body}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
                {t.magma_mats[matTab].badges.map(b => (
                  <span key={b} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 2, background: "rgba(240,90,26,0.08)", border: "1px solid rgba(240,90,26,0.25)", color: "#F05A1A", letterSpacing: "0.03em", fontWeight: 500 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="label" style={{ marginTop: 60, color: "#8A9099" }}>
            {t.magma_disclaimer}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

// ─── CAPABILITIES ─────────────────────────────────────────────────────────────
function CapabilitiesPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  const [activeMat, setActiveMat] = useState(0);

  return (
    <>
      <PageHeader kicker={t.cap_kicker} title={t.cap_title} lede={t.cap_lede} />

      <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 100, overflow: "hidden" }}>
        <div className="container" style={{ position: "relative" }}>
          <div className="hex-pattern" style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }} />
          <SectionLabel color="#F05A1A">{t.cap_mat_kicker}</SectionLabel>
          <h2 className="heading" style={{ fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 40px", color: "#1F2529", maxWidth: 800 }}>{t.cap_mat_heading}</h2>
          <div role="tablist" aria-label="Material types" style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", border: "1px solid #E6E8EA", borderBottom: "none" }}>
            {t.cap_materials.map((m, i) => (
              <button key={m.k} role="tab" aria-selected={activeMat===i} aria-controls={"cap-mat-"+i} id={"cap-tab-"+i} onClick={() => setActiveMat(i)}
                style={{ padding: mobile?"14px 16px":"20px 24px", textAlign: "left", cursor: "pointer", border: "none", borderRight: i < t.cap_materials.length-1 ? "1px solid #E6E8EA" : "none", background: activeMat===i?"#1F2529":"#FFFFFF", color: activeMat===i?"#FFFFFF":"#1F2529", transition: "background 0.2s", display: "flex", flexDirection: "column", gap: 4 }}>
                <span className="label" style={{ color: "#F05A1A", fontWeight: 600 }}>M/0{i+1}</span>
                <span className="heading" style={{ fontSize: mobile?16:20, textTransform: "uppercase" }}>{m.k}</span>
              </button>
            ))}
          </div>
          <div role="tabpanel" id={"cap-mat-"+activeMat} aria-labelledby={"cap-tab-"+activeMat}
            style={{ background: "#1F2529", color: "#FFFFFF", padding: mobile?"28px 24px":"48px 48px", display: "grid", gridTemplateColumns: mobile?"1fr":"auto 1fr", gap: mobile?16:48, alignItems: "center", borderLeft: "4px solid #F05A1A" }}>
            <div className="display" style={{ fontSize: mobile?64:120, color: "#F05A1A", lineHeight: 1, minWidth: mobile?"auto":140 }}>{t.cap_materials[activeMat].sym}</div>
            <div>
              <div className="label" style={{ color: "#F05A1A", fontWeight: 600 }}>{t.cap_materials[activeMat].v}</div>
              <h3 className="heading" style={{ fontSize: 36, textTransform: "uppercase", margin: "8px 0 16px" }}>{t.cap_materials[activeMat].k}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "#E6E8EA", margin: 0, maxWidth: 720 }}>{t.cap_materials[activeMat].detail}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
                {t.cap_materials[activeMat].tags.map(tag => <span key={tag} style={{ padding: "6px 14px", border: "1px solid #363C44", borderRadius: 999, fontSize: 12, fontFamily: "var(--f-mono)", color: "#FFFFFF", letterSpacing: "0.04em" }}>{tag}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#F05A1A">{t.cap_sim_kicker}</SectionLabel>
          <h2 className="heading" style={{ fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 40px", maxWidth: 900 }}>{t.cap_sim_heading}</h2>
          <div style={{ display: "grid", gridTemplateColumns: mobile?"1fr 1fr":"repeat(3, 1fr)", gap: 1, background: "#363C44", border: "1px solid #363C44" }}>
            {t.cap_simcaps.map((s, i) => (
              <div key={s.k} style={{ background: "#1F2529", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name={SIMCAP_ICONS[i]} size={20} color="#F05A1A" />
                  <div className="label" style={{ color: "#F05A1A", fontWeight: 600 }}>SIM/{String(i+1).padStart(2,"0")}</div>
                </div>
                <h3 className="heading" style={{ fontSize: 22, textTransform: "uppercase", margin: 0 }}>{s.k}</h3>
                <p style={{ fontSize: 14, color: "#8A9099", margin: 0, lineHeight: 1.55 }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#F4F5F6", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#F05A1A">{t.cap_proc_kicker}</SectionLabel>
          <h2 className="heading" style={{ fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 40px", color: "#1F2529", maxWidth: 900 }}>{t.cap_proc_heading}</h2>
          <div style={{ display: "grid", gridTemplateColumns: mobile?"1fr 1fr":"repeat(3, 1fr)", gap: 16 }}>
            {t.cap_processes.map((p, cpi) => (
              <div key={p.n} className="svc-card" style={{ background: p.featured?"#1F2529":"#FFFFFF", color: p.featured?"#FFFFFF":"#1F2529", borderLeft: "4px solid #F05A1A", padding: "32px 28px", borderRadius: 4, position: "relative", minHeight: 240, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, background: p.featured ? "rgba(240,90,26,0.15)" : "#F4F5F6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={CAP_PROC_ICONS[cpi]} size={18} color="#F05A1A" />
                  </div>
                  <div className="label" style={{ color: "#F05A1A", fontWeight: 600 }}>{p.n}</div>
                </div>
                <h3 className="heading" style={{ fontSize: 22, textTransform: "uppercase", margin: "0 0 6px" }}>{p.k}</h3>
                <div style={{ fontSize: 12, fontFamily: "var(--f-mono)", color: p.featured?"#F05A1A":"#3A6C8C", letterSpacing: "0.06em", marginBottom: 14 }}>{p.v}</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: p.featured?"#E6E8EA":"#4A5158", margin: 0 }}>{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: mobile?"1fr":"1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <SectionLabel color="#F05A1A">{t.cap_spot_kicker}</SectionLabel>
              <h2 className="heading" style={{ fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 20px", color: "#1F2529" }}>{t.cap_spot_heading}</h2>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: "#4A5158", margin: 0 }}>{t.cap_spot_body}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "32px 0 0", display: "grid", gap: 14 }}>
                {t.cap_spot_items.map(item => (
                  <li key={item} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontSize: 14.5, color: "#1F2529", lineHeight: 1.5 }}>
                    <span style={{ width: 18, height: 2, background: "#F05A1A", marginTop: 10, flexShrink: 0 }} /><span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="https://www.magmasoft.de/en/solutions/magma-economics/" target="_blank" rel="noopener noreferrer"
                className="btn-primary" style={{ display: "inline-block", marginTop: 36 }}>
                {t.cap_spot_link}
              </a>
            </div>
            <div style={{ borderRadius: 4, overflow: "hidden", position: "relative", border: "1px solid #E6E8EA" }}>
              <a href="https://www.magmasoft.de/en/solutions/magma-economics/" target="_blank" rel="noopener noreferrer"
                style={{ display: "block", position: "relative" }}
                aria-label="Learn more about MAGMASOFT Economics">
                <img src="images/magma-economics_en.png" alt="MAGMASOFT Economics — cost and CO₂ optimization" loading="lazy"
                  style={{ width: "100%", height: "auto", display: "block" }}
                  onError={e => { e.currentTarget.style.display = "none"; }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(240,90,26,0)", transition: "background 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,90,26,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(240,90,26,0)"; }} />
                <div style={{ position: "absolute", bottom: 16, right: 16, fontSize: 10, fontFamily: "var(--f-mono)", color: "#FFFFFF", letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(240,90,26,0.88)", padding: "6px 12px", borderRadius: 2 }}>
                  magmasoft.de ↗
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAGMAlink — light ── */}
      <section style={{ background: "#F4F5F6", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 0.95fr", gap: mobile ? 32 : 56, alignItems: "center", marginBottom: 48 }}>
            <div>
              <SectionLabel color="#F05A1A">{t.cap_ml_kicker}</SectionLabel>
              <h2 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 16px", color: "#1F2529", maxWidth: 900 }}>
                {t.cap_ml_heading}
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: "#4A5158", margin: 0, maxWidth: 760 }}>
                {t.cap_ml_intro}
              </p>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6E8EA", borderLeft: "4px solid #F05A1A", borderRadius: 4, overflow: "hidden" }}>
              <img src="images/magamlink.png" alt="MAGMAlink workflow diagram" loading="lazy"
                style={{ width: "100%", height: "auto", display: "block" }}
                onError={e => { e.currentTarget.style.display = "none"; }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            {t.cap_ml_items.map((item, mli) => (
              <div key={item.n} className="svc-card" style={{ background: "#FFFFFF", borderLeft: "4px solid #F05A1A", padding: "32px 28px", borderRadius: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, background: "#F4F5F6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={ML_ICONS[mli]} size={19} color="#3A6C8C" />
                  </div>
                  <SectionLabel color="#3A6C8C">{item.n}</SectionLabel>
                </div>
                <h3 className="heading" style={{ fontSize: 20, textTransform: "uppercase", margin: "0 0 10px", color: "#1F2529" }}>{item.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#4A5158", margin: 0 }}>{item.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

// ─── PROCESS ──────────────────────────────────────────────────────────────────
function ProcessPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  const [audience, setAudience] = useState("foundry");
  const steps = audience === "foundry" ? t.process_steps_foundry : t.process_steps_oem;
  return (
    <>
      <PageHeader kicker={t.proc_kicker}
        title={<>{t.proc_title[0]}<br />{t.proc_title[1]}</>}
        lede={t.proc_lede} />

      <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#F05A1A">{t.proc_how_kicker}</SectionLabel>
          <h2 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 32px", color: "#1F2529", maxWidth: 800 }}>
            {t.proc_how_heading}
          </h2>

          {/* Audience tab toggle */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "inline-flex", border: "1px solid #E6E8EA", borderRadius: 4, overflow: "hidden" }}>
              {t.proc_audience_tabs.map(([label, key]) => (
                <button key={key} onClick={() => setAudience(key)} style={{
                  padding: mobile ? "10px 18px" : "12px 28px",
                  background: audience === key ? "#1F2529" : "#FFFFFF",
                  color: audience === key ? "#FFFFFF" : "#4A5158",
                  fontFamily: "var(--f-display)", fontWeight: 700,
                  fontSize: mobile ? 12 : 13, letterSpacing: "0.1em", textTransform: "uppercase",
                  border: "none", borderRight: key === "foundry" ? "1px solid #E6E8EA" : "none",
                  cursor: "pointer", transition: "background 0.2s, color 0.2s",
                }}>{label}</button>
              ))}
            </div>
            <p style={{ fontSize: 15, color: "#4A5158", margin: "14px 0 0", lineHeight: 1.6 }}>
              {audience === "foundry" ? t.proc_foundry_context : t.proc_oem_context}
            </p>
          </div>

          {mobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {steps.map((p, i) => (
                <div key={p.t} style={{ background: "#F4F5F6", borderLeft: "4px solid #F05A1A", borderRadius: 4, padding: "24px 20px", display: "grid", gridTemplateColumns: "48px 1fr", gap: 16, alignItems: "start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F05A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={PROCESS_ICONS[i]} size={22} color="#FFFFFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "#8A9099", letterSpacing: "0.12em", marginBottom: 6 }}>0{i+1}</div>
                    <h3 className="heading" style={{ fontSize: 20, textTransform: "uppercase", margin: "0 0 8px", color: "#1F2529" }}>{p.t}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: "#2D3540", margin: 0 }}>{p.b}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 23, left: "calc(10% + 24px)", right: "calc(10% + 24px)", height: 2, background: "#E6E8EA", zIndex: 0 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {steps.map((p, i) => (
                  <div key={p.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 16px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F05A1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 20, position: "relative", zIndex: 1, boxShadow: "0 0 0 6px #FFFFFF" }}>
                      <Icon name={PROCESS_ICONS[i]} size={22} color="#FFFFFF" />
                    </div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "#8A9099", letterSpacing: "0.12em", marginBottom: 10 }}>0{i+1}</div>
                    <h3 className="heading" style={{ fontSize: 20, textTransform: "uppercase", margin: "0 0 12px", color: "#1F2529" }}>{p.t}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: "#2D3540", margin: 0 }}>{p.b}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {steps.map((p, i) => (
                  <div key={p.t + "d"} style={{ borderTop: "2px solid #F4F5F6", paddingTop: 20, paddingLeft: 16, paddingRight: 16 }}>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4A5158", margin: 0 }}>{p.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <CTABand />
    </>
  );
}

// ─── NEXUS ────────────────────────────────────────────────────────────────────
// Integrated Engineering Platform — landing page for the FOX apps suite.
// The list of apps comes from NEXUS_APPS at the top of this file.
const NEXUS_ACCENTS = {
  orange: { stripe: "#F05A1A", chip: "#F05A1A", chipText: "#FFFFFF", glyphBg: "#1F2529", glyphFg: "#F05A1A" },
  blue:   { stripe: "#3A6C8C", chip: "#3A6C8C", chipText: "#FFFFFF", glyphBg: "#1F2529", glyphFg: "#3A6C8C" },
  steel:  { stripe: "#4A5158", chip: "#4A5158", chipText: "#FFFFFF", glyphBg: "#1F2529", glyphFg: "#FFFFFF" },
};

// Render an app name with the "FOX" suffix in orange, prefix in the base color.
// Case-insensitive match — works for OptiFOX, YieldFOX, EnduraFOX, StatFOX, MeshFOX.
function AppName({ name, baseColor = "#1F2529", foxColor = "#F05A1A" }) {
  const m = /^(.*?)(fox)$/i.exec(name);
  if (!m) return <span style={{ color: baseColor }}>{name}</span>;
  return (
    <>
      <span style={{ color: baseColor }}>{m[1]}</span>
      <span style={{ color: foxColor }}>{m[2]}</span>
    </>
  );
}

function NexusAppCard({ app, idx }) {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  const accent = NEXUS_ACCENTS[app.accent] || NEXUS_ACCENTS.orange;
  const isLive = app.status === "live" || app.status === "beta";
  const statusText = t.nexus_status[app.status] || t.nexus_status.soon;
  const num = "FX/" + String(idx + 1).padStart(2, "0");

  const cardStyle = {
    background: "#FFFFFF",
    border: "1px solid #E6E8EA",
    borderLeft: `4px solid ${accent.stripe}`,
    borderRadius: 4,
    padding: mobile ? "28px 24px" : "32px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    minHeight: 320,
    color: "inherit",
    textDecoration: "none",
    cursor: isLive ? "pointer" : "default",
  };

  const cardInner = (
    <>
      {/* Top row — glyph + status */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 4,
          background: accent.glyphBg, color: accent.glyphFg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--f-display)", fontWeight: 900, fontSize: 28,
          letterSpacing: "0.04em",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {app.logo
            ? <img src={app.logo} alt={app.code + " logo"} loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
                onError={e => {
                  // If the logo file is missing, fall back to the 2-letter glyph
                  const parent = e.currentTarget.parentNode;
                  e.currentTarget.style.display = "none";
                  const fb = document.createElement("span");
                  fb.textContent = app.code.slice(0, 2).toUpperCase();
                  parent.appendChild(fb);
                }} />
            : app.code.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "#8A9099", letterSpacing: "0.12em" }}>{num}</div>
          <div style={{
            marginTop: 8,
            display: "inline-block",
            padding: "4px 10px",
            background: isLive ? accent.chip : "#E6E8EA",
            color: isLive ? accent.chipText : "#4A5158",
            fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 500,
            letterSpacing: "0.12em", textTransform: "uppercase",
            borderRadius: 2,
          }}>{statusText}</div>
        </div>
      </div>

      {/* Name */}
      <div>
        <h3 className="heading" style={{
          fontSize: mobile ? 26 : 30, textTransform: "uppercase",
          margin: 0, letterSpacing: "0.01em",
        }}>
          <AppName name={app.code} baseColor="#1F2529" />
        </h3>
        <div className="label" style={{ color: accent.stripe, marginTop: 8 }}>{app.category}</div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#4A5158", margin: 0, flex: 1 }}>
        {app.description}
      </p>

      {/* Footer — launch affordance */}
      <div style={{ marginTop: 4, paddingTop: 18, borderTop: "1px solid #E6E8EA" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 13,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: isLive ? accent.stripe : "#8A9099",
        }}>
          {isLive ? t.nexus_launch : t.nexus_launch_soon}
        </span>
      </div>
    </>
  );

  return isLive ? (
    <a className="svc-card" href={app.url}
      aria-label={`Launch ${app.code}`}
      style={cardStyle}>
      {cardInner}
    </a>
  ) : (
    <div className="svc-card" style={cardStyle}>
      {cardInner}
    </div>
  );
}

function NexusPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  return (
    <>
      <PageHeader
        kicker={t.nexus_kicker}
        title={<>{t.nexus_title[0]}<br />{t.nexus_title[1]}</>}
        lede={t.nexus_lede}
        secondaryMark="images/nexus-mark.png"
        markOpacity={0.12}
      />

      {/* ── Apps grid ── */}
      <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
            <div>
              <SectionLabel color="#F05A1A">{t.nexus_apps_kicker}</SectionLabel>
              <h2 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 0", color: "#1F2529", maxWidth: 760 }}>
                {t.nexus_apps_heading}
              </h2>
            </div>
            <div className="label" style={{ color: "#8A9099" }}>
              {NEXUS_APPS.length.toString().padStart(2, "0")} / {NEXUS_APPS.length.toString().padStart(2, "0")}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}>
            {NEXUS_APPS.map((app, i) => (
              <NexusAppCard key={app.code} app={app} idx={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow band — dark ── */}
      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1.2fr", gap: mobile ? 32 : 64, alignItems: "start" }}>
            <div>
              <SectionLabel color="#F05A1A">{t.nexus_flow_kicker}</SectionLabel>
              <h2 className="heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", textTransform: "uppercase", margin: "16px 0 16px", maxWidth: 520 }}>
                {t.nexus_flow_heading}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "#8A9099", margin: 0, maxWidth: 520 }}>
                {t.nexus_flow_body}
              </p>
            </div>
            <div style={{
              background: "#161A1D",
              border: "1px solid #363C44",
              borderLeft: "4px solid #F05A1A",
              borderRadius: 4,
              padding: mobile ? "24px 20px" : "32px 36px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {NEXUS_APPS.map((app, i) => {
                  const accent = NEXUS_ACCENTS[app.accent] || NEXUS_ACCENTS.orange;
                  const last = i === NEXUS_APPS.length - 1;
                  return (
                    <div key={app.code} style={{
                      display: "grid",
                      gridTemplateColumns: mobile ? "44px 1fr" : "60px 120px 1fr",
                      gap: mobile ? 12 : 20,
                      alignItems: "center",
                      padding: "16px 0",
                      borderBottom: last ? "none" : "1px solid #363C44",
                    }}>
                      <div style={{
                        fontFamily: "var(--f-mono)", fontSize: 11, color: "#8A9099", letterSpacing: "0.12em",
                      }}>
                        {String(i + 1).padStart(2, "0")} →
                      </div>
                      {!mobile && (
                        <div className="heading" style={{
                          fontSize: 18, textTransform: "uppercase",
                          letterSpacing: "0.02em",
                        }}>
                          <AppName name={app.code} baseColor="#FFFFFF" />
                        </div>
                      )}
                      <div>
                        {mobile && (
                          <div className="heading" style={{ fontSize: 16, textTransform: "uppercase", marginBottom: 4 }}>
                            <AppName name={app.code} baseColor="#FFFFFF" />
                          </div>
                        )}
                        <div style={{ fontSize: 13.5, color: "#FFFFFF", fontWeight: 500 }}>{app.category}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function AboutPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  return (
    <>
      <PageHeader kicker={t.about_kicker} title={t.about_title} lede={t.about_lede}
        secondaryMark="images/norfox-logo-fox-ladle.png" markOpacity={0.05} />

      <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: mobile?"1fr":"340px 1fr", gap: mobile?40:80, alignItems: "start" }}>

            <div style={{ position: mobile?"static":"sticky", top: 120 }}>
              <div style={{ borderRadius: 4, overflow: "hidden", background: "#1F2529", aspectRatio: "3/4", position: "relative" }}>
                <img src="images/me.png" alt="Mostafa Payandeh, Founder of NORFOX"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                  onError={e => { e.currentTarget.style.display = "none"; }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#363C44", fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 9px)", pointerEvents: "none" }}>Photo</div>
              </div>
              <div style={{ marginTop: 20, borderLeft: "3px solid #F05A1A", paddingLeft: 16 }}>
                <div className="heading" style={{ fontSize: 20, textTransform: "uppercase", color: "#1F2529", lineHeight: 1.2 }}>{t.about_founder}</div>
                <div style={{ fontSize: 12, color: "#F05A1A", fontFamily: "var(--f-mono)", marginTop: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.about_role}</div>
              </div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                  <span style={{ color: "#8A9099", minWidth: 96, flexShrink: 0 }}>{t.about_location_label}</span>
                  <span style={{ color: "#1F2529", fontWeight: 500 }}>{t.about_location}</span>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel color="#F05A1A">{t.about_bg_kicker}</SectionLabel>
              <p style={{ fontSize: 20, lineHeight: 1.7, color: "#1F2529", fontWeight: 500, margin: "20px 0 0", maxWidth: 680 }}>{t.about_p1}</p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#4A5158", marginTop: 28 }}>{t.about_p2}</p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#4A5158", marginTop: 20 }}>{t.about_p3}</p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#4A5158", marginTop: 20 }}>{t.about_p4}</p>
              <div style={{ marginTop: 48 }}>
                <SectionLabel color="#F05A1A">{t.about_cred_kicker}</SectionLabel>
                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: mobile?"1fr":"1fr 1fr", gap: 14 }}>
                  {t.about_creds.map(c => (
                    <div key={c.label} style={{ borderLeft: "3px solid #F05A1A", paddingLeft: 16, paddingTop: 2, paddingBottom: 2 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1F2529", lineHeight: 1.3 }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: "#8A9099", marginTop: 4 }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: 100, paddingBottom: 100 }}>
        <div className="container">
          <SectionLabel color="#F05A1A">{t.about_principle_kicker}</SectionLabel>
          <blockquote style={{ margin: "24px 0 0", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: "clamp(28px, 4.4vw, 56px)", lineHeight: 1.15, letterSpacing: "0.01em", textTransform: "uppercase", maxWidth: 1100 }}>
            {t.about_quote[0]}<span style={{ color: "#F05A1A" }}>{t.about_quote[1]}</span>{t.about_quote[2]}
            <cite style={{ display: "block", fontSize: 13, fontFamily: "var(--f-body)", fontWeight: 400, color: "#8A9099", letterSpacing: "0.12em", marginTop: 24, fontStyle: "normal" }}>
              {t.about_cite}
            </cite>
          </blockquote>
        </div>
      </section>
      <CTABand />
    </>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function ContactPage() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  const [s, setS] = useState({ name:"", company:"", email:"", topic:t.contact_topics[0], message:"" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setS(p => ({ ...p, topic: t.contact_topics[0] })); }, [lang]);
  const set = k => e => setS(p => ({ ...p, [k]: e.target.value }));
  const sendMail = e => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim());
    if (!s.name.trim() || !s.email.trim() || !s.message.trim()) {
      setError(t.contact_error_required);
      return;
    }
    if (!emailOk) {
      setError(t.contact_error_email);
      return;
    }
    setError("");
    const body = [
      `Name: ${s.name}`,
      `Company: ${s.company || "-"}`,
      `Email: ${s.email}`,
      `Topic: ${s.topic}`,
      "",
      "Message:",
      s.message,
    ].join("\n");
    window.location.href = `mailto:info@norfox.se?subject=${encodeURIComponent(t.contact_mail_subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };
  const focusRing = { onFocus: e => { e.currentTarget.style.outline = "2px solid #F05A1A"; }, onBlur: e => { e.currentTarget.style.outline = "none"; } };
  const inputStyle = { width: "100%", marginTop: 6, background: "transparent", border: "none", color: "#FFFFFF", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 22 };

  return (
    <>
      <PageHeader kicker={t.contact_kicker} title={t.contact_title} lede={t.contact_lede} />
      <section style={{ background: "#1F2529", color: "#FFFFFF", paddingTop: 60, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: mobile?"1fr":"1fr 1fr", gap: mobile?48:80 }}>
            <div>
              <SectionLabel color="#F05A1A">{t.contact_direct_kicker}</SectionLabel>
              <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: mobile?"1fr":"1fr 1fr", gap: 24, maxWidth: 480 }}>
                {t.contact_info.map(([k,v], ci) => (
                  <div key={k}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Icon name={CONTACT_ICONS[ci]} size={13} color="#8A9099" />
                      <SectionLabel color="#8A9099">{k}</SectionLabel>
                    </div>
                    <div style={{ fontFamily: "var(--f-display)", fontSize: mobile?14:18, marginTop: 2, wordBreak: "break-word" }}>
                      {v.includes("@")
                        ? <a href={"mailto:" + v} style={{ color: "inherit", textDecoration: "underline" }}>{v}</a>
                        : /^[\+\d][\d\s\-\(\)\.]+$/.test(v)
                          ? <a href={"tel:" + v.replace(/[\s\-\(\)]/g, "")} style={{ color: "inherit", textDecoration: "underline" }}>{v}</a>
                          : v}
                    </div>
                  </div>
                ))}
              </div>
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
                style={{ marginTop: 36, display: "inline-flex", alignItems: "center", gap: 16, background: "#0A66C2", color: "#FFFFFF", borderRadius: 4, padding: "18px 30px", fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <img src="images/linked.png" alt="" loading="lazy" style={{ width: 38, height: 38, objectFit: "contain", display: "block" }} />
                {t.linkedin_label} →
              </a>
            </div>

            <form onSubmit={sendMail} style={{ borderTop: "1px solid #363C44" }} noValidate>
              {sent ? (
                <div style={{ padding: "40px 0" }}>
                  <SectionLabel color="#F05A1A">{t.contact_sent_kicker}</SectionLabel>
                  <div className="heading" style={{ fontSize: 28, marginTop: 16, textTransform: "uppercase" }}>
                    {t.contact_sent_thanks} {s.name || t.contact_sent_engineer}.<br />{t.contact_sent_body}
                  </div>
                </div>
              ) : (
                <>
                  {t.contact_fields.map(([k,l,ftype]) => (
                    <label key={k} htmlFor={"cf-"+k} style={{ padding: "18px 0", borderBottom: "1px solid #363C44", display: "block" }}>
                      <SectionLabel color="#8A9099">{l}</SectionLabel>
                      <input id={"cf-"+k} name={k} type={ftype} value={s[k]} onChange={set(k)} required={k !== "company"} {...focusRing} style={inputStyle} />
                    </label>
                  ))}
                  <div style={{ padding: "18px 0", borderBottom: "1px solid #363C44" }}>
                    <SectionLabel color="#8A9099">{t.contact_topic_label}</SectionLabel>
                    <div role="group" aria-label="Select a topic" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {t.contact_topics.map(topic => (
                        <button type="button" key={topic} aria-pressed={s.topic===topic} onClick={() => setS(p => ({ ...p, topic }))}
                          style={{ padding: "8px 14px", fontFamily: "var(--f-body)", fontSize: 12, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", borderRadius: 4, border: "1px solid "+(s.topic===topic?"#F05A1A":"#363C44"), background: s.topic===topic?"#F05A1A":"transparent", color: "#FFFFFF" }}>{topic}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "18px 0", borderBottom: "1px solid #363C44" }}>
                    <label htmlFor="cf-message"><SectionLabel color="#8A9099">{t.contact_message_label}</SectionLabel></label>
                    <textarea id="cf-message" name="message" value={s.message} onChange={set("message")} rows={3} required {...focusRing}
                      style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: "#FFFFFF", fontFamily: "var(--f-body)", fontSize: 16, resize: "vertical" }} />
                  </div>
                  {error && <div role="alert" style={{ marginTop: 18, color: "#FFFFFF", background: "rgba(240,90,26,0.18)", borderLeft: "4px solid #F05A1A", padding: "12px 14px", fontSize: 13.5, lineHeight: 1.5 }}>{error}</div>}
                  <button type="submit" className="btn-primary" style={{ marginTop: 28 }}>{t.contact_send}</button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const mobile = useMobile();
  const { lang } = useLang();
  const t = T[lang];
  return (
    <footer style={{ background: "#161A1D", color: "#FFFFFF", paddingTop: 56, paddingBottom: 0, borderTop: "1px solid #363C44" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: mobile?"1fr":"1fr 1fr 1fr", gap: mobile?36:48 }}>
          <div>
            <Logo dark size={120} />
            <p style={{ fontSize: 13, color: "#8A9099", marginTop: 20, maxWidth: 320, lineHeight: 1.6 }}>{t.footer_tagline}</p>
          </div>
          <div>
            <SectionLabel color="#8A9099">{t.footer_contact}</SectionLabel>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
              <li style={{ fontSize: 14 }}><a href="#/contact">{t.footer_nav_contact}</a></li>
              <li style={{ fontSize: 14 }}><a href="mailto:mostafa.payandeh@norfox.se" style={{ color: "#8A9099" }}>mostafa.payandeh@norfox.se</a></li>
              <li style={{ fontSize: 14 }}><a href="mailto:info@norfox.se" style={{ color: "#8A9099" }}>info@norfox.se</a></li>
              <li style={{ fontSize: 14 }}><a href="tel:+46762844244" style={{ color: "#8A9099" }}>+46 76 284 4244</a></li>
              <li style={{ fontSize: 14 }}><a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#8A9099", display: "inline-flex", alignItems: "center", gap: 9 }}><img src="images/linked.png" alt="" loading="lazy" style={{ width: 24, height: 24, objectFit: "contain", display: "block" }} />LinkedIn</a></li>
            </ul>
          </div>
          <div style={{ position: "relative" }}>
            <SectionLabel color="#8A9099">{t.footer_region}</SectionLabel>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
              {t.footer_countries.map(c => <li key={c} style={{ fontSize: 14, color: "#8A9099" }}>{c}</li>)}
            </ul>
            <img src="images/nordic_map.png" alt="Nordic region map" loading="lazy"
              style={{ position: "absolute", bottom: -60, right: -30, width: 300, height: "auto", opacity: 0.2, pointerEvents: "none", zIndex: 0 }} />
          </div>
        </div>
      </div>
      <div style={{ background: "#0F1215", marginTop: 56, padding: "20px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span className="label" style={{ color: "#8A9099" }}>{t.footer_copyright}</span>
          <span className="label" style={{ color: "#8A9099" }}>{t.footer_tagline_bottom[0]} <span style={{ color: "#F05A1A" }}>{t.footer_tagline_bottom[1]}</span></span>
        </div>
      </div>
    </footer>
  );
}

// ─── App — provides MobileContext + LangContext so all components share state ──
function App() {
  const route = useHashRoute();
  const mobile = useIsMobile();
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem("norfox-lang") || "en"; } catch { return "en"; }
  });
  const setLang = l => {
    setLangState(l);
    try { localStorage.setItem("norfox-lang", l); } catch {}
  };

  let page;
  switch (route) {
    case "solutions":    page = <ServicesPage />;     break;
    case "magmasoft":    page = <MagmasoftPage />;    break;
    case "academy":      page = <AcademyPage />;      break;
    case "capabilities": page = <CapabilitiesPage />; break;
    case "process":      page = <ProcessPage />;      break;
    case "nexus":        page = <NexusPage />;        break;
    case "about":        page = <AboutPage />;        break;
    case "contact":      page = <ContactPage />;      break;
    default:             page = <HomePage />;
  }

  return (
    <MobileContext.Provider value={mobile}>
      <LangContext.Provider value={{ lang, setLang }}>
        <Nav route={route} />
        {page}
        <Footer />
      </LangContext.Provider>
    </MobileContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

