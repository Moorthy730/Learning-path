"""
schemas_reminders.py — Pydantic schemas for the reminder / notification feature.
"""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ── Reminder Preferences ──────────────────────────────────────────────────────

class ReminderPreferencesResponse(BaseModel):
    user_id: str
    enabled: bool
    reminder_time: str          # "HH:MM" 24-hour format
    timezone: str               # IANA timezone string
    email_enabled: bool
    push_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateReminderPreferencesRequest(BaseModel):
    enabled: Optional[bool] = None
    reminder_time: Optional[str] = Field(
        None,
        pattern=r"^\d{2}:\d{2}$",
        description="HH:MM format (24-hour)"
    )
    timezone: Optional[str] = Field(None, max_length=100)
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None

    @field_validator("reminder_time")
    @classmethod
    def validate_reminder_time(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        parts = v.split(":")
        hour, minute = int(parts[0]), int(parts[1])
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            raise ValueError("reminder_time must be a valid time (00:00–23:59)")
        return v


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    data: dict[str, Any]
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MarkNotificationsReadRequest(BaseModel):
    notification_ids: list[str] = Field(..., min_length=1, max_length=100)


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int


# ── Daily Tasks ───────────────────────────────────────────────────────────────

class DailyTaskResponse(BaseModel):
    id: str
    user_id: str
    path_id: str
    lesson_id: Optional[str] = None
    task_type: str
    title: str
    scheduled_date: date
    completed: bool
    completed_at: Optional[datetime] = None
    overdue: bool
    snoozed_until: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateDailyTaskRequest(BaseModel):
    path_id: str
    lesson_id: Optional[str] = None
    task_type: str = Field(..., pattern="^(lesson|project|assessment|review)$")
    title: str = Field(..., min_length=3, max_length=300)
    scheduled_date: date


class UpdateDailyTaskRequest(BaseModel):
    completed: Optional[bool] = None
    snoozed_until: Optional[date] = None


class DailyTaskListResponse(BaseModel):
    today: list[DailyTaskResponse]
    pending: list[DailyTaskResponse]
    overdue: list[DailyTaskResponse]
    completed_today: list[DailyTaskResponse]


# ── Push Subscriptions ────────────────────────────────────────────────────────

class PushSubscriptionRequest(BaseModel):
    endpoint: str = Field(..., max_length=2000)
    p256dh: str = Field(..., max_length=500)
    auth_key: str = Field(..., max_length=200)
    user_agent: Optional[str] = Field(None, max_length=300)


class PushSubscriptionResponse(BaseModel):
    id: str
    endpoint: str
    active: bool
    created_at: datetime
