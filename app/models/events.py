from sqlalchemy import Column, String, Integer, DateTime, Text, ARRAY, ForeignKey
from sqlalchemy.orm import relationship
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
    price = Column(Integer, default=0)  # Ticket price in MIST (0 for free)
    ticket_type = Column(String, default="free")  # "free" or "paid"
    created_at = Column(DateTime(timezone=False), default=lambda: datetime.now())
    updated_at = Column(DateTime(timezone=False), default=lambda: datetime.now(), onupdate=lambda: datetime.now())

    # Relationship
    participants = relationship("Participant", back_populates="event", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.event_id"))
    user_id = Column(String, index=True)
    joined_at = Column(DateTime(timezone=False), default=lambda: datetime.now())

    event = relationship("Event", back_populates="participants")
