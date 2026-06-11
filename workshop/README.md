# NEXUS Platform Onboarding Workshop

A hands-on, nine-module workshop that walks new customers through the NEXUS platform via a single use case: **credit risk / loan default prediction**. Each module ships with a Jupyter notebook for interactive learning and a presentation deck that works without an instructor.

## Prerequisites

- **Python 3.10 or higher**
- **[uv](https://docs.astral.sh/uv/)** — the installer uses it (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- A **NEXUS API key** exposed as `FUNDAMENTAL_API_KEY` (e.g., in an `.env.local` file not tracked by git)
- A **Fundamental Cloudsmith token** exposed as `CLOUDSMITH_FUNDAMENTAL_TOKEN` so `pip` can fetch the SDK from the private repository
- Working familiarity with **pandas** and **scikit-learn**. Module 00 is a gentle on-ramp; 200- and 300-level modules assume comfort with DataFrames, train/holdout splits, and basic classification metrics.

## Setup

Three steps: add your tokens, run the installer, launch.

```bash
# 1. Clone and enter the workshop
git clone https://github.com/Fundamental-Technologies/introduction-to-nexus.git
cd introduction-to-nexus/workshop

# 2. Add your secrets (.env.local is not tracked by git)
cp .env.example .env.local        # then edit .env.local with your two tokens

# 3. Install everything — creates .venv, installs the deps and the Fundamental SDK
./setup.sh
```

Then launch the notebooks:

```bash
source .venv/bin/activate && jupyter lab
```

**Prefer VS Code?** Open the `workshop/` folder, run `./setup.sh` once, and pick the `.venv` interpreter when prompted. The bundled `.vscode/settings.json` already points VS Code at the venv and loads your `.env.local`, so the notebooks find your API key automatically. Run the modules in order (00 → 08).

`setup.sh` needs [uv](https://docs.astral.sh/uv/) (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`). It reads `CLOUDSMITH_FUNDAMENTAL_TOKEN` from `.env.local` to fetch the SDK from the private repository.

<details>
<summary>Manual setup (Windows, or if you would rather not run the script)</summary>

```bash
uv venv && source .venv/bin/activate          # or: python -m venv .venv && source .venv/bin/activate
set -a && source .env.local && set +a          # export so Jupyter's kernel inherits the key
uv pip install -r requirements.txt
uv pip install "fundamental-client==0.10.0" \
  --extra-index-url "https://dl.cloudsmith.io/${CLOUDSMITH_FUNDAMENTAL_TOKEN}/fundamental/fundamental-client/python/simple/"
jupyter lab
```
</details>

The first cell of Modules 00 and 01 verifies the SDK is importable. If it fails, the install did not succeed — check that `CLOUDSMITH_FUNDAMENTAL_TOKEN` is set in `.env.local` and that you are using the `.venv`.

## Dataset

The dataset lives at the repo root and is shared by every module. From any module notebook, paths resolve as `../../dataset/...`:

- **`../../dataset/home_price/housing.csv`** — 545 rows, area vs price. Used only in Module 00 to introduce the concept of prediction.
- **`../../dataset/credit_risk/`** — the credit-risk tables that thread through Modules 01–08:
  - `borrowers_train.csv` — 4,591 rows, 13 columns, `default_flag` target (19.1% default rate)
  - `borrowers_holdout.csv` — holdout evaluation set
  - `borrowers_train_messy.csv` / `borrowers_holdout_messy.csv` — intentionally messy versions used in the data-prep lesson
  - `credit_assessments.csv`, `financial_snapshots.csv`, `credit_utilization.csv`, `payment_events.csv` — supplementary join tables introduced in Module 03 and beyond

## How to use this workshop

Modules use three markers so you can move at your own pace:

- **New to a topic?** Short primers appear right before the harder sections. Read them when the topic is new to you; skip them when it is not.
- **Optional — go deeper.** Sections with this label are extensions. Nothing later depends on them.
- **Already comfortable with a topic?** Skip-ahead notes tell you where to rejoin.

If you are new to machine learning, read everything in order. If you are experienced, follow the skip-ahead notes and take the optional deep dives.

## Modules

| # | Level | Title | Description |
|---|---|---|---|
| 00 | 100 | What Is Prediction? | A gentle on-ramp for participants new to data science. Builds intuition using a one-feature housing model (area → price) and an interactive slider, so learners feel what "prediction" means before the real use case begins. |
| 01 | 100 | Your First Credit Risk Model | Build and train your first NEXUS model on the credit-risk dataset using numeric features. Covers the core `fit` / `predict` loop and introduces the `trained_model_id_` handle that carries through the rest of the workshop. |
| 02 | 100 | Probabilities and Persistence | Go beyond binary predictions with `predict_proba`, and reload a trained model with `load_model()`. Compares the `quality` and `speed` training modes so you can pick the right trade-off for your workload. |
| 03 | 200 | Smarter Features | Level up the feature set with categorical columns (passed to NEXUS as-is) and multi-table joins across borrowers, financial snapshots, credit assessments, and payments. Covers the data-prep patterns — cleaning and joins that add signal — that separate production models from notebook experiments. |
| 04 | 200 | Feature Importance | Understand what your model learned with `get_feature_importance()` — a flat ranking over your features. Plot the cumulative importance curve, then run an importance-driven trim experiment and pick a `TOP_FEATURES` set for downstream modules. |
| 05 | 200 | Async Patterns | Graduate from synchronous calls to the full async workflow: `submit_fit_task`, `poll_fit_result`, `submit_predict_task`. Essential for any production integration that can't afford to block a Python process for minutes at a time. |
| 06 | 300 | Resilient Pipelines | Build integrations that don't break in the field. Covers the typed exception hierarchy from `fundamental.exceptions`, retry logic with exponential backoff, and resilient polling strategies. |
| 07 | 300 | Diagnostics and Debugging | When things go wrong, know exactly where to look. Covers Python logging, the SDK's built-in `diagnose()` context manager, structured `trace_id` interpretation, and a systematic walkthrough of the most common failure patterns. |
| 08 | 300 | Operating at Scale | Everything you need to run NEXUS in production: API-key management across environments, model lifecycle with `client.models.set_attributes` / `get` / `delete`, and full inventory via `client.models.list()`. |

## How to Run

Open the notebook in each `module_XX/` directory in order. The modules share state through IPython's `%store` magic and through model IDs that persist on the NEXUS server:

- **Modules 01 → 02**: Module 01 stores a `MODEL_ID` that Module 02 reloads with `%store -r` and `clf.load_model(MODEL_ID)`.
- **Modules 03 → 04–08**: Module 03 produces an `ENRICHED_MODEL_ID` and Module 04 produces a `TOP_FEATURES` list. Both flow through the rest of the modules.
- **Module 06**: persists a small `module_06_registry.json` locally — leave it alone between runs (it's gitignored).

If you jump into a later module without running its prerequisites, use `client.models.list()` to discover existing models under your API key, or run `clf.load_model(<a-known-model-id>)` to pick up where you left off.

## Folder Layout

```
workshop/
├── README.md
├── requirements.txt
└── module_00/ … module_08/        # one directory per module
    ├── module_XX_*.ipynb          # the notebook
    ├── module_XX_presentation.html  # authored 1920×1080 deck (source of truth)
    └── module_XX_presentation.pdf   # rendered from the HTML
```

Shared assets live one level up at the repo root:

```
../dataset/                        # 11 CSVs
../fundamental_assets/             # deck CSS/JS, build scripts, branding
```
