# Problem Solving

## Root cause vs symptom

### Question 1076aa26-336b-4c3e-86b3-f372f1d2338e

- Tell me about a time you discovered the real cause of a problem after others had only been treating its symptoms.

### Answer

- **Situation:** As Senior Mobile Developer at Cigro, I worked on Uobong, the flagship trekking app for our largest client account. A target-tracking malfunction was generating major client complaints, and early attempts kept patching the visible glitches.
- **Task:** Find the underlying cause so the complaints would stop permanently, not just pause.
- **Action:** I reproduced the failure on real devices and traced it back through the app's state handling instead of the UI layer. The surface symptoms came from inconsistent state, so I fixed the state logic and covered it with regression checks.
- **Result:** The complaints stopped, and we reached zero post-launch complaints after the fix shipped.
- **Worst case:** If the state-handling fix had not stopped the complaints, I would have widened the trace to device logs and field conditions rather than retreating to UI patches; the signal to switch would have been continued complaints on a clean regression suite.
- [More detail on root cause analysis](https://en.wikipedia.org/wiki/Root_cause_analysis)

---

### Question 38be2d6d-2176-4852-b2bb-1805c68149c4

- Describe a situation where you used data to find a root cause that others could only speculate about.

### Answer

- **Situation:** On the Uobong trekking app at Cigro, users reported intermittent issues that nobody on the team could reproduce reliably, so discussions kept circling around theories.
- **Task:** Isolate the actual cause instead of arguing anecdotes.
- **Action:** I added Sentry session telemetry so we could watch what real user sessions did. Comparing sessions that showed the problem against ones that did not let me isolate the specific state issues behind it.
- **Result:** We aimed the fix at the verified cause instead of a guess, and the telemetry stayed in place as a permanent evidence channel for the team.
- **Worst case:** If the telemetry had stayed silent or pointed nowhere, my fallback was pairing structured hypotheses with targeted debug builds for affected users instead of waiting on session data; a week of sessions with no pattern would have been my cue to change approach.
- [More detail on five whys](https://en.wikipedia.org/wiki/Five_whys)

---

### Question 03609bda-c313-45d7-8a9e-61889c0d5516

- Tell me about a time a performance problem turned out to be something deeper than it first appeared.

### Answer

- **Situation:** At GOSOFT TECHNOLOGY, our Turborepo monorepo of five React Native Expo apps started feeling sluggish, and the first instinct on the team was to keep tweaking the UI.
- **Task:** Improve responsiveness for real, not cosmetically.
- **Action:** I traced the slowdowns to their source: unmanaged application state and redundant data fetching. I introduced scalable state management and caching with React Query, Redux, and Legend-State, matching each tool to the specific cause.
- **Result:** The apps became noticeably more responsive, and the state-and-caching pattern was adopted across the monorepo instead of one-off UI patches.
- **Worst case:** Had the responsiveness gains failed to appear after the state and caching work, I would have profiled network and render costs per screen before touching more code; the tell would be smooth frames in isolated tests but lag in real sessions.
- [More detail on root cause analysis](https://en.wikipedia.org/wiki/Root_cause_analysis)

---

## Debugging under pressure

### Question 307ce9e4-1bb0-456b-a566-98147cefb0f9

- How did you handle a bug that was actively generating complaints from an important client?

### Answer

- **Situation:** At Cigro, a critical target-tracking bug in Uobong was producing major complaints from our largest client account, and the pressure to "just fix it" was intense.
- **Task:** Restore the client's trust quickly without shipping a hack that would break again.
- **Action:** I told the client plainly what we knew and when they would hear next, reproduced the bug on real devices, fixed the root cause in state handling, and added regression coverage before reporting back.
- **Result:** We reached zero post-launch complaints, and the honest, dated updates kept the client calm while the real fix landed.
- **Worst case:** If the root-cause fix had missed the release window, I would have negotiated a scoped hotfix plus honest status calls with the client rather than shipping a patch I could not stand behind; the signal would be reproduction still failing on real devices after the fix.
- [More detail on debugging](https://en.wikipedia.org/wiki/Debugging)

---

### Question 2257ed67-119d-41d3-9915-512a601d3eeb

- Tell me about a time you debugged something that broke in several places at once.

### Answer

- **Situation:** At GOSOFT, our five React Native Expo apps in a Turborepo shared components for social feed, e-commerce, and e-learning. A change to one shared component surfaced issues in multiple apps simultaneously.
- **Task:** Stabilize all five apps without freezing every team's work.
- **Action:** I reproduced the problem in each affected app, isolated the shared component change as the common factor, scoped the blast radius, and fixed it once at the source rather than five times at the edges.
- **Result:** All apps returned to stable behavior, and the monorepo structure actually made the trace faster than five separate codebases would have.
- **Worst case:** My fallback if the shared-component theory had not held across all five apps was to bisect the change and isolate apps individually; divergence between apps, some fixed and some still failing, would have told me more than one cause was in play.
- [More detail on time management](https://en.wikipedia.org/wiki/Time_management)

---

### Question ea7e8e28-0650-4a6a-8d20-7881a672d4b7

- Describe a time you had to fix a critical issue right before delivery.

### Answer

- **Situation:** At ZenGroup, I built the React Native real estate app that included token trading. Late in delivery, an issue appeared in the trading flow — the one part where user assets were directly involved.
- **Task:** Ship on time without letting a shaky trading experience go out.
- **Action:** I narrowed down the reproduction steps first, then deliberately deprioritized cosmetic polish to concentrate on the trading path, fixed it, and verified the critical flow by hand on a real device before sign-off.
- **Result:** The app delivered on schedule with the token trading flow working correctly, and the triage kept the fix small instead of sprawling.
- **Worst case:** If the trading-path fix had not converged in time, I would have asked to drop the polish entirely and cut delivery to the verified core flow rather than risk user assets; a reproduction I could not nail down on the final day would have triggered that conversation.
- [More detail on debugging](https://en.wikipedia.org/wiki/Debugging)

---

## Using evidence and telemetry over guesses

### Question 99587472-90a3-4624-9289-97bbe73532cb

- Tell me about a time you refused to guess and insisted on gathering evidence first.

### Answer

- **Situation:** At Cigro, the team debated the cause of Uobong's state issues based on individual impressions, and each theory implied a different, expensive fix.
- **Task:** Settle the question with facts before committing engineering time.
- **Action:** I instrumented the app with Sentry session telemetry and compared sessions that exhibited the issue against sessions that did not. The real user data isolated the state issues and ruled out several popular theories.
- **Result:** The fix targeted the verified cause on the first attempt, and the telemetry became the default way the team settled future disagreements.
- **Worst case:** If the session data had contradicted my read or stayed ambiguous, I would have taken the competing theories back to the team and designed a discriminating experiment; telemetry that split evenly across failing and passing sessions would have been my cue to distrust it.
- [More detail on debugging](https://en.wikipedia.org/wiki/Debugging)

---

### Question 0fd9033a-d864-4a3c-b3ef-25b50c2b58d8

- Describe a situation where you used automation to get evidence about behavior humans couldn't reliably observe.

### Answer

- **Situation:** On Uobong at Cigro, the critical trekking flows — GPS pathing, map loading, and offline sync — failed only intermittently, and manual testing could never catch them at the right moment.
- **Task:** Make the failures reproducible so they could actually be fixed.
- **Action:** I built AI-driven automated testing that ran the flows repeatedly and collected the failure patterns, then fed those findings directly into the fixes.
- **Result:** The critical flows stabilized, and the automated suite kept catching regressions that manual testing had been missing all along.
- **Worst case:** If the automated runs had not stabilized the critical flows, I would have fallen back to scripted manual checklists on a strict schedule while debugging the harness itself; consistent differences between automated failures and human reports would have told me the tooling was lying.
- [More detail on critical thinking](https://en.wikipedia.org/wiki/Critical_thinking)

---

### Question 2c64c104-2c0b-4be5-b1d0-bef4bc502d18

- Tell me about a time you chose a tool based on observed evidence rather than hype.

### Answer

- **Situation:** At GOSOFT, our apps showed concrete symptoms: stale screens, redundant network fetches, and jumpy updates. It was tempting to grab whichever state library was loudest online.
- **Task:** Pick a remediation that matched the evidence we actually had.
- **Action:** I mapped each symptom to its specific cause, then matched tools to causes — React Query for server-state caching, Legend-State where fine-grained reactivity mattered, Redux where established structure already existed.
- **Result:** Responsiveness improved because each cause had its own cure, and the team kept the mapping habit of symptom-to-cause-to-tool.
- **Worst case:** Had the symptom-to-tool mapping not produced visible improvement, I would have reverted to one library where the team already had structure and measured again; unchanged network fetch counts after the caching change would have been the signal to stop migrating.
- [More detail on debugging](https://en.wikipedia.org/wiki/Debugging)

---

## Working with ambiguity

### Question 20fb69ef-5f16-48ee-ac00-d080298149ed

- Describe a project where the requirements were unclear. How did you proceed?

### Answer

- **Situation:** At Cigro, I was asked to co-architect the offline-sync and GPS APIs for Uobong. The client could describe outcomes — "the app has to work on a mountain with no signal" — but not specifications.
- **Task:** Turn vague needs into a concrete, buildable architecture.
- **Action:** I enumerated real trekking scenarios, derived the sync and GPS requirements from each one, wrote down my assumptions, and validated them with the client before committing to the design.
- **Result:** The offline-sync and GPS APIs supported real field usage instead of a misread spec, and the scenario list became the reference for later decisions.
- **Worst case:** If the client had disagreed with my scenario-derived assumptions, I would have walked them through the trekking scenarios one by one and let field data arbitrate before locking the architecture; repeated clashes over the same assumption would have told me I had misread their users.
- [More detail on ambiguity](https://en.wikipedia.org/wiki/Ambiguity)

---

### Question 2f2bc3b1-1481-4955-9db0-9d9ebe50abfa

- Tell me about a time you turned vague stakeholder feedback into something concrete.

### Answer

- **Situation:** At ZenGroup, marketing and sales relayed general user feedback like "users want browsing to feel easier," which was directionally useful but not buildable as stated.
- **Task:** Convert soft feedback into shippable, specific features.
- **Action:** I sat down with them, asked for the concrete user moments behind each comment, translated those moments into feature candidates, and validated a prototype with them before building the full version.
- **Result:** We shipped high-engagement features, and the partnership settled into a routine feedback loop instead of one-off requests.
- **Worst case:** If marketing and sales had rejected my translated feature candidates, I would have taken the prototype back to their concrete user moments and rebuilt from those rather than defending my version; two validation rounds without agreement would have been my signal to escalate the mismatch.
- [More detail on problem solving](https://en.wikipedia.org/wiki/Problem_solving)

---

### Question 6088a439-f686-47e9-9ca9-cdf40aa6add4

- How did you handle starting a career in a field you had no formal background in?

### Answer

- **Situation:** My degree is a Bachelor of Accountancy from RMIT — no computer science education. I taught myself web and mobile development from zero.
- **Task:** Become genuinely competent and employable without any curriculum telling me what to learn next.
- **Action:** I built real projects end to end in web and mobile, deliberately filled the gaps each project exposed, and sought out review from more experienced developers instead of trusting my own judgment alone.
- **Result:** I shipped work across three companies, and the non-CS background ended up strengthening my business understanding on product teams.
- **Worst case:** If self-teaching had stopped producing employable work, I would have sought structured mentorship and contributed to established codebases to calibrate against real standards; a portfolio that kept failing review from experienced developers would have been my cue to change method.
- [More detail on ambiguity](https://en.wikipedia.org/wiki/Ambiguity)

---

## Triage and prioritization under deadline

### Question a42f5526-dc19-441e-ad7d-f7af4900d203

- Tell me about a time you had to decide what to fix first when you couldn't fix everything.

### Answer

- **Situation:** At Cigro, we needed Uobong's critical trekking flows secured before release, and there was not enough time to cover everything at once.
- **Task:** Choose an order that protected users even if the deadline arrived mid-work.
- **Action:** I ranked flows by user impact: GPS pathing and offline sync first, because a trekker without those is stranded; map loading next. I then built the AI-driven automated tests in exactly that order.
- **Result:** The highest-impact flows were covered first, so any interruption still left the app's core protected at release.
- **Worst case:** If the ranked order had proven wrong, GPS covered but sync still broken at deadline, I would have reassessed impact with fresh field reports instead of defending the original ranking; the signal would be complaints clustering in flows I had sequenced last.
- [More detail on triage](https://en.wikipedia.org/wiki/Triage)

---

### Question a4462864-1d16-4508-90c3-297333f2192c

- How did you prioritize when everything on your plate felt urgent?

### Answer

- **Situation:** At GOSOFT, I led a team of five mobile developers across five React Native Expo apps in one Turborepo, and every app's stakeholders treated their request as the urgent one.
- **Task:** Keep releases predictable instead of reactive.
- **Action:** I triaged work by user impact and release risk rather than by who asked loudest, sequenced code reviews to match that order, and batched similar work across apps using the shared components.
- **Result:** Releases became predictable, the team stopped thrashing between apps, and stakeholders learned the triage rules instead of escalating everything.
- **Worst case:** If stakeholders had refused the triage rules and kept escalating over my sequencing, I would have published the impact-and-risk ranking and made exceptions an explicit, visible trade; escalations that bypassed the queue would have been the signal to renegotiate the process.
- [More detail on prioritization](https://en.wikipedia.org/wiki/Prioritization)

---

### Question 8c70d056-87f4-40d1-8dd6-6863044794bc

- Tell me about a time you had to balance multiple projects at once.

### Answer

- **Situation:** At ZenGroup, I simultaneously owned a React Native real estate app with token trading and three Next.js sites spanning branding and e-commerce.
- **Task:** Keep all four moving without silently dropping any of them.
- **Action:** I sequenced work by business moments — campaigns and launches got priority windows — reused patterns and components across projects, and blocked dedicated time per project so context switching stayed deliberate.
- **Result:** All the projects delivered, with the Next.js sites live and optimized for SEO and scalability alongside the real estate app.
- **Worst case:** If business owners had disagreed with my sequencing and pulled two launches into the same window, I would have asked them to rank the conflict explicitly and resequenced around the winner; a second collision would have told me my model was too optimistic.
- [More detail on triage](https://en.wikipedia.org/wiki/Triage)

---

## Tradeoffs and constraints

### Question 90c5d5ee-55b4-4321-884f-18f56916d3a5

- Describe a technical tradeoff you had to make and explain to others.

### Answer

- **Situation:** Co-architecting offline-sync for Uobong at Cigro meant choosing between data freshness, battery and data usage, and implementation complexity — the app had to work on long treks with no signal.
- **Task:** Pick a balance I could defend to both engineers and the client.
- **Action:** I laid out the options against real trekking constraints, chose graceful degradation when connectivity dropped, kept conflict resolution predictable, and documented the reasoning so it could be challenged.
- **Result:** Sync behavior stayed understandable and dependable on the trail, and the documented tradeoff made later changes faster to reason about.
- **Worst case:** If the client had pushed back that graceful degradation felt like missing functionality, I would have demonstrated the battery and data costs of the alternatives on real devices before revisiting the design; their rejection of the documented tradeoff would have been my cue to renegotiate requirements.
- [More detail on trade-offs](https://en.wikipedia.org/wiki/Trade-off)

---

### Question 0ff1abbb-1adb-42ae-a566-7e860fdd447b

- Tell me about a tradeoff you made between consistency and flexibility.

### Answer

- **Situation:** At GOSOFT, our Turborepo held five React Native Expo apps — social feed, e-commerce, e-learning — sharing components. Sharing everything uniformly would speed us up but straitjacket each app.
- **Task:** Find the line between shared and app-specific code.
- **Action:** I defined a shared core of components with clear extension points, kept app-specific UI local to each app, and wrote down the boundaries so the five developers on my team could apply the same judgment.
- **Result:** The apps reused the core and moved faster, while each kept the flexibility its product actually needed.
- **Worst case:** If the shared-core boundary had slowed the team instead of speeding it, I would have moved the offending components back into app-local code and shrunk the core; repeated PRs fighting the extension points would have been the signal the line sat in the wrong place.
- [More detail on decision-making](https://en.wikipedia.org/wiki/Decision-making)

---

### Question b20e7f9e-cacf-48cb-9e58-5221c591706f

- Describe a constraint that fundamentally shaped your design decisions.

### Answer

- **Situation:** At ZenGroup, the three Next.js sites I built — branding and e-commerce — had to perform well in search engines, which constrained how freely I could use rich client-side interactivity.
- **Task:** Keep discoverability and load performance without shipping a static-feeling product.
- **Action:** I favored server-rendered output wherever SEO mattered, isolated interactive islands so they couldn't drag down the rest, and kept pages structurally lean for scalability.
- **Result:** The sites were optimized for SEO and scalability, and the constraint became a design tool rather than a fight.
- **Worst case:** If stakeholders had insisted on richer interactivity than the SEO constraint allowed, I would have built one interactive island as a measured prototype before conceding the design; a measurably slower page or indexing drop would have been the evidence that settled the disagreement.
- [More detail on trade-offs](https://en.wikipedia.org/wiki/Trade-off)

---

## Learning unfamiliar technology fast

### Question aa6fd31f-ffbe-4d53-98bf-f420fec8d695

- Tell me about a time you had to learn an unfamiliar tool quickly to get a job done.

### Answer

- **Situation:** At Cigro, Uobong needed end-to-end coverage on its critical trekking flows, and we chose Maestro — a tool I had never used professionally.
- **Task:** Become productive with it fast enough to matter for the release.
- **Action:** I learned it by building the real pipeline against GPS pathing first instead of working through tutorials in isolation, ran small experiments to confirm assumptions, and kept the scope to what the release actually needed.
- **Result:** A working E2E pipeline covered the critical flows well before it was needed, and the learning stuck because it was anchored to real work.
- **Worst case:** If Maestro had proven too immature for our GPS-pathing needs, I would have cut losses to a different E2E tool or a focused manual script set rather than sinking more release time into it; flows I could not automate after a fixed trial window would have been my switch signal.
- [More detail on the learning curve](https://en.wikipedia.org/wiki/Learning_curve)

---

### Question abda75f5-e96a-46ef-95dd-1f6b058cc4dd

- How do you approach picking up technology that is new to your whole team, not just you?

### Answer

- **Situation:** At Cigro, AI-driven testing workflows were new to me and to everyone around me, and there was no internal expertise to borrow.
- **Task:** Evaluate the approach honestly and decide whether to adopt it.
- **Action:** I ran small trials against real Uobong issues, kept only what demonstrably worked, then used our weekly cross-team sharing sessions to train other developers on the workflows that survived testing.
- **Result:** The AI workflow was adopted by the team rather than remaining my personal experiment, and the sharing sessions spread the learning.
- **Worst case:** If the trials had shown no real gain over conventional testing, I would have dropped the workflow openly instead of forcing adoption, and said so in the sharing sessions; results I could not reproduce across two different flows would have been my signal to stop advocating.
- [More detail on growth mindset](https://en.wikipedia.org/wiki/Growth_mindset)

---

### Question c1b482fa-d2f1-4e81-92b2-68ed981e64ee

- Tell me about a time you automated something you had been doing manually.

### Answer

- **Situation:** At GOSOFT, deployments for our five Expo apps were done by hand, and each manual step was a chance to fat-finger a release.
- **Task:** Remove the human-error risk from staging and production deployments.
- **Action:** I taught myself the Turbo and Fastlane pieces I was missing, built automated staging and production CI/CD pipelines, and treated each early failure as a lesson that tightened the pipeline.
- **Result:** Deployments across all five apps became repeatable one-path operations, and release day stopped being a tense event.
- **Worst case:** If Turbo and Fastlane had kept failing against our Expo setup, I would have staged the rollout app by app behind manual fallbacks instead of betting all five at once; a pipeline I could not make green in staging after a set window would have triggered the fallback.
- [More detail on the learning curve](https://en.wikipedia.org/wiki/Learning_curve)

---

### Question 128a4d50-f0a4-41af-ab1e-f2343d27d384

- Tell me about the hardest thing you have ever taught yourself.

### Answer

- **Situation:** My formal education is a Bachelor of Accountancy from RMIT. Everything about being a professional developer — JavaScript, TypeScript, React Native, Next.js — I taught myself.
- **Task:** Build a whole career's worth of skill without a program, professor, or cohort defining the path.
- **Action:** I built real projects end to end, studied the fundamentals underneath each feature I shipped, and treated every gap a project exposed as the next item on my personal syllabus.
- **Result:** That self-directed path carried me into mobile developer roles at three companies, including senior and team-lead responsibility.
- **Worst case:** If the self-directed path had plateaued, with gaps staying gaps project after project, I would have invested in a structured curriculum for the fundamentals instead; the same gap surfacing on a third shipped project would have told me to change approach.
- [More detail on growth mindset](https://en.wikipedia.org/wiki/Growth_mindset)

---

## Pushing back on unrealistic scope

### Question 1448d9fe-5060-45e5-81f6-42d4a7f17df7

- Tell me about a time you pushed back on scope you believed was unrealistic.

### Answer

- **Situation:** At Cigro, our largest client wanted additional Uobong features before launch while the GPS and offline core was still being hardened.
- **Task:** Protect the release's quality without flatly refusing an important client.
- **Action:** I presented the risk plainly: shipping new features on a fragile core endangered everything. I proposed deferring non-critical features until after a stable launch and backed the plan with automated test results as evidence.
- **Result:** The critical flows shipped solid, we reached zero post-launch complaints, and the deferred features followed on a stable foundation.
- **Worst case:** If the client had insisted on the pre-launch features regardless of the test evidence, I would have proposed cutting scope elsewhere to fund a hardening sprint rather than quietly absorbing the risk; an unmovable position after seeing the automated results would have been my signal to escalate internally.
- [More detail on scope creep](https://en.wikipedia.org/wiki/Scope_creep)

---

### Question 968e270f-a273-4dde-b563-e9aca41ad798

- Describe a time you disagreed with a non-technical stakeholder about what to build.

### Answer

- **Situation:** At ZenGroup, marketing and sales pushed a feature request that I believed cost far more than the value it would create for users.
- **Task:** Disagree without damaging a partnership I depended on for user feedback.
- **Action:** I asked what user problem the request was meant to solve, proposed a smaller version aimed directly at that problem, and agreed with them on how we would judge engagement once it shipped.
- **Result:** We shipped the leaner feature, engagement validated the approach, and the stakeholders trusted my pushback more afterward, not less.
- **Worst case:** If marketing and sales had insisted on the full-cost feature despite my smaller proposal, I would have asked for an explicit time-boxed trial of the lean version before committing the larger build; engagement still lagging on the lean version would have been the signal to concede the disagreement.
- [More detail on negotiation](https://en.wikipedia.org/wiki/Negotiation)

---

### Question ae6e5bcd-56ef-4a5f-8c3b-6072cf92f449

- Tell me about a time you pushed back on a proposed technical approach.

### Answer

- **Situation:** At GOSOFT, there was pressure to copy-paste a feature separately into each of our five apps because it looked like the fastest route in the moment.
- **Task:** Argue for the slower-looking shared approach without becoming the bottleneck.
- **Action:** I showed what five divergent copies would cost in ongoing maintenance across the monorepo, proposed shared components with extension points instead, and volunteered to build the first ones myself to prove it.
- **Result:** The team adopted the shared approach, the duplication never happened, and later features across the five apps got cheaper to build.
- **Worst case:** If the stakeholders behind the copy-paste push had held their ground after seeing the maintenance math, I would have asked for a one-sprint trial of the shared approach with a pre-agreed revert condition; the signal to switch back would have been the shared path blocking more than it saved.
- [More detail on scope creep](https://en.wikipedia.org/wiki/Scope_creep)

---

## Risk mitigation and releases

### Question 6f260b86-a43c-4c00-9829-417583142e14

- How do you decide when software is safe to release?

### Answer

- **Situation:** At Cigro, Uobong releases carried unusual risk: trekkers depend on the app in the field, offline, far from help. Gut feel was not an acceptable release gate.
- **Task:** Make the go/no-go decision objective.
- **Action:** I wired Maestro E2E pipelines over the critical flows — GPS pathing, map loading, and offline sync — and made a green suite the precondition for shipping.
- **Result:** Releases stopped depending on anyone's confidence, and we reached zero post-launch complaints on the releases gated this way.
- **Worst case:** If the client had pressed for shipping on a partially green suite, I would have shown which field scenario each failing test represented and offered a dated fix plan rather than waive the gate; a repeat demand after the failures were explained would have been my signal to escalate.
- [More detail on risk management](https://en.wikipedia.org/wiki/Risk_management)

---

### Question 028d5321-0599-4fae-aacd-5b0e7feb3ac5

- Describe a time you used process, not heroics, to reduce release risk.

### Answer

- **Situation:** At GOSOFT, releasing any of our five Expo apps touched staging and production, and regressions reaching production were the expensive kind of mistake.
- **Task:** Make dangerous mistakes structurally harder to make.
- **Action:** I built the CI/CD pipelines with Turbo and Fastlane so staging and production were clearly separated, every change verified in staging first, and promotion to production was a deliberate step rather than an accident.
- **Result:** Issues surfaced in staging where they were cheap, and production releases across all five apps became calm, repeatable events.
- **Worst case:** If staging had failed to catch the issues it was built for, I would have tightened the pipeline's parity with production and added the missed check explicitly rather than trust the process on faith; a regression reaching production untouched by staging would have triggered that rebuild.
- [More detail on software testing](https://en.wikipedia.org/wiki/Software_testing)

---

### Question ac0872f2-9d25-4437-ac85-a022508df2de

- Tell me about handling a feature where failure would be genuinely costly.

### Answer

- **Situation:** At ZenGroup, the React Native real estate app I built included token trading — a feature where real user assets were at stake, so failure meant real harm, not just annoyance.
- **Task:** Ship it with a level of care proportional to the stakes.
- **Action:** I deliberately kept the trading scope tight, prioritized correctness of the trading path over adding feature breadth around it, and verified the critical paths systematically and by hand before release.
- **Result:** The token trading functionality shipped without incident, and the discipline of matching care to stakes became how I scoped risky work.
- **Worst case:** If stakeholders had pressed for broader trading features before launch, I would have held the correctness work as the non-negotiable core and offered the breadth as a fast follow-up; pressure to trade scope against verification of the asset path would have been my signal to escalate the risk.
- [More detail on risk management](https://en.wikipedia.org/wiki/Risk_management)

---

### Question 3299f1a3-f2ba-4ee2-926e-95ebef43a1c4

- Tell me about designing for an environment that was actively working against you.

### Answer

- **Situation:** At Cigro, Uobong's users trek through mountains with weak or absent connectivity and unreliable GPS conditions — the environment fights the app the entire time.
- **Task:** Co-architect GPS APIs that keep working under those conditions.
- **Action:** I designed for graceful degradation from the start: the APIs had to tolerate bad signal and partial data rather than assume ideal conditions, and I validated the assumptions against real field usage with the client.
- **Result:** GPS pathing stayed dependable where users actually were, and the APIs gave the rest of the app a stable foundation to build on.
- **Worst case:** If field validation had shown the degradation was worse than designed for, paths lost where users actually walked, I would have renegotiated the caching and retry budgets with the client before adding complexity; sensor logs showing gaps beyond our tolerance would have been the switch signal.
- [More detail on software testing](https://en.wikipedia.org/wiki/Software_testing)

---

## Retrospectives and preventing recurrence

### Question 5cf42fdd-c078-454b-a707-cc61c905cc22

- Tell me about a time you improved how your organization learns from its problems.

### Answer

- **Situation:** At Cigro, the same kinds of issues and pain points kept resurfacing, but quietly — one team would solve something the next team was still struggling with.
- **Task:** Stop useful lessons from dying inside individual teams.
- **Action:** I organized weekly cross-team sharing sessions focused on issues and pain points, kept the format concrete — one issue, its cause, its fix — and opened them to everyone rather than a fixed invite list.
- **Result:** Recurring problems surfaced earlier because more eyes recognized them, and fixes spread between teams instead of stopping at the team that found them.
- **Worst case:** If attendance and contributions had faded after the first weeks, I would have cut the format to a tight slot with rotating owners rather than let it die politely; empty sessions two weeks running would have been my signal to change the format or kill it.
- [More detail on retrospectives](https://en.wikipedia.org/wiki/Retrospective)

---

### Question d9f59615-c2dd-473d-a351-b5e76adb1fd0

- Describe a time you worked to prevent an entire class of problems, not just the one instance you fixed.

### Answer

- **Situation:** After fixing the critical target-tracking bug at Cigro, I was unsatisfied — that specific bug was dead, but the state-handling mistakes behind it could happen again anywhere in Uobong.
- **Task:** Make the whole class of state issues less likely, not just this member of it.
- **Action:** I mentored the developers on my team on the state-handling patterns involved, added regression coverage and Sentry telemetry that would catch similar issues early, and reviewed the related code paths for the same mistake.
- **Result:** No repeat of that complaint class followed, and we held zero post-launch complaints.
- **Worst case:** If the class of state issues had resurfaced despite the mentoring and coverage, I would have escalated from patterns to architecture, auditing the state model itself rather than its symptoms; telemetry flagging the same mistake in fresh code would have told me the teaching had not landed.
- [More detail on five whys](https://en.wikipedia.org/wiki/Five_whys)

---

### Question 9b60cfb8-4dd4-4fbf-a6b7-a1140419eae8

- Tell me about a time you used standards to stop problems from recurring.

### Answer

- **Situation:** At ZenGroup, I mentored four developers whose inconsistent coding practices caused recurring friction — the same style and structural debates repeated in review after review.
- **Task:** Raise the team's floor so reviews could focus on substance.
- **Action:** I established collaborative best practices and coding standards, explained the reasoning behind each rule during reviews instead of just enforcing it, and paired with the developers on the first cases so the standards landed.
- **Result:** The recurring issues faded, and code reviews shifted from arguing style to discussing design.
- **Worst case:** If the four developers had pushed back that the standards felt arbitrary, I would have opened each rule for challenge and kept only the ones we could tie to a real incident; standards surviving on my authority alone would have been the signal they would erode.
- [More detail on retrospectives](https://en.wikipedia.org/wiki/Retrospective)

---

### Question 1a499f21-24f9-4adf-8b7f-787723a29fe7

- How do you handle discovering gaps in your own knowledge?

### Answer

- **Situation:** Coming from an Accountancy degree at RMIT into self-taught development, gaps in my knowledge surface regularly — a new role, a new technology, a problem I have never seen.
- **Task:** Keep gaps from becoming blockers or hidden risks.
- **Action:** I treat each gap as a concrete learning backlog item: name it precisely, learn just enough through real work to close it, then teach it back — as I did in the weekly sharing sessions I ran at Cigro.
- **Result:** The non-CS background became a habit of continuous learning that carried me through senior roles at three companies.
- **Worst case:** If a gap had outgrown what learning through work could close, say a security or architecture blind spot, I would have brought in outside material or an experienced reviewer rather than bluff competence; the same gap biting a second shipped project would have been that signal.
- [More detail on five whys](https://en.wikipedia.org/wiki/Five_whys)

---
