#!/usr/bin/env python3
# /// script
# requires-python = ">=3.8"
# ///

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def get_project_root():
    """
    Get project root from CLAUDE_PROJECT_DIR environment variable.
    Falls back to finding .claude directory if not set.
    """
    # First, try environment variable
    env_root = os.getenv('CLAUDE_PROJECT_DIR')
    if env_root:
        return Path(env_root)

    # Fallback: find .claude directory
    current = Path.cwd().resolve()
    for parent in [current] + list(current.parents):
        if (parent / '.claude').exists():
            return parent

    # Last resort: current directory
    return current


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--chat', action='store_true', help='Copy transcript to chat.json')
        args = parser.parse_args()

        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract required fields
        session_id = input_data.get("session_id", "")
        stop_hook_active = input_data.get("stop_hook_active", False)

        # Get project root and ensure log directory exists
        project_root = get_project_root()
        current_date = datetime.now().strftime("%Y%m%d")
        log_dir = project_root / '.claude' / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "subagent_stop.json"

        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []

        # Append new data
        log_data.append(input_data)

        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)

        # Handle --chat switch (same as stop.py)
        if args.chat and 'transcript_path' in input_data:
            transcript_path = input_data['transcript_path']
            if os.path.exists(transcript_path):
                # Read .jsonl file and convert to JSON array
                chat_data = []
                try:
                    with open(transcript_path, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                try:
                                    chat_data.append(json.loads(line))
                                except json.JSONDecodeError:
                                    pass  # Skip invalid lines

                    # Create unique filename based on session_id and timestamp
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    session_short = session_id[:8] if len(session_id) >= 8 else session_id
                    chat_filename = f'transcript_subagent_{session_short}_{timestamp}.json'

                    # Ensure dated subdirectory exists
                    dated_log_dir = log_dir / current_date
                    dated_log_dir.mkdir(parents=True, exist_ok=True)
                    chat_file = dated_log_dir / chat_filename

                    with open(chat_file, 'w') as f:
                        json.dump(chat_data, f, indent=2)
                except Exception as e:
                    # Log errors but don't fail the hook
                    try:
                        error_log = log_dir / 'hook_errors.log'
                        with open(error_log, 'a') as f:
                            f.write(f"{datetime.now().isoformat()}: subagent_stop.py transcript error: {e}\n")
                    except:
                        pass

        sys.exit(0)

    except json.JSONDecodeError as e:
        # Log JSON decode errors to help with debugging
        try:
            project_root = get_project_root()
            error_log = project_root / '.claude' / 'logs' / 'hook_errors.log'
            error_log.parent.mkdir(parents=True, exist_ok=True)
            with open(error_log, 'a') as f:
                f.write(f"{datetime.now().isoformat()}: subagent_stop.py JSON decode error: {e}\n")
        except:
            pass  # Still fail silently if we can't log
        sys.exit(0)
    except Exception as e:
        # Log other errors to help with debugging
        try:
            project_root = get_project_root()
            error_log = project_root / '.claude' / 'logs' / 'hook_errors.log'
            error_log.parent.mkdir(parents=True, exist_ok=True)
            with open(error_log, 'a') as f:
                f.write(f"{datetime.now().isoformat()}: subagent_stop.py error: {e}\n")
                import traceback
                f.write(traceback.format_exc() + "\n")
        except:
            pass  # Still fail silently if we can't log
        sys.exit(0)


if __name__ == "__main__":
    main()
