<?php get_header(); ?>

<!-- HERO (full-bleed) -->
<section class="hero">
  <div class="hero-bg">
    <div class="hero-slide active">
      <img src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=2400&h=1400&q=85" alt="Aerial view of fleet terminal at golden hour" loading="eager">
    </div>
  </div>
  <div class="hero-slide hero-slide--laptop">
      <svg viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%">
        <defs>
          <linearGradient id="nb-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0052cc"/>
            <stop offset="100%" stop-color="#003494"/>
          </linearGradient>
          <linearGradient id="nb-silver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e8eaed"/>
            <stop offset="50%" stop-color="#d2d5db"/>
            <stop offset="100%" stop-color="#b0b5be"/>
          </linearGradient>
          <linearGradient id="nb-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d2d5db"/>
            <stop offset="100%" stop-color="#9da3ae"/>
          </linearGradient>
          <linearGradient id="nb-route" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0"/>
            <stop offset="100%" stop-color="#2563eb" stop-opacity="1"/>
          </linearGradient>
          <filter id="nb-card-shadow"><feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#00000033"/></filter>
        </defs>

        <!-- ── BACKGROUND ── -->
        <rect width="1440" height="900" fill="url(#nb-bg)"/>
        <!-- Decorative circles -->
        <circle cx="180" cy="200" r="320" fill="white" opacity="0.04"/>
        <circle cx="1300" cy="700" r="280" fill="white" opacity="0.04"/>
        <circle cx="900" cy="450" r="600" fill="white" opacity="0.03"/>

        <!-- ── LAPTOP LID ── -->
        <rect x="490" y="68" width="820" height="560" rx="18" fill="url(#nb-silver)"/>
        <!-- lid edge shadow -->
        <rect x="490" y="68" width="820" height="3" rx="1.5" fill="white" opacity="0.5"/>
        <rect x="490" y="625" width="820" height="3" rx="1.5" fill="#8a9099" opacity="0.6"/>

        <!-- Screen bezel -->
        <rect x="506" y="84" width="788" height="528" rx="10" fill="#18181b"/>

        <!-- ── SCREEN ── -->
        <rect x="518" y="96" width="764" height="504" rx="8" fill="#f8fafc"/>

        <!-- Camera -->
        <circle cx="900" cy="76" r="5.5" fill="#0e0e10"/>
        <circle cx="900" cy="76" r="2.5" fill="#050508"/>
        <circle cx="901.5" cy="74.5" r="1" fill="rgba(255,255,255,0.12)"/>

        <!-- ── APP TOP BAR (y=96 to y=134) ── -->
        <rect x="518" y="96" width="764" height="38" rx="8" fill="white"/>
        <rect x="518" y="114" width="764" height="20" fill="white"/>
        <rect x="518" y="133" width="764" height="1" fill="#e2e8f0"/>
        <!-- macOS-style dots -->
        <circle cx="540" cy="115" r="6" fill="#ff5f57"/>
        <circle cx="560" cy="115" r="6" fill="#febc2e"/>
        <circle cx="580" cy="115" r="6" fill="#28c840"/>
        <!-- brand -->
        <text x="605" y="120" fill="#0041a8" font-size="12.5" font-family="Lexend" font-weight="700" letter-spacing="-0.02em">EnVue Fleet Live</text>
        <!-- nav -->
        <rect x="708" y="101" width="68" height="26" rx="6" fill="#eff6ff"/>
        <text x="742" y="119" fill="#2563eb" font-size="10" font-family="Lexend" font-weight="600" text-anchor="middle">Live Map</text>
        <text x="795" y="119" fill="#94a3b8" font-size="10" font-family="Lexend">Assets</text>
        <text x="845" y="119" fill="#94a3b8" font-size="10" font-family="Lexend">Alerts</text>
        <text x="895" y="119" fill="#94a3b8" font-size="10" font-family="Lexend">Reports</text>
        <!-- status chips -->
        <rect x="1000" y="102" width="86" height="22" rx="11" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
        <circle cx="1013" cy="113" r="3.5" fill="#16a34a"/>
        <text x="1021" y="117" fill="#15803d" font-size="8.5" font-family="Lexend" font-weight="600">142 Moving</text>
        <rect x="1098" y="102" width="60" height="22" rx="11" fill="#fef2f2" stroke="#fecaca" stroke-width="1"/>
        <circle cx="1108" cy="113" r="3" fill="#dc2626"/>
        <text x="1114" y="117" fill="#dc2626" font-size="8.5" font-family="Lexend" font-weight="600">2 Alerts</text>

        <!-- ── SIDEBAR (x=518-690, y=134-566) ── -->
        <rect x="518" y="134" width="172" height="432" fill="#f8fafc"/>
        <rect x="690" y="134" width="1" height="432" fill="#e2e8f0"/>
        <text x="528" y="154" fill="#94a3b8" font-size="8" font-family="Lexend" font-weight="700" letter-spacing="0.1em">FLEET ASSETS</text>
        <rect x="526" y="160" width="156" height="22" rx="5" fill="white" stroke="#e2e8f0" stroke-width="1"/>
        <text x="538" y="174" fill="#cbd5e1" font-size="8.5" font-family="Lexend">Search assets&#8230;</text>

        <!-- VRow 1 selected -->
        <rect x="519" y="188" width="170" height="40" rx="5" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
        <circle cx="534" cy="208" r="8" fill="#dbeafe"/><circle cx="534" cy="208" r="5.5" fill="#2563eb"/>
        <polygon points="534,203.5 537.5,211 530.5,211" fill="white"/>
        <text x="547" y="204" fill="#1e40af" font-size="9.5" font-family="Lexend" font-weight="600">Truck #1042</text>
        <text x="547" y="216" fill="#64748b" font-size="7.5" font-family="Lexend">58 mph · I-20 West</text>
        <rect x="658" y="197" width="26" height="12" rx="6" fill="#dcfce7"/>
        <text x="671" y="207" fill="#16a34a" font-size="7" font-family="Lexend" font-weight="600" text-anchor="middle">On</text>

        <!-- VRow 2 -->
        <rect x="519" y="232" width="170" height="38" rx="5" fill="transparent"/>
        <circle cx="534" cy="251" r="7.5" fill="#dcfce7"/><circle cx="534" cy="251" r="5" fill="#16a34a"/>
        <polygon points="534,246.5 537,253.5 531,253.5" fill="white"/>
        <text x="547" y="247" fill="#334155" font-size="9.5" font-family="Lexend" font-weight="500">Van #0387</text>
        <text x="547" y="259" fill="#94a3b8" font-size="7.5" font-family="Lexend">42 mph · Hwy 80</text>
        <rect x="658" y="241" width="26" height="12" rx="6" fill="#dcfce7"/>
        <text x="671" y="251" fill="#16a34a" font-size="7" font-family="Lexend" font-weight="600" text-anchor="middle">On</text>

        <!-- VRow 3 alert -->
        <rect x="519" y="274" width="170" height="38" rx="5" fill="#fef2f2" stroke="#fecaca" stroke-width="1"/>
        <circle cx="534" cy="293" r="7.5" fill="#fee2e2"/><circle cx="534" cy="293" r="5" fill="#dc2626"/>
        <text x="534" y="297" fill="white" font-size="9" font-family="Lexend" font-weight="900" text-anchor="middle">!</text>
        <text x="547" y="289" fill="#334155" font-size="9.5" font-family="Lexend" font-weight="500">Truck #1108</text>
        <text x="547" y="301" fill="#dc2626" font-size="7.5" font-family="Lexend">84 mph — Speeding</text>
        <rect x="651" y="283" width="34" height="12" rx="6" fill="#fee2e2"/>
        <text x="668" y="293" fill="#dc2626" font-size="7" font-family="Lexend" font-weight="600" text-anchor="middle">Alert</text>

        <!-- VRow 4 -->
        <rect x="519" y="316" width="170" height="38" rx="5" fill="transparent"/>
        <circle cx="534" cy="335" r="7.5" fill="#fef3c7"/><circle cx="534" cy="335" r="5" fill="#d97706"/>
        <rect x="530.5" y="331.5" width="7" height="7" rx="1.5" fill="white"/>
        <text x="547" y="331" fill="#334155" font-size="9.5" font-family="Lexend" font-weight="500">Truck #0991</text>
        <text x="547" y="343" fill="#94a3b8" font-size="7.5" font-family="Lexend">Idle · Job Site A</text>
        <rect x="655" y="325" width="30" height="12" rx="6" fill="#fef3c7"/>
        <text x="670" y="335" fill="#d97706" font-size="7" font-family="Lexend" font-weight="600" text-anchor="middle">Idle</text>

        <!-- VRow 5 -->
        <rect x="519" y="358" width="170" height="38" rx="5" fill="transparent"/>
        <circle cx="534" cy="377" r="7.5" fill="#dbeafe"/><circle cx="534" cy="377" r="5" fill="#3b82f6"/>
        <polygon points="534,372.5 537,379.5 531,379.5" fill="white"/>
        <text x="547" y="373" fill="#334155" font-size="9.5" font-family="Lexend" font-weight="500">Pickup #0214</text>
        <text x="547" y="385" fill="#94a3b8" font-size="7.5" font-family="Lexend">67 mph · I-20 East</text>
        <rect x="658" y="367" width="26" height="12" rx="6" fill="#dcfce7"/>
        <text x="671" y="377" fill="#16a34a" font-size="7" font-family="Lexend" font-weight="600" text-anchor="middle">On</text>

        <!-- VRow 6 -->
        <rect x="519" y="400" width="170" height="38" rx="5" fill="transparent"/>
        <circle cx="534" cy="419" r="7.5" fill="#dcfce7"/><circle cx="534" cy="419" r="5" fill="#16a34a"/>
        <polygon points="534,414.5 537,421.5 531,421.5" fill="white"/>
        <text x="547" y="415" fill="#334155" font-size="9.5" font-family="Lexend" font-weight="500">Van #0553</text>
        <text x="547" y="427" fill="#94a3b8" font-size="7.5" font-family="Lexend">51 mph · Loop 281</text>
        <rect x="658" y="409" width="26" height="12" rx="6" fill="#dcfce7"/>
        <text x="671" y="419" fill="#16a34a" font-size="7" font-family="Lexend" font-weight="600" text-anchor="middle">On</text>

        <!-- ── LIGHT MAP (x=691-1282, y=134-566) ── -->
        <rect x="691" y="134" width="591" height="432" fill="#f1f5f9"/>
        <!-- Water -->
        <ellipse cx="1180" cy="460" rx="100" ry="60" fill="#bfdbfe" opacity="0.7"/>
        <text x="1180" y="464" fill="#93c5fd" font-size="7" font-family="Lexend" text-anchor="middle" font-style="italic">Lake Longview</text>
        <!-- Parks -->
        <rect x="750" y="145" width="70" height="45" rx="3" fill="#d1fae5" opacity="0.8"/>
        <rect x="920" y="148" width="55" height="40" rx="3" fill="#d1fae5" opacity="0.8"/>
        <!-- City blocks -->
        <rect x="700" y="145" width="44" height="38" rx="2" fill="#e2e8f0"/>
        <rect x="834" y="143" width="80" height="44" rx="2" fill="#e2e8f0"/>
        <rect x="985" y="145" width="60" height="40" rx="2" fill="#e2e8f0"/>
        <rect x="1060" y="143" width="72" height="44" rx="2" fill="#e2e8f0"/>
        <rect x="700" y="266" width="50" height="52" rx="2" fill="#e2e8f0"/>
        <rect x="770" y="262" width="62" height="56" rx="2" fill="#e2e8f0"/>
        <rect x="850" y="268" width="55" height="50" rx="2" fill="#e2e8f0"/>
        <rect x="985" y="265" width="60" height="53" rx="2" fill="#e2e8f0"/>
        <rect x="1060" y="263" width="68" height="55" rx="2" fill="#e2e8f0"/>
        <rect x="700" y="378" width="56" height="52" rx="2" fill="#e2e8f0"/>
        <rect x="776" y="380" width="60" height="50" rx="2" fill="#e2e8f0"/>
        <rect x="856" y="376" width="58" height="54" rx="2" fill="#e2e8f0"/>
        <!-- Major roads (horizontal) -->
        <rect x="691" y="198" width="591" height="12" fill="#cbd5e1"/>
        <rect x="691" y="201" width="591" height="6" fill="#e2e8f0"/>
        <rect x="691" y="318" width="591" height="14" fill="#cbd5e1"/>
        <rect x="691" y="322" width="591" height="7" fill="#e2e8f0"/>
        <rect x="691" y="440" width="591" height="10" fill="#cbd5e1"/>
        <!-- Major roads (vertical) -->
        <rect x="920" y="134" width="12" height="432" fill="#cbd5e1"/>
        <rect x="923" y="134" width="6" height="432" fill="#e2e8f0"/>
        <rect x="1110" y="134" width="10" height="432" fill="#cbd5e1"/>
        <rect x="1113" y="134" width="5" height="432" fill="#e2e8f0"/>
        <!-- Minor roads -->
        <line x1="691" y1="170" x2="1282" y2="170" stroke="#e8edf2" stroke-width="2"/>
        <line x1="691" y1="260" x2="1282" y2="260" stroke="#e8edf2" stroke-width="2"/>
        <line x1="691" y1="390" x2="1282" y2="390" stroke="#e8edf2" stroke-width="2"/>
        <line x1="691" y1="500" x2="1282" y2="500" stroke="#e8edf2" stroke-width="2"/>
        <line x1="800" y1="134" x2="800" y2="566" stroke="#e8edf2" stroke-width="2"/>
        <line x1="1020" y1="134" x2="1020" y2="566" stroke="#e8edf2" stroke-width="2"/>
        <line x1="1200" y1="134" x2="1200" y2="566" stroke="#e8edf2" stroke-width="2"/>
        <!-- Road labels -->
        <text x="712" y="326" fill="#94a3b8" font-size="6.5" font-family="Lexend" font-weight="700">I-20 W</text>
        <text x="1140" y="326" fill="#94a3b8" font-size="6.5" font-family="Lexend" font-weight="700">I-20 E</text>
        <text x="926" y="158" fill="#94a3b8" font-size="6" font-family="Lexend" font-weight="700" transform="rotate(-90,926,158)">Loop 281</text>
        <!-- Route trail -->
        <path d="M712,322 C780,319 840,317 920,316 C1000,315 1060,313 1110,312" fill="none" stroke="url(#nb-route)" stroke-width="3"/>
        <path d="M712,322 C780,319 840,317 920,316 C1000,315 1060,313 1110,312" fill="none" stroke="#2563eb" stroke-width="1.5" opacity="0.25"/>
        <!-- Geofence -->
        <circle cx="926" cy="498" r="34" fill="rgba(139,92,246,0.06)" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="6,4"/>
        <text x="926" y="540" fill="#8b5cf6" font-size="6.5" font-family="Lexend" font-weight="600" text-anchor="middle">Depot Zone</text>
        <!-- TRK-1042 selected -->
        <circle cx="1110" cy="312" r="18" fill="#dbeafe"/>
        <circle cx="1110" cy="312" r="11" fill="#2563eb"/>
        <circle cx="1110" cy="312" r="10" fill="none" stroke="#93c5fd" stroke-width="2"/>
        <polygon points="1110,306.5 1114,314.5 1106,314.5" fill="white"/>
        <rect x="1062" y="280" width="96" height="24" rx="6" fill="white" stroke="#bfdbfe" stroke-width="1.5" filter="url(#nb-card-shadow)"/>
        <polygon points="1106,304 1110,310 1114,304" fill="white"/>
        <text x="1110" y="290" fill="#1e40af" font-size="7" font-family="Lexend" text-anchor="middle" font-weight="700">TRK-1042 · 58 mph</text>
        <text x="1110" y="299" fill="#64748b" font-size="6" font-family="Lexend" text-anchor="middle">I-20 W · R. Torres</text>
        <!-- VAN-0387 -->
        <circle cx="780" cy="203" r="13" fill="#dcfce7"/>
        <circle cx="780" cy="203" r="8.5" fill="#16a34a"/>
        <circle cx="780" cy="203" r="7.5" fill="none" stroke="#86efac" stroke-width="1.5"/>
        <polygon points="780,198.5 783,206 777,206" fill="white"/>
        <text x="780" y="190" fill="#15803d" font-size="6" font-family="Lexend" text-anchor="middle" font-weight="700">VAN-0387</text>
        <!-- TRK-1108 alert -->
        <circle cx="740" cy="325" r="14" fill="#fee2e2"/>
        <circle cx="740" cy="325" r="9" fill="#dc2626"/>
        <circle cx="740" cy="325" r="8.5" fill="none" stroke="#fca5a5" stroke-width="1.5"/>
        <text x="740" y="329" fill="white" font-size="10" font-family="Lexend" font-weight="900" text-anchor="middle">!</text>
        <rect x="700" y="305" width="80" height="14" rx="4" fill="#fef2f2" stroke="#fecaca" stroke-width="1"/>
        <text x="740" y="315" fill="#dc2626" font-size="6" font-family="Lexend" font-weight="700" text-anchor="middle">&#9888; 84mph SPEEDING</text>
        <!-- TRK-0991 idle -->
        <circle cx="926" cy="478" r="12" fill="#fef3c7"/>
        <circle cx="926" cy="478" r="7.5" fill="#d97706"/>
        <rect x="922.5" y="474.5" width="7" height="7" rx="1.5" fill="white"/>
        <text x="926" y="466" fill="#d97706" font-size="5.5" font-family="Lexend" text-anchor="middle" font-weight="700">IDLE</text>
        <!-- PKP-0214 -->
        <circle cx="1020" cy="322" r="11" fill="#dbeafe"/>
        <circle cx="1020" cy="322" r="7" fill="#3b82f6"/>
        <polygon points="1020,317.5 1023,324.5 1017,324.5" fill="white"/>
        <text x="1020" y="309" fill="#2563eb" font-size="5.5" font-family="Lexend" text-anchor="middle" font-weight="700">PKP-0214</text>

        <!-- ── STATS BAR (y=566-600) ── -->
        <rect x="518" y="566" width="764" height="34" fill="white"/>
        <rect x="518" y="566" width="764" height="1" fill="#e2e8f0"/>
        <text x="556" y="580" fill="#16a34a" font-size="14" font-family="Lexend" font-weight="800">142</text>
        <text x="556" y="592" fill="#94a3b8" font-size="7" font-family="Lexend">Active</text>
        <line x1="614" y1="571" x2="614" y2="595" stroke="#e2e8f0" stroke-width="1"/>
        <text x="630" y="580" fill="#d97706" font-size="14" font-family="Lexend" font-weight="800">8</text>
        <text x="630" y="592" fill="#94a3b8" font-size="7" font-family="Lexend">Idling</text>
        <line x1="672" y1="571" x2="672" y2="595" stroke="#e2e8f0" stroke-width="1"/>
        <text x="688" y="580" fill="#dc2626" font-size="14" font-family="Lexend" font-weight="800">2</text>
        <text x="688" y="592" fill="#94a3b8" font-size="7" font-family="Lexend">Alerts</text>
        <line x1="720" y1="571" x2="720" y2="595" stroke="#e2e8f0" stroke-width="1"/>
        <text x="736" y="580" fill="#2563eb" font-size="14" font-family="Lexend" font-weight="800">58</text>
        <text x="754" y="580" fill="#2563eb" font-size="7" font-family="Lexend"> mph avg</text>
        <text x="736" y="592" fill="#94a3b8" font-size="7" font-family="Lexend">Fleet Speed</text>
        <line x1="820" y1="571" x2="820" y2="595" stroke="#e2e8f0" stroke-width="1"/>
        <text x="836" y="580" fill="#8b5cf6" font-size="14" font-family="Lexend" font-weight="800">4</text>
        <text x="836" y="592" fill="#94a3b8" font-size="7" font-family="Lexend">Geofences</text>
        <line x1="876" y1="571" x2="876" y2="595" stroke="#e2e8f0" stroke-width="1"/>
        <text x="892" y="580" fill="#334155" font-size="14" font-family="Lexend" font-weight="800">152</text>
        <text x="892" y="592" fill="#94a3b8" font-size="7" font-family="Lexend">Total Assets</text>

        <!-- ── LAPTOP BASE ── -->
        <rect x="460" y="628" width="880" height="16" rx="8" fill="url(#nb-base)"/>
        <path d="M406 644 C384 644 372 656 372 672 L376 740 C376 752 384 758 394 758 L1406 758 C1416 758 1424 752 1424 740 L1428 672 C1428 656 1416 644 1394 644 Z" fill="url(#nb-base)"/>
        <!-- Key rows -->
        <rect x="444" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="462" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="480" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="498" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="516" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="534" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="552" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="570" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="588" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="606" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="624" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="642" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="660" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="678" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="696" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="714" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="732" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="750" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="768" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="786" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="804" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="822" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="840" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="858" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="876" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="894" y="656" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="448" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="466" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="484" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="502" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="520" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="538" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="556" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="574" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="592" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="610" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="628" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="646" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="664" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="682" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="700" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="718" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="736" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="754" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="772" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="790" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <rect x="808" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/><rect x="826" y="670" width="12" height="8" rx="2" fill="#c8cbd1"/>
        <!-- Spacebar -->
        <rect x="570" y="708" width="360" height="10" rx="5" fill="#c8cbd1"/>
        <!-- Touchpad -->
        <rect x="756" y="684" width="160" height="46" rx="8" fill="#c2c6cd"/>
        <rect x="757" y="685" width="158" height="44" rx="7" fill="none" stroke="#b8bcc3" stroke-width="1"/>

        <!-- ── FLOATING CARDS (outside laptop) ── -->
        <!-- Left stat card -->
        <rect x="48" y="280" width="200" height="110" rx="14" fill="white" filter="url(#nb-card-shadow)"/>
        <rect x="48" y="280" width="200" height="110" rx="14" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        <text x="68" y="306" fill="#64748b" font-size="9" font-family="Lexend" font-weight="700" letter-spacing="0.08em">LIVE FLEET STATUS</text>
        <circle cx="68" cy="302" r="4" fill="#16a34a"/>
        <text x="68" y="332" fill="#0f172a" font-size="28" font-family="Lexend" font-weight="800">142</text>
        <text x="100" y="332" fill="#64748b" font-size="12" font-family="Lexend" font-weight="500"> vehicles</text>
        <text x="68" y="350" fill="#94a3b8" font-size="9" font-family="Lexend">active right now</text>
        <rect x="68" y="360" width="50" height="20" rx="10" fill="#dcfce7"/>
        <text x="93" y="374" fill="#15803d" font-size="8.5" font-family="Lexend" font-weight="600" text-anchor="middle">Moving</text>
        <rect x="126" y="360" width="36" height="20" rx="10" fill="#fef3c7"/>
        <text x="144" y="374" fill="#d97706" font-size="8.5" font-family="Lexend" font-weight="600" text-anchor="middle">Idle</text>

        <!-- Right alert card -->
        <rect x="1282" y="340" width="148" height="130" rx="14" fill="white" filter="url(#nb-card-shadow)"/>
        <rect x="1282" y="340" width="148" height="4" rx="2" fill="#dc2626"/>
        <rect x="1282" y="344" width="148" height="126" rx="12" fill="white"/>
        <text x="1302" y="365" fill="#dc2626" font-size="8.5" font-family="Lexend" font-weight="700" letter-spacing="0.06em">&#9888; ALERT</text>
        <text x="1302" y="384" fill="#0f172a" font-size="11" font-family="Lexend" font-weight="700">Truck #1108</text>
        <text x="1302" y="400" fill="#64748b" font-size="8.5" font-family="Lexend">Speeding detected</text>
        <text x="1302" y="416" fill="#64748b" font-size="8.5" font-family="Lexend">84 mph on FM 1845</text>
        <rect x="1302" y="428" width="108" height="28" rx="8" fill="#dc2626"/>
        <text x="1356" y="446" fill="white" font-size="9.5" font-family="Lexend" font-weight="600" text-anchor="middle">View on Map</text>
      </svg>
    </div>
    <div class="hero-slide" style="z-index:-2">
      <img src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=2400&h=1400&q=85" alt="Fleet of trucks on the highway" loading="lazy">
    </div>
  <div class="hero-scrim"></div>
  <div class="hero-grid"></div>

  <div class="hero-dots">
    <button class="hero-dot active" data-slide="0" aria-label="Slide 1"></button>
    <button class="hero-dot" data-slide="1" aria-label="Slide 2"></button>
    <button class="hero-dot" data-slide="2" aria-label="Slide 3"></button>
  </div>

  <div class="hero-content">
    <div class="hero-eyebrow">
      <span class="hero-eyebrow-dot"></span>
      Powered by Geotab &middot; 300+ Integrations
    </div>
    <h1>Smarter Fleet<br><span class="hero-h1-accent">Management.</span></h1>
    <p class="hero-sub">Lower risk, control operating costs, and boost productivity with leading-edge solutions.</p>
    <div class="hero-ctas">
      <a href="<?php echo esc_url(home_url('/#demo')); ?>" class="btn btn-primary btn-lg">Get a Free Demo</a>
      <a href="<?php echo esc_url(home_url('/results/')); ?>" class="btn btn-glass btn-lg">See the ROI<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:6px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
    </div>
  </div>

  <div class="hero-strip">
    <div class="hero-strip-inner">
      <div class="hstat">
        <div class="hstat-num"><span class="cu" data-t="31">0</span>%</div>
        <div class="hstat-label">Fewer reportable accidents</div>
      </div>
      <div class="hstat">
        <div class="hstat-num"><span class="cu" data-t="7">0</span>%</div>
        <div class="hstat-label">Fuel economy improvement</div>
      </div>
      <div class="hstat">
        <div class="hstat-num"><span class="cu" data-t="40">0</span>%</div>
        <div class="hstat-label">Dispatch efficiency gain</div>
      </div>
      <div class="hstat">
        <div class="hstat-num"><span class="cu" data-t="300">0</span>+</div>
        <div class="hstat-label">Software integrations</div>
      </div>
      <div class="hstat hstat--badge">
        <div class="hstat-live"><span class="hstat-live-dot"></span> Live</div>
        <div class="hstat-label">142 vehicles active right now</div>
      </div>
    </div>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <span class="trust-label">Trusted across</span>
  <div class="trust-pills">
    <span class="trust-pill">Construction</span>
    <span class="trust-pill">Trucking &amp; Transportation</span>
    <span class="trust-pill">Oil &amp; Gas</span>
    <span class="trust-pill">Field Services</span>
    <span class="trust-pill">Government</span>
    <span class="trust-pill">Leasing &amp; Rental</span>
  </div>
</div>

<!-- FEATURE SPLITS -->
<div class="feat-wrapper" id="platform">

  <!-- Dashcam -->
  <div class="feat-split fade-in">
    <div class="feat-photo">
      <img src="https://images.unsplash.com/photo-1744884275743-4b075af04f62?auto=format&fit=crop&w=900&h=700&q=85" alt="AI dashcam monitoring inside truck cab" loading="lazy">
    </div>
    <div class="feat-body">
      <div class="feat-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        AI Dash Cams
        <div class="feat-label-line"></div>
      </div>
      <h3>See every incident before it becomes a claim.</h3>
      <p>AI-powered cameras trigger automatically on hard braking, swerving, and distracted driving. Exonerating footage reaches your legal team in seconds, not weeks of discovery.</p>
      <div class="feat-metrics">
        <div><div class="fm-val">31%</div><div class="fm-label">Fewer accidents</div></div>
        <div><div class="fm-val">21%</div><div class="fm-label">Less risk per mile</div></div>
      </div>
      <ul class="check-list">
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Automatic event-triggered video on every hard event</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Real-time in-cab distracted driving alerts</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Automated driver scorecards and coaching queues</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Exonerating footage delivered in seconds, not weeks</li>
      </ul>
    </div>
  </div>

  <!-- GPS -->
  <div class="feat-split fade-in" style="direction:rtl">
    <div class="feat-photo" style="direction:ltr">
      <img src="https://images.unsplash.com/photo-1643686978040-beac9782e58b?auto=format&fit=crop&w=900&h=700&q=85" alt="GPS device on vehicle dashboard" loading="lazy">
    </div>
    <div class="feat-body" style="direction:ltr">
      <div class="feat-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        GPS Tracking
        <div class="feat-label-line"></div>
      </div>
      <h3>Know where every asset is, and was.</h3>
      <p>Live location, geofencing alerts, trip history, and route replay across your entire fleet. Nothing goes unaccounted for, whether it's a semi or a generator on a job site.</p>
      <div class="feat-metrics">
        <div><div class="fm-val">100%</div><div class="fm-label">Fleet visibility</div></div>
        <div><div class="fm-val">24/7</div><div class="fm-label">Live tracking</div></div>
      </div>
      <ul class="check-list">
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Real-time location on any device, anywhere</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Custom geofence zones with instant alerts</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Complete trip history and route replay</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Stolen vehicle recovery within minutes</li>
      </ul>
    </div>
  </div>

  <!-- Fleet Intelligence -->
  <div class="feat-split fade-in">
    <div class="feat-photo">
      <img src="https://images.unsplash.com/photo-1703194531119-e8b98a555cb6?auto=format&fit=crop&w=900&h=700&q=85" alt="Aerial view of fleet at container terminal" loading="lazy">
    </div>
    <div class="feat-body">
      <div class="feat-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Fleet Intelligence
        <div class="feat-label-line"></div>
      </div>
      <h3>Your entire operation. One screen.</h3>
      <p>Unified KPIs, driver scorecards, fuel reports, maintenance alerts, and compliance status, built for the operations leader who needs answers before the CFO asks questions.</p>
      <div class="feat-metrics">
        <div><div class="fm-val">6%</div><div class="fm-label">Lower cost per mile</div></div>
        <div><div class="fm-val">7%</div><div class="fm-label">Fuel savings</div></div>
      </div>
      <ul class="check-list">
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Single command center for all vehicles and assets</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Executive-ready ROI reporting for finance teams</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Open API with 300+ software and hardware integrations</li>
        <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Scales from 10 vehicles to 10,000</li>
      </ul>
    </div>
  </div>
</div>

<!-- SOLUTIONS -->
<section class="section" id="solutions">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div class="section-label">Full Platform</div>
      <h2 class="section-h2">Every tool your fleet needs.<br>One intelligent platform.</h2>
      <p class="section-sub">Built on Geotab, the world's largest open telematics platform. Connects to your hardware and software on day one.</p>
    </div>
    <div class="sol-grid">

      <!-- Card 1 — Featured (spans 2 rows) -->
      <div class="sol-card sol-card--feature fade-in" style="--i:0">
        <div class="sol-photo">
          <img src="https://images.unsplash.com/photo-1736134869393-bb43683d5d28?auto=format&fit=crop&w=800&h=500&q=80" alt="Truck on highway at night" loading="lazy">
        </div>
        <div class="sol-body">
          <div class="sol-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>AI Dash Cams</h3>
          <p>Event-triggered recording, AI coaching, and liability-proof footage that pays for itself on the first prevented claim.</p>
          <a href="<?php echo esc_url(home_url('/dash-cams/')); ?>" class="sol-link">Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="sol-card fade-in" style="--i:1">
        <div class="sol-photo">
          <img src="https://images.unsplash.com/photo-1745956983820-6e960f7e8472?auto=format&fit=crop&w=600&h=200&q=80" alt="Fleet trucks on highway" loading="lazy">
        </div>
        <div class="sol-body">
          <div class="sol-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>GPS Tracking</h3>
          <p>Live location, geofencing, trip history. Every vehicle documented, every mile accounted for.</p>
          <a href="<?php echo esc_url(home_url('/gps-tracking/')); ?>" class="sol-link">Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="sol-card fade-in" style="--i:2">
        <div class="sol-photo">
          <img src="https://images.unsplash.com/photo-1534097575056-ddba81f714c8?auto=format&fit=crop&w=600&h=200&q=80" alt="Construction equipment aerial" loading="lazy">
        </div>
        <div class="sol-body">
          <div class="sol-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17,2 12,7 7,2"/></svg>
          </div>
          <h3>Equipment Mgmt</h3>
          <p>Track powered and non-powered assets with utilization reports and theft prevention.</p>
          <a href="<?php echo esc_url(home_url('/solutions/')); ?>" class="sol-link">Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="sol-card fade-in" style="--i:3">
        <div class="sol-photo">
          <img src="https://images.unsplash.com/photo-1643686978040-beac9782e58b?auto=format&fit=crop&w=600&h=200&q=80" alt="Vehicle GPS dashboard" loading="lazy">
        </div>
        <div class="sol-body">
          <div class="sol-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 1 21 12M4.93 4.93A10 10 0 0 0 3 12m1.93 7.07A10 10 0 0 0 12 21m7.07-1.93A10 10 0 0 0 21 12"/></svg>
          </div>
          <h3>Predictive Maintenance</h3>
          <p>OBD fault alerts that stop a $12,000 breakdown before it pulls a truck off the road.</p>
          <a href="<?php echo esc_url(home_url('/solutions/')); ?>" class="sol-link">Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

      <!-- Card 5 -->
      <div class="sol-card fade-in" style="--i:4">
        <div class="sol-photo">
          <img src="https://images.unsplash.com/photo-1703194531119-e8b98a555cb6?auto=format&fit=crop&w=600&h=200&q=80" alt="Fleet terminal overhead" loading="lazy">
        </div>
        <div class="sol-body">
          <div class="sol-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <h3>Fuel Management</h3>
          <p>Idle reduction, MPG benchmarking, and fuel card integration that makes fuel spend controllable.</p>
          <a href="<?php echo esc_url(home_url('/solutions/')); ?>" class="sol-link">Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

      <!-- Card 6 -->
      <div class="sol-card fade-in" style="--i:5">
        <div class="sol-photo">
          <img src="https://images.unsplash.com/photo-1744884275743-4b075af04f62?auto=format&fit=crop&w=600&h=200&q=80" alt="Night driving dashboard" loading="lazy">
        </div>
        <div class="sol-body">
          <div class="sol-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h3>EV Fleet</h3>
          <p>Range visibility, charge status, and EV adoption planning for your electrification strategy.</p>
          <a href="<?php echo esc_url(home_url('/solutions/')); ?>" class="sol-link">Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

    </div>
  </div>
</section>

<div class="divider"></div>

<!-- RESULTS -->
<section class="section section--alt" id="results">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div class="section-label">Proven Results</div>
      <h2 class="section-h2">Measurable ROI across every<br>dimension of your operation.</h2>
      <p class="section-sub">Six performance dimensions tracked and benchmarked with data from real fleets across every major industry.</p>
    </div>
    <div class="results-layout">
      <div class="results-tabs">
        <div class="rtab on" data-p="safety">
          <div class="rtab-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div><div class="rtab-title">Safety</div><div class="rtab-sub">Accidents, coaching, liability</div></div>
        </div>
        <div class="rtab" data-p="productivity">
          <div class="rtab-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div><div class="rtab-title">Productivity</div><div class="rtab-sub">Dispatch, routing, visibility</div></div>
        </div>
        <div class="rtab" data-p="optimization">
          <div class="rtab-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div><div class="rtab-title">Optimization</div><div class="rtab-sub">Cost reduction, idle, diagnostics</div></div>
        </div>
        <div class="rtab" data-p="sustainability">
          <div class="rtab-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 20.94L5.71 21c.34-.73.69-1.46 1.08-2.17C8 22 12 24 12 24c4.5-4.5 8-11.5 5-16z"/></svg>
          </div>
          <div><div class="rtab-title">Sustainability</div><div class="rtab-sub">Emissions, EV planning, carbon</div></div>
        </div>
        <div class="rtab" data-p="compliance">
          <div class="rtab-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
          </div>
          <div><div class="rtab-title">Compliance</div><div class="rtab-sub">DOT/FMCSA, HOS, inspections</div></div>
        </div>
        <div class="rtab" data-p="expandability">
          <div class="rtab-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <div><div class="rtab-title">Expandability</div><div class="rtab-sub">300+ integrations, API, hardware</div></div>
        </div>
      </div>

      <div class="result-panel fade-in">
        <div class="rp-photo">
          <img id="rpImg" src="https://images.unsplash.com/photo-1736134869393-bb43683d5d28?auto=format&fit=crop&w=900&h=320&q=85" alt="" loading="lazy">
        </div>
        <div class="rp-body">
          <div class="rp-stat" id="rpStat">31%</div>
          <div class="rp-label" id="rpLabel">Reduction in Annual Reportable Accidents</div>
          <p class="rp-desc" id="rpDesc">AI dash cams build a documented record that protects your company in litigation and coaches drivers before incidents happen, not after.</p>
          <ul class="check-list" id="rpBullets">
            <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>AI-triggered video on every hard event</li>
            <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Real-time in-cab distracted driving alerts</li>
            <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Automatic driver scorecards and coaching queues</li>
            <li><span class="check-icon"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Exonerating footage delivered in seconds, not weeks</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- INDUSTRIES -->
<section class="section" id="industries">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div class="section-label">Industries Served</div>
      <h2 class="section-h2">Built for fleets that keep<br>America moving.</h2>
    </div>
    <div class="ind-grid">
      <div class="ind-card fade-in" style="--i:0">
        <div class="ind-photo"><img src="https://images.unsplash.com/photo-1534097575056-ddba81f714c8?auto=format&fit=crop&w=900&h=600&q=80" alt="Construction trucks" loading="lazy"></div>
        <div class="ind-overlay"></div>
        <div class="ind-content">
          <span class="ind-tag">Construction</span>
          <h3>Construction &amp; Heavy Equipment</h3>
          <p>Track every machine across sprawling job sites. Stop theft, cut idle, stay on schedule.</p>
        </div>
      </div>
      <div class="ind-card fade-in" style="--i:1">
        <div class="ind-photo"><img src="https://images.unsplash.com/photo-1745956983820-6e960f7e8472?auto=format&fit=crop&w=700&h=500&q=80" alt="Trucking fleet" loading="lazy"></div>
        <div class="ind-overlay"></div>
        <div class="ind-content">
          <span class="ind-tag">Transportation</span>
          <h3>Trucking &amp; Transportation</h3>
          <p>HOS automation, DOT compliance, and video-based liability protection for every haul.</p>
        </div>
      </div>
      <div class="ind-card fade-in" style="--i:2">
        <div class="ind-photo"><img src="https://images.unsplash.com/photo-1703194531119-e8b98a555cb6?auto=format&fit=crop&w=700&h=500&q=80" alt="Logistics fleet" loading="lazy"></div>
        <div class="ind-overlay"></div>
        <div class="ind-content">
          <span class="ind-tag">Logistics</span>
          <h3>Logistics &amp; Distribution</h3>
          <p>Container-level tracking, dynamic dispatching, and terminal visibility at scale.</p>
        </div>
      </div>
      <div class="ind-card fade-in" style="--i:3">
        <div class="ind-photo"><img src="https://images.unsplash.com/photo-1736134869393-bb43683d5d28?auto=format&fit=crop&w=700&h=500&q=80" alt="Night operations" loading="lazy"></div>
        <div class="ind-overlay"></div>
        <div class="ind-content">
          <span class="ind-tag">Field Services</span>
          <h3>Field Service Operations</h3>
          <p>Dynamic dispatching and technician accountability that turns calls into competitive edge.</p>
        </div>
      </div>
      <div class="ind-card fade-in" style="--i:4">
        <div class="ind-photo"><img src="https://images.unsplash.com/photo-1744884275743-4b075af04f62?auto=format&fit=crop&w=700&h=500&q=80" alt="Night dashboard" loading="lazy"></div>
        <div class="ind-overlay"></div>
        <div class="ind-content">
          <span class="ind-tag">Oil &amp; Gas</span>
          <h3>Oil &amp; Gas / Energy</h3>
          <p>Remote tracking, lone worker safety, and regulatory compliance for high-stakes field ops.</p>
        </div>
      </div>
      <div class="ind-card fade-in" style="--i:5">
        <div class="ind-photo"><img src="https://images.unsplash.com/photo-1643686978040-beac9782e58b?auto=format&fit=crop&w=700&h=500&q=80" alt="Fleet GPS" loading="lazy"></div>
        <div class="ind-overlay"></div>
        <div class="ind-content">
          <span class="ind-tag">Government</span>
          <h3>Government &amp; Municipal</h3>
          <p>Public accountability dashboards and compliance automation for city and county fleets.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="divider"></div>

<!-- INTEGRATIONS -->
<section class="section section--alt" id="integrations">
  <div class="section-inner">
    <div class="fade-in" style="max-width:560px;">
      <div class="section-label">300+ Integrations</div>
      <h2 class="section-h2">Connects with everything<br>your team already uses.</h2>
      <p class="section-sub">No rip-and-replace. EnVue plugs directly into your dispatch, ERP, fuel card, and camera systems on day one.</p>
    </div>
    <div class="int-row fade-in">
      <div class="int-chip">Geotab</div>
      <div class="int-chip">Route4Me</div>
      <div class="int-chip">FleetCor</div>
      <div class="int-chip">CarAdvise</div>
      <div class="int-chip">Phillips Connect</div>
      <div class="int-chip">Drivewyze</div>
      <div class="int-chip">Netradyne</div>
      <div class="int-chip">Mobileye</div>
      <div class="int-chip">Lytx</div>
      <div class="int-chip">Samsara</div>
      <div class="int-chip">Surfsight</div>
      <div class="int-chip">Azuga</div>
      <div class="int-chip">+ 288 more</div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS (asymmetric) -->
<section class="section" id="company">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div class="section-label">Customer Stories</div>
      <h2 class="section-h2">Fleets that made the switch.</h2>
    </div>
    <div class="test-grid">
      <!-- Featured testimonial -->
      <div class="tcard tcard--featured fade-in">
        <div>
          <div class="tcard-stars">
            <span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span>
          </div>
          <p class="tquote">When our truck was stolen, we had the exact GPS location within minutes. The vehicle was recovered the same day. That one recovery paid for three years of the platform.</p>
        </div>
        <div>
          <div class="tauthor" style="border:none;padding:0;margin-bottom:24px;">
            <div class="tavatar">CE</div>
            <div><div class="tname">Fleet Manager</div><div class="tco">Cooper Electric Supply Co.</div></div>
          </div>
          <div style="background:var(--blue-lt);border:1px solid var(--blue-md);border-radius:12px;padding:16px 20px;">
            <div style="font-family:'Lexend',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--blue);margin-bottom:6px;">Result</div>
            <div style="font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--ink);">Same-day recovery</div>
            <div style="font-size:13px;color:var(--slate);margin-top:2px;">3 years of platform cost recovered in 1 incident</div>
          </div>
        </div>
      </div>
      <!-- Two smaller -->
      <div class="tcard fade-in" style="--i:1">
        <div class="tcard-stars"><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span></div>
        <p class="tquote">The engine diagnostic alerts caught a failure before it happened. We avoided a $12,000 repair with zero downtime. Predictive maintenance paid for our entire contract.</p>
        <div class="tauthor"><div class="tavatar">AG</div><div><div class="tname">Operations Director</div><div class="tco">AGL Welding Supply Co.</div></div></div>
      </div>
      <div class="tcard fade-in" style="--i:2">
        <div class="tcard-stars"><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span><span class="tcard-star">&#9733;</span></div>
        <p class="tquote">This isn&#8217;t a vendor relationship; it&#8217;s a genuine operational partnership. They deployed with us, trained our team, and continue to optimize alongside us every quarter.</p>
        <div class="tauthor"><div class="tavatar">BT</div><div><div class="tname">CEO</div><div class="tco">B-4 Transport Company</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="section section--dark" id="demo">
  <div class="cta-inner fade-in">
    <div>
      <h2>See exactly what your fleet could save.</h2>
      <p>Live data from your actual operation, not a generic slide deck. We show you what you&#8217;d recover, protect, and eliminate from your cost structure.</p>
    </div>
    <div class="cta-actions">
      <a href="mailto:sales@et-envue.com" class="btn btn-primary btn-lg">Request a Demo</a>
      <a href="tel:8002011169" class="btn btn-ghost btn-lg" style="color:oklch(98% 0 218/.7);border-color:oklch(100% 0 0/.18);">Call (800) 201-1169</a>
      <div class="cta-contact">
        <a href="mailto:sales@et-envue.com">sales@et-envue.com</a>
        <a href="#">Longview, Texas</a>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>
