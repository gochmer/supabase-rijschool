import { spawn } from "node:child_process";
import process from "node:process";

const FLOW_STEPS = [
  {
    name: "Interne links",
    command: "npm",
    args: ["run", "check:links"],
  },
  {
    name: "Klikbare routes",
    command: "npm",
    args: ["run", "playwright:clickcheck"],
  },
  {
    name: "Directe boeking",
    command: "node",
    args: ["scripts/playwright-direct-booking-check.mjs"],
  },
  {
    name: "Notificatieflows",
    command: "node",
    args: ["scripts/playwright-notification-flows-check.mjs"],
  },
  {
    name: "Reviewflow",
    command: "node",
    args: ["scripts/playwright-review-flow-check.mjs"],
  },
  {
    name: "Dashboard visual check",
    command: "npm",
    args: ["run", "playwright:dashboards"],
  },
];

function runStep(step) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    console.log(`\n[flow] ${step.name}`);
    console.log(`[flow] $ ${step.command} ${step.args.join(" ")}`);

    const child = spawn(step.command, step.args, {
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("close", (code) => {
      const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

      resolve({
        ...step,
        code,
        durationSeconds,
      });
    });
  });
}

async function main() {
  const results = [];

  for (const step of FLOW_STEPS) {
    const result = await runStep(step);
    results.push(result);

    if (result.code !== 0) {
      console.error(
        `\n[flow] Gestopt bij "${result.name}" na ${result.durationSeconds}s.`
      );
      process.exitCode = result.code ?? 1;
      return;
    }
  }

  console.log("\n[flow] Alle flow checks zijn groen.");
  console.table(
    results.map((result) => ({
      stap: result.name,
      seconden: result.durationSeconds,
    }))
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
