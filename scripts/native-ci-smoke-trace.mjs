// Bounded diagnostics for synthetic native smoke tests. Never retain credentials.
export class SmokeTrace {
  #states = new Map();
  #processes = [];
  #secrets = new Set();

  #redact(value) {
    for (const secret of [...this.#secrets].sort((a, b) => b.length - a.length))
      value = value.replaceAll(secret, "[redacted]");
    return value;
  }

  secret(value) {
    if (typeof value === "string" && value.length >= 8) this.#secrets.add(value);
  }

  observe(label, state) {
    this.#states.delete(label);
    this.#states.set(label, { at: new Date().toISOString(), ...state });
    if (this.#states.size > 40) this.#states.delete(this.#states.keys().next().value);
  }

  process(command, child) {
    const item = { command, pid: child.pid, exitCode: null, signal: null, stderr: "" };
    this.#processes.push(item);
    if (this.#processes.length > 10) this.#processes.shift();
    child.stderr.on("data", (chunk) => {
      item.stderr = this.#redact(item.stderr + chunk).slice(-4000);
    });
    child.once("exit", (code, signal) => {
      item.exitCode = code;
      item.signal = signal;
    });
  }

  report(error) {
    const json = JSON.stringify({
      error: error.stack || String(error),
      cause: error.cause?.stack || (error.cause && String(error.cause)),
      states: Object.fromEntries(this.#states),
      processes: this.#processes,
    }, null, 2);
    return this.#redact(json);
  }
}
