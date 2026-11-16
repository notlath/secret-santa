# Review context

Supply both reviewers with the originating ticket and spec, the fixed comparison commit, and applicable spec exceptions. Include the relevant repository standards in the Standards review. The MVP explicitly excludes ui-sdk's agent-ready/createAgent/WebMCP work.

When a change adds roles, live regions or repeated controls to an existing page, inspect that page's existing browser assertions. A formerly unique role may become ambiguous. Scope an assertion by a meaningful region, accessible name or relevant message; choose the boundary that identifies the behavior being checked. Full browser verification covers existing flows as well as the new component.

Keep scope judgments separate from deterministic checks. Existing lint/typecheck and browser failures must be resolved before reporting an integration candidate ready. Use the project's documented exceptions when interpreting generic skill rules.

For browser assertions, check whether the test isolates the condition it claims to cover. Exercise reduced motion with pointer activation separately from the keyboard bypass. For controls gated until hydration, reuse the delayed-script fixture and check native disabled behavior where the browser could otherwise submit or navigate.

For new custom graphics or unfamiliar CSS utilities, require rendered evidence during focused UI testing: essential geometry assertions and inspected phone/desktop screenshots. A generated screenshot alone does not establish that the layout was reviewed.

Review settled changes before final verification. A successful verification must refer to unchanged inputs; consult its fingerprinted summary when comparing results or diagnosing a failure.
