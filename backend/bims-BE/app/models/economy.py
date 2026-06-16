"""
Payout and leaderboard related models based on UML.
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.profile import Creator
from app.models.campaign import Campaign
import enum


def _uuid_str() -> str:
    return str(uuid4())


class PayoutStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(String, primary_key=True, default=_uuid_str)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)

    creator = relationship(Creator, backref="payouts")


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id = Column(String, primary_key=True, default=_uuid_str)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    total_submissions = Column(Integer, default=0, nullable=False)
    total_earned = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship(Campaign, backref="leaderboard_entries")
    creator = relationship(Creator, backref="leaderboard_entries")

