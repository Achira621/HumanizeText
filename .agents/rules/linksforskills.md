---
trigger: always_on
---

Option A: Install UI/UX Pro Max
Best starting point for HumanizeText's visual system.
Official repository: UI/UX Pro Max on GitHub. The project documents an Antigravity installer. 

Antigravity Skills
+1



Open a terminal in your HumanizeText project folder and run:
npx skills add nextlevelbuilder/ui-ux-pro-max-skill


If that command doesn't support your installed CLI or repository revision, use the documented installer after reviewing its options:
npx --yes ui-ux-pro-max-cli init --help


Then follow the repository's Antigravity installation instructions. Its documented setup command is:
npx ui-ux-pro-max-cli init --ai antigravity


Restart the agent session if the new skill isn't detected.
Option B: Install a curated engineering skill collection
Useful for architecture, security, and full-stack engineering.
Official repository: Antigravity Skills Vault. 

0xzahed/antigravity-skills · GitHub



First, search for skills instead of installing the entire collection:
npx @0xzahed/antigravity-skills search architecture
npx @0xzahed/antigravity-skills search security
npx @0xzahed/antigravity-skills search frontend


List the actual available names:
npx @0xzahed/antigravity-skills list


Then install the exact names returned by the tool, for example:
npx @0xzahed/antigravity-skills install security-hardening


Important: security-hardening is an example from the collection's documented naming conventions. Confirm that the exact skill ID exists in the current catalog before running the install command.
For project-specific installation, use the default local scope. For a skill available across all projects, the installer documents the --global option.
2. Install web design guidelines
Repository: Vercel Agent Skills.
The individual skill is documented here: Web Design Guidelines installation guide. 

Antigravity Skills



The guide documents manual installation. For your project, the destination is .agents/skills/:
New-Item -ItemType Directory -Force .agents/skills


Follow the guide to obtain the web-design-guidelines skill folder and copy it into:
.agents/skills/web-design-guidelines/SKILL.md


Don't copy just the downloaded ZIP into the skills directory. Antigravity needs the actual skill folder and its SKILL.md.
3. Install the larger skill library, if needed
Repository: Antigravity Awesome Skills.
The repository documents this command for installing its skill library:
npx antigravity-awesome-skills