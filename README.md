# NEXUS Platform Onboarding Workshop

A hands-on, nine-module workshop that walks new customers through the NEXUS platform via a single use case: **credit risk / loan default prediction**. Modules build from beginner (100-level) to advanced (300-level) — each ships with a Jupyter notebook for interactive learning and a presentation deck that works without an instructor.

The workshop lives in [`workshop/`](./workshop) — see [`workshop/README.md`](./workshop/README.md) for prerequisites and setup.

## Shared resources

The following sit at the repo root and are reused across the workshop modules. You don't need to clone or duplicate anything:

- **`dataset/`** — 11 CSVs covering home prices (Module 00) and credit risk (Modules 01–08). Pure customer data, API-agnostic.
- **`fundamental_assets/`** — deck CSS/JS, branding, and the `build_pdf.py` / `build_pptx.py` render scripts.

## Quick start

```bash
git clone https://github.com/Fundamental-Technologies/introduction-to-nexus.git
cd introduction-to-nexus/workshop
# Then follow the README in that folder.
```
