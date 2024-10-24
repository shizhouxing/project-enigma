#!/usr/bin/env bash

set -e
set -x

.venv/bin/mypy api
.venv/bin/ruff check api
.venv/bin/ruff format api --check