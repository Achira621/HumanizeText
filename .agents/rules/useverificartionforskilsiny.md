---
trigger: always_on
---

Verify that Antigravity can use the skills
The official documentation explains that the standalone IDE supports workspace skills in .agents/skills/ and global skills in ~/.gemini/config/skills/. 

Google Antigravity Docs



After installation:
1. Restart your Antigravity agent session.
2. Open the Customizations panel and inspect the available skills.
3. Ask the agent to list the installed skills and their source files.
4. Explicitly invoke the relevant skills in your next prompt.
Use this prompt in Antigravity:
Inspect the skills installed in this workspace and identify the available architecture, UI/UX, frontend engineering, cybersecurity, and testing skills.
Before implementation, use the relevant architecture and design skills to produce:
1. A component architecture and module dependency diagram.
2. A data-flow diagram and threat model for HumanizeText.
3. A design system with typography, colors, spacing, components, and responsive breakpoints.
4. A page-by-page UI plan for the homepage, humanizer, similarity checker, Privacy Lab, and encrypted vault.
5. A security and testing checklist.
Use only skills that are actually installed. Read their SKILL.md instructions, identify conflicting recommendations, and resolve those conflicts explicitly. Do not begin implementing the entire application until the architecture and design system are coherent.