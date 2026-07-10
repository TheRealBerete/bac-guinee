#!/bin/bash
# Cron jobs run with a minimal environment by default, so DATABASE_PATH (set
# via ENV in the Dockerfile) wouldn't be visible to `python -m scraper.run`
# otherwise. Persisting the container's current env into /etc/environment is
# the standard fix — cron sources it for every job it runs.
printenv | grep -v "no_proxy" > /etc/environment

touch /var/log/scraper.log
cron
tail -f /var/log/scraper.log
