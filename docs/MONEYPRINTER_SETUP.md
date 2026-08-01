# MoneyPrinterV2 setup

[MoneyPrinterV2](https://github.com/FujiwaraChoki/MoneyPrinterV2) is a
third-party Python project for automated short-form video generation. It is
not part of the tmac codebase and its source is not vendored here — this repo
only provides a helper script that automates the upstream setup instructions.

## Quick start

```bash
./scripts/setup-moneyprinter.sh [target-dir]
```

`target-dir` defaults to `../MoneyPrinterV2` (a sibling directory, outside
this repo). The script:

1. Clones `FujiwaraChoki/MoneyPrinterV2` if `target-dir` doesn't already exist.
2. Copies `config.example.json` to `config.json` (if not already present).
3. Creates a `venv` virtual environment.
4. Installs `requirements.txt` into it.

## Manual steps

After the script finishes:

1. Fill in the values in `target-dir/config.json`.
2. Activate the environment: `source target-dir/venv/bin/activate`
   (Windows: `target-dir\venv\Scripts\activate`).

## Equivalent commands

For reference, the script automates the following:

```bash
git clone https://github.com/FujiwaraChoki/MoneyPrinterV2.git
cd MoneyPrinterV2
cp config.example.json config.json

python -m venv venv
source venv/bin/activate   # Windows: .\venv\Scripts\activate

pip install -r requirements.txt
```
