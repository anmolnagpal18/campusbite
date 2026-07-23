#!/bin/bash
set -e

echo "Starting deployment build..."

# Update pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Run Database Migrations securely
python manage.py migrate --settings=config.settings.production --noinput

# Collect Static files
python manage.py collectstatic --settings=config.settings.production --noinput

echo "Build complete."
