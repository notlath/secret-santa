# Review context

Supply both reviewers with the originating ticket and spec, the fixed comparison commit, and applicable spec exceptions. Include the relevant repository standards in the Standards review. The MVP explicitly excludes ui-sdk's agent-ready/createAgent/WebMCP work.

When a change adds roles, live regions or repeated controls to an existing page, inspect that page's existing browser assertions. A formerly unique role may become ambiguous. Scope an assertion by a meaningful region, accessible name or relevant message; preserve its existing behavioral checks when changing its scope. Full browser verification covers existing flows as well as the new component.

Keep scope judgments separate from deterministic checks. Existing lint/typecheck and browser failures must be resolved before reporting an integration candidate ready. Use the project's documented exceptions when interpreting generic skill rules.

For browser assertions, check whether the test isolates the condition it claims to cover. Exercise reduced motion with pointer activation separately from the keyboard bypass. Also exercise a preference change while an animation is running: switching reduced motion on mid-animation must cancel the motion and clear the state that drives it, so restoring the preference cannot replay it. For each new JavaScript-dependent control, check for coverage with the delayed-script fixture and native disabled behavior before hydration.

When an effect depends on who caused a state transition, inspect local, remote, repeated and concurrent transitions separately. A partial local save must not leave state that animates a later remote update, and a local transition back into a state the page already showed must still animate. Confirm coverage for each transition; `e2e/join-ready.spec.ts` covers the Ready case.

For new custom graphics or unfamiliar CSS utilities, require rendered evidence during focused UI testing: essential geometry assertions and inspected phone/desktop screenshots. A generated screenshot alone does not establish that the layout was reviewed.

Review settled changes before final verification. A successful verification must refer to unchanged inputs; consult its fingerprinted summary when comparing results or diagnosing a failure.

The Spec reviewer checks the ticket against the spec as well as the code against the ticket. Where a ticket narrows a spec rule (a status, a role, a limit), report it: the spec wins unless an ADR says otherwise.

Confirm each finding against the code or an existing test before reporting it, and quote the line that proves it. A claim about behavior (an allowed status, an error mapping) is checked where that behavior lives.
