Git hooks
---------

This project includes a simple pre-commit hook to scan staged files for common secret patterns (Firebase API keys, private keys, supabase service role indicators, etc.).

Enable hooks for this repo (run once):

PowerShell:

    .\scripts\enable-githooks.ps1

Or (git):

    git config core.hooksPath .githooks

If a commit is blocked by the hook, inspect the staged files and remove any secrets. To bypass in an emergency use:

    git commit --no-verify

This hook is a simple safeguard — it does not replace secret scanning or code reviews.
