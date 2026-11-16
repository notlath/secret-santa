# Review context

Supply both reviewers with the originating ticket and spec, the fixed comparison commit, and applicable spec exceptions. Include the relevant repository standards in the Standards review. The MVP explicitly excludes ui-sdk's agent-ready/createAgent/WebMCP work.

When a change adds roles, live regions or repeated controls to an existing page, inspect that page's existing browser assertions. A formerly unique role may become ambiguous. Scope an assertion by a meaningful region, accessible name or relevant message; choose the boundary that identifies the behavior being checked. Full browser verification covers existing flows as well as the new component.

Keep scope judgments separate from deterministic checks. Existing lint/typecheck and browser failures must be resolved before reporting an integration candidate ready. Use the project's documented exceptions when interpreting generic skill rules.
