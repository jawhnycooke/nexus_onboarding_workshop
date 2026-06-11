#!/usr/bin/env bash
#
# One-command setup for the NEXUS onboarding workshop.
# Run from this folder:  ./setup.sh
#
# Creates a virtual environment, installs the workshop dependencies, and
# installs the Fundamental SDK from Cloudsmith using the token in .env.local.
#
set -eo pipefail
cd "$(dirname "$0")"

# Pin the Fundamental SDK to the version this workshop was validated against.
SDK_VERSION="0.10.0"

step() { printf "\n\033[1m==> %s\033[0m\n" "$1"; }

# 1. Require uv
if ! command -v uv >/dev/null 2>&1; then
  echo "uv is not installed. Install it, then re-run ./setup.sh:"
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

# 2. Require secrets
if [ ! -f .env.local ]; then
  echo "No .env.local found. Create it first, then re-run ./setup.sh:"
  echo "  cp .env.example .env.local     # then edit it with your tokens"
  exit 1
fi
set -a
# shellcheck disable=SC1091
. ./.env.local
set +a
if [ -z "${CLOUDSMITH_FUNDAMENTAL_TOKEN:-}" ] || [ "${CLOUDSMITH_FUNDAMENTAL_TOKEN}" = "replace_me" ]; then
  echo "CLOUDSMITH_FUNDAMENTAL_TOKEN is not set in .env.local. Edit it and re-run ./setup.sh."
  exit 1
fi

# 3. Virtual environment
step "Creating virtual environment (.venv)"
if [ ! -d .venv ]; then
  uv venv
else
  echo ".venv already exists — reusing it (delete it to start fresh)."
fi
# shellcheck disable=SC1091
. .venv/bin/activate

# 4. Dependencies
step "Installing workshop dependencies (pandas, scikit-learn, Jupyter, ...)"
uv pip install -r requirements.txt

step "Installing the Fundamental SDK (v${SDK_VERSION}) from Cloudsmith"
uv pip install "fundamental-client==${SDK_VERSION}" \
  --extra-index-url "https://dl.cloudsmith.io/${CLOUDSMITH_FUNDAMENTAL_TOKEN}/fundamental/fundamental-client/python/simple/"

# 5. Verify
step "Verifying the install"
python -c "import fundamental; print(f'Fundamental SDK {getattr(fundamental, \"__version__\", \"?\")} imported OK')"

step "Setup complete"
cat <<'DONE'
Launch the workshop from the terminal:
  source .venv/bin/activate && jupyter lab

Or in VS Code: open this workshop/ folder and pick the .venv interpreter when
prompted. The bundled .vscode/settings.json points VS Code at the venv and loads
your .env.local automatically.
DONE
