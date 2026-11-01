const fs = require('fs');
const path = require('path');

const freshCohort = [
  // 1. Academic: Molecular Biochemistry (Complex, Medium)
  {
    id: 'fresh_acad_01',
    category: 'academic',
    subgenre: 'biochemistry',
    dialect: 'American Scholarly',
    length: 'medium',
    name: 'Allosteric Enzyme Kinetics in Glycolytic Regulation',
    provenance: 'Adapted from open access structural biochemistry literature on phosphofructokinase-1 allosteric transitions',
    originalText:
      'Phosphofructokinase-1 (PFK-1) exhibits cooperative allosteric inhibition in the presence of high intracellular ATP concentrations. Furthermore, fructose-2,6-bisphosphate serves as a potent allosteric activator, shifting the conformational equilibrium from the inactive T-state to the catalytically active R-state. Spectroscopic assays demonstrated that kinetic cooperativity decreases markedly under alkaline pH conditions (Hill coefficient nH = 1.2 vs 3.8 at physiological pH 7.2).',
    expectedInvariants: ['Phosphofructokinase-1', 'PFK-1', 'ATP', 'fructose-2,6-bisphosphate', 'T-state', 'R-state', 'nH = 1.2', 'pH 7.2'],
    recommendedMode: 'formal',
  },
  // 2. Indian Academic English: Agricultural Economics (Complex, Long)
  {
    id: 'fresh_acad_02',
    category: 'academic',
    subgenre: 'indian_agricultural_economics',
    dialect: 'Indian Academic English',
    length: 'long',
    name: 'MSP Procurement and Tube-Well Depletion in Punjab',
    provenance: 'Adapted from Indian agricultural policy monograph on groundwater depletion and APMC mandi operations',
    originalText:
      'The assured minimum support price (MSP) regime for paddy has incentivized intensive monocropping across the Malwa belt of Punjab, causing acute groundwater over-exploitation. As per Central Ground Water Board estimates, water table decline in 82% of administrative assessment units exceeds recharge capacity. Although the state government initiated direct seeding of rice (DSR) schemes, marginal farmers do not find the rental subsidies for specialized machinery remunerative. Consequently, tube-well bore depths now routinely surpass 200 feet.',
    expectedInvariants: ['MSP', 'paddy', 'Malwa', 'Punjab', 'Central Ground Water Board', '82%', 'DSR', '200 feet'],
    recommendedMode: 'formal',
  },
  // 3. Academic: Constitutional Law (Complex, Medium)
  {
    id: 'fresh_acad_03',
    category: 'academic',
    subgenre: 'constitutional_law',
    dialect: 'Commonwealth Legal',
    length: 'medium',
    name: 'Basic Structure Doctrine and Judicial Review',
    provenance: 'Adapted from constitutional jurisprudence commentary on Kesavananda Bharati v. State of Kerala',
    originalText:
      'The doctrine of basic structure serves as an impenetrable judicial fortress safeguarding the core identity of the constitution against legislative encroachment. In the realm of judicial review, parliamentary constituent power under Article 368 cannot be exercised so as to damage democratic governance or judicial independence. Furthermore, subsequent benches reaffirmed that the rule of law and equality before law constitute essential pillars incapable of abrogation.',
    expectedInvariants: ['basic structure', 'Article 368', 'judicial review', 'rule of law'],
    recommendedMode: 'formal',
  },
  // 4. Academic: AI Literature Review (Formulaic AI Synthetic, Short)
  {
    id: 'fresh_acad_04',
    category: 'academic',
    subgenre: 'ai_synthetic_literature',
    dialect: 'Standard AI Academic',
    length: 'short',
    name: 'Synthetic Overview of Attention Mechanisms',
    provenance: 'Synthesized via GPT-4o exhibiting formulaic AI transitional clichés',
    originalText:
      'In today\'s fast-paced AI research landscape, self-attention mechanisms play a pivotal role in sequence transduction. Researchers delve into cross-modal representations in order to align visual embeddings with textual queries. Furthermore, empirical benchmarks serve as a testament to the superiority of transformer architectures across NLP benchmarks.',
    expectedInvariants: ['self-attention', 'NLP'],
    recommendedMode: 'formal',
  },

  // 5. Technical: Linux eBPF Kernel Tracing (Complex, Medium)
  {
    id: 'fresh_acad_05',
    category: 'technical',
    subgenre: 'systems_programming',
    dialect: 'Systems Technical',
    length: 'medium',
    name: 'eBPF Ring Buffer Event Dispatch',
    provenance: 'Linux kernel documentation and eBPF tracing tutorial (GPLv2/CC-BY)',
    originalText:
      'Unlike legacy perf event arrays that allocate per-CPU buffers, the BPF ring buffer provides an MPMC (multi-producer multi-consumer) circular queue with epoll support and zero-copy reservations. Kernel probes reserve space via bpf_ringbuf_reserve() and commit entries with bpf_ringbuf_submit(). If user space consumers fall behind, dropped events are tracked through the bpf_ringbuf__lost_event_cnt() metric.',
    expectedInvariants: ['eBPF', 'MPMC', 'epoll', 'bpf_ringbuf_reserve()', 'bpf_ringbuf_submit()', 'bpf_ringbuf__lost_event_cnt()'],
    recommendedMode: 'formal',
  },
  // 6. Technical: SQLite WAL Mode Architecture (Simple, Medium)
  {
    id: 'fresh_tech_02',
    category: 'technical',
    subgenre: 'database_engineering',
    dialect: 'Software Engineering',
    length: 'medium',
    name: 'SQLite Write-Ahead Logging Concurrency',
    provenance: 'SQLite architectural documentation and design whitepaper (Public Domain)',
    originalText:
      'In SQLite WAL (write-ahead log) mode, readers do not block writers and writers do not block readers. Changes are appended sequentially to a separate -wal file rather than updating the main database file directly. Furthermore, transactions are periodically transferred back to the database file during checkpoint operations, which can run passively without interrupting concurrent reader queries.',
    expectedInvariants: ['SQLite', 'WAL', '-wal', 'checkpoint'],
    recommendedMode: 'flow',
  },
  // 7. Technical: WebGL 2.0 Shader Pipeline (Complex, Short)
  {
    id: 'fresh_tech_03',
    category: 'technical',
    subgenre: 'graphics_engineering',
    dialect: 'Graphics Technical',
    length: 'short',
    name: 'Uniform Buffer Objects in WebGL 2.0',
    provenance: 'WebGL 2.0 specification excerpt and OpenGL ES 3.0 reference',
    originalText:
      'Uniform Buffer Objects (UBOs) allow shaders across multiple draw passes to share large blocks of matrix data without binding individual uniforms repeatedly. Binding a buffer to GL_UNIFORM_BUFFER and linking it to a known uniformBlockBinding index dramatically reduces driver draw-call overhead.',
    expectedInvariants: ['WebGL 2.0', 'Uniform Buffer Objects', 'UBOs', 'GL_UNIFORM_BUFFER', 'uniformBlockBinding'],
    recommendedMode: 'concise',
  },
  // 8. Technical: AI Synthetic Dev Guide (Formulaic AI Synthetic, Medium)
  {
    id: 'fresh_tech_04',
    category: 'technical',
    subgenre: 'ai_synthetic_technical',
    dialect: 'Standard AI Technical',
    length: 'medium',
    name: 'Synthetic Microservices Architecture Summary',
    provenance: 'Synthesized via Claude 3.5 Sonnet containing formulaic transitional padding',
    originalText:
      'In the realm of modern microservices, Kubernetes pods play a crucial role in maintaining high availability. Developers must delve into service mesh telemetry in order to trace latency bottlenecks across distributed endpoints. Furthermore, Istio mutual TLS stands as a beacon of security for zero-trust cloud architectures.',
    expectedInvariants: ['Kubernetes', 'Istio', 'TLS'],
    recommendedMode: 'natural',
  },

  // 9. Professional: Cybersecurity Incident Root Cause (Complex, Long)
  {
    id: 'fresh_prof_01',
    category: 'professional',
    subgenre: 'incident_response',
    dialect: 'Corporate Security',
    length: 'long',
    name: 'S3 Bucket Misconfiguration Incident Postmortem',
    provenance: 'Adapted from public commercial security incident disclosure',
    originalText:
      'On October 14 at 03:12 UTC, our automated anomaly detection system flagged unauthorized access to an internal backup repository on Amazon S3. The incident was traced to an overly permissive IAM policy that had been temporarily attached during database migration testing. Approximately 1,420 non-sensitive diagnostic logs were accessed before the bucket policy was revoked at 03:48 UTC. Furthermore, audit confirmation verified that no customer payment data or plaintext credentials were exposed.',
    expectedInvariants: ['October 14', '03:12 UTC', '03:48 UTC', 'Amazon S3', 'IAM', '1,420'],
    recommendedMode: 'formal',
  },
  // 10. Professional: Quarterly Shareholder Letter (Formulaic Corporate AI, Medium)
  {
    id: 'fresh_prof_02',
    category: 'professional',
    subgenre: 'corporate_executive',
    dialect: 'Executive Corporate',
    length: 'medium',
    name: 'Executive ARR and Retention Summary',
    provenance: 'Synthesized via Llama-3-70B mimicking corporate shareholder letter',
    originalText:
      'In today\'s fast-paced corporate marketplace, enterprise agility plays a pivotal role in maintaining shareholder value. Our management team delves into customer churn patterns in order to drive net revenue retention above 124%. Furthermore, our newly launched AI agent features serve as a testament to our ongoing product innovation.',
    expectedInvariants: ['124%', 'ARR'],
    recommendedMode: 'formal',
  },
  // 11. Professional: Indian Banking Operational Circular (Complex, Medium)
  {
    id: 'fresh_prof_03',
    category: 'professional',
    subgenre: 'banking_regulatory',
    dialect: 'Indian Professional Banking',
    length: 'medium',
    name: 'RBI Tokenization Mandate for Card-on-File Transactions',
    provenance: 'Adapted from Reserve Bank of India notifications on card tokenization frameworks',
    originalText:
      'With reference to RBI circular DPSS.CO.PD No.1221/02.14.003/2021-22, all authorized card networks and merchant aggregators must ensure that actual card details are purged from application databases upon transaction settlement. Authorized payment aggregators will do the needful regarding device tokenization using alternate 16-digit random reference tokens. Non-compliance after December 31 will attract penal interest under Section 30 of the PSS Act.',
    expectedInvariants: ['RBI', 'DPSS.CO.PD No.1221/02.14.003/2021-22', '16-digit', 'December 31', 'Section 30', 'PSS Act'],
    recommendedMode: 'formal',
  },
  // 12. Professional: Healthcare Quality Audit (Simple, Short)
  {
    id: 'fresh_prof_04',
    category: 'professional',
    subgenre: 'clinical_operations',
    dialect: 'Clinical Professional',
    length: 'short',
    name: 'Hospital Surgical Site Infection Checklist Audit',
    provenance: 'Hospital clinical governance board quality review document',
    originalText:
      'Adherence to the WHO 19-item surgical safety checklist increased from 74% to 96% across all eight operating theatres following nurse-led simulation training. Surgical site infections declined by 38% over the six-month observation window.',
    expectedInvariants: ['WHO', '19-item', '74%', '96%', '38%'],
    recommendedMode: 'concise',
  },

  // 13. Conversational: Personal Tech Career Advice (Simple, Medium)
  {
    id: 'fresh_conv_01',
    category: 'conversational',
    subgenre: 'personal_mentorship',
    dialect: 'Friendly Conversational',
    length: 'medium',
    name: 'Advice on Junior Developer Imposter Syndrome',
    provenance: 'Adapted from tech community mentoring thread on developer career transitions',
    originalText:
      'When you are starting your first junior developer job, do not feel terrified if you do not understand the entire codebase on day one. Nobody expects you to ship complex features without guidance. Focus on reading PR reviews, asking specific questions when you get stuck for more than thirty minutes, and taking clean notes on local debugging steps.',
    expectedInvariants: ['junior developer', 'PR reviews', 'thirty minutes'],
    recommendedMode: 'conversational',
  },
  // 14. Conversational: Formulaic Lifestyle AI (Formulaic AI, Short)
  {
    id: 'fresh_conv_02',
    category: 'conversational',
    subgenre: 'ai_lifestyle_blog',
    dialect: 'Standard AI Conversational',
    length: 'short',
    name: 'Synthetic Daily Habit Reflection',
    provenance: 'Generated via GPT-4o exhibiting lifestyle clichés',
    originalText:
      'In today\'s fast-paced world, journaling serves as a testament to mindful living. Many people delve into morning reflections in order to center their mental energy. Furthermore, taking ten deep breaths plays a pivotal role in reducing daily stress.',
    expectedInvariants: ['journaling', 'ten deep breaths'],
    recommendedMode: 'conversational',
  },
  // 15. Conversational: Indian Urban Commuter Perspective (Simple, Medium)
  {
    id: 'fresh_conv_03',
    category: 'conversational',
    subgenre: 'indian_urban_daily',
    dialect: 'Indian English Conversational',
    length: 'medium',
    name: 'Navigating Bengaluru Silk Board Junction',
    provenance: 'Adapted from personal Bengaluru commuter blog on daily metro construction traffic',
    originalText:
      'If you have to cross Silk Board junction around 6:30 PM, you better leave your car at home and take the metro up to BTM Layout. Otherwise you will be stuck in bumper-to-bumper dust for at least 45 minutes near the flyover ramp. One quick tip: carry a good N95 mask because the road widening digging makes the air terribly polluted.',
    expectedInvariants: ['Silk Board', '6:30 PM', 'BTM Layout', '45 minutes', 'N95'],
    recommendedMode: 'conversational',
  },
  // 16. Conversational: Amateur Coffee Brewing (Simple, Short)
  {
    id: 'fresh_conv_04',
    category: 'conversational',
    subgenre: 'hobby_food_drink',
    dialect: 'Casual Enthusiast',
    length: 'short',
    name: 'Aeropress Inverted Method Tips',
    provenance: 'Specialty coffee hobbyist forum post on medium roast grind size',
    originalText:
      'For light roasts on the Aeropress, try grinding slightly finer than standard pour-over and pouring water at 92 degrees Celsius. Flip the chamber gently at the 1:30 mark and press down slowly over thirty seconds so you do not produce bitter channeling.',
    expectedInvariants: ['Aeropress', '92 degrees Celsius', '1:30', 'thirty seconds'],
    recommendedMode: 'conversational',
  },

  // 17. Creative: Steampunk Clockwork Fiction (Formulaic AI, Medium)
  {
    id: 'fresh_creat_01',
    category: 'creative',
    subgenre: 'ai_steampunk_fiction',
    dialect: 'Literary AI',
    length: 'medium',
    name: 'Synthetic Clockwork Skyport Narrative',
    provenance: 'Synthesized via Claude 3.5 Sonnet containing formulaic fantasy tropes',
    originalText:
      'The brass airship docked quietly as copper gears danced gracefully beneath a blanket of coal fog. The harbor master\'s lighthouse stood as a beacon of safety where airships delved into the turbulent crosswinds above. Furthermore, steam whistles played a pivotal role in signaling arrival across the cobblestone tapestry of the lower wharf.',
    expectedInvariants: ['brass airship', 'copper gears', 'lighthouse'],
    recommendedMode: 'natural',
  },
  // 18. Creative: Monsoon in North Chennai (Human Literary, Long)
  {
    id: 'fresh_creat_02',
    category: 'creative',
    subgenre: 'human_literary_fiction',
    dialect: 'Indian English Literary',
    length: 'long',
    name: 'November Rains on Royapuram Shore',
    provenance: 'Excerpt from independent contemporary literary fiction set in coastal Tamil Nadu',
    originalText:
      'The northeast monsoon broke over Royapuram at dusk with the dull percussion of iron sheets rattling against coastal masonry. Salt spray mingled with the sharp tang of drying bombil fish laid out on slatted bamboo racks. Old fishermen hauled wooden catamarans above the tideline, their calloused hands dark against the coir ropes, while across the railway tracks the diesel locomotives idle in the rain with steaming iron flanks.',
    expectedInvariants: ['Royapuram', 'monsoon', 'bombil fish', 'catamarans'],
    recommendedMode: 'natural',
  },
  // 19. Creative: Hard Sci-Fi Lunar Extraction (Human Literary, Medium)
  {
    id: 'fresh_creat_03',
    category: 'creative',
    subgenre: 'hard_science_fiction',
    dialect: 'Speculative Fiction',
    length: 'medium',
    name: 'Helium-3 Harvester at Shackleton Crater',
    provenance: 'Excerpt from published indie science fiction short story (CC-BY)',
    originalText:
      'The crawler tracks crushed gray basalt regolith into fine vacuum dust that clung to the camera lenses like graphite powder. Inside the cabin, the Geiger needle flickered against background solar wind. Kincaid adjusted the magnetic induction coil, waiting for the extraction chamber to reach 600 Kelvin before venting the vaporized helium-3 isotopes into the storage flask.',
    expectedInvariants: ['Shackleton', 'basalt regolith', '600 Kelvin', 'helium-3', 'Kincaid'],
    recommendedMode: 'natural',
  },
  // 20. Creative: Non-native European English Narrative (Simple, Short)
  {
    id: 'fresh_creat_04',
    category: 'creative',
    subgenre: 'non_native_narrative',
    dialect: 'European English',
    length: 'short',
    name: 'Winter Crossing over the Baltic Archipelago',
    provenance: 'Nordic translation literature excerpt (Open Access)',
    originalText:
      'The small wooden ferry was cutting through brittle sea ice with a grinding roar that echoed across the deserted pine islands. Gray gulls circled overhead in the freezing wind, waiting for bread crusts from the lone deckhand who stamped his felt boots against the frosted iron deck.',
    expectedInvariants: ['pine islands', 'sea ice', 'deckhand', 'felt boots'],
    recommendedMode: 'flow',
  },
];

const outputPath = path.resolve('tests/fixtures/benchmarks/fresh_generalization_cohort_20.json');
fs.writeFileSync(outputPath, JSON.stringify(freshCohort, null, 2), 'utf8');
console.log(`Generated fresh 20-sample generalization cohort at ${outputPath}`);
console.log(`Total samples: ${freshCohort.length}`);
console.log(`Category distribution:`, freshCohort.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {}));

