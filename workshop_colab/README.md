# NEXUS Onboarding Workshop — Google Colab Edition

A turnkey, browser-only version of the NEXUS onboarding workshop. Every module is a
self-installing Colab notebook: open it, add two secrets once, and run. No local Python,
no `setup.sh`, no virtual environment.

Each module's first cell is a **bootstrap** that clones this repo into Colab, installs the
Fundamental SDK, reads your secrets, authenticates, and wires up cross-module state. It is
safe to re-run.

---

## Open in Colab

| Module | Topic | Open |
|--------|-------|------|
| 0 | What Is Prediction? | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_00/module_00_what_is_prediction.ipynb) |
| 1 | Your First Credit Risk Model | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_01/module_01_your_first_nexus_model.ipynb) |
| 2 | Probabilities and Persistence | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_02/module_02_probabilities_and_persistence.ipynb) |
| 3 | Smarter Features and the Benchmark | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_03/module_03_smarter_features.ipynb) |
| 4 | Feature Importance | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_04/module_04_feature_importance.ipynb) |
| 5 | Async Patterns | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_05/module_05_async_patterns.ipynb) |
| 6 | Resilient Pipelines | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_06/module_06_resilient_pipelines.ipynb) |
| 7 | Diagnostics and Debugging | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_07/module_07_diagnostics_debugging.ipynb) |
| 8 | Operating at Scale | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Fundamental-Technologies/introduction-to-nexus/blob/main/workshop_colab/module_08/module_08_operating_at_scale.ipynb) |

> The badges point at the `main` branch, so they go live once this folder is merged to `main`.

---

## One-time setup: add your two secrets

The notebooks need two secrets. In Colab you store them **once** and every module reads them
automatically — you never paste a key into a cell.

1. Open any module with the **Open in Colab** badge above.
2. In the Colab left sidebar, click the **key icon** ("Secrets").
3. Add these two secrets and toggle **Notebook access** on for each:

   | Secret name | Value |
   |-------------|-------|
   | `FUNDAMENTAL_API_KEY` | Your NEXUS API key (starts with `ak_`) |
   | `CLOUDSMITH_FUNDAMENTAL_TOKEN` | Your token for installing the Fundamental SDK |

4. Run the first cell (the bootstrap). It installs everything and confirms authentication.

If a secret is missing, the bootstrap stops with a message telling you exactly which one to add.

---

## How to run the workshop

**Run the modules in order, in a single Colab runtime.** The modules pass state to each
other (trained model IDs, the selected feature list) through a shared file,
`workshop_colab/_workshop_state.json`, created in your Colab session. Running them in order in
the same runtime is what lets, say, Module 4 pick up the model Module 3 trained.

- Open Module 0, run it top to bottom, then move on to Module 1, and so on.
- If you open a later module in a **fresh** runtime before running the earlier ones, it will
  stop with a clear message telling you which module to run first. Re-run from where it points.
- "Restart runtime" wipes the shared state; if you restart, re-run the earlier modules.

---

## How to use this workshop

Modules use three markers so you can move at your own pace:

- **New to a topic?** Short primers appear right before the harder sections. Read them when the topic is new to you; skip them when it is not.
- **Optional — go deeper.** Sections with this label are extensions. Nothing later depends on them.
- **Already comfortable with a topic?** Skip-ahead notes tell you where to rejoin.

If you are new to machine learning, read everything in order. If you are experienced, follow the skip-ahead notes and take the optional deep dives.

---

## What's in this folder

```
workshop_colab/
├── dataset/                 # all CSVs the notebooks read (cloned with the repo)
│   ├── home_price/
│   └── credit_risk/
├── module_00/ … module_08/  # one notebook per module
└── requirements.txt         # installed automatically by the bootstrap
```

The dataset travels with the repo, so the `git clone` in the bootstrap brings the data along —
there is nothing to upload.

---

## Running locally (optional)

The same notebooks also run outside Colab. The bootstrap detects a non-Colab environment,
locates this folder, and authenticates from your shell environment instead of Colab Secrets:

```bash
# Install dependencies + the Fundamental SDK (the SDK lives in a private Cloudsmith index)
pip install -r requirements.txt
pip install "fundamental-client==0.10.0" \
  --extra-index-url "https://dl.cloudsmith.io/${CLOUDSMITH_FUNDAMENTAL_TOKEN}/fundamental/fundamental-client/python/simple/"

# Authenticate, then launch Jupyter
export FUNDAMENTAL_API_KEY="ak_..."
jupyter lab
```

Locally the SDK must already be installed before you run a notebook; in Colab the bootstrap
installs it for you.
