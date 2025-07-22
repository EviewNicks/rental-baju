#!/usr/bin/env python3

import json
import sys
import re
from pathlib import Path

def main():
    try:
        # Read input data from stdin
        input_data = json.load(sys.stdin)

        tool_input = input_data.get("tool_input", {})
        command = tool_input.get("command", "")
        if not command:
            sys.exit(0)

        # Patterns
        npm_pattern = r"\bnpm\s+"
        pnpm_pattern = r"\bpnpm\s+"
        # npx boleh, yarn boleh
        yarn_pattern = r"\byarn\s+"
        npx_pattern = r"\bnpx\s+"

        blocked_command = None
        suggested_command = None
        reason = None

        # Blokir npm/pnpm, arahkan ke yarn/npx
        if re.search(npm_pattern, command):
            blocked_command = command
            # Saran: ganti ke yarn jika memungkinkan, jika tidak npx
            if re.search(r"npm run ", command):
                suggested_command = re.sub(r"npm run ", "yarn ", command)
                reason = "Gunakan 'yarn' sebagai pengganti 'npm run' untuk workflow utama."
            elif re.search(r"npm install", command):
                suggested_command = re.sub(r"npm install", "yarn install", command)
                reason = "Gunakan 'yarn install' sebagai pengganti 'npm install'."
            else:
                suggested_command = re.sub(r"npm ", "yarn ", command)
                reason = "Gunakan 'yarn' sebagai default, kecuali ada alasan khusus."
        elif re.search(pnpm_pattern, command):
            blocked_command = command
            suggested_command = re.sub(r"pnpm ", "yarn ", command)
            reason = "Project ini tidak menggunakan pnpm, gunakan 'yarn' sebagai default."
        # npx dan yarn tidak diblokir
        # Jika ingin enforce yarn sebagai default, bisa log jika ada npx, tapi tidak blokir

        if blocked_command:
            # Log the usage attempt
            log_file = Path(__file__).parent.parent / "package_manager_enforcement.json"
            log_entry = {
                "session_id": input_data.get("session_id"),
                "blocked_command": blocked_command,
                "suggested_command": suggested_command,
                "reason": reason
            }

            # Load existing logs or create new list
            if log_file.exists():
                with open(log_file, "r") as f:
                    logs = json.load(f)
            else:
                logs = []

            logs.append(log_entry)

            # Save logs
            with open(log_file, "w") as f:
                json.dump(logs, f, indent=2)

            # Send error message to stderr for LLM to see
            print(f"Error: Project ini menggunakan 'yarn' sebagai package manager utama. {reason} (Jika sangat spesifik, baru gunakan npm)", file=sys.stderr)
            # Exit with code 2 to signal LLM to correct
            sys.exit(2)

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error in use-bun hook: {e}", file=sys.stderr)
        sys.exit(1)

main()