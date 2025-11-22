from sqlalchemy import Column, String, Integer, DateTime, Text, ARRAY
from app.core.postgres import Base
from datetime import datetime, timezone

class Event(Base):
    __tablename__ = "events"

    event_id = Column(String, primary_key=True, index=True)
    organizer_id = Column(String, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    event_type = Column(String)
    start_time = Column(DateTime(timezone=False))  # Explicitly timezone-naive
    end_time = Column(DateTime(timezone=False))  # Explicitly timezone-naive
    location = Column(String)
    max_participants = Column(Integer)
    privacy_level = Column(String, default="public")
    cover_image = Column(Text, nullable=True)
    cover_image_path = Column(String, nullable=True)  # For uploaded images
    tags = Column(ARRAY(String), nullable=True)  # Event tags
    created_at = Column(DateTime(timezone=False), default=lambda: datetime.now())
    updated_at = Column(DateTime(timezone=False), default=lambda: datetime.now(), onupdate=lambda: datetime.now())
