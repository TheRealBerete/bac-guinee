from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared Limiter instance: main.py registers it on app.state, routers import it
# to decorate individual endpoints. slowapi requires one instance reused across
# the app, not a new Limiter() per module.
limiter = Limiter(key_func=get_remote_address)
