"""
Brand model aligned with UML.
"""
from uuid import uuid4

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid_str() -> str:
    return str(uuid4())


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String, primary_key=True, default=_uuid_str, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    website = Column(String, nullable=True)

    user = relationship("User", backref="brand")
    campaigns = relationship("Campaign", back_populates="brand", cascade="all, delete-orphan")

