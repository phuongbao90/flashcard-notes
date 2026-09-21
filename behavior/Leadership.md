# Leadership

## Leading without formal authority

### Question b3be051c-aa62-4119-a5d5-201b212914dd

- Tell me about a time you got another team to change their approach when you had no authority over them.

### Answer

- **Situation:** As Senior Mobile Developer at Cigro, I led mobile development on Uobong, the trekking app for our largest client. The GPS APIs we consumed had been designed without mobile's offline reality in mind.
- **Task:** I needed the backend owners to adjust the GPS API design, even though none of them reported to me.
- **Action:** I mapped exactly where GPS tracking broke on real treks, drafted a proposal showing how the current API shape forced rework in our offline logic, and ran a joint design session where we co-architected the contract together.
- **Result:** The GPS APIs were redesigned around our constraints; mobile stopped fighting the contract, and the trekking features the client cared about shipped cleanly.
- **Worst case:** If the backend owners had refused to rework the GPS APIs, I would have stopped pushing my proposal and instead built a thin client-side adaptation layer in our offline logic, and proposed revisiting the contract with real failure data. The signal to switch would have been a second design session ending without a committed owner.
- [More detail on situational leadership](https://en.wikipedia.org/wiki/Situational_leadership)

---

### Question 0d208099-c172-4c50-8b56-0ed572011708

- Describe a situation where you influenced other developers to adopt a practice they were hesitant about.

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, I maintained a Turborepo monorepo of five React Native Expo apps — social feed, e-commerce, e-learning — and each team had a habit of copying its own versions of the same components.
- **Task:** Convince all the app teams to consume shared components instead of duplicating them.
- **Action:** I started small: extracted the components two apps were already duplicating, documented them, and paired with one team first. When the second team saw the first shipping faster, adoption stopped being my argument to win.
- **Result:** All five apps drew from the shared component set; a change landed once instead of five times, and consistency across the apps improved.
- **Worst case:** If teams had kept copying their own components even after the pilot, I would have stopped selling reuse and instead asked each team lead what the shared versions were missing, then fixed those gaps before widening adoption. The signal would have been the second team still duplicating components after the first success.
- [More detail on persuasion](https://en.wikipedia.org/wiki/Persuasion)

---

### Question 56121d73-cdc5-4cd9-8797-903700f38e95

- How did you handle resistance on your team to a new way of working?

### Answer

- **Situation:** At Cigro, I introduced AI-driven automated testing with Maestro E2E pipelines to protect Uobong's critical trekking flows — GPS pathing, map loading, offline sync. Some developers initially saw it as overhead on top of feature work.
- **Task:** Earn genuine buy-in, not grudging compliance.
- **Action:** I covered the first flows myself and showed the pipeline catching a regression in offline sync before release. I then invited the skeptics to write scenarios for the features they owned, so the workflow served their work instead of policing it.
- **Result:** The E2E pipeline became part of our normal release workflow; developers added coverage to their own flows without me pushing.
- **Worst case:** Had the skeptics stayed convinced the E2E pipeline was overhead, I would have confined it to the offline-sync and GPS flows I covered myself rather than forcing it on everyone, and revisited once results were visible. The signal would have been no developer adding scenarios for their own flows after the first month.
- [More detail on situational leadership](https://en.wikipedia.org/wiki/Situational_leadership)

---

### Question 4bab2caa-9e6f-4e46-ba4e-5eb8fde8aae6

- Tell me about leading a change when you were not the manager.

### Answer

- **Situation:** At ZenGroup, as a web and mobile developer, I mentored four developers. There were no agreed coding standards, so every pull request discussion relitigated the same style arguments.
- **Task:** Raise the quality bar with no formal authority over my mentees.
- **Action:** I ran a session where the four of them proposed the standards themselves; I only facilitated and captured the outcome. Because they authored the rules, defending them in reviews became their standard, not my imposition.
- **Result:** Review discussions got shorter and shifted to design; the standards outlasted my involvement because the team owned them.
- **Worst case:** If the four developers had kept relitigating style in reviews after authoring the standards, I would have accepted that the rules were mine, not theirs - rewritten them with the two loudest dissenters, and dropped anything without consensus. The signal would have been review threads still re-debating agreed conventions after two weeks.
- [More detail on persuasion](https://en.wikipedia.org/wiki/Persuasion)

---

## Delegation and ownership

### Question dc57ec71-f145-4576-8f2f-7e8bfb338507

- Tell me about a time you delegated something important. How did you decide what, and to whom?

### Answer

- **Situation:** At Cigro, leading mobile development on Uobong, I owned the offline-sync architecture — and had become the bottleneck for every decision on the app.
- **Task:** Keep the architecture moving while growing the team instead of hoarding the work.
- **Action:** I split ownership by strength: I kept the offline-sync design, and handed GPS-pathing features and map-loading work to developers who had shown capability there, reviewing their designs instead of writing them myself.
- **Result:** Features moved without waiting on me, and the developers I delegated to grew into those areas — two of them became my go-to people for GPS and map work.
- **Worst case:** If the delegated GPS and map work had stalled or shipped with quality slips, I would have taken those areas back temporarily and paired on the next feature instead of re-assuming permanent ownership. The signal would have been design reviews repeatedly returning the same corrections, or features slipping past their release window twice.
- [More detail on delegation](https://en.wikipedia.org/wiki/Delegation)

---

### Question f920f489-bcc7-4bf9-baa7-b482829a6f9b

- Describe how you divided responsibility across a team you led.

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, I led a team of five mobile developers working across a Turborepo monorepo of five Expo apps.
- **Task:** Give each developer real ownership rather than a stream of assigned tasks.
- **Action:** I assigned app-level ownership — each developer answered for one app's releases inside the monorepo — while shared components were owned jointly, with me arbitrating conflicts. I reviewed direction in regular one-on-ones instead of approving every change.
- **Result:** The team shipped releases independently of me; my role shifted to unblocking and reviewing direction, which is where a lead adds most value.
- **Worst case:** Had per-app ownership produced uneven release quality across the monorepo, I would have tightened the shared definition of done before shrinking anyone's scope, and taken direct charge of the weakest app's next release. The signal would have been one app's releases repeatedly needing my intervention to ship.
- [More detail on accountability](https://en.wikipedia.org/wiki/Accountability)

---

### Question 4fd92dc9-fc39-4989-b123-1d62d1c6bf7a

- Tell me about a time you handed off something you personally founded.

### Answer

- **Situation:** At Cigro, I organized weekly cross-team sharing sessions on issues and pain points. They worked well, but they consumed my preparation time and centered too much on me.
- **Task:** Make the sessions survive and scale beyond my own involvement.
- **Action:** I moved to a rotating host model: each week a different team presented a pain point they had solved. I coached presenters on structure beforehand and only stepped in when a session stalled.
- **Result:** The sessions kept running with topics I would never have covered alone; teams started bringing problems to each other instead of routing everything through me.
- **Worst case:** If the rotating hosts had dried up after the first few weeks, I would have resumed hosting while pre-seeding the next month's topics with teams I knew had stories ready, rather than letting the sessions lapse. The signal to switch would have been two consecutive weeks with no volunteer presenter.
- [More detail on delegation](https://en.wikipedia.org/wiki/Delegation)

---

### Question 979b5ef7-6bfc-44ef-bcba-7d04c715e7ce

- Describe a time you gave someone ownership of something you cared deeply about.

### Answer

- **Situation:** In the GOSOFT monorepo, the shared components were the part I cared most about — five apps depended on them, and I initially reviewed every change myself.
- **Task:** Stop being the single gatekeeper without letting quality slip.
- **Action:** I handed each app team ownership of the components they used most, wrote down what a shared change must satisfy, and moved to reviewing only changes with cross-app impact.
- **Result:** Component changes landed faster and the teams caught their own regressions, because the ownership was real rather than nominal. My review queue shrank to what genuinely needed me.
- **Worst case:** If component quality had slipped once app teams owned their changes, I would have reinstated review on the worst-affected component first - not all of them - and paired with that team on the conventions. The signal would have been cross-app regressions reaching another team's app more than once.
- [More detail on accountability](https://en.wikipedia.org/wiki/Accountability)

---

## Mentoring and growing engineers

### Question f5055516-3d35-4992-89e3-e07dde9efaa9

- Tell me about mentoring someone who was stuck.

### Answer

- **Situation:** At Cigro, on the Uobong trekking app, one of the developers I mentored kept hitting state-management issues that only surfaced in long-running GPS sessions.
- **Task:** Help him get unstuck — and able to diagnose this class of issue himself next time.
- **Action:** I did not hand him the fix. We reproduced a failing session together, walked the state transitions, and I taught him to read the session telemetry we had added to isolate state issues. He drove the fix; I asked questions.
- **Result:** He found the next state issue on his own, and later he was the one walking other developers through telemetry.
- **Worst case:** If the guided telemetry walkthroughs had not made him self-sufficient - he kept bringing me the same class of state issue - I would have switched from questioning to pairing full-time on his next diagnosis and slowed the feature commitments around him. The signal would have been two more issues escalated to me unresolved.
- [More detail on mentorship](https://en.wikipedia.org/wiki/Mentorship)

---

### Question 24f7eb4b-5e18-45b1-840b-70faac590c32

- Describe a time you helped a junior engineer grow into more responsibility.

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, leading five mobile developers, I noticed one junior's code was consistently safe but he never reviewed anyone else's work.
- **Task:** Grow him from a consumer of reviews into a reviewer.
- **Action:** I paired him into my own reviews — I would ask what he would flag before showing my list. After a few weeks I assigned him real reviews on the e-learning app with me as backup, and gave him feedback on his feedback.
- **Result:** He became a regular reviewer for his app, and his comments started catching issues mine had missed.
- **Worst case:** Had his reviews stayed shallow once he reviewed alone, I would have extended the pairing phase and shadow-reviewed his app's pull requests for another cycle instead of declaring the growth done. The signal would have been his review comments missing issues that his own code later surfaced.
- [More detail on feedback](https://en.wikipedia.org/wiki/Feedback)

---

### Question cbf66ada-fa62-4262-837d-506f366658f3

- How did you approach teaching a team something completely new to them?

### Answer

- **Situation:** At Cigro, I wanted the mobile team to use AI-driven workflows in daily development and testing, but most of them had never worked that way.
- **Task:** Turn an unfamiliar way of working into a team capability, not a personal trick.
- **Action:** I ran hands-on sessions on real Uobong tasks instead of demos — each developer applied the workflow to their own ticket while I paired with them. We kept a shared list of what worked and what did not, and I adjusted the workflow from their findings.
- **Result:** The team adopted the AI workflows into normal delivery; people stopped waiting for me to run things for them.
- **Worst case:** If the hands-on sessions had failed to make the workflows stick - people still waiting for me - I would have narrowed the scope to the two developers most receptive and built from their visible wins instead of pushing the whole team. The signal would have been the shared findings list going unused after the sessions.
- [More detail on mentorship](https://en.wikipedia.org/wiki/Mentorship)

---

### Question b8af4997-7816-4b15-8ff0-dff20efa9af0

- Tell me about mentoring a group rather than a single person.

### Answer

- **Situation:** At ZenGroup, I mentored four developers on collaborative best practices and coding standards, all with different starting points.
- **Task:** Raise the whole group's baseline at once without leaving the slowest person behind.
- **Action:** I ran short recurring sessions instead of one big training, each focused on a single practice applied immediately to live work. I paired stronger and newer developers together so the teaching did not all route through me.
- **Result:** All four converged on shared practices, and onboarding the next developer got easier because the practices belonged to the team, not to me.
- **Worst case:** If the recurring sessions had left the weakest of the four behind, I would have split the group by pace and run smaller catch-up pairing for him, protecting the group's momentum rather than dragging everyone to the slowest. The signal would have been one developer consistently arriving unprepared or silent.
- [More detail on feedback](https://en.wikipedia.org/wiki/Feedback)

---
## Driving architecture and technical direction

### Question e12d2ed7-75f3-40b6-bca9-7129790adc34

- Describe a time you set technical direction for a product.

### Answer

- **Situation:** At Cigro, Uobong — the flagship trekking app for our largest client — had to work deep on trails with no connectivity, but early builds treated offline as an error state rather than a normal condition.
- **Task:** As the one leading mobile development, define the offline-sync architecture before more features piled on top of the problem.
- **Action:** I co-architected the sync model with the backend owner: what must be captured locally during treks, how conflicts resolve when the device reconnects, and how GPS traces upload. I socialized the design with the team and the client before implementation began.
- **Result:** GPS pathing and trek data survived offline reliably, and new features were built on the sync foundation instead of around it.
- **Worst case:** If the client had balked at funding the offline-sync redesign, I would have scoped it down to GPS pathing and trek data only - the flows their users actually lost - and deferred the rest until usage justified it. The signal would have been the client questioning the offline investment after the design walkthrough.
- [More detail on decision-making](https://en.wikipedia.org/wiki/Decision-making)

---

### Question e67f3798-ea04-4db9-b349-eb0f875dbc3e

- Tell me about a time you chose a technical approach for the whole team.

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, our five Expo apps had grown inconsistent state handling — screens re-fetched data on every mount and the apps felt sluggish.
- **Task:** Pick a scalable state-management and caching direction all five apps could follow.
- **Action:** I evaluated React Query, Redux, and Legend-State against our real screens — social feed, e-commerce, e-learning — rather than against abstract benchmarks. I concluded they were complementary, documented which tool fits which problem, and presented the mapping to the team.
- **Result:** The apps became noticeably more responsive, and the team gained a clear default so per-screen debates stopped.
- **Worst case:** If the complementary-tools mapping had failed to settle the per-screen debates, I would have picked one default - React Query for caching - and set a review rule allowing exceptions only with evidence. The signal would have been the same screens still re-fetching on every mount after one sprint.
- [More detail on software quality](https://en.wikipedia.org/wiki/Software_quality)

---

### Question 05c39bf2-c7ac-4685-90a7-bacb3cc195c4

- Describe how you drove the architecture of a product from the start.

### Answer

- **Situation:** At ZenGroup, I built a React Native real estate app that included token trading — property tokens bought and sold in the app.
- **Task:** Shape the architecture so both the browsing experience and the trading flows stayed trustworthy as the product grew.
- **Action:** I separated the real-estate domain from the token-trading domain early — separate state and separate flows — so trading logic could be hardened and reviewed without destabilizing property browsing. I walked the developers I mentored through the boundaries and why they mattered.
- **Result:** Trading changes stayed contained, and browsing features kept shipping while the trading flows matured.
- **Worst case:** If the domain separation had proven too rigid - trading changes still destabilizing browsing - I would have introduced a clearer service boundary with an explicit contract between the two sides rather than just separate state. The signal would have been a trading change forcing rework in browsing screens.
- [More detail on decision-making](https://en.wikipedia.org/wiki/Decision-making)

---

### Question 0048195a-c754-4963-8263-09e1bbafab21

- Tell me about balancing competing requirements when setting direction.

### Answer

- **Situation:** At ZenGroup, I also built three Next.js sites — branding and e-commerce — where marketing wanted rich, interactive pages while I was accountable for SEO and scalability.
- **Task:** Set a direction that served both goals instead of picking a side.
- **Action:** I pushed server-rendered, SEO-first patterns as the default for the sites, and negotiated with marketing on the few places where interactivity justified slower delivery. I structured things so new pages followed the SEO-safe pattern without needing a specialist each time.
- **Result:** The sites stayed search-optimized and scalable while marketing kept the interactive moments that mattered to them.
- **Worst case:** If marketing had rejected the SEO-first default and pushed for interactivity everywhere, I would have brought load-time and search data to a joint session and proposed A/B testing one showcase page against their preferred design. The signal to switch would have been them escalating the disagreement to product leadership.
- [More detail on software quality](https://en.wikipedia.org/wiki/Software_quality)

---

## Setting standards and quality bar

### Question 004655e4-65bf-4147-b4f2-f23afc876e00

- Describe a time you raised the quality bar on a team.

### Answer

- **Situation:** At Cigro, Uobong's critical trekking flows — GPS pathing, map loading, offline sync — were verified by manual testing before each release, and issues still slipped through to users on trails.
- **Task:** Make the critical flows provably safe, not just probably fine.
- **Action:** I built Maestro E2E pipelines driven by AI-generated test scenarios covering exactly those flows, and made a green pipeline run a release requirement rather than an optional check.
- **Action:** When the pipeline flagged something, we fixed it before shipping — not after complaints.
- **Result:** Critical-flow regressions were caught before release, and the manual pass shrank to genuinely exploratory checks.
- **Worst case:** If stakeholders had refused to hold a release for a red pipeline - a launch date outranking the check - I would have shipped only with a written risk note naming the exact flow left unverified, then pushed the gate into the definition of done. The signal would have been a release forced through on red more than once.
- [More detail on code review](https://en.wikipedia.org/wiki/Code_review)

---

### Question 6a4cfdbd-d4f1-45f3-b0ee-f72b0999c03c

- How did you use code reviews to set standards?

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, I ran code reviews for my team of five across the monorepo, but reviews had drifted into approval theater — approvals without real scrutiny.
- **Task:** Turn reviews into the mechanism that actually holds the quality bar.
- **Action:** I set the expectation that every review states what was checked, modeled it myself by reviewing thoroughly but kindly, and rotated review duty so everyone both gave and received real feedback. Repeated findings became written team conventions instead of repeated comments.
- **Result:** Issues moved from production to review, and design debates happened earlier — in the pull request rather than after release.
- **Worst case:** If the review expectations had not taken hold - approvals drifting back to rubber-stamping - I would have gone back to reviewing every PR myself for a month and hand-walked two reviews per developer. The signal would have been approvals landing within minutes with no substantive comments.
- [More detail on software quality](https://en.wikipedia.org/wiki/Software_quality)

---

### Question 18d3c0ed-77b2-47de-a580-5d49df17ad89

- Describe establishing a practice that prevented recurring problems.

### Answer

- **Situation:** At Cigro, we fixed a critical target-tracking bug that had caused major client complaints — and I realized we had found it through complaints, not through instrumentation.
- **Task:** Make sure the next state issue surfaced to us before it surfaced to the client.
- **Action:** I added Sentry session telemetry to Uobong and made reading it part of the team's routine, triaging sessions around reported symptoms to isolate state issues. I trained the developers to pull evidence from telemetry before proposing fixes.
- **Result:** We isolated state issues from real sessions instead of guesswork, and post-launch complaints dropped to zero.
- **Worst case:** If telemetry-first triage had stayed a habit only I practiced, I would have stopped diagnosing any reported symptom myself and instead booked pair sessions where the reporter drove the query while I observed. The signal would have been developers still proposing fixes with no session evidence attached.
- [More detail on code review](https://en.wikipedia.org/wiki/Code_review)

---

### Question 77c59913-7a89-4f3d-bced-c97141386dc3

- Tell me about a time you held a quality bar under pressure to move faster.

### Answer

- **Situation:** At ZenGroup, the real estate app included token trading, and there was constant pull to ship property features faster and treat trading changes like any other change.
- **Task:** Keep the trading flows dependable without killing overall velocity.
- **Action:** I drew a clear line: anything touching token trading got the fuller review and testing treatment, while low-risk browsing changes moved on a faster lane. I explained the reasoning — trading errors cost user trust in a way a cosmetic bug never does.
- **Result:** The trading features stayed dependable, and the two-speed approach kept the team's overall delivery fast.
- **Worst case:** If stakeholders had pushed back that the two-speed review was needless overhead and routed trading changes through the fast lane anyway, I would have shown a concrete diff-level comparison of blast radius rather than reasserting the rule. The signal would have been trading changes appearing in the browsing review queue.
- [More detail on software quality](https://en.wikipedia.org/wiki/Software_quality)

---

## Owning a client escalation

### Question 6074af47-0b49-44db-bee1-b161fc6cdc6d

- Tell me about handling a serious complaint from a client.

### Answer

- **Situation:** At Cigro, our largest client escalated major complaints about a critical target-tracking bug in Uobong, their flagship trekking app.
- **Task:** Own the escalation end to end as the lead for mobile development.
- **Action:** I took it personally in the right way: reproduced the tracking failure, communicated progress to the client in plain language instead of jargon, fixed the root cause, and then added Sentry session telemetry so the next issue would reach us before it reached their users.
- **Result:** The bug was resolved, post-launch complaints dropped to zero, and the client stayed with us.
- Takeaway: owning an escalation means fixing the class of problem, not just the instance.
- **Worst case:** If the client had stayed unconvinced after the fix and reopened the complaint, I would have brought them into the telemetry itself - walking them through a live session showing the failure mode now caught - rather than repeating written assurances. The signal would have been their escalation continuing past the first post-fix release.
- [More detail on accountability](https://en.wikipedia.org/wiki/Accountability)

---

### Question cf08c4b0-98f4-4997-b24a-332fd9000f0b

- How did you keep a key client's trust during a crisis?

### Answer

- **Situation:** Uobong was Cigro's largest client account, and I led the mobile development on it — right as the target-tracking bug triggered their complaints.
- **Task:** Protect the relationship while the fix was still in progress, not just after it landed.
- **Action:** I insisted on honest, regular updates: what we knew, what we did not yet know, and when they would hear from me next — rather than going quiet until the fix shipped. I also brought them the telemetry plan so they saw prevention, not only repair.
- **Result:** The client experienced ownership instead of excuses; after the fix and the telemetry rollout, we received zero further complaints.
- **Worst case:** If the client had pushed back that our updates raised more questions than they answered, I would have moved to daily written checkpoints with a named owner per unknown, and invited their engineers into our findings channel. The signal would have been replies going cold between updates.
- [More detail on conflict management](https://en.wikipedia.org/wiki/Conflict_management)

---

### Question 12c5a59d-13c3-4edb-a80c-353d08852d5c

- Describe a time a release problem escalated and you owned it.

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, repeated friction getting builds from staging to production for our five Expo apps created ongoing escalations from stakeholders who could not get reliable releases.
- **Task:** Own the release process as my problem instead of tolerating it as a fact of life.
- **Action:** I automated staging and production deployments using our Turbo setup with Fastlane, so releases became repeatable steps instead of manual rituals, and I made pipeline status visible to stakeholders so they could see build health themselves.
- **Result:** Deployments stopped being an escalation topic; releasing became a routine, unremarkable event.
- **Worst case:** If stakeholders had stayed unconvinced the automation solved their release pain - escalations continuing after Fastlane landed - I would have sat with each of them through a release end to end and instrumented the exact steps that still broke. The signal to switch would have been escalation topics surviving two automated releases.
- [More detail on accountability](https://en.wikipedia.org/wiki/Accountability)

---
## Decisions and prioritization

### Question 4769a02f-dcbb-45f5-9790-f74570effec5

- Tell me about prioritizing when everything felt urgent.

### Answer

- **Situation:** Leading mobile development on Uobong at Cigro, with our largest client watching, I faced simultaneous pressure: new features, stability work, and building out the E2E testing pipeline.
- **Task:** Decide the order without letting the client account down.
- **Action:** I ranked by risk to the client relationship: stability first — the target-tracking fix and telemetry — then protecting the critical trekking flows with the Maestro pipeline, and only then features. I explained the order to the client in terms of their users' experience, not our internal backlog.
- **Result:** The account stabilized with zero post-launch complaints, and the features that followed landed on a foundation that held.
- **Worst case:** If the client had insisted features come before the stability work, I would have bundled one visible feature into the same release as the tracking fix rather than defending a pure sequencing argument. The signal would have been their account manager relaying feature pressure after I explained the risk order.
- [More detail on decision-making](https://en.wikipedia.org/wiki/Decision-making)

---

### Question ad9ba862-8761-48de-96fa-04e8396f0d77

- Describe a difficult technical trade-off you had to decide on.

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, the state-management direction for our five apps had advocates for React Query, Redux, and Legend-State among my team of five — and the debate was stalling decisions.
- **Task:** Decide without fracturing the team or freezing progress.
- **Action:** I framed the decision around our real screens rather than preferences, ran the candidates against the feed, e-commerce, and e-learning flows, and concluded they were complementary rather than competing. I documented which tool belongs to which problem and left room to revisit with evidence.
- **Result:** The team stopped relitigating the choice, app responsiveness improved, and each app used a tool that fit its problems.
- **Worst case:** If the team had rejected the complementary-tools conclusion and each kept lobbying for one library, I would have called a decision deadline, picked React Query as the single default, and logged the conditions under which we would revisit. The signal would have been tool-choice debates resurfacing in sprint planning.
- [More detail on prioritization](https://en.wikipedia.org/wiki/Prioritization)

---

### Question e53816c4-7836-480a-8f4a-5bdf8156729e

- Tell me about a major decision that changed your career direction.

### Answer

- **Situation:** I graduated in Accountancy from RMIT with a solid GPA — and a growing realization that I wanted to build software, not audit it.
- **Task:** Decide whether to start over as a self-taught developer with a non-CS background.
- **Action:** I committed to structured self-teaching: JavaScript first, then web and mobile, building real projects instead of only following tutorials, and actively seeking feedback from working developers rather than validating myself.
- **Result:** That decision carried me into developer roles at ZenGroup, GOSOFT, and Cigro, and into team leadership — and my accountancy training still sharpens the business judgment I bring to product decisions.
- **Worst case:** If structured self-teaching had stalled - months of tutorials without employable work - I would have joined a bootcamp or contributed to open-source mobile projects for real review, keeping the accounting path open. The signal would have been no interview offers after finishing my portfolio projects.
- [More detail on decision-making](https://en.wikipedia.org/wiki/Decision-making)

---

### Question cef749ae-defb-4095-9c62-aebc23a673a2

- How did you decide where to spend limited time on team improvement?

### Answer

- **Situation:** At Cigro, I ran weekly cross-team sharing sessions, but every team had far more pain points than available slots.
- **Task:** Choose topics that were worth everyone's hour, every week.
- **Action:** I collected pain points continuously instead of picking ad hoc, then prioritized recurring cross-team issues — like state debugging — over one-off curiosities. Anything that touched only one team went to that team directly instead of taking the whole forum's time.
- **Result:** The sessions earned their slot: attendance stayed strong because topics were chosen by shared pain, not novelty.
- **Worst case:** If attendance had slid because the chosen topics missed the room, I would have switched to an open nomination vote each week and dropped my recurring-issues criterion if it kept losing. The signal would have been attendance falling over three consecutive sessions despite fresh topics.
- [More detail on prioritization](https://en.wikipedia.org/wiki/Prioritization)

---

## Influence and stakeholder alignment

### Question 794aae74-dd5b-4b98-893f-f6644e5e9fbc

- Describe aligning multiple stakeholders on a technical decision.

### Answer

- **Situation:** The offline-sync design for Uobong at Cigro touched three parties: the client who funded it, the backend owners who shaped the APIs, and my mobile team who would live with it daily.
- **Task:** Get one design all three would genuinely commit to.
- **Action:** I ran the design as a conversation instead of an announcement. I brought the mobile reality — hours on a trail with no connectivity — to the client to justify the investment, and co-architected the sync and GPS contracts with backend so no side was handed a done deal.
- **Result:** One design, committed to by all sides; there was no late-stage renegotiation when implementation started.
- **Worst case:** If the client or the backend owners had walked away from the co-architected design, I would have proposed a time-boxed prototype of the offline flows to make the cost of the status quo concrete before renegotiating. The signal would have been either side deferring commitment past the design session.
- [More detail on persuasion](https://en.wikipedia.org/wiki/Persuasion)

---

### Question e1638166-8590-4c90-a442-3ae22bc6972f

- Tell me about turning user feedback into something you actually shipped.

### Answer

- **Situation:** At ZenGroup, I partnered with marketing and sales, who were sitting on direct user feedback about our real estate app and our sites that never reached development.
- **Task:** Convert that feedback into features people wanted, rather than what we guessed they wanted.
- **Action:** I set up a regular exchange: they brought feedback with context — who said it and why — and I translated recurring themes into buildable features, then looped back with what shipped so they could close the loop with users.
- **Result:** Feedback-driven features landed with high engagement, and the teams stopped seeing development as a black box.
- **Worst case:** If marketing and sales had judged the feedback loop useless and stopped bringing anything, I would have picked one small recurring request, shipped it fast, and shown them it landing before rebuilding the exchange. The signal would have been attendance thinning at the feedback sessions.
- [More detail on cross-functional teams](https://en.wikipedia.org/wiki/Cross-functional_team)

---

### Question 19e20f55-e5b1-4ee5-bd5b-7da8d55cba55

- How did you handle a stakeholder who wanted something you disagreed with?

### Answer

- **Situation:** At ZenGroup, marketing pushed for heavily interactive, media-rich branding pages on the Next.js sites I built, while I was accountable for SEO and scalability.
- **Task:** Disagree without stalling either the relationship or the roadmap.
- **Action:** Instead of a flat no, I showed the trade-off concretely — what that level of interactivity cost in search visibility and load time, and where it genuinely paid off. We agreed on a few showcase moments and SEO-safe defaults everywhere else.
- **Result:** Marketing got pages that felt rich where it counted; the sites kept their search performance and stayed scalable.
- **Worst case:** If we had hit a genuine impasse - marketing refusing SEO-safe defaults anywhere - I would have escalated with data to product leadership rather than quietly shipping either extreme, and proposed one measured A/B comparison of their page against mine. The signal would have been two meetings ending with no agreed default.
- [More detail on persuasion](https://en.wikipedia.org/wiki/Persuasion)

---

## Handling your own mistakes as a lead

### Question aa69585e-04e0-40ca-b130-577396a72a2c

- Tell me about a mistake you made as a lead and what you did about it.

### Answer

- **Situation:** At Cigro, a critical target-tracking bug in Uobong reached our largest client as complaints before we even knew it existed. As mobile lead, I had shipped without instrumentation that would have caught it.
- **Task:** Own both the bug and the gap in my own process — not just the symptom.
- **Action:** I fixed the bug first, then named the process failure openly with the team: we had relied on manual checks for flows that run for hours on trails. I added Sentry session telemetry and made evidence-before-fix the norm, applying that bar to my own work first.
- **Result:** Post-launch complaints went to zero, and the team adopted telemetry-first debugging because I held myself to it before holding them to it.
- **Worst case:** If the telemetry had failed to rebuild trust - complaints continuing after rollout - I would have added release gates keyed to the specific tracking flows and reported telemetry health to the client directly, owning the miss twice over. The signal would have been any new complaint about the same failure mode.
- [More detail on accountability](https://en.wikipedia.org/wiki/Accountability)

---

### Question 75a7f3d6-dec1-414b-99b5-33df1462fcc1

- Describe a time a gap in your background hurt your work. What did you do?

### Answer

- **Situation:** As a self-taught developer with an Accountancy degree from RMIT, early in my career I ran into problems — around scalability and architecture — where I lacked fundamentals that CS-trained colleagues took for granted.
- **Task:** Close the gap without slowing my teams down or hiding the weakness.
- **Action:** I treated learning like delivery: identified exactly which fundamentals each problem actually needed, studied them just-in-time, and asked targeted questions instead of pretending. The developers I mentored saw me doing homework on basics, which made it safe for them to ask too.
- **Result:** Within a few years I was the one making architecture calls and leading teams; visible learning became part of how I mentor.
- **Worst case:** If just-in-time study had been too slow for the problem at hand, I would have brought in someone stronger - a senior colleague or external material - and paired rather than grinding alone, absorbing the fundamentals afterward. The signal would have been my learning pace becoming the critical path on a deliverable.
- [More detail on growth mindset](https://en.wikipedia.org/wiki/Growth_mindset)

---

### Question 7e7404e4-e6f0-48be-8ca6-12cd17dd86ca

- Tell me about a time you were wrong in a judgment call.

### Answer

- **Situation:** Early at ZenGroup, I treated feedback from marketing and sales as noise that would derail the engineering roadmap I had set for the app and the sites.
- **Task:** Reconsider my own judgment once the cost of ignoring that channel became clear.
- **Action:** I sat down with both teams and went through the raw user feedback myself instead of the summarized version — and found a recurring theme my roadmap had missed entirely. I reshaped the plan around it and set up an ongoing partnership so the channel stayed open.
- **Result:** The feedback-driven features we shipped drove high engagement; I had simply been wrong about who held the best information.
- **Worst case:** If sitting with the raw feedback had confirmed my original roadmap rather than correcting it, I would have kept the plan and still kept the channel open - cheap insurance either way - rather than restructuring around an echo. The signal would have been feedback themes already covered by the roadmap.
- [More detail on accountability](https://en.wikipedia.org/wiki/Accountability)

---

## Scaling knowledge across teams

### Question 28f98e10-53b7-40ed-8da7-e67f4ae8c0c0

- Describe spreading a capability beyond your own team.

### Answer

- **Situation:** At Cigro, I had made AI-driven workflows productive inside the Uobong mobile team, but other teams knew of the work without adopting any of it.
- **Task:** Scale the practice across teams, not just showcase it.
- **Action:** I used the weekly cross-team sharing sessions I organized to run the workflow live on another team's actual pain point instead of a canned demo, left them the working materials we used, and followed up weeks later to unblock whatever had stalled.
- **Result:** Teams outside mobile began applying AI workflows to their own problems; the sharing sessions became the transfer mechanism rather than a presentation slot.
- **Worst case:** If the live sessions had produced interest but no adoption, I would have embedded with one outside team for a week to run their first workflow end to end with them, instead of repeating sessions. The signal would have been no other team shipping anything built with the workflow.
- [More detail on knowledge transfer](https://en.wikipedia.org/wiki/Knowledge_transfer)

---

### Question 223e3f32-5751-40e9-b350-a65bb6ca8196

- How did you make sure knowledge did not live only in your head?

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, the CI/CD setup with Turbo and Fastlane for our five Expo apps worked — but only because I understood every piece of it.
- **Task:** Turn deployment knowledge into a team asset instead of a personal one.
- **Action:** I documented the pipelines as instructions a developer could execute, ran a walkthrough where each developer performed a staging deployment themselves, and rotated release duty so the knowledge stayed warm rather than decaying in a wiki.
- **Result:** Any developer on the team could ship a release; deployments stopped waiting for me to be available.
- **Worst case:** If releases had still routed back to me after the walkthroughs, I would have made release duty a scheduled rotation with me on standby only, accepting a slower release for a few weeks to force the muscle to build. The signal would have been developers messaging me instead of the runbook.
- [More detail on mentorship](https://en.wikipedia.org/wiki/Mentorship)

---

### Question 6a4a4603-29b6-4854-bbc1-34e36e4c2149

- Tell me about making a difficult-to-learn skill common across a team.

### Answer

- **Situation:** After I added Sentry session telemetry to Uobong at Cigro, I was the only one who could interpret the sessions, so isolating state issues still bottlenecked on me.
- **Task:** Make telemetry-driven debugging a shared skill, not my personal specialty.
- **Action:** I walked developers through real sessions tied to symptoms they recognized, had them lead the next diagnosis while I observed, and brought the approach to the weekly cross-team sharing sessions so it spread past mobile.
- **Result:** The team isolated state issues from real session evidence on their own, and the practice spread beyond my team through the sessions I ran.
- **Worst case:** If the guided diagnoses had not stuck and developers kept routing sessions to me, I would have made telemetry triage part of an on-call style rotation so interpreting sessions was unavoidable, and co-signed the first few write-ups. The signal would have been the interpretation queue still emptying only through me.
- [More detail on knowledge transfer](https://en.wikipedia.org/wiki/Knowledge_transfer)

---
