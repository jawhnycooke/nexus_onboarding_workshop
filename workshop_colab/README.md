# NEXUS Onboarding Workshop — Google Colab Edition

A turnkey, browser-only version of the NEXUS onboarding workshop. Every module is a
self-installing Colab notebook: open it with its badge below, add two secrets once, and run.
No local Python, no `setup.sh`, no virtual environment.

Each module's first cell is a **bootstrap** that fetches the workshop dataset, mounts your
Google Drive (so modules can share state), installs the Fundamental SDK, reads your secrets,
and authenticates. It is safe to re-run.

---

## Open in Colab

Always open modules with these badges — Colab's file browser cannot open notebooks, and the
badge is what loads the notebook straight from GitHub into Colab.

| Module | Topic | Open |
|--------|-------|------|
| 0 | What Is Prediction? | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_00_what_is_prediction.ipynb) |
| 1 | Your First Credit Risk Model | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_01_your_first_nexus_model.ipynb) |
| 2 | Probabilities and Persistence | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_02_probabilities_and_persistence.ipynb) |
| 3 | Smarter Features and the Benchmark | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_03_smarter_features.ipynb) |
| 4 | Feature Importance | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_04_feature_importance.ipynb) |
| 5 | Async Patterns | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_05_async_patterns.ipynb) |
| 6 | Resilient Pipelines | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_06_resilient_pipelines.ipynb) |
| 7 | Diagnostics and Debugging | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_07_diagnostics_debugging.ipynb) |
| 8 | Operating at Scale | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jawhnycooke/nexus_onboarding_workshop/blob/main/workshop_colab/module_08_operating_at_scale.ipynb) |

> The badges (and the `REPO` variable in each bootstrap cell) currently point at the testing
> repo `jawhnycooke/nexus_onboarding_workshop`. At go-live, switch both to
> `Fundamental-Technologies/introduction-to-nexus`.

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

**Run the modules in order**, each from its own badge. Every Colab notebook runs in its own
fresh session, so the modules pass state to each other (trained model IDs, the selected
feature list) through a small JSON file on your **Google Drive**:
`MyDrive/nexus_workshop/_workshop_state.json`.

- When the bootstrap asks to mount Google Drive, **approve the popup**. That one click is
  what lets, say, Module 4 pick up the model Module 3 trained.
- If you decline the Drive mount, nothing breaks — each module prints the values it produces
  (e.g. `Saved 'MODEL_ID' = '...'`), and the next module will ask you to paste them.
- If you open a later module before running the earlier ones, it stops with a clear message
  telling you which module to run first (or lets you paste the value if you already have it).
- The state file lives on your Drive, so it survives closed tabs, recycled runtimes, and
  multi-day gaps between modules.

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
├── module_00_*.ipynb … module_08_*.ipynb   # one notebook per module
├── requirements.txt                        # for running locally (Colab has these preinstalled)
└── README.md
```

The CSVs the notebooks read live in `dataset/` at the **repo root**. In Colab the bootstrap
sparse-fetches just that folder (not the whole repo) — there is nothing to upload.

---

## Running locally (optional)

The same notebooks also run outside Colab. The bootstrap detects a non-Colab environment,
locates the repo's `dataset/` folder, keeps state in `workshop_colab/_workshop_state.json`,
and authenticates from your shell environment instead of Colab Secrets:

```bash
# From the cloned repo root:
# Install dependencies + the Fundamental SDK (the SDK lives in a private Cloudsmith index)
pip install -r workshop_colab/requirements.txt
pip install "fundamental-client==0.10.0" \
  --extra-index-url "https://dl.cloudsmith.io/${CLOUDSMITH_FUNDAMENTAL_TOKEN}/fundamental/fundamental-client/python/simple/"

# Authenticate, then launch Jupyter
export FUNDAMENTAL_API_KEY="ak_..."
jupyter lab
```

Locally the SDK must already be installed before you run a notebook; in Colab the bootstrap
installs it for you.
