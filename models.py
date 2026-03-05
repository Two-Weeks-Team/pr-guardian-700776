from typing import Literal, Optional, List
from pydantic import BaseModel, Field
from sqlalchemy import (
    String,
    Integer,
    Float,
    Text,
    JSON,
    DateTime,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AnalysisRunORM(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner: Mapped[str] = mapped_column(String(255), index=True)
    repo: Mapped[str] = mapped_column(String(255), index=True)
    pr_number: Mapped[int] = mapped_column(Integer, index=True)
    status: Mapped[str] = mapped_column(String(32), default="queued", index=True)
    summary: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RepoConfigORM(Base):
    __tablename__ = "repo_configs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner: Mapped[str] = mapped_column(String(255), index=True)
    repo: Mapped[str] = mapped_column(String(255), index=True)
    severity_threshold: Mapped[str] = mapped_column(String(16), default="medium")
    max_comments_per_pr: Mapped[int] = mapped_column(Integer, default=3)
    posting_mode: Mapped[str] = mapped_column(String(24), default="preview")
    enabled_categories: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PRFileHunk(BaseModel):
    start_line: int = Field(..., ge=1)
    patch: str = Field(..., min_length=1)


class PRFile(BaseModel):
    path: str
    language: Optional[str] = None
    hunks: List[PRFileHunk]


class StaticSignal(BaseModel):
    tool: Literal["semgrep", "eslint", "bandit", "secret_scan", "heuristic"]
    rule_id: str
    path: str
    line: int = Field(..., ge=1)
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    message: Optional[str] = None


class AnalyzePRRequest(BaseModel):
    owner: str
    repo: str
    pr_number: int = Field(..., ge=1)
    head_sha: Optional[str] = None
    files: List[PRFile]
    static_signals: List[StaticSignal] = Field(default_factory=list)
    max_suggestions: int = Field(default=3, ge=1, le=10)


class Suggestion(BaseModel):
    severity: str
    category: str
    title: str
    path: str
    start_line: int
    end_line: int
    explanation: str
    patch: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)
    evidence: List[dict]


class AnalyzePRResponse(BaseModel):
    review_id: str
    owner: str
    repo: str
    pr_number: int
    suggestions: List[Suggestion]
    model_usage: dict


class RankCandidate(BaseModel):
    suggestion_id: str
    category: str
    severity: Literal["low", "medium", "high", "critical"]
    title: str


class RankSuggestionsRequest(BaseModel):
    owner: str
    repo: str
    pr_number: int = Field(..., ge=1)
    candidates: List[RankCandidate] = Field(..., min_length=1, max_length=200)


class RankSuggestionsResponse(BaseModel):
    ranked: List[dict]
    policy: dict
