import type {
  HumanizerChange,
  HumanizerMode,
  HumanizerOptions,
  HumanizerResult,
  LocalHumanizerEngine,
} from '../../types';

interface ReplacementPattern {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  reason: string;
  category: HumanizerChange['category'];
  modes: HumanizerMode[];
}

// ---------------------------------------------------------------------------
// UTILITY: pick a random item from an array (seeded by position for stability)
// ---------------------------------------------------------------------------
function pick<T>(arr: T[], seed?: number): T {
  if (arr.length === 1) return arr[0];
  const idx = seed !== undefined ? Math.abs(seed) % arr.length : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

// ---------------------------------------------------------------------------
// SECTION 1: MASSIVE AI CLICHÉ / OVERUSED PHRASE DICTIONARY
// Each entry maps a pattern to a pool of human alternatives.
// The engine picks one at random so each humanization run feels fresh.
// ---------------------------------------------------------------------------
const CLICHE_POOLS: Array<{
  pattern: RegExp;
  pool: string[];
  reason: string;
  category: HumanizerChange['category'];
  modes: HumanizerMode[];
}> = [
  // ── High-Impact Email, Pitch & Status Update AI Clichés ────────────────────
  {
    pattern: /\bI hope (?:everyone|all of you|you all) (?:is|are) having a (?:productive|great|good) week\.?\b/gi,
    pool: [
      "Hope everyone's week is going well.",
      "Hope you all are having a productive week.",
      "Hope everyone is having a solid week.",
    ],
    reason: 'Replaced AI team opener',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bthroughout my career,?\s*/gi,
    pool: ['Over the years, ', 'In my past roles, ', 'Across my work, ', 'In my experience, '],
    reason: 'Replaced formulaic cover letter transition "throughout my career"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bpride myself on\b/gi,
    pool: ['focus heavily on', 'always aim to', 'make it a point to', 'prioritize'],
    reason: 'Replaced clichéd resume phrase "pride myself on"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bwelcome the opportunity to\b/gi,
    pool: ['would love the chance to', 'would be excited to', 'look forward to the chance to'],
    reason: 'Replaced formal AI closing "welcome the opportunity to"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\balign(?:s)? with the (?:goals|mission|values|objectives) of\b/gi,
    pool: ['support the goals of', 'fit with what your team is building', 'match the direction of'],
    reason: 'Replaced corporate alignment cliché',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bdrive sustainable (?:revenue |growth)?/gi,
    pool: ['bring in steady revenue ', 'deliver consistent growth ', 'support steady growth '],
    reason: 'Replaced business buzzphrase "drive sustainable growth"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bdata-driven (?:analytics|insights|decisions|approach)\b/gi,
    pool: ['performance metrics', 'concrete testing and data', 'real data', 'actionable metrics'],
    reason: 'Replaced buzzphrase "data-driven analytics"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bcontent strategy\b/gi,
    pool: ['content rollout', 'content roadmap', 'editorial approach', 'content plan'],
    reason: 'Replaced formal "content strategy"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\baudienc(?:e) engagement\b/gi,
    pool: ['user engagement', 'community interaction', 'reader interest'],
    reason: 'Replaced buzzphrase "audience engagement"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bdiscuss how my (?:background|skills|experience)\b/gi,
    pool: ['talk through how my experience', 'share how my background', 'discuss how my skills'],
    reason: 'Replaced boilerplate interview request phrasing',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\boptimiz(?:e|ing|es|ation)\b/gi,
    pool: ['improving', 'refining', 'fine-tuning', 'boosting', 'strengthening'],
    reason: 'Replaced buzzword "optimize"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bdynamic team\b/gi,
    pool: ['talented team', 'collaborative team', 'growing team', 'fast-moving team'],
    reason: 'Replaced empty resume buzzword "dynamic team"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\binnovative solutions\b/gi,
    pool: ['fresh solutions', 'practical approaches', 'new ideas', 'creative answers'],
    reason: 'Replaced business buzzword "innovative solutions"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\binnovative\b/gi,
    pool: ['fresh', 'creative', 'novel', 'practical', 'modern'],
    reason: 'Replaced cliché "innovative"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bsustainab(?:le|ility)\b/gi,
    pool: ['steady', 'long-term', 'lasting', 'durable'],
    reason: 'Replaced overused "sustainable"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bhope (?:everyone|all of you|you all) (?:is|are) having\b/gi,
    pool: ["hope everyone's having", "hope you all are having"],
    reason: 'Replaced formulaic team greeting',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\benhance operational efficiency\b/gi,
    pool: [
      'boost daily productivity',
      'speed up operations',
      'make workflows smoother',
      'cut down daily delays',
    ],
    reason: 'Replaced corporate cliché "enhance operational efficiency"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\boperational efficiency\b/gi,
    pool: ['daily productivity', 'smooth operations', 'workflow speed', 'day-to-day efficiency'],
    reason: 'Replaced corporate jargon "operational efficiency"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\btailored specifically to\b/gi,
    pool: ['designed specifically to', 'built to', 'crafted to', 'aimed at', 'set up to'],
    reason: 'Replaced AI marketing phrase "tailored specifically to"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\btailored to\b/gi,
    pool: ['built for', 'designed for', 'suited for', 'crafted for'],
    reason: 'Replaced cliché "tailored to"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\btailored\b/gi,
    pool: ['custom', 'focused', 'specific', 'designed', 'personalized'],
    reason: 'Replaced buzzword "tailored"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\badditionally\b/gi,
    pool: ['Also,', 'Plus,', 'On top of that,', 'What is more,', 'Along with that,'],
    reason: 'Replaced formulaic transition "additionally"',
    category: 'filler',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bplease let me know if\b/gi,
    pool: ['Let me know if', 'Drop me a line if', 'Reach out if', 'Tell me if'],
    reason: 'Replaced boilerplate email prompt',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\blooking forward to your thoughts\b/gi,
    pool: ['Excited to hear what you think', 'Talk soon', 'Hope to hear your thoughts soon'],
    reason: 'Varied email closing expectation',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\blooking forward to\b/gi,
    pool: ['excited for', 'eager to discuss', 'hopeful about', 'anticipating'],
    reason: 'Replaced cliché "looking forward to"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bif you have any (?:questions|concerns|feedback)\b/gi,
    pool: [
      'if anything comes up',
      'if you have questions',
      'if anything looks unclear',
      'if any thoughts come to mind',
    ],
    reason: 'Replaced boilerplate conditional question offer',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bI hope this email finds you well(?: and that you(?:'re| are) having a (?:great|productive|wonderful) week)?\.?/gi,
    pool: [
      "Hope you're having a good week.",
      "Hope all is well with you.",
      "Hope your week is off to a great start.",
      "Hope things are going smoothly on your end.",
    ],
    reason: 'Replaced ubiquitous AI email opener "hope this email finds you well"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bhope this (?:email|message) finds you well\b/gi,
    pool: ["hope all is well", "hope you're doing well", "hope your week is going well"],
    reason: 'Replaced clichéd email opening pleasantry',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bI am reaching out to follow up on\b/gi,
    pool: [
      "Following up on",
      "Just wanted to check in on",
      "Reaching out about",
      "Circling back on",
    ],
    reason: 'Replaced formal robotic follow-up transition',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bI wanted to (?:provide|give|share) a quick update on\b/gi,
    pool: [
      "Here's a quick update on",
      "Quick update on",
      "Just wanted to share where things stand with",
    ],
    reason: 'Replaced formulaic update opener',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bIn today's fast-paced digital landscape\b/gi,
    pool: [
      "These days",
      "In modern business",
      "Right now",
      "In today's market",
      "With things moving so fast today",
    ],
    reason: 'Replaced top-ranking AI throat-clearer "in today\'s fast-paced digital landscape"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bin today's (?:world|age|era|society|landscape)\b/gi,
    pool: ['nowadays', 'today', 'these days', 'currently', 'in the modern market'],
    reason: 'Replaced clichéd temporal opening cliché',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bplays? a (?:pivotal|crucial|vital|key|significant) role in\b/gi,
    pool: [
      'makes a big difference in',
      'is key to',
      'really matters for',
      'heavily impacts',
      'is central to',
    ],
    reason: 'Replaced overused "plays a pivotal role"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bseamlessly (?:and agile|integrates?|integrated|workflows?)\b/gi,
    pool: [
      'smoothly integrates',
      'fits smoothly into existing workflows',
      'connects without friction',
      'plugs right in',
    ],
    reason: 'Replaced AI buzzword "seamlessly"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bmaintaining a competitive advantage\b/gi,
    pool: [
      'staying ahead of the competition',
      'keeping an edge in the market',
      'standing out from competitors',
      'staying competitive',
    ],
    reason: 'Replaced corporate buzzphrase "maintaining a competitive advantage"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bleverages cutting-edge technology\b/gi,
    pool: ['uses modern software', 'relies on up-to-date tools', 'takes advantage of modern tech', 'runs on modern tools'],
    reason: 'Replaced dual buzzwords "leverages cutting-edge technology"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bleveraging cutting-edge technology\b/gi,
    pool: ['using modern software', 'relying on up-to-date tools', 'taking advantage of modern tech'],
    reason: 'Replaced dual buzzwords "leveraging cutting-edge technology"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bleverage cutting-edge technology\b/gi,
    pool: ['use modern software', 'rely on up-to-date tools', 'take advantage of modern tech'],
    reason: 'Replaced dual buzzwords "leverage cutting-edge technology"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bcutting-edge\b/gi,
    pool: ['modern', 'advanced', 'latest', 'state-of-the-art', 'top-tier'],
    reason: 'Replaced cliché "cutting-edge"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bensuring optimal accuracy\b/gi,
    pool: [
      'keeping things precise',
      'making sure data stays accurate',
      'guaranteeing accuracy',
      'maintaining high precision',
    ],
    reason: 'Replaced formulaic "ensuring optimal accuracy"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\b(?:fosters?|fostering) (?:greater )?cross-functional collaboration\b/gi,
    pool: [
      'helps different teams work together better',
      'boosts cross-team communication',
      'connects teams across departments',
      'breaks down silos',
    ],
    reason: 'Replaced AI buzzphrase "foster cross-functional collaboration"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\blays? the groundwork for sustainable long-term growth\b/gi,
    pool: [
      'sets a strong foundation for steady growth',
      'builds a solid base for the long haul',
      'sets teams up for continued success',
    ],
    reason: 'Replaced dramatic AI metaphor "lays the groundwork for sustainable growth"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\blays? the groundwork for\b/gi,
    pool: ['sets the stage for', 'builds the foundation for', 'prepares the way for', 'sets up'],
    reason: 'Replaced metaphor "lays the groundwork"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bI would be happy to schedule a brief (?:15-minute )?call\b/gi,
    pool: [
      "I'd love to hop on a quick 15-minute call",
      "Happy to set up a quick 15-minute chat",
      "Let's schedule a short call",
      "I'd be glad to jump on a quick call",
    ],
    reason: 'Replaced formal AI closing pitch',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bdelve into the details\b/gi,
    pool: ['walk through the details', 'go over the specifics', 'talk through the details', 'discuss the specifics'],
    reason: 'Replaced cliché "delve into the details"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bshowcase a live demonstration\b/gi,
    pool: ['show you a quick demo', 'walk through a live demo', 'give you a quick look at how it works'],
    reason: 'Replaced redundant "showcase a live demonstration"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bPlease let me know if (?:Thursday or Friday|any time this week) works for your schedule\b/gi,
    pool: [
      "Let me know if Thursday or Friday works on your end",
      "Let me know if you're free Thursday or Friday",
      "Let me know what time works best for you",
    ],
    reason: 'Replaced rigid AI calendar proposal',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bThank you very much for your time and consideration\b/gi,
    pool: [
      "Thanks so much for your time",
      "Appreciate your time and consideration",
      "Thanks for considering this",
      "Really appreciate your time",
    ],
    reason: 'Replaced robotic sign-off pleasantry',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bI look forward to hearing from you soon\b/gi,
    pool: [
      "Talk soon",
      "Hope to hear from you soon",
      "Excited to hear what you think",
      "Eager to hear your thoughts",
      "Hope to connect soon",
    ],
    reason: 'Replaced generic AI closing sentence',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\b(?:Warm|Best|Kind) regards\b/gi,
    pool: ["Best", "Cheers", "Thanks", "Warmly"],
    reason: 'Replaced boilerplate corporate sign-off',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bworking diligently to ensure that all requirements are met on time\b/gi,
    pool: [
      "pushing hard to keep all deliverables right on track",
      "working to make sure everything lands on schedule",
      "making sure we hit our deadlines without issue",
    ],
    reason: 'Replaced corporate update cliché',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bcompleted successfully\b/gi,
    pool: ['wrapped up smoothly', 'finished without issues', 'completed cleanly', 'went through successfully'],
    reason: 'Replaced redundant AI status phrase',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bmoving into the final stages of verification\b/gi,
    pool: [
      "moving into final verification",
      "wrapping up final testing",
      "running the last checks before release",
    ],
    reason: 'Simplified status phrasing',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bensure a smooth rollout for our users\b/gi,
    pool: [
      "give our users a seamless launch",
      "make the rollout as smooth as possible",
      "avoid any hiccups for our users",
    ],
    reason: 'Replaced corporate rollout cliché',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bPlease let me know if you have any questions or feedback\.?\b/gi,
    pool: [
      "Let me know if you have any questions or thoughts.",
      "Feel free to reach out if anything comes up.",
      "Happy to answer any questions if anything looks unclear.",
    ],
    reason: 'Replaced generic AI feedback request',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bI will keep you posted as we make further progress\.?\b/gi,
    pool: [
      "I'll share more updates as we get closer.",
      "I'll keep you in the loop as things progress.",
      "More updates to follow soon.",
    ],
    reason: 'Replaced AI update closure',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bI am writing to express my enthusiastic interest in\b/gi,
    pool: [
      "I am excited to apply for",
      "I would love to be considered for",
      "I'm writing to put my name forward for",
    ],
    reason: 'Replaced boilerplate cover letter opener',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  {
    pattern: /\bconfident in my ability to make a meaningful contribution\b/gi,
    pool: [
      "excited about what I can bring to",
      "eager to make a real impact on",
      "confident I can deliver strong results for",
    ],
    reason: 'Replaced generic cover letter cliché',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bsuccessfully spearheaded\b/gi,
    pool: ['led', 'directed', 'ran', 'oversaw', 'managed'],
    reason: 'Replaced resume buzzword "spearheaded"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },

  // ── Mega-clichés (GPT top-25 ──────────────────────────────────────────────
  {
    pattern: /\bdelve(?:s)? into\b/gi,
    pool: ['examine', 'explore', 'look at', 'dig into', 'unpack', 'investigate', 'break down', 'analyze'],
    reason: 'Replaced top-ranked AI cliché "delve into"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\btapestry of\b/gi,
    pool: ['blend of', 'mix of', 'range of', 'variety of', 'combination of', 'collection of'],
    reason: 'Replaced melodramatic AI cliché "tapestry"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'formal', 'concise', 'flow'],
  },
  {
    pattern: /\b(?:these|those|they)\s+systems?\s+serves?\s+as\s+a\s+testament\s+to\b/gi,
    pool: ['these systems reflect', 'these systems prove', 'these systems show', 'these systems demonstrate'],
    reason: 'Replaced formulaic "serve as a testament to"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bserves?\s+as\s+a\s+testament\s+to\b/gi,
    pool: ['reflects', 'proves', 'shows', 'demonstrates', 'speaks to'],
    reason: 'Replaced formulaic "serves as a testament to"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bmultifaceted\b/gi,
    pool: ['varied', 'complex', 'diverse', 'broad', 'many-sided'],
    reason: 'Replaced AI buzzword "multifaceted"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bit is crucial to\b/gi,
    pool: ['we really need to', 'it helps to', 'it is vital to', 'you need to'],
    reason: 'Replaced formulaic "it is crucial to"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\btestament to\b/gi,
    pool: ['proof of', 'evidence of', 'sign of', 'reflection of', 'indicator of'],
    reason: 'Replaced formulaic "testament to"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bvital role\b/gi,
    pool: ['key role', 'central role', 'important part', 'crucial function', 'significant role'],
    reason: 'Replaced overused "vital role"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bserves? as a beacon of modern inquiry\b/gi,
    pool: ['stands as a model for modern research', 'leads the way in modern inquiry', 'exemplifies contemporary research'],
    reason: 'Replaced melodramatic academic cliché',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bserves? as a beacon of\b/gi,
    pool: ['stands as a model for', 'leads the way in', 'exemplifies', 'guides'],
    reason: 'Replaced metaphor "serves as a beacon of"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\ba beacon of\b/gi,
    pool: ['a model of', 'a standard for', 'an example of', 'a guide for'],
    reason: 'Replaced AI-overused metaphor "beacon of"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bconduct(?:ed)? an investigation into\b/gi,
    pool: ['investigate', 'examine', 'study', 'look into'],
    reason: 'Simplified nominalization "conduct an investigation into"',
    category: 'concise',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\b(?:the )?aforementioned\b/gi,
    pool: ['these', 'those', 'the earlier', 'the specified'],
    reason: 'Replaced archaic academic word "aforementioned"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bit should be noted that\b/gi,
    pool: ['note that', 'we should note that', 'in fact,', 'importantly,'],
    reason: 'Removed passive throat-clearer "it should be noted that"',
    category: 'filler',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bprior literature demonstrates\b/gi,
    pool: ['past studies show', 'earlier research shows', 'prior work indicates', 'earlier findings reveal'],
    reason: 'Replaced formulaic academic citation phrase',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bempirical observations were collected\b/gi,
    pool: ['data was collected', 'empirical data was gathered', 'observations were compiled'],
    reason: 'Simplified passive academic phrase',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bover a long duration of time\b/gi,
    pool: ['over a long period', 'over time', 'for years', 'over many years'],
    reason: 'Condensed redundant phrase "long duration of time"',
    category: 'redundancy',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bwe have the ability to conclude that\b/gi,
    pool: ['we can conclude that', 'this shows that', 'we can see that', 'the results show that'],
    reason: 'Streamlined wordy conclusion phrase',
    category: 'concise',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bcomputational methodology\b/gi,
    pool: ['computational methods', 'computational modeling', 'computer methods'],
    reason: 'Simplified inflated term "computational methodology"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bautomate repetitive tasks\b/gi,
    pool: ['handle repetitive tasks', 'take care of routine chores', 'automate mundane work'],
    reason: 'Replaced corporate buzzphrase "automate repetitive tasks"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bsave valuable time\b/gi,
    pool: ['free up valuable time', 'save hours of work', 'give teams time back'],
    reason: 'Replaced corporate cliché "save valuable time"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bincrease overall efficiency\b/gi,
    pool: ['boost efficiency', 'speed up work', 'streamline daily operations'],
    reason: 'Replaced business buzzword "increase overall efficiency"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bdrive higher productivity\b/gi,
    pool: ['lift productivity', 'get more done', 'increase team output'],
    reason: 'Replaced business buzzword "drive higher productivity"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bin many different ways\b/gi,
    pool: ['in countless ways', 'across the board', 'in all kinds of ways'],
    reason: 'Replaced vague filler "in many different ways"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bchanging the world\b/gi,
    pool: ['reshaping daily work', 'transforming modern life', 'altering how we work'],
    reason: 'Replaced hyperbole "changing the world"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\blandscape(?:s)? of\b/gi,
    pool: ['world of', 'field of', 'space of', 'domain of', 'realm of', 'area of'],
    reason: 'Replaced overused spatial metaphor "landscape of"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bevolving landscape\b/gi,
    pool: ['changing field', 'shifting environment', 'dynamic space', 'fast-moving domain'],
    reason: 'Replaced AI-favored compound cliché "evolving landscape"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bin today's fast-paced (?:digital )?world\b/gi,
    pool: [
      'these days',
      'nowadays',
      'in our current moment',
      'right now',
      'in the modern era',
      'at this point',
    ],
    reason: 'Replaced extremely common AI opener cliché',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bfast-paced world\b/gi,
    pool: ['modern world', 'world we live in', 'current era', 'world today'],
    reason: 'Replaced AI-favored filler phrase',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bit(?:'s| is) (?:important|crucial|essential|critical) to (?:note|remember|acknowledge|understand) that\b/gi,
    pool: ['remember,', 'in fact,', 'keep in mind:', 'we should note:', 'crucially,', ''],
    reason: 'Removed hollow "important to note" throat-clearer',
    category: 'filler',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bit(?:'s| is) worth (?:noting|mentioning) that\b/gi,
    pool: ['keep in mind:', 'interestingly,', 'to highlight:', ''],
    reason: 'Removed hollow "worth noting" filler',
    category: 'filler',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bdelve deeper into\b/gi,
    pool: ['dig into', 'look closer at', 'explore', 'examine more closely'],
    reason: 'Replaced AI cliché "delve deeper into"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bnavigating the complexities of\b/gi,
    pool: ['handling', 'managing', 'dealing with', 'working through'],
    reason: 'Replaced AI cliché "navigating the complexities of"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bunlock the true potential of\b/gi,
    pool: ['make the most of', 'tap into', 'maximize', 'get the best from'],
    reason: 'Replaced formulaic "unlock the true potential of"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bcornerstone of\b/gi,
    pool: ['foundation of', 'core of', 'basis of', 'heart of'],
    reason: 'Replaced AI cliché "cornerstone of"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\btransformative impact\b/gi,
    pool: ['major change', 'deep impact', 'real difference', 'lasting change'],
    reason: 'Replaced buzzphrase "transformative impact"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bindispensable tool\b/gi,
    pool: ['essential tool', 'vital tool', 'key asset', 'must-have tool'],
    reason: 'Replaced buzzphrase "indispensable tool"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bholistic approach\b/gi,
    pool: ['complete approach', 'well-rounded strategy', 'broad approach'],
    reason: 'Replaced buzzphrase "holistic approach"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bserves as a reminder that\b/gi,
    pool: ['reminds us that', 'shows that', 'highlights that'],
    reason: 'Replaced formulaic "serves as a reminder that"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\ba wide variety of\b/gi,
    pool: ['many', 'all kinds of', 'a range of', 'plenty of'],
    reason: 'Simplified wordy quantifier "a wide variety of"',
    category: 'concise',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bon a daily basis\b/gi,
    pool: ['every day', 'daily', 'each day'],
    reason: 'Simplified phrase "on a daily basis"',
    category: 'concise',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bin the near future\b/gi,
    pool: ['soon', 'shortly', 'in coming months'],
    reason: 'Simplified "in the near future"',
    category: 'concise',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bembark(?:s|ed|ing)? (?:on|upon) a journey\b/gi,
    pool: ['begin', 'start', 'set out on', 'take on', 'pursue'],
    reason: 'Removed over-dramatic journey metaphor',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bplays? (?:a )?(?:pivotal|crucial|vital|key|important|significant) role\b/gi,
    pool: ['matters greatly', 'is central', 'is key', 'drives', 'shapes', 'influences significantly'],
    reason: 'Replaced formulaic "plays a X role" structure',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bfoster(?:s|ing|ed)?(?:\s+(?:a sense of|an environment of))\b/gi,
    pool: ['build', 'create', 'develop', 'grow', 'encourage', 'promote'],
    reason: 'Replaced AI-favored "foster a sense/environment of" phrase',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bfoster(?:s|ed)?\b/gi,
    pool: ['build', 'create', 'develop', 'grow', 'encourage', 'promote'],
    reason: 'Replaced AI-favored "foster" verb',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bfostering\b/gi,
    pool: ['building', 'creating', 'developing', 'growing', 'encouraging'],
    reason: 'Replaced AI-favored "fostering" verb',
    category: 'phrasing',
    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\beveryone(?:'s| is)? unique(?:ly)?\b/gi,
    pool: ['each person differs', 'people vary', 'individuals differ', 'no two people are alike'],
    reason: 'Replaced clichéd universalism phrase',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bseamlessly\b/gi,
    pool: ['smoothly', 'naturally', 'easily', 'without friction', 'effortlessly'],
    reason: 'Replaced AI-overused adverb "seamlessly"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bunlock(?:s|ing|ed)? (?:the )?(?:full )?potential\b/gi,
    pool: ['realize the value of', 'maximize', 'harness', 'tap into', 'get the most from'],
    reason: 'Replaced AI cliché "unlock potential"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bleverage(?:s|d|ing)?\b/gi,
    pool: ['use', 'apply', 'draw on', 'build on', 'take advantage of', 'employ'],
    reason: 'Replaced corporate jargon "leverage"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\boptimal(?:ly)?\b/gi,
    pool: ['best', 'ideal', 'most effective', 'peak', 'top'],
    reason: 'Replaced formal "optimal" with natural alternative',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bensure(?:s|d|ing)? (?:that )?\b/gi,
    pool: ['make sure ', 'confirm ', 'guarantee ', 'see to it that ', 'verify '],
    reason: 'Varied "ensure" with natural alternatives',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bin conclusion,?\s*/gi,
    pool: [
      'Ultimately, ',
      'At the end of the day, ',
      'To wrap up, ',
      'All things considered, ',
      'In short, ',
      'So, ',
      'Putting it all together, ',
    ],
    reason: 'Replaced robotic essay-closing "in conclusion"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bin summary,?\s*/gi,
    pool: ['To sum up, ', 'Briefly, ', 'In short, ', 'The bottom line: ', 'Simply put, '],
    reason: 'Replaced stiff "in summary" transition',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bto summarize,?\s*/gi,
    pool: ['In a nutshell, ', 'To put it simply, ', 'In brief, ', 'Overall, '],
    reason: 'Replaced "to summarize" with varied closer',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bin addition(?:,|\s)/gi,
    pool: ['Also, ', 'On top of that, ', 'What\'s more, ', 'Beyond that, ', 'Plus, '],
    reason: 'Replaced stiff additive transition',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bfurthermore,?\s*/gi,
    pool: ['Also, ', 'On top of that, ', 'Beyond this, ', 'What\'s more, ', 'Plus, '],
    reason: 'Softened heavy "furthermore" transition',
    category: 'flow',
    modes: ['natural', 'flow'],
  },
  {
    pattern: /\bmoreover,?\s*/gi,
    pool: ['Also, ', 'On top of that, ', 'Beyond that, ', 'Plus, ', 'What\'s more, '],
    reason: 'Smoothed overly stiff "moreover" academic transition',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bconversely,?\s*/gi,
    pool: ['On the other hand, ', 'That said, ', 'Then again, ', 'In contrast, ', 'Yet, '],
    reason: 'Replaced stiff contrastive "conversely"',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bnevertheless,?\s*/gi,
    pool: ['Still, ', 'Even so, ', 'That said, ', 'Regardless, ', 'Yet, '],
    reason: 'Replaced formal "nevertheless" with natural alternatives',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bnotwithstanding\b/gi,
    pool: ['despite', 'in spite of', 'even with', 'regardless of'],
    reason: 'Replaced archaic "notwithstanding"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\bsubsequently,?\s*/gi,
    pool: ['Then, ', 'After that, ', 'Next, ', 'Following that, '],
    reason: 'Replaced formal "subsequently"',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bconsequently,?\s*/gi,
    pool: ['As a result, ', 'So, ', 'Because of this, ', 'This means ', 'That\'s why '],
    reason: 'Replaced stiff "consequently" with natural causals',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bthus,?\s*/gi,
    pool: ['So, ', 'As a result, ', 'This means ', 'For this reason, ', 'Therefore, '],
    reason: 'Replaced terse academic "thus"',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bhence,?\s*/gi,
    pool: ['So, ', 'This is why ', 'As a result, ', 'Therefore, ', 'That\'s why '],
    reason: 'Replaced archaic "hence"',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bthereby\b/gi,
    pool: ['and so', 'which means', 'in doing so', 'and as a result'],
    reason: 'Replaced stiff "thereby"',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },

  // ── Wordy/Bureaucratic phrases ────────────────────────────────────────────
  {
    pattern: /\bin order to\b/gi,
    pool: ['to', 'so as to', 'with the aim of', 'to help'],
    reason: 'Simplified wordy infinitive phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bdue to the fact that\b/gi,
    pool: ['because', 'since', 'given that', 'as'],
    reason: 'Replaced bureaucratic "due to the fact that"',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow', 'formal'],
  },
  {
    pattern: /\bat this point in time\b/gi,
    pool: ['now', 'currently', 'at this stage', 'today'],
    reason: 'Replaced inflated temporal phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational'],
  },
  {
    pattern: /\bfor the purpose of\b/gi,
    pool: ['for', 'to', 'with the goal of', 'in order to'],
    reason: 'Eliminated redundant prepositional phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bin the event that\b/gi,
    pool: ['if', 'should', 'in case', 'whenever'],
    reason: 'Streamlined conditional phrasing',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'formal', 'flow'],
  },
  {
    pattern: /\bhas the ability to\b/gi,
    pool: ['can', 'is able to', 'is capable of', 'manages to'],
    reason: 'Replaced circumlocution with direct modal',
    category: 'phrasing',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bgives? (?:us|me|them|one) the ability to\b/gi,
    pool: ['lets', 'allows', 'enables', 'helps'],
    reason: 'Replaced inflated "gives the ability to"',
    category: 'phrasing',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\butilized\b/gi,
    pool: ['used', 'applied', 'employed', 'put to use', 'worked with'],
    reason: 'Substituted formal jargon "utilized" with natural past-tense verb',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\butilizes\b/gi,
    pool: ['uses', 'applies', 'employs', 'works with'],
    reason: 'Substituted formal jargon "utilizes" with natural verb',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\butilize\b/gi,
    pool: ['use', 'apply', 'employ', 'put to use', 'work with'],
    reason: 'Substituted formal jargon "utilize" with natural verb',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\butilizing\b/gi,
    pool: ['using', 'applying', 'employing', 'working with'],
    reason: 'Substituted formal jargon "utilizing"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'conversational', 'flow'],
  },
  {
    pattern: /\ba large number of\b/gi,
    pool: ['many', 'numerous', 'a lot of', 'plenty of', 'a great many'],
    reason: 'Condensed wordy quantifier',
    category: 'redundancy',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\ba significant number of\b/gi,
    pool: ['many', 'quite a few', 'a good number of', 'a substantial number of'],
    reason: 'Condensed "a significant number of"',
    category: 'redundancy',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\ba significant portion of\b/gi,
    pool: ['much of', 'a large part of', 'a good chunk of', 'a sizable share of'],
    reason: 'Condensed inflated phrase',
    category: 'redundancy',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bwith regard to\b/gi,
    pool: ['regarding', 'about', 'on the subject of', 'when it comes to', 'concerning'],
    reason: 'Replaced clunky prepositional phrase',
    category: 'flow',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bin terms of\b/gi,
    pool: ['concerning', 'regarding', 'as for', 'when it comes to', 'with respect to'],
    reason: 'Eliminated vague transitional phrase',
    category: 'flow',
    modes: ['formal', 'flow', 'natural', 'concise'],
  },
  {
    pattern: /\bneedless to say,?\s*/gi,
    pool: ['', 'Clearly, ', 'Naturally, ', 'Of course, '],
    reason: 'Removed deadweight expression "needless to say"',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational'],
  },
  {
    pattern: /\bfirst and foremost,?\s*/gi,
    pool: ['First, ', 'To start, ', 'Above all, ', 'Most importantly, ', 'Primarily, '],
    reason: 'Replaced cliché idiom "first and foremost"',
    category: 'phrasing',
    modes: ['natural', 'formal', 'flow', 'conversational'],
  },
  {
    pattern: /\bat the end of the day,?\s*/gi,
    pool: ['Ultimately, ', 'In the end, ', 'When all is said and done, ', 'Fundamentally, '],
    reason: 'Rotated overused closing phrase "at the end of the day"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bwithout further ado,?\s*/gi,
    pool: ['', 'So, ', 'Let\'s get into it. ', 'Here\'s the thing: '],
    reason: 'Removed stiff "without further ado" opener',
    category: 'filler',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bnot only .{0,60}? but also\b/gi,
    pool: [], // handled below in structural transforms
    reason: '',
    category: 'phrasing',
    modes: [],
  },
  {
    pattern: /\bof utmost importance\b/gi,
    pool: ['critical', 'very important', 'essential', 'paramount', 'a top priority'],
    reason: 'Replaced inflated "of utmost importance"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bplethora of\b/gi,
    pool: ['many', 'lots of', 'a wealth of', 'a wide range of', 'an abundance of'],
    reason: 'Replaced pompous "plethora of"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bmyriad of?\b/gi,
    pool: ['many', 'countless', 'a wide variety of', 'numerous', 'lots of'],
    reason: 'Replaced academic "myriad"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bin (?:today's|the modern) digital age\b/gi,
    pool: ['today', 'these days', 'in our connected world', 'now', 'in the modern era'],
    reason: 'Replaced AI-favored opener "digital age"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bthe realm of\b/gi,
    pool: ['the world of', 'the field of', 'the domain of', 'the area of'],
    reason: 'Replaced formal "realm of"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\ba (?:wide|broad|vast|diverse) range of\b/gi,
    pool: ['many types of', 'a variety of', 'all kinds of', 'various', 'many different'],
    reason: 'Condensed "a broad/wide range of"',
    category: 'redundancy',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bstate-of-the-art\b/gi,
    pool: ['cutting-edge', 'advanced', 'modern', 'leading', 'latest'],
    reason: 'Replaced overused superlative "state-of-the-art"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bcutting-edge\b/gi,
    pool: ['advanced', 'modern', 'leading', 'innovative', 'the latest'],
    reason: 'Replaced overused "cutting-edge"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bgroundbreaking\b/gi,
    pool: ['innovative', 'novel', 'original', 'pioneering', 'remarkable'],
    reason: 'Replaced AI-favored hyperbole "groundbreaking"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\brevolutionary\b/gi,
    pool: ['transformative', 'major', 'significant', 'major new', 'far-reaching'],
    reason: 'Replaced dramatic "revolutionary" with measured alternative',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bparadigm shift\b/gi,
    pool: ['major change', 'fundamental shift', 'turning point', 'big change', 'transformation'],
    reason: 'Replaced academic jargon "paradigm shift"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bsynergy\b/gi,
    pool: ['collaboration', 'teamwork', 'combined effort', 'partnership', 'joint effort'],
    reason: 'Replaced corporate jargon "synergy"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bproactive(?:ly)?\b/gi,
    pool: ['ahead of time', 'early on', 'in advance', 'before it happens', 'deliberately'],
    reason: 'Replaced corporate buzzword "proactive"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bstrategically\b/gi,
    pool: ['deliberately', 'intentionally', 'thoughtfully', 'carefully', 'purposefully'],
    reason: 'Replaced corporate adverb "strategically" with natural alternatives',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bstrategic\b/gi,
    pool: ['key', 'focused', 'planned', 'long-term', 'deliberate'],
    reason: 'Replaced corporate buzzword "strategic" with natural adjectives',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bcomprehensive(?:ly)?\b/gi,
    pool: ['thorough', 'complete', 'detailed', 'full', 'in-depth'],
    reason: 'Replaced formal "comprehensive" with direct alternatives',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\brobust\b/gi,
    pool: ['strong', 'solid', 'reliable', 'well-built', 'sturdy', 'dependable'],
    reason: 'Replaced overused tech/formal "robust"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bstreamline(?:s|d|ing)?\b/gi,
    pool: ['simplify', 'improve', 'speed up', 'make easier', 'clean up', 'optimize'],
    reason: 'Replaced business jargon "streamline"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bimpactful\b/gi,
    pool: ['effective', 'powerful', 'meaningful', 'significant', 'valuable'],
    reason: 'Replaced buzzword "impactful" with concrete alternatives',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bemphasize(?:s|d)?\b/gi,
    pool: ['stress', 'highlight', 'underscore', 'point out', 'focus on', 'make clear'],
    reason: 'Varied formal "emphasize"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bdemonstrate(?:s|d)?\b/gi,
    pool: ['show', 'prove', 'illustrate', 'make clear', 'reveal', 'confirm'],
    reason: 'Varied formal "demonstrate"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bultimately,?\s*/gi,
    pool: ['In the end, ', 'At its core, ', 'When it comes down to it, ', 'In the final analysis, ', 'Ultimately, '],
    reason: 'Rotated closing transition "ultimately"',
    category: 'flow',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\ba(?:s well as)\b/gi,
    pool: ['and', 'along with', 'together with', 'in addition to', 'plus'],
    reason: 'Simplified "as well as" connector',
    category: 'concise' as any,
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\btaking (?:everything )?into consideration\b/gi,
    pool: ['considering this', 'all things considered', 'overall', 'given all this'],
    reason: 'Replaced wordy synthesis phrase',
    category: 'filler',
    modes: ['concise', 'natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bit is (?:clear|evident|obvious) that\b/gi,
    pool: ['clearly,', 'obviously,', 'evidently,', ''],
    reason: 'Replaced hollow "it is clear that" construction',
    category: 'filler',
    modes: ['concise', 'natural', 'flow'],
  },
  {
    pattern: /\bone (?:must|should|can|may)\b/gi,
    pool: ['you', 'we', 'anyone'],
    reason: 'Replaced impersonal "one must/should" with direct address',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bprofound(?:ly)?\b/gi,
    pool: ['deep', 'significant', 'great', 'strong', 'meaningful'],
    reason: 'Replaced inflated "profound" with grounded alternatives',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\ba significant variance\b/gi,
    pool: ['a clear difference', 'a notable difference', 'a real contrast', 'a major divergence'],
    reason: 'Replaced inflated academic phrase "a significant variance"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'concise', 'flow'],
  },
  {
    pattern: /\bsignificant\b/gi,
    pool: ['notable', 'meaningful', 'major', 'substantial', 'clear'],
    reason: 'Varied overused adjective "significant"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },
  {
    pattern: /\bsignificantly\b/gi,
    pool: ['considerably', 'substantially', 'markedly', 'greatly', 'quite a bit'],
    reason: 'Varied overused adverb "significantly"',
    category: 'phrasing',
    modes: ['natural', 'conversational', 'flow'],
  },

  // ── Passive-voice common structures ───────────────────────────────────────
  {
    pattern: /\bit (?:has been|was) (?:shown|demonstrated|found|proven|established) that\b/gi,
    pool: ['research shows', 'studies show', 'evidence suggests', 'data confirms', 'findings indicate'],
    reason: 'Converted impersonal passive "it has been shown that"',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bcan be (?:seen|observed|noted) (?:in|from|through)\b/gi,
    pool: ['appears in', 'shows up in', 'is visible in', 'is evident in'],
    reason: 'Converted weak passive observation phrase',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
  {
    pattern: /\bwas (?:able to|found to|seen to)\b/gi,
    pool: ['could', 'managed to', 'did', 'proved to'],
    reason: 'Simplified passive compound modal',
    category: 'phrasing',
    modes: ['natural', 'concise', 'flow', 'conversational'],
  },
];

// ---------------------------------------------------------------------------
// SECTION 2: DETERMINISTIC RULES (mode-specific, always-apply)
// ---------------------------------------------------------------------------
const DETERMINISTIC_RULES: ReplacementPattern[] = [
  // Correlative conjunction replacement (removes classic AI hallmark)
  {
    pattern: /\bnot only\s+([\w\s,]+?)\s+but also\s+/gi,
    replacement: (_match: string, p1: string) => `both ${p1.trim()} and `,
    reason: 'Simplified correlative conjunction "not only... but also" to natural "both... and"',
    category: 'concise',
    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],
  },
  // Natural & Conversational contractions (breaks robotic AI stiffness)
  { pattern: /\bdo not\b/gi, replacement: "don't", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bcannot\b/gi, replacement: "can't", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bwill not\b/gi, replacement: "won't", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bshould not\b/gi, replacement: "shouldn't", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bwould not\b/gi, replacement: "wouldn't", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bcould not\b/gi, replacement: "couldn't", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bI am\b/g, replacement: "I'm", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow'] },
  { pattern: /\bI have\b/g, replacement: "I've", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow'] },
  { pattern: /\bI will\b/g, replacement: "I'll", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow'] },
  { pattern: /\bit is\b/gi, replacement: "it's", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bthat is\b/gi, replacement: "that's", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bthere is\b/gi, replacement: "there's", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bthey are\b/gi, replacement: "they're", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bwe are\b/gi, replacement: "we're", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\byou are\b/gi, replacement: "you're", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow', 'concise'] },
  { pattern: /\bhe is\b/gi, replacement: "he's", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow'] },
  { pattern: /\bshe is\b/gi, replacement: "she's", reason: 'Applied natural contraction', category: 'formality', modes: ['natural', 'conversational', 'flow'] },

  // Formal expansions
  { pattern: /\bdon't\b/gi, replacement: 'do not', reason: 'Expanded for formal register', category: 'formality', modes: ['formal'] },
  { pattern: /\bcan't\b/gi, replacement: 'cannot', reason: 'Expanded for formal register', category: 'formality', modes: ['formal'] },
  { pattern: /\bwon't\b/gi, replacement: 'will not', reason: 'Expanded for formal register', category: 'formality', modes: ['formal'] },
  { pattern: /\bit's\b/gi, replacement: 'it is', reason: 'Expanded for formal register', category: 'formality', modes: ['formal'] },
  { pattern: /\bkids\b/gi, replacement: 'children', reason: 'Elevated to formal register', category: 'formality', modes: ['formal'] },
  { pattern: /\ba lot of\b/gi, replacement: 'numerous', reason: 'Substituted colloquial quantifier', category: 'formality', modes: ['formal'] },
  { pattern: /\bstuff\b/gi, replacement: 'materials', reason: 'Replaced vague slang', category: 'formality', modes: ['formal'] },
  { pattern: /\bget\b/gi, replacement: 'obtain', reason: 'Elevated verb for formal register', category: 'formality', modes: ['formal'] },
  { pattern: /\bgot\b/gi, replacement: 'obtained', reason: 'Elevated verb for formal register', category: 'formality', modes: ['formal'] },

  // Cleanup
  { pattern: / {2,}/g, replacement: ' ', reason: 'Removed double spaces', category: 'filler', modes: ['natural', 'concise', 'conversational', 'formal', 'flow'] },
];

// ---------------------------------------------------------------------------
// SECTION 3: SENTENCE-LEVEL TRANSFORMATIONS
// These operate on sentence arrays, not character patterns
// ---------------------------------------------------------------------------

/**
 * Split a long sentence (≥30 words) at a coordinating conjunction or relative clause
 * to inject burstiness. Returns 1 or 2 sentences.
 */
function maybeSplitLongSentence(sentence: string, mode: HumanizerMode): string {
  if (mode === 'formal') return sentence;
  const words = sentence.trim().split(/\s+/);
  if (words.length < 28) return sentence;

  // Try splitting at coordinating conjunctions after word 12
  const conjRegex = /\b(, and |, but |, so |, yet |, or |; however, |; therefore, )\b/gi;
  let match: RegExpExecArray | null;
  const re = new RegExp(conjRegex.source, conjRegex.flags);

  while ((match = re.exec(sentence)) !== null) {
    const idx = match.index;
    const wordsBefore = sentence.slice(0, idx).split(/\s+/).length;
    if (wordsBefore >= 10 && wordsBefore <= words.length - 8) {
      const left = sentence.slice(0, idx).trim();
      let right = sentence.slice(idx + match[0].length).trim();
      // Capitalize right part
      right = right.charAt(0).toUpperCase() + right.slice(1);

      // Pick one of several joining strategies
      const strategy = pick(['split', 'split', 'dash', 'period']);
      if (strategy === 'dash') {
        return `${left} — ${right}`;
      }
      return `${left}. ${right}`;
    }
  }

  // Try splitting at "which" / "that" relative clause after word 15
  const relRegex = /\b(, which | that | who | where )\b/gi;
  const re2 = new RegExp(relRegex.source, relRegex.flags);
  while ((match = re2.exec(sentence)) !== null) {
    const wordsBefore = sentence.slice(0, match.index).split(/\s+/).length;
    if (wordsBefore >= 12 && wordsBefore <= words.length - 6) {
      const left = sentence.slice(0, match.index).trim();
      let right = sentence.slice(match.index + match[0].length).trim();
      right = right.charAt(0).toUpperCase() + right.slice(1);
      return `${left}. ${right}`;
    }
  }

  return sentence;
}

/**
 * Inject a light hedge or first-person aside into a sentence that starts with "AI" patterns.
 * Increases perplexity by making word choices less predictable.
 */
const HEDGES = [
  'In practice, ', 'To be fair, ', 'Generally speaking, ', 'That said, ',
  'Admittedly, ', 'As a rule, ', 'For the most part, ', 'In most cases, ',
  'Broadly speaking, ', 'By and large, ', 'As things stand, ',
  'Here\'s the thing: ', 'Worth noting: ', 'The short answer: ',
];

function maybeAddHedge(sentence: string, sentenceIndex: number, totalSentences: number): string {
  const trimmed = sentence.trim();
  // Never add a hedge to the first or last sentence
  if (sentenceIndex === 0 || sentenceIndex === totalSentences - 1) return sentence;
  // Skip short fragments or questions
  if (trimmed.length < 25 || trimmed.endsWith('?')) return sentence;

  // Never add a hedge to email salutations, closings, or politeness formulas
  const isEmailFormula = /^(?:Dear|Hi|Hello|Hey|Thank you|Thanks|Please|I look forward|Looking forward|Warm|Best|Kind|Sincerely|Hope|If you|With that|In fact|However|Although|These days|Nowadays|Right now|Following up|Quick update|Let me know)\b/i.test(trimmed);
  if (isEmailFormula) return sentence;

  // Only add a hedge to ~25% of body sentences
  if ((sentenceIndex * 7919) % 10 > 2) return sentence;

  // Preserve uppercase "I", "I'm", "I'd", etc.
  const startsWithPronounI = /^I(?:'|\s)/.test(trimmed);
  const adjusted = startsWithPronounI
    ? trimmed
    : trimmed.charAt(0).toLowerCase() + trimmed.slice(1);

  return pick(HEDGES, sentenceIndex) + adjusted;
}

/**
 * Vary the starter of sentences that all begin with "The" to reduce monotony.
 */
function varyMonotonousStarters(sentences: string[]): string[] {
  const THE_ALTERNATIVES = ['This', 'That', 'Such a', 'One such', 'Each'];
  let theCount = 0;
  return sentences.map((s, i) => {
    if (/^The\s/.test(s)) {
      theCount++;
      // Every 3rd "The"-started sentence, replace with an alternative
      if (theCount % 3 === 0) {
        const alt = pick(THE_ALTERNATIVES, i);
        return alt + s.slice(3);
      }
    }
    return s;
  });
}

/**
 * Merge pairs of very short sentences (< 6 words each) with a natural connector.
 */
const MERGE_CONNECTORS = [' and ', ', which means ', ', so ', ', making it ', ' — and '];
function mergeShortSentencePairs(sentences: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < sentences.length) {
    const curr = sentences[i];
    const next = sentences[i + 1];
    const currWords = curr.split(/\s+/).length;
    const nextWords = next ? next.split(/\s+/).length : 999;

    if (next && currWords < 6 && nextWords < 6 && currWords + nextWords < 14) {
      const connector = pick(MERGE_CONNECTORS, i);
      const merged = curr.replace(/[.!?]\s*$/, '') + connector + next.charAt(0).toLowerCase() + next.slice(1);
      result.push(merged);
      i += 2;
    } else {
      result.push(curr);
      i++;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// SECTION 4: HUMANIZATION SCORE CALCULATOR
// Estimates likelihood text is AI-generated vs human on 0-100 scale
// ---------------------------------------------------------------------------
const AI_SIGNALS = [
  /\bdelve(?:s|d|ing)?\b/gi, /\btapestry\b/gi, /\btestament\b/gi, /\bvital role\b/gi,
  /\bbeacon\b/gi, /\bembark(?:s|ed|ing)?\b/gi, /\bfoster(?:s|ed|ing)?\b/gi, /\bseamlessly\b/gi,
  /\bunlock(?:s|ed)? (?:the )?potential\b/gi, /\blandscape of\b/gi, /\bevolving landscape\b/gi,
  /\bplethora\b/gi, /\bmyriad\b/gi, /\bparadigm\b/gi, /\bsynergy\b/gi,
  /\bproactive\b/gi, /\bcomprehensive\b/gi, /\brobust\b/gi, /\bimpactful\b/gi,
  /\bin conclusion\b/gi, /\bfurthermore\b/gi, /\bmoreover\b/gi,
  /\bconsequently\b/gi, /\bin addition\b/gi, /\bnotably\b/gi,
  /\bit is important to\b/gi, /\bit is worth noting\b/gi, /\bit is crucial to\b/gi,
  /\bit is essential to\b/gi, /\bit should be noted\b/gi,
  /\bin today's (?:fast-paced|digital)?\b/gi, /\bstate-of-the-art\b/gi,
  /\bgroundbreaking\b/gi, /\bleverage\b/gi, /\butilize[sd]?\b/gi, /\butilizing\b/gi,
  /\bmultifaceted\b/gi, /\bintricacies\b/gi, /\bnuances\b/gi, /\bunderscores\b/gi,
  /\bharness(?:ing)?\b/gi, /\brevolutionize\b/gi, /\bcornerstone\b/gi, /\bparamount\b/gi,
  /\bcatalyst\b/gi, /\btransformative\b/gi, /\bindispensable\b/gi, /\bholistic\b/gi,
  /\bfast-paced world\b/gi, /\bmodern era\b/gi, /\bdigital age\b/gi,
  /\bpaves the way\b/gi, /\bsheds light on\b/gi, /\bdriving force\b/gi,
  /\bplays a (?:pivotal|key|central|significant) role\b/gi,
  /\bserves as a (?:testament|reminder|beacon)\b/gi,
  /\baims to (?:provide|ensure|deliver)\b/gi,
  /\bin order to\b/gi, /\bdue to the fact that\b/gi, /\bat this point in time\b/gi,
  /\bfor the purpose of\b/gi, /\bhas the ability to\b/gi,
  /\b(increase overall efficiency|drive higher productivity|automate repetitive tasks)\b/gi,
  /\b(optimal outcomes|significant impact|valuable insights|seamless integration)\b/gi,
  /\b(it goes without saying|first and foremost|at the end of the day|needless to say)\b/gi,
  /\b(crucial aspect|key factor|essential component|integral part)\b/gi,
  /\b(prior literature demonstrates|empirical observations|computational methodology)\b/gi,
  /\b(aforementioned|conduct an investigation into|duration of time)\b/gi,
];

export function scoreHumanization(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < 5) return 85;

  // ── 1. AI Signal Matches ──────────────────────────────────────────────────
  let aiSignalCount = 0;
  for (const sig of AI_SIGNALS) {
    const clone = new RegExp(sig.source, sig.flags);
    const matches = text.match(clone);
    if (matches) aiSignalCount += matches.length;
  }

  // ── 2. Uncontracted Auxiliaries vs Contractions ────────────────────────────
  const uncontracted = (text.match(/\b(it is|there is|they are|we are|cannot|do not|does not|will not|should not|would not|could not|have not|has not|is not|are not)\b/gi) || []).length;
  const contractions = (text.match(/\b(it's|there's|they're|we're|can't|don't|doesn't|won't|shouldn't|wouldn't|couldn't|haven't|hasn't|isn't|aren't|I'm|I've|I'll|you're|he's|she's)\b/gi) || []).length;

  // ── 3. Sentence Length Variance (Burstiness) ──────────────────────────────
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  let burstinessStdDev = 5;
  if (sentences.length >= 2) {
    const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    burstinessStdDev = Math.sqrt(variance);
  }

  let score = 92;

  // AI signal penalties
  if (aiSignalCount > 0) {
    const signalDensity = (aiSignalCount / wordCount) * 100;
    const penalty = Math.min(signalDensity * 7.5 + aiSignalCount * 7.5, 76);
    score -= penalty;
  }

  // Formality penalty / contractions bonus
  if (uncontracted >= 2 && contractions === 0) {
    score -= Math.min(uncontracted * 5, 20);
  } else if (contractions > 0) {
    score += Math.min(contractions * 2, 4);
  }

  // Sentence burstiness impact
  if (sentences.length >= 2) {
    if (burstinessStdDev < 2.5) {
      score -= 10;
    } else if (burstinessStdDev >= 5.0) {
      score += 2;
    }
  }

  return Math.max(12, Math.min(97, Math.round(score)));
}


// ---------------------------------------------------------------------------
// MAIN ENGINE CLASS
// ---------------------------------------------------------------------------
export class RuleBasedHumanizerEngine implements LocalHumanizerEngine {
  public readonly id = 'deterministic-rules';
  public readonly name = 'Advanced Linguistic Engine v2 (On-Device, 100% Private)';
  public readonly isAvailable = true;
  public readonly requiresDownload = false;

  public async process(text: string, options: HumanizerOptions): Promise<HumanizerResult> {
    const { mode } = options;
    if (!text || text.trim().length === 0) {
      return {
        originalText: text,
        improvedText: text,
        mode,
        changes: [],
        stats: { originalWords: 0, improvedWords: 0, reductionPercentage: 0, readingTimeSeconds: 0 },
        engineName: this.name,
        engineType: 'deterministic-rules',
        processedLocally: true,
      };
    }

    let modified = text;
    const recordedChanges: HumanizerChange[] = [];

    // ── PASS 1: Pool-based cliché replacements ───────────────────────────────
    for (const rule of CLICHE_POOLS) {
      if (rule.pool.length === 0 || !rule.modes.includes(mode)) continue;

      let matchCount = 0;
      modified = modified.replace(rule.pattern, (match) => {
        const rep = pick(rule.pool, matchCount++);
        const formatted = match[0] === match[0].toUpperCase() && rep.length > 0
          ? rep.charAt(0).toUpperCase() + rep.slice(1)
          : rep;
        recordedChanges.push({
          original: match,
          replacement: formatted,
          reason: rule.reason,
          category: rule.category,
          index: 0,
        });
        return formatted;
      });
    }

    // ── PASS 2: Deterministic rules ──────────────────────────────────────────
    for (const rule of DETERMINISTIC_RULES) {
      if (!rule.modes.includes(mode)) continue;
      modified = modified.replace(rule.pattern, (m, ...args) => {
        const rep = typeof rule.replacement === 'function' ? rule.replacement(m, ...args) : rule.replacement;
        const formatted = m[0] === m[0].toUpperCase() && rep.length > 0
          ? rep.charAt(0).toUpperCase() + rep.slice(1)
          : rep;
        if (rep !== m) {
          recordedChanges.push({
            original: m,
            replacement: formatted,
            reason: rule.reason,
            category: rule.category,
            index: 0,
          });
        }
        return formatted;
      });
    }

    // ── PASS 3: Sentence-level structural transforms ──────────────────────────
    if (mode === 'natural' || mode === 'flow' || mode === 'conversational') {
      // Split into sentences preserving terminators
      const sentenceRegex = /([^.!?]*[.!?]+\s*)/g;
      const sentenceParts: string[] = [];
      let lastIndex = 0;
      let m: RegExpExecArray | null;

      while ((m = sentenceRegex.exec(modified)) !== null) {
        sentenceParts.push(m[0]);
        lastIndex = m.index + m[0].length;
      }
      // Remainder without terminator
      const remainder = modified.slice(lastIndex).trim();
      if (remainder) sentenceParts.push(remainder);

      let sentences = sentenceParts.map(s => s.trim()).filter(Boolean);

      // 3a. Split long sentences for burstiness
      sentences = sentences.map(s => maybeSplitLongSentence(s, mode));

      // 3b. Merge tiny sentence pairs
      sentences = mergeShortSentencePairs(sentences);

      // 3c. Vary monotonous "The" starters
      sentences = varyMonotonousStarters(sentences);

      // 3d. Add hedges for natural/conversational modes
      if (mode === 'natural' || mode === 'conversational') {
        sentences = sentences.map((s, i) => maybeAddHedge(s, i, sentences.length));
      }

      modified = sentences.join(' ').replace(/ {2,}/g, ' ').trim();
    }

    // ── PASS 4: Final cleanup ─────────────────────────────────────────────────
    modified = modified.replace(/ {2,}/g, ' ');
    modified = modified.replace(/\.{2,}/g, '.');
    modified = modified.replace(/,{2,}/g, ',');
    modified = modified.replace(/\s+([,.:;!?])/g, '$1');
    modified = modified.replace(/([.!?])\s*([a-z])/g, (_, punc, letter) => `${punc} ${letter.toUpperCase()}`);

    // ── STATS ─────────────────────────────────────────────────────────────────
    const origWords = text.trim().split(/\s+/).filter(Boolean).length;
    const impWords = modified.trim().split(/\s+/).filter(Boolean).length;
    const wordDiff = origWords - impWords;
    const reductionPercentage = origWords > 0 ? Math.round((wordDiff / origWords) * 100) : 0;
    const readingTimeSeconds = Math.round((impWords / 200) * 60);

    return {
      originalText: text,
      improvedText: modified,
      mode,
      changes: recordedChanges,
      stats: {
        originalWords: origWords,
        improvedWords: impWords,
        reductionPercentage,
        readingTimeSeconds,
      },
      engineName: this.name,
      engineType: 'deterministic-rules',
      processedLocally: true,
    };
  }
}
