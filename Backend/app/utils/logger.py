import json
from app.models import db, EventLog

def log_event(event_type, details):
    log = EventLog(event_type=event_type, payload=json.dumps(details))
    db.session.add(log)
    db.session.commit()