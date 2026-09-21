# Communication

## Explaining technical work to non-technical stakeholders

### Question a8b73171-a2ee-467a-ab8e-aff99e2f0476

- Tell me about a time you had to explain a complex technical concept to a non-technical client.

### Answer

- **Situation:** As senior mobile developer at Cigro, our Uobong trekking app — the largest client account — had state issues we could not reproduce in the office.
- **Task:** I needed the non-technical client to approve adding Sentry session telemetry so we could see what users actually experienced.
- **Action:** I swapped jargon for an analogy: a black box recorder that replays each user's session when something goes wrong. I showed two anonymized example reports and named the decision each one would unlock.
- **Result:** The client approved it in the same meeting; telemetry let us isolate the state issues, and after the fixes we reached zero post-launch complaints.
- Concrete artifacts beat abstract explanations.
- [More detail on the STAR method](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/)

---

### Question fc326033-212f-411f-8263-c92c8d7ac058

- Describe a time you explained a technical decision to a non-technical manager or stakeholder.

### Answer

- **Situation:** At GOSOFT we maintained a Turborepo monorepo of five React Native Expo apps; a non-technical stakeholder questioned whether one shared codebase "for five different apps" was risky.
- **Task:** As the developer leading that effort, I had to explain the choice without jargon and keep the approach supported.
- **Action:** I compared it to one shared kitchen serving five restaurants: a fix or improvement lands once and every app benefits. I walked through a real case where a shared component fix reached all five apps in a single release.
- **Result:** The stakeholder kept backing the monorepo and stopped requesting duplicated per-app work; shared components remained the team standard.
- [More detail on Situation, Task, Action, Result](https://en.wikipedia.org/wiki/Situation,_task,_action,_result)

---

### Question 3cd41689-8041-4fb0-b290-a1db4e64189d

- Tell me about a time you had to make a complicated product concept clear to business people.

### Answer

- **Situation:** At ZenGroup I built the React Native real estate app that included token trading; marketing and sales colleagues had to promote it but kept misdescribing how the tokens worked.
- **Task:** I needed non-technical partners to understand the flow well enough to represent it accurately to users.
- **Action:** I drew the token journey on a single page as a simple storyboard and ran a short walkthrough. I kept inviting questions until each partner could re-explain the flow back to me in their own words.
- **Result:** They described the feature consistently afterwards, and their user feedback became precise enough for us to turn into high-engagement product improvements.
- [More detail on the STAR interview method](https://www.themuse.com/advice/star-interview-method)

---

### Question b23cea8c-e1c5-49ad-a983-0a73605e02bf

- Describe a situation where you had to explain your technical approach to a client who was not technical.

### Answer

- **Situation:** At Cigro I co-architected the offline-sync capability for Uobong, the trekking app of our largest client. The client could not follow engineering detail but had to sign off on the approach.
- **Task:** I had to earn their confidence in plain language, because they worried about trekkers losing data in the mountains.
- **Action:** I framed the design as a travel journal: the app writes everything down locally as it happens, then mails the pages home whenever a signal appears. I listed every condition it covered — tunnels, remote summits, long treks — and what the user would see in each.
- **Result:** The client approved the design with realistic expectations, and there were no sync-related escalations after launch.
- [More detail on the STAR interview technique](https://www.mindtools.com/ah8ju2d/star-interview-technique)

---

## Written and async communication

### Question 17697f91-fded-4fa4-af39-a024412d8df6

- Tell me about a time your written communication made a real difference for a team.

### Answer

- **Situation:** At Cigro I organized weekly cross-team sharing sessions on issues and pain points, but the insights evaporated because nothing was written down.
- **Task:** As the organizer, I wanted the sessions to outlive the meeting and reach developers who could not attend.
- **Action:** I wrote a short structured summary after each session — problem, root cause, lesson — capped at one page, and indexed them so anyone could search past issues before hitting the same wall.
- **Result:** Developers started citing the summaries instead of re-asking questions, and attendance grew as people trusted that sessions produced a permanent artifact.
- [More detail on teamwork skills](https://www.indeed.com/career-advice/career-development/teamwork-skills)

---

### Question 43574d1e-eda0-41cd-9eb2-d91e9f66221b

- How did you handle communication when your team worked across many projects at once?

### Answer

- **Situation:** At GOSOFT our Turborepo monorepo held five React Native Expo apps — social feed, e-commerce, e-learning — and constant meetings were fragmenting the team's focus.
- **Task:** As a lead on the monorepo, I needed the team aligned without adding more meetings.
- **Action:** I pushed context-first written communication: pull request descriptions that stated the problem and user impact before the change, plus short design notes for anything touching shared components. I modeled the standard in my own reviews and held the line on incomplete descriptions.
- **Result:** Review cycles moved faster, developers switched between apps without a hand-off call, and the written-first habit became the team's default.
- [More detail on teamwork in the workplace](https://asana.com/resources/teamwork-in-the-workplace)

---

### Question 7ae273e8-d5a6-44d9-9242-4a34ee5d62c2

- Describe a time you improved the way you ask for help.

### Answer

- **Situation:** As a self-taught developer — my degree is a Bachelor of Accountancy from RMIT — most of my early learning happened alone, with no instructor to lean on.
- **Task:** I had to get useful answers from busy, experienced strangers in online communities, where vague questions simply get ignored.
- **Action:** I trained myself to write questions that included what I expected, what happened instead, and the smallest example that reproduced it. Before posting, I attempted two similar questions from other people, which often solved my own problem.
- **Result:** My questions consistently attracted quality answers, and writing problems down clearly still shapes how I debug and how I report issues today.
- [More detail on active listening](https://en.wikipedia.org/wiki/Active_listening)

---

## Listening and clarifying requirements

### Question 00782d9a-81ca-406e-9dca-c02cf82f6d3a

- Tell me about a time you turned user feedback into a product decision.

### Answer

- **Situation:** At ZenGroup I partnered with marketing and sales, who heard raw user feedback about our real estate app and websites every day.
- **Task:** My job was to convert their anecdotes into features that genuinely raised engagement, not just build whatever was shouted loudest.
- **Action:** I sat in on their feedback reviews and asked what users were trying to accomplish rather than what they requested. I grouped the input into themes, sized the effort for each, and proposed the smallest feature that addressed the biggest theme first.
- **Result:** We shipped high-engagement features the partners felt ownership of, and they started bringing feedback to me earlier in the process.
- [More detail on leadership skills](https://www.themuse.com/advice/leadership-skills)

---

### Question c10f6127-767f-434c-967c-055f9a62fbfc

- Describe a time you had to dig into a vague complaint to find the real problem.

### Answer

- **Situation:** At Cigro, users of the Uobong trekking app hit a target-tracking bug that generated major client complaints — but every report was vague: "tracking is wrong sometimes."
- **Task:** As the senior developer on the account, I had to turn fuzzy complaints into something reproducible before we could fix anything.
- **Action:** I interviewed the client's support contacts and asked for exact conditions each time — device, route, app version, where on the trek it happened. I mapped the answers and found the reports clustered around specific conditions rather than random failures.
- **Result:** The pattern pointed straight to the faulty logic; I fixed the bug and we reached zero post-launch complaints.
- [More detail on growth mindset](https://en.wikipedia.org/wiki/Growth_mindset)

---

### Question e8d7b0b8-6d88-409d-9aeb-9eac331441fb

- Tell me about a time a stakeholder's request and their real need were two different things.

### Answer

- **Situation:** At GOSOFT, partners on our e-commerce app kept saying "make it faster" — a request too vague to act on directly.
- **Task:** As the developer responsible for responsiveness, I needed to find what users actually experienced as slow.
- **Action:** I asked them to walk me screen by screen through where users hesitated, and I listened without interrupting. The real pain was stale information after actions, not raw loading time — a data-refresh problem, not a performance one.
- **Result:** I addressed it through scalable state management and caching choices like React Query and Legend-State, and the responsiveness complaints stopped.
- [More detail on the STAR method](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/)

---

## Giving feedback in code review

### Question 2120a2d9-d976-4274-96ee-db3b36ee060d

- Tell me about a time you gave a teammate hard feedback in a code review.

### Answer

- **Situation:** Leading five mobile developers at GOSOFT, I reviewed a teammate's change that worked but duplicated logic we already shared across the monorepo's apps.
- **Task:** I had to push back on the easy path without discouraging a capable developer.
- **Action:** Instead of a bare "change this," I explained the downstream cost — five apps inheriting the inconsistency — and asked what had blocked them from the shared component.
- **Action:** It turned out the shared code was hard to find, so we fixed its discoverability together before they resubmitted.
- **Result:** The revised change used the shared component, and the documentation improvement prevented the same trap for the rest of the team.
- [More detail on Situation, Task, Action, Result](https://en.wikipedia.org/wiki/Situation,_task,_action,_result)

---

### Question 99e8bc51-d39c-47a0-b110-eec15760ff17

- Describe how you have given constructive feedback to someone you mentored.

### Answer

- **Situation:** At Cigro I mentored developers on the Uobong trekking app; one strong junior shipped features fast but left state handling fragile, creating bugs others had to chase.
- **Task:** I needed the quality problems fixed while protecting their momentum and confidence.
- **Action:** I tied feedback to concrete user consequences — a sync bug a trekker would hit mid-route with no signal — instead of style opinions. We agreed on a checklist they ran before every change, and I reviewed alongside them until it became habit.
- **Result:** Their changes stopped generating follow-up bugs, and they began catching the same issues in other people's code.
- [More detail on the STAR interview method](https://www.themuse.com/advice/star-interview-method)

---

### Question dc94b009-4444-4962-a85d-e3606cc95187

- Tell me about a time you had to tell a mentee their work was not good enough.

### Answer

- **Situation:** At ZenGroup I mentored four developers on coding standards; one repeatedly shipped work that broke our shared conventions despite earlier informal nudges.
- **Task:** I had to have the honest conversation before the habit spread through our collaborative work.
- **Action:** I brought two concrete examples side by side with the agreed standard, then asked first what made the standard hard to follow. It emerged they had never heard the reasoning behind it, so we walked through why each rule existed.
- **Action:** I then had them lead the next standards review themselves.
- **Result:** Their following work met the standards without prompting, and explaining the "why" became part of how the whole team onboarded.
- [More detail on the STAR interview technique](https://www.mindtools.com/ah8ju2d/star-interview-technique)

---

## Receiving criticism

### Question 2e5a37aa-f43b-43ae-8311-c4e3bcee87fd

- Describe a time you were criticized for something your team shipped. How did you respond?

### Answer

- **Situation:** At Cigro, the target-tracking bug in Uobong — our largest client's trekking app — caused major client complaints, and as the senior developer leading the account, the criticism landed on me.
- **Task:** I had to own the problem publicly without deflecting onto my team or making excuses.
- **Action:** I acknowledged the impact to the client directly, laid out what we knew, what we did not, and when they would next hear from me — then kept that cadence without being chased.
- **Action:** Internally I framed it as a systems gap, not one person's failure, while I hunted the root cause.
- **Result:** The fix landed, telemetry confirmed the issue was gone, and we closed with zero post-launch complaints.
- [More detail on teamwork skills](https://www.indeed.com/career-advice/career-development/teamwork-skills)

---

### Question 8bd23a47-1adb-45c8-8ea8-1db01ab25853

- Tell me about a time you received criticism about how you communicated.

### Answer

- **Situation:** While leading code reviews at GOSOFT, a developer told me my review comments came across as dismissive — too short, reading as "do this because I said so."
- **Task:** I had to fix how I communicated, not defend my intent.
- **Action:** I asked for a specific example and saw they were right: my comments stated verdicts without reasoning. I changed my format to lead with why — the risk or cost behind each point — and asked the team to flag any comment where the reason was unclear.
- **Result:** Reviews became discussions instead of orders, my suggestions were adopted more willingly, and the team kept giving me candid style feedback afterwards.
- [More detail on teamwork in the workplace](https://asana.com/resources/teamwork-in-the-workplace)

---

### Question 0d3baa50-0a01-454a-ae22-c2bbe343a441

- Tell me about a time someone doubted your ability because of your background.

### Answer

- **Situation:** My degree is a Bachelor of Accountancy from RMIT — not computer science — and early in my self-taught journey, interviewers and peers questioned whether an accounting graduate could do serious software work.
- **Task:** I had to decide whether to argue my case or let the work speak.
- **Action:** I treated the gap as a skills list, not an identity: I built real web and mobile projects end to end and asked experienced developers to critique them harshly. When discussing my background, I connected accounting's structured analysis and attention to detail to debugging and maintainable code.
- **Result:** I earned mobile developer roles and eventually led teams; the non-traditional background now helps me talk business with stakeholders.
- [More detail on active listening](https://en.wikipedia.org/wiki/Active_listening)

---

## Disagreeing with a manager, client or peer

### Question 080d6b76-85a9-4b92-9e96-a6ab49cec905

- Describe a time you disagreed with a teammate about a technical approach. How did you resolve it?

### Answer

- **Situation:** At Cigro, a teammate and I disagreed over the design of the GPS APIs for Uobong's trekking features; both approaches were workable and we were deadlocked.
- **Task:** As the person co-architecting it, I had to break the tie without making it personal or stalling our largest client's roadmap.
- **Action:** I proposed we each list the trekking scenarios our own design would handle badly — attacking our own design instead of each other's. Covering those scenarios became our shared selection criteria.
- **Result:** One design clearly handled the weak cases better, we merged the strongest parts of both, and we presented it to the client as a joint decision we both defended.
- [More detail on leadership skills](https://www.themuse.com/advice/leadership-skills)

---

### Question 715899c8-533e-4323-9bb5-d1df399aa343

- Tell me about a time your team disagreed about which tool or approach to adopt.

### Answer

- **Situation:** At GOSOFT, our five React Native apps mixed state management styles — Redux in places, newer options like React Query and Legend-State elsewhere — and the team split over standardizing.
- **Task:** As the lead pushing for scalable, consistent state handling, I had to build alignment rather than impose a favorite.
- **Action:** I reframed the debate around needs — server data, local UI state, caching — instead of tool loyalty, and we mapped each library to the need it served best. We agreed on a small decision rule for new features and piloted it on one app first.
- **Result:** The team converged on a shared approach, and the apps' responsiveness complaints faded as data handling became consistent.
- [More detail on growth mindset](https://en.wikipedia.org/wiki/Growth_mindset)

---

### Question 3671e799-0996-4f45-93fb-d2b0e2cf881a

- Describe a time you disagreed with a client about what they were asking for.

### Answer

- **Situation:** At ZenGroup, a stakeholder on the real estate app wanted a token trading interaction built exactly as sketched, but the sketch conflicted with how users would naturally flow through property listings.
- **Task:** I had to push back on a stakeholder's idea without damaging the relationship or simply caving.
- **Action:** I asked to walk through their sketch as if I were a first-time user, narrating each point where I got confused. When they hit the same confusion themselves, I offered two alternatives that kept their intent but fixed the flow, and let them choose.
- **Result:** They picked an alternative, the shipped feature felt natural to users, and they involved me much earlier on subsequent features.
- [More detail on the STAR method](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/)

---

## Persuading and negotiating scope

### Question d52e75eb-7f9e-4a84-8566-6201a37b4275

- Tell me about a time you had to convince stakeholders to invest in work that shipped no visible feature.

### Answer

- **Situation:** At Cigro I wanted AI-driven automated testing and Maestro end-to-end pipelines covering Uobong's critical trekking flows — GPS pathing, map loading, offline sync — but the client saw only timeline with nothing new to show for it.
- **Task:** I had to sell invisible quality work to a client focused on shipping.
- **Action:** I listed our most damaging recurring issues and showed, issue by issue, which ones this testing would have caught before release, alongside the manual checking effort every release currently consumed. I proposed starting with the single most critical flow.
- **Result:** The client approved the pipelines; the critical flows stayed stable across releases, backing our record of zero post-launch complaints.
- [More detail on Situation, Task, Action, Result](https://en.wikipedia.org/wiki/Situation,_task,_action,_result)

---

### Question cda20fc7-4369-4fb9-9ef0-0e85a805c9f3

- Describe a time you persuaded your team to change the way they worked.

### Answer

- **Situation:** At GOSOFT, releasing any of our five apps meant repetitive manual steps, and staging and production deployments depended on whoever remembered the runbook.
- **Task:** As the lead, I wanted automated deployments with Turbo and Fastlane, but the team doubted the setup effort and hesitated to trust automation with releases.
- **Action:** I automated a single app's staging deployment first as a live demonstration, then ran it in parallel with the manual process until trust built.
- **Action:** I deliberately involved the loudest skeptics in extending it to production and the other apps.
- **Result:** Staging and production deployments became routine and consistent, and the team extended the pipeline to the remaining apps themselves.
- [More detail on the STAR interview method](https://www.themuse.com/advice/star-interview-method)

---

### Question f7d6fa7d-175c-4532-a16e-dcd31c3b7d3b

- Tell me about a time you negotiated scope with a non-technical stakeholder.

### Answer

- **Situation:** At ZenGroup, marketing wanted our three Next.js sites — branding and e-commerce — fully optimized for SEO and scalability while simultaneously pushing constant new page requests.
- **Task:** I had to negotiate a scope that served search performance without endlessly deferring their content goals.
- **Action:** I explained the trade-off in their language: every new unoptimized page could dilute the sites' search standing. We agreed on a definition of an optimized page template, so new pages inherited quality by default instead of each one becoming a fresh negotiation.
- **Result:** Marketing got a predictable path for launching pages, and the sites stayed optimized for SEO as they grew.
- [More detail on the STAR interview technique](https://www.mindtools.com/ah8ju2d/star-interview-technique)

---

### Question aad16b1e-d8ab-4630-a918-c1672fadc2c8

- Describe a time you had to push back on a deadline or scope you believed was unrealistic.

### Answer

- **Situation:** At Cigro, the client wanted Uobong's offline-sync capability ready for the coming trekking season, but the edge cases — long offline stretches, difficult GPS conditions — needed more time than the timeline allowed to build safely.
- **Task:** As co-architect, I had to protect the quality of our largest client's flagship feature without a flat refusal.
- **Action:** I split the scope into the sync behaviors trekkers would genuinely hit on day one versus rare edge cases, and proposed shipping the first set on schedule with the rest explicitly scheduled behind it. I documented what each tier covered so the client could verify the promise.
- **Result:** The client accepted the staged plan, launch-day sync worked reliably, and the remaining cases followed without incident.
- [More detail on teamwork skills](https://www.indeed.com/career-advice/career-development/teamwork-skills)

---

## Delivering bad news and status updates

### Question d2066299-54ef-4e2b-85ed-044f32d19395

- Tell me about a time you had to deliver unwelcome findings to a client.

### Answer

- **Situation:** At Cigro, after adding Sentry session telemetry to Uobong, the data revealed the state issues ran deeper than the single bug we had blamed — more user sessions were affected than anyone had seen.
- **Task:** I had to tell our largest client the problem was bigger than we had originally reported.
- **Action:** I brought it to them before they discovered it themselves: what the telemetry showed, which users were affected, and the fixes in priority order. I separated what we knew from what we were still investigating, and committed only to update dates I could actually meet.
- **Result:** The client stayed with us through the fixes; the issues were isolated and resolved, ending in zero post-launch complaints.
- [More detail on teamwork in the workplace](https://asana.com/resources/teamwork-in-the-workplace)

---

### Question 402151bf-9fe3-45d7-bbb8-7bf9c327b1bb

- Describe a time you had to report a failure in something you personally owned.

### Answer

- **Situation:** At GOSOFT, after we automated deployments with Turbo and Fastlane, a configuration I owned pushed a broken build toward staging — and the same speed that made automation valuable could spread the problem fast.
- **Task:** I had to surface it immediately, even though I had championed the automation causing it.
- **Action:** I stopped the line first — halting the pipeline — then posted a clear message: what happened, which apps were affected, the actual impact, and fix status.
- **Action:** I proposed the guardrail that would catch this whole class of mistake, and we added it to the pipeline.
- **Result:** Staging recovered quickly, production was untouched, and the team trusted the automation more, not less.
- [More detail on active listening](https://en.wikipedia.org/wiki/Active_listening)

---

### Question 7a86804d-ffbf-4fd8-ba1f-fefdb9240a86

- Tell me about a time you had to deliver bad news upward to leadership.

### Answer

- **Situation:** At Cigro, my weekly cross-team sharing sessions on issues and pain points kept surfacing recurring friction that never appeared in the status reports leadership read.
- **Task:** I had to report systemic problems upward, knowing some reflected on priorities set above me.
- **Action:** I anonymized specifics so no team felt exposed, grouped the pain points by how often they recurred and how much rework they caused, and presented the top three — each paired with a proposed owner and a concrete next step, so problems arrived with options rather than complaints.
- **Result:** Leadership acted on the top items, and the sharing sessions gained credibility as a channel that genuinely reached decision-makers.
- [More detail on leadership skills](https://www.themuse.com/advice/leadership-skills)

---

## Cross-functional collaboration

### Question df7d9bf1-e8df-4709-a315-2fbec514e831

- Describe a time you worked closely with people outside your own discipline.

### Answer

- **Situation:** At Cigro I introduced AI-driven automated testing with Maestro for Uobong's critical flows — GPS pathing, map loading, offline sync — and it only paid off if colleagues beyond the mobile team adopted and trusted it.
- **Task:** I had to collaborate across teams, not just hand over a tool.
- **Action:** I ran sessions where colleagues from other teams chose which flows hurt them most, prioritized automating those first, and folded their existing manual checks into the pipeline so it complemented their work instead of replacing it.
- **Result:** The pipelines covered the flows the whole delivery chain cared about, and colleagues treated them as shared infrastructure rather than my side project.
- [More detail on growth mindset](https://en.wikipedia.org/wiki/Growth_mindset)

---

### Question db81cbe6-5873-41c2-a6a0-2cdc0594ee7b

- Tell me about a time you had to keep multiple groups aligned on one product.

### Answer

- **Situation:** As senior mobile developer at Cigro, I led mobile development for Uobong, our largest client account — meaning client stakeholders and our internal teams all pulled on the same roadmap.
- **Task:** I was the communication hinge; any gap between the client's expectations and engineering reality would land on the trekking app's quality.
- **Action:** I kept one shared source of truth for status and decisions, translated between client language and engineering language in both directions, and raised mismatches the moment they appeared instead of waiting for delivery.
- **Result:** Releases ran without surprise gaps between what the client expected and what shipped, and the account stayed healthy throughout.
- [More detail on the STAR method](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/)

---

### Question 46bb2f33-e245-4c68-a364-9470a4f0aa56

- Describe a time you worked with a department whose priorities were very different from yours.

### Answer

- **Situation:** At ZenGroup I built three Next.js sites optimized for SEO and scalability, while marketing's priority was campaign speed — new landing content whenever they wanted it, ideally yesterday.
- **Task:** I had to protect the sites' structure without becoming the department that always says no.
- **Action:** I learned their campaign calendar and built flexibility where it mattered — templates they could populate themselves — while holding the line on the underlying structure. I also joined their planning each cycle instead of reacting to incoming requests.
- **Result:** Marketing shipped campaigns on their own timeline, the sites stayed optimized as they grew, and our collaboration shifted from ticket ping-pong to joint planning.
- [More detail on Situation, Task, Action, Result](https://en.wikipedia.org/wiki/Situation,_task,_action,_result)

---

## Teaching and presenting

### Question ab5c7ee3-6e2a-4789-8fc1-6e103e9dd228

- Tell me about a time you taught a new technology to people who were resistant to it.

### Answer

- **Situation:** At Cigro I trained developers on AI workflows and new technologies; some saw AI-assisted work as a threat to their craft or a hype cycle best waited out.
- **Task:** I had to win over skeptics, not just demo to the already convinced.
- **Action:** I started from their current pain — repetitive, low-value work — and showed the workflow applied to their own tasks, with and without AI assistance side by side. I was also explicit about where it failed and wasted time, which cost me little credibility and bought real trust.
- **Result:** The most skeptical developers began using the workflows on real tasks, and the techniques spread across teams beyond my sessions.
- [More detail on the STAR interview method](https://www.themuse.com/advice/star-interview-method)

---

### Question 29811e70-dea9-45d7-b234-730b0f1dc7a2

- Describe a time you had to present your team's work to an important audience.

### Answer

- **Situation:** At Cigro, as the mobile lead on Uobong for our largest client, I regularly presented progress to client stakeholders whose confidence shaped the whole account.
- **Task:** I had to present technical progress in a way non-technical stakeholders could genuinely evaluate and act on.
- **Action:** I structured demos around trekker stories — walk in, lose signal, GPS path still recorded — rather than feature lists, and always showed what had been deliberately deferred and why. I ended every demo with the specific decisions I needed from them.
- **Result:** Stakeholders engaged with real questions instead of nodding along, decisions came faster, and demos became something they requested rather than endured.
- [More detail on the STAR interview technique](https://www.mindtools.com/ah8ju2d/star-interview-technique)

---

### Question 9c681885-ec85-45eb-9c47-f9e90b334815

- Tell me about a time you helped someone else become a better communicator.

### Answer

- **Situation:** At Cigro I mentored developers on the Uobong team; one was technically strong but froze when presenting progress, so all updates flowed through me.
- **Task:** I wanted them representing their own work to the client and team — for their growth, and to stop me being the bottleneck.
- **Action:** We rehearsed with a simple frame — what changed, why it matters to trekkers, what comes next — and in early sessions I sat beside them rather than instead of them, stepping in only when truly stuck. After each session we kept one thing and changed one thing.
- **Result:** They began running their own updates unaided, and I got to focus on architecture and mentoring instead of relaying status.
- [More detail on teamwork skills](https://www.indeed.com/career-advice/career-development/teamwork-skills)

---
