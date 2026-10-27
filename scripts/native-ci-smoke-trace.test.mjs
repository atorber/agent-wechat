import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { SmokeTrace } from "./native-ci-smoke-trace.mjs";

test("smoke failures retain the latest phase, operation state and exited process diagnostics", () => {
  const trace = new SmokeTrace();
  const child = new EventEmitter();
  child.pid = 123;
  child.stderr = new EventEmitter();
  trace.process("hub", child);
  trace.observe("waiting", { label: "work signed in", timeout: 20000 });
  trace.observe("login:work", { state: "awaiting_scan" });
  trace.observe("login:work", { state: "authenticating", result: {} });
  child.stderr.emit("data", "profile initialization failed");
  child.emit("exit", 1, null);
  const report = JSON.parse(trace.report(new Error("Timed out: work signed in")));
  assert.equal(report.states["login:work"].state, "authenticating");
  assert.equal(report.states.waiting.timeout, 20000);
  assert.equal(report.processes[0].stderr, "profile initialization failed");
  assert.equal(report.processes[0].exitCode, 1);
  assert.match(report.error, /work signed in/);
});

test("smoke diagnostics bound process logs and states and redact known secrets everywhere", () => {
  const trace = new SmokeTrace();
  const secret = "synthetic-secret-".repeat(4);
  trace.secret(secret);
  for (let i = 0; i < 60; i++) trace.observe(String(i), { value: i });
  trace.observe("secret", { value: secret });
  for (let i = 0; i < 12; i++) {
    const child = new EventEmitter();
    child.stderr = new EventEmitter();
    trace.process("hub", child);
    child.stderr.emit("data", "x".repeat(5000));
    child.stderr.emit("data", secret);
  }
  const json = trace.report(new Error(secret, { cause: new Error(secret) }));
  assert.ok(!json.includes(secret));
  const report = JSON.parse(json);
  assert.equal(Object.keys(report.states).length, 40);
  assert.equal(report.states["0"], undefined);
  assert.equal(report.processes.length, 10);
  assert.ok(report.processes.every((p) => p.stderr.length <= 4000));
  assert.equal(report.states.secret.value, "[redacted]");
});

test("redaction happens before truncation so a partial credential is not retained", () => {
  const trace = new SmokeTrace();
  const secret = "synthetic-secret-".repeat(4);
  trace.secret(secret);
  const child = new EventEmitter();
  child.stderr = new EventEmitter();
  trace.process("hub", child);
  child.stderr.emit("data", secret.slice(0, 20));
  child.stderr.emit("data", secret.slice(20) + "x".repeat(3970));
  const report = JSON.parse(trace.report(new Error("fixture failure")));
  assert.equal(report.processes[0].stderr, "[redacted]" + "x".repeat(3970));
});
