#!/usr/bin/env bash
cd "$(dirname "$0")/.."

# Ejecuta el dev_up.sh en nueva ventana de Terminal
osascript <<EOT
tell application "Terminal"
    do script "cd $(pwd) && ./scripts/dev_up.sh"
    activate
end tell
EOT
