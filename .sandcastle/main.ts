import { config } from "dotenv";
import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

config({ path: new URL(".env", import.meta.url).pathname });

const MODEL = "ollama-cloud/glm-5.1";

const MAX_ITERATIONS = 10;

const opencodeJson = (model: string): sandcastle.AgentProvider => ({
  name: "opencode",
  env: {},
  captureSessions: false,
  buildPrintCommand({ prompt }) {
    return {
      command: `opencode run --format json --model '${model}' -p -`,
      stdin: prompt,
    };
  },
  buildInteractiveArgs({ prompt }) {
    const args = ["opencode", "--model", model];
    if (prompt) args.push("-p", prompt);
    return args;
  },
  parseStreamLine(line: string) {
    if (!line.startsWith("{")) return [];
    try {
      const obj = JSON.parse(line);
      if (obj.type === "error" && obj.error) {
        const msg = typeof obj.error === "string" ? obj.error : obj.error?.message;
        return msg ? [{ type: "result" as const, result: msg }] : [];
      }
      if (obj.type === "text" && typeof obj.part?.text === "string") {
        return [{ type: "text" as const, text: obj.part.text }];
      }
      if (obj.type === "tool_use" && typeof obj.part?.tool === "string") {
        const toolName = obj.part.tool;
        const TOOL_ARG_FIELDS: Record<string, string> = {
          Bash: "command",
          WebSearch: "query",
          WebFetch: "url",
          Agent: "description",
          read: "filePath",
          write: "filePath",
          edit: "filePath",
        };
        const argField = TOOL_ARG_FIELDS[toolName];
        if (!argField) return [];
        const input = obj.part.state?.input;
        if (!input || typeof input[argField] !== "string") return [];
        return [{ type: "tool_call" as const, name: toolName, args: input[argField] }];
      }
      return [];
    } catch {
      return [];
    }
  },
});

const hooks = {
  sandbox: {
    onSandboxReady: [
      { command: "npm install" },
    ],
  },
};

const copyToWorktree = ["node_modules"];

(async () => {
  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`);

    const plan = await sandcastle.run({
      hooks,
      sandbox: docker(),
      name: "planner",
      maxIterations: 1,
      agent: opencodeJson(MODEL),
      promptFile: "./.sandcastle/plan-prompt.md",
    });

    const planMatch = plan.stdout.match(/<plan>([\s\S]*?)<\/plan>/);
    if (!planMatch) {
      throw new Error(
        "Planning agent did not produce a <plan> tag.\n\n" + plan.stdout,
      );
    }

    const { issues } = JSON.parse(planMatch[1]!) as {
      issues: { id: string; title: string; branch: string }[];
    };

    if (issues.length === 0) {
      console.log("No unblocked issues to work on. Exiting.");
      break;
    }

    console.log(
      `Planning complete. ${issues.length} issue(s) to work in parallel:`,
    );
    for (const issue of issues) {
      console.log(`  ${issue.id}: ${issue.title} → ${issue.branch}`);
    }

    const settled = await Promise.allSettled(
      issues.map(async (issue) => {
        const sandbox = await sandcastle.createSandbox({
          branch: issue.branch,
          sandbox: docker(),
          hooks,
          copyToWorktree,
        });

        try {
          const implement = await sandbox.run({
            name: "implementer",
            maxIterations: 100,
            agent: opencodeJson(MODEL),
            promptFile: "./.sandcastle/implement-prompt.md",
            promptArgs: {
              TASK_ID: issue.id,
              ISSUE_TITLE: issue.title,
              BRANCH: issue.branch,
            },
          });

          if (implement.commits.length > 0) {
            const review = await sandbox.run({
              name: "reviewer",
              maxIterations: 1,
              agent: opencodeJson(MODEL),
              promptFile: "./.sandcastle/review-prompt.md",
              promptArgs: {
                BRANCH: issue.branch,
              },
            });

            return {
              ...review,
              commits: [...implement.commits, ...review.commits],
            };
          }

          return implement;
        } finally {
          await sandbox.close();
        }
      }),
    );

    for (const [i, outcome] of settled.entries()) {
      if (outcome.status === "rejected") {
        console.error(
          `  ✗ ${issues[i]!.id} (${issues[i]!.branch}) failed: ${outcome.reason}`,
        );
      }
    }

    const completedIssues = settled
      .map((outcome, i) => ({ outcome, issue: issues[i]! }))
      .filter(
        (entry) =>
          entry.outcome.status === "fulfilled" &&
          entry.outcome.value.commits.length > 0,
      )
      .map((entry) => entry.issue);

    const completedBranches = completedIssues.map((i) => i.branch);

    console.log(
      `\nExecution complete. ${completedBranches.length} branch(es) with commits:`,
    );
    for (const branch of completedBranches) {
      console.log(`  ${branch}`);
    }

    if (completedBranches.length === 0) {
      console.log("No commits produced. Nothing to merge.");
      continue;
    }

    await sandcastle.run({
      hooks,
      sandbox: docker(),
      name: "merger",
      maxIterations: 1,
      agent: opencodeJson(MODEL),
      promptFile: "./.sandcastle/merge-prompt.md",
      promptArgs: {
        BRANCHES: completedBranches.map((b) => `- ${b}`).join("\n"),
        ISSUES: completedIssues
          .map((i) => `- ${i.id}: ${i.title}`)
          .join("\n"),
      },
    });

    console.log("\nBranches merged.");
  }

  console.log("\nAll done.");
})();
