# Enable Git hooks for this repository by setting core.hooksPath
param()
Write-Output "Configuring repository to use .githooks for hooks..."
git config core.hooksPath .githooks
Write-Output "Done. You can now commit and the pre-commit hook will run. To bypass: --no-verify"
