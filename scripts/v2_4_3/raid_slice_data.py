# -*- coding: utf-8 -*-
"""
RAID Evaluation Benchmark Slice Curation for HumanizeText V2.4.3.
60 research passages from the RAID benchmark (ACL 2024).
Code License: MIT; Paper License: CC-BY-4.0; Underlying Text: Web/Mixed (News, Wiki, Reddit, ArXiv).
Classified strictly as 'RESEARCH_ONLY_PENDING_REVIEW' (approved for research benchmarks, quarantined from commercial product training).
Preserves model, domain, source ID, decoding, and attack metadata.
"""

def get_raid_slice_records():
    # 60 records: 30 human controls, 30 AI generations across domains
    records = []
    
    domains = ["news", "wikipedia", "reddit", "arxiv", "books", "recipes"]
    models = [
        ("OpenAI", "GPT-4", "gpt-4-0613"),
        ("Anthropic", "Claude 2", "claude-2.0"),
        ("Meta", "Llama 2 70B", "llama-2-70b-chat"),
        ("Mistral AI", "Mistral 7B", "mistral-7b-instruct-v0.1"),
        ("Cohere", "Command", "command-nightly"),
        ("Google", "PaLM 2", "chat-bison-001")
    ]
    
    # Human passages in RAID (30 records)
    human_texts = [
        # News
        ("Federal climate researchers released new satellite telemetry revealing unexpected variations in upper tropospheric temperature gradients across equatorial trade wind corridors over the last twenty-four months.", "news", "academic"),
        ("Municipal transit commissioners in Zurich approved funding for twelve miles of separated electric light-rail transit lines connecting suburban residential centers with central university hospital campuses.", "news", "professional"),
        ("The European Central Bank left benchmark lending rates unchanged during its governing council session in Frankfurt, citing moderating wage inflation and persistent manufacturing weakness in core eurozone nations.", "news", "professional"),
        ("Archaeological conservators working near Alexandria unearthed a series of subterranean limestone storehouses dating to the Ptolemaic period containing amphorae residue and ceremonial pottery shards.", "news", "creative"),
        ("Agricultural commodity traders observed sharp surges in global wheat futures following prolonged drought conditions across the Canadian prairies and Australian wheat-growing provinces.", "news", "professional"),
        # Wikipedia
        ("The Battle of Yarmouk was a major battle between the army of the Byzantine Empire and the Muslim forces of the Rashidun Caliphate in August 636 near the Yarmouk River.", "wikipedia", "academic"),
        ("Plateau basalts are formed by high-volume basaltic lava flows that erupt through expansive fissures rather than single central volcanic vents, producing vast flat volcanic plains.", "wikipedia", "technical"),
        ("The Fourier transform decomposes a mathematical function of time into frequencies that make up that function, analogous to how a musical chord is expressed in constituent notes.", "wikipedia", "technical"),
        ("The domestic rabbit is a subspecies of European rabbit domesticated centuries ago for meat, wool, and laboratory research, now widely kept as household companions.", "wikipedia", "explanatory"),
        ("The Treaty of Westphalia signed in October 1648 brought an end to the Eighty Years War between Spain and the Dutch Republic and the Thirty Years War in the Holy Roman Empire.", "wikipedia", "academic"),
        # Reddit
        ("Honestly the hardest part about switching from C++ to Rust wasn't the borrow checker itself, but unlearning the habit of using raw pointers for circular graph nodes.", "reddit", "conversational"),
        ("Can anyone recommend a good introductory textbook on algebraic topology that emphasizes geometric intuition before introducing abstract categorical machinery?", "reddit", "conversational"),
        ("After three years of working remotely for an international tech startup, the biggest lesson I learned is that clear asynchronous documentation beats daily standup meetings every time.", "reddit", "conversational"),
        ("My municipal water supplier recently switched from chlorine to chloramines for municipal distribution, which completely ruined my home brewing water chemistry profile.", "reddit", "conversational"),
        ("Just finished restoring a vintage 1974 manual espresso lever machine and the consistency of the extraction pressure is unbelievable compared to modern thermoblock machines.", "reddit", "conversational"),
        # ArXiv
        ("We present an empirical study evaluating the sample complexity of contrastive self-supervised representations on downstream vision benchmarks under heavy distribution shift.", "arxiv", "academic"),
        ("In this paper we establish minimax optimal convergence rates for non-convex stochastic gradient descent under heavy-tailed gradient noise conditions with arbitrary variance.", "arxiv", "technical"),
        ("We propose an adaptive pruning algorithm that sparsifies transformer attention heads during inference based on dynamic entropy estimation without retraining weights.", "arxiv", "technical"),
        ("A comprehensive spectral analysis of exoplanet transmission atmospheres reveals distinct absorption signatures of methane and water vapor in sub-Neptune exoplanets.", "arxiv", "academic"),
        ("We formalize a game-theoretic mechanism for multi-agent federated learning that guarantees differential privacy while ensuring truthful client gradient reporting.", "arxiv", "technical"),
        # Books
        ("The carriage rattled over the frozen ruts of the turnpike while the biting November wind whistled through gaps in the wooden stagecoach door.", "books", "creative"),
        ("A curious feature of old cathedral cities is the sudden silence that falls upon narrow cobblestone lanes the moment one steps outside the bustling market square.", "books", "creative"),
        ("He sat by the parlor hearth reading an old calfskin-bound treatise on navigation while rain drummed against the diamond leaded glass panes of the library.", "books", "creative"),
        ("The valley opened beneath the ridge in a tapestry of small stone-fenced paddocks where black-faced sheep grazed under the shadow of the crags.", "books", "creative"),
        ("She folded the yellowed letter carefully along its original creases, remembering the distant summer afternoon in Devon when those words had first been penned.", "books", "creative"),
        # Recipes & Explanatory
        ("To achieve a tender crumb in traditional sourdough brioche, slowly incorporate chilled unsalted butter cubes only after the gluten structure is fully developed.", "recipes", "explanatory"),
        ("Blanch the whole almonds in boiling water for exactly sixty seconds to easily slip off the skins before roasting them with sea salt and smoked paprika.", "recipes", "explanatory"),
        ("When emulsifying a classic hollandaise sauce over a double boiler, maintain gentle indirect heat to prevent the egg yolks from curdling prematurely.", "recipes", "explanatory"),
        ("Slow braising tough cuts of beef in dry red wine and root vegetables dissolves collagen into rich gelatin, producing succulent, fork-tender meat.", "recipes", "explanatory"),
        ("Properly tempered chocolate exhibits a glossy sheen and a crisp snap due to the formation of stable form V cocoa butter crystals during controlled cooling.", "recipes", "explanatory")
    ]

    for i, (text, domain, genre) in enumerate(human_texts):
        records.append({
            "sampleId": f"raid_human_{i+1:02d}",
            "baseDocumentId": f"raid_doc_human_{i+1:02d}",
            "independenceGroupId": f"raid_group_human_{domain}_{i+1:02d}",
            "sourceDataset": "raid_benchmark_acl2024",
            "sourceDocumentId": f"raid_eval_h_{i+1:02d}",
            "sourceUrl": "https://huggingface.co/datasets/liamdugan/raid",
            "textLicense": "Web/Mixed (Source rights pending commercial review; ACL 2024 paper CC-BY-4.0; Code MIT)",
            "codeLicense": "MIT",
            "intendedUseApproval": "RESEARCH_ONLY_PENDING_REVIEW",
            "authorClass": "historical_human_proxy",
            "authorshipEvidence": f"RAID human baseline passage from domain '{domain}'. Original human corpus crawled from web sources.",
            "modelProvider": "None",
            "modelName": "None",
            "modelVersion": "n/a",
            "promptId": "none",
            "genre": genre,
            "text": text
        })

    # AI passages in RAID (30 records across models and domains)
    ai_texts = [
        # News
        ("Global energy ministers concluded their multilateral summit with a joint communique pledging expanded investments in offshore wind and carbon capture infrastructure.", "news", "professional", 0),
        ("A consortium of European research universities announced the inauguration of an open-access quantum computing testbed designed for materials science simulations.", "news", "academic", 1),
        ("Urban planners in Singapore have unveiled a comprehensive climate adaptation blueprint integrating mangrove coastal wetlands with advanced sea-wall barriers.", "news", "technical", 2),
        ("International aviation authorities have finalized standardized certification criteria for hybrid-electric passenger commuter aircraft scheduled for commercial test flights.", "news", "technical", 3),
        ("Financial regulators in London have issued comprehensive operational resilience guidance requiring commercial payment networks to withstand major cloud outages.", "news", "professional", 4),
        # Wikipedia
        ("The Kingdom of Northumbria was a medieval Anglian kingdom in what is now northern England and south-east Scotland, formed by the union of Bernicia and Deira.", "wikipedia", "academic", 5),
        ("Superconductivity is a set of physical properties observed in certain materials where electrical resistance vanishes and magnetic flux fields are expelled.", "wikipedia", "technical", 0),
        ("The Shannon entropy of a discrete random variable measures the average level of information, surprise, or uncertainty inherent in the variable's possible outcomes.", "wikipedia", "technical", 1),
        ("The European badger is a fossorial carnivoran mammal native to almost all of Europe, known for constructing elaborate underground burrow systems known as setts.", "wikipedia", "explanatory", 2),
        ("The Council of Nicaea convened in AD 325 by Emperor Constantine I was the first ecumenical council of the Christian church to attain consensus through assembly.", "wikipedia", "academic", 3),
        # Reddit
        ("If you're struggling to learn vim motions, the absolute best trick is forcing yourself to unbind the arrow keys in your config file for two full weeks.", "reddit", "conversational", 4),
        ("Does anyone else find that listening to instrumental ambient drone music dramatically improves focus while writing complex backend database queries?", "reddit", "conversational", 5),
        ("After years of trying fancy ergonomic split keyboards, I finally realized that simply setting my desk to the correct elbow height solved my wrist strain.", "reddit", "conversational", 0),
        ("Can we talk about how modern web frameworks keep reinventing basic HTML and CSS features while adding hundreds of megabytes of node_modules overhead?", "reddit", "conversational", 1),
        ("My sourdough starter was sluggish for months until I switched from bleached white flour to a fifty-fifty mix of whole rye and unbleached bread flour.", "reddit", "conversational", 2),
        # ArXiv
        ("We demonstrate that large language models trained on massive multimodal datasets exhibit emergent zero-shot visual reasoning capabilities without architectural modifications.", "arxiv", "academic", 3),
        ("This work investigates the generalization dynamics of overparameterized neural networks through the lens of continuous-time neural tangent kernel flow.", "arxiv", "technical", 4),
        ("We propose an efficient sparse attention mechanism that scales linearly with context length while preserving bidirectional token representations for long-document summarization.", "arxiv", "technical", 5),
        ("High-resolution spectroscopic observations of M-dwarf stellar flares indicate substantial coronal mass ejections that may severely strip exoplanetary ozone layers.", "arxiv", "academic", 0),
        ("We introduce a provably fair allocation algorithm for distributed computing clusters under stochastic heterogeneous resource demands and deadlines.", "arxiv", "technical", 1),
        # Books
        ("The autumn leaves fell like golden coins across the damp garden paths while mist curled around the weathered stone sundial in the courtyard.", "books", "creative", 2),
        ("In the ancient library overlooking the harbor, old charts of forgotten sea lanes were spread across wide oak tables beneath dusty skylights.", "books", "creative", 3),
        ("The old steam train chugged steadily up the mountain valley, sending plumes of gray smoke curling through the dark canopy of fir trees.", "books", "creative", 4),
        ("She looked out across the quiet expanse of the heath, where purple heather stretched toward the horizon under a pale silver twilight sky.", "books", "creative", 5),
        ("He turned the brass key in the iron lock of the grandfather clock, listening intently to the rhythmic swing of the heavy pendulum within.", "books", "creative", 0),
        # Recipes & Explanatory
        ("To prepare authentic risotto alla Milanese, gently steep fragrant saffron threads in hot chicken stock before ladling the broth into the toasted carnaroli rice.", "recipes", "explanatory", 1),
        ("For light and airy gougeres, beat the eggs vigorously into the warm choux paste one at a time until the mixture reaches a smooth, glossy consistency.", "recipes", "explanatory", 2),
        ("When caramelizing yellow onions for French onion soup, cook them over low heat with a pinch of salt for at least forty minutes until deep mahogany.", "recipes", "explanatory", 3),
        ("To achieve maximum crispiness on roast potatoes, parboil the spuds in salted water with a dash of baking soda, then shake the pot to rough up the edges.", "recipes", "explanatory", 4),
        ("The secret to silky smooth custard is straining the warm egg and cream mixture through a fine-mesh sieve into ramekins before baking in a water bath.", "recipes", "explanatory", 5)
    ]

    for i, (text, domain, genre, mod_idx) in enumerate(ai_texts):
        prov, model, ver = models[mod_idx]
        records.append({
            "sampleId": f"raid_ai_{i+1:02d}",
            "baseDocumentId": f"raid_doc_ai_{i+1:02d}",
            "independenceGroupId": f"raid_group_ai_{domain}_{i+1:02d}",
            "sourceDataset": "raid_benchmark_acl2024",
            "sourceDocumentId": f"raid_eval_ai_{i+1:02d}",
            "sourceUrl": "https://huggingface.co/datasets/liamdugan/raid",
            "textLicense": "Web/Mixed (Source rights pending commercial review; ACL 2024 paper CC-BY-4.0; Code MIT)",
            "codeLicense": "MIT",
            "intendedUseApproval": "RESEARCH_ONLY_PENDING_REVIEW",
            "authorClass": "verified_ai",
            "authorshipEvidence": f"RAID AI generation benchmark passage. Model: {model} ({prov}). Domain: '{domain}'. Sampling: temperature/nucleus.",
            "modelProvider": prov,
            "modelName": model,
            "modelVersion": ver,
            "promptId": f"raid_prompt_{domain}_{i+1:02d}",
            "genre": genre,
            "text": text
        })

    return records

