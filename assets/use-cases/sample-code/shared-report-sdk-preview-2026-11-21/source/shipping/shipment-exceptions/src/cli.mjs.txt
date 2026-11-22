import { runCLI } from '@decision-lab/cli';

/**
 * Invoke the same public command handler used by the decision-lab executable.
 * This avoids shell interpolation and permits a copied example to resolve the
 * installed npm package normally. No private package paths or evaluators are
 * imported. The transcript retains commands, diagnostics and native exit codes.
 */
export async function invokeCLI(args, transcript) {
  let stdout = '', stderr = '';
  const exitCode = await runCLI(args, {
    stdout: { write(chunk) { stdout += chunk; } },
    stderr: { write(chunk) { stderr += chunk; } },
  });
  transcript.push({ args: [...args], exitCode, stdout, stderr });
  return { exitCode, stdout, stderr };
}
