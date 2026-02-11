from datetime import datetime, timedelta
import dateparser
import re

def __clean_time_str(s: str) -> str:
    """Strip out relative day/week/month words from individual time fragment"""
    relatives = [
        r'\bday before yesterday\b', r'\bday after tomorrow\b',
        r'\byesterday\b', r'\btoday\b', r'\btomorrow\b',
        r'\bthis week\b', r'\blast week\b', r'\bnext week\b',
        r'\bthis month\b', r'\blast month\b', r'\bnext month\b',
        r'\bthis year\b', r'\blast year\b', r'\bnext year\b',
    ]
    pattern = '|'.join(relatives)
    s = re.sub(pattern, '', s, flags=re.IGNORECASE).strip()
    return re.sub(r'\s+', ' ', s).strip()


def __get_context(text: str) -> str | None:
    """
    Find the rightmost (latest in sentence) relative day/week/month phrase.
    People usually put the most important context at the end.
    """
    candidates = [
        "day before yesterday", "yesterday", "today", "tomorrow", "day after tomorrow",
        "this week", "last week", "next week",
        "this month", "last month", "next month",
        "this year", "last year", "next year",
    ]

    best = None
    best_pos = -1
    text_lower = text.lower()

    for cand in candidates:
        pos = text_lower.rfind(cand)
        if pos > best_pos:
            best_pos = pos
            best = cand

    return best


def __parse_single_time(time_part: str, context: str | None) -> datetime | None:
    cleaned = __clean_time_str(time_part)
    if context:
        parse_str = f"{cleaned} {context}".strip() if cleaned else context
    else:
        parse_str = cleaned or context

    if not parse_str:
        return None

    dt = dateparser.parse(parse_str, settings={'PREFER_LOCALE_DATE_ORDER': True})
    return dt


def __parse_two_times(t1_str: str, t2_str: str, context: str | None):
    t1 = __parse_single_time(t1_str, context)
    t2 = __parse_single_time(t2_str, context)

    if t1 is None or t2 is None:
        return None, None

    # Swap if user reversed start/end
    if t1 > t2:
        t1, t2 = t2, t1

    return t1, t2


def extract_time_range(text: str) -> tuple[datetime | None, datetime | None]:
    text = text.lower().strip()
    now = datetime.utcnow()

    # ── Quick patterns ───────────────────────────────────────

    # "last / past / previous 3 days / 2 weeks / an hour ..."
    if m := re.search(r'\b(last|past|previous)\s*(?:an?\s+)?(\d+)?\s*(minute|hour|day|week|month|year)s?\b', text):
        qty = 1 if m.group(2) is None else int(m.group(2))
        unit = m.group(3) + 's'
        if unit in ('minutes', 'hours', 'days', 'weeks'):
            delta = timedelta(**{unit: qty})
            return now - delta, now

    # "... ago"
    if m := re.search(r'(\d+)\s*(minute|hour|day|week)s?\s*ago', text):
        qty = int(m.group(1))
        unit = m.group(2) + 's'
        delta = timedelta(**{unit: qty})
        return now - delta, now

    # ── Range patterns ───────────────────────────────────────

    context = __get_context(text)

    # between A and B
    if m := re.search(r'between\s+(.+?)\s+and\s+(.+?)(?:\?|$)', text):
        return __parse_two_times(m.group(1), m.group(2), context)

    # from A to B
    if m := re.search(r'from\s+(.+?)\s+to\s+(.+?)(?:\?|$)', text):
        return __parse_two_times(m.group(1), m.group(2), context)

    # after ...
    if m := re.search(r'after\s+(.+?)(?:\?|$)', text):
        start = __parse_single_time(m.group(1), context)
        if start:
            return start, now

    # before ...
    if m := re.search(r'before\s+(.+?)(?:\?|$)', text):
        end = __parse_single_time(m.group(1), context)
        if end:
            return now - timedelta(days=14), end   # wider fallback window

    # ── Whole-sentence relative day/week fallback ────────────
    if context:
        if context in ("today", "this week", "this month", "this year"):
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            return start, now

        elif context == "yesterday":
            start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            return start, start + timedelta(days=1)

        elif context == "day before yesterday":
            start = (now - timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
            return start, start + timedelta(days=1)

        elif context == "tomorrow":
            start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            return start, start + timedelta(days=1)

        elif context == "day after tomorrow":
            start = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
            return start, start + timedelta(days=1)
    return None, None

if __name__ == "__main__":
    tests = [
        "What happened between 3 pm day before yesterday to 5 pm today?",
        "events from 9am last week monday to 6pm this week friday",
        "show activity after 11 am day after tomorrow",
        "before 4 pm yesterday",
        "what occurred last 48 hours",
        "between 2pm and 7pm tomorrow",
    ]

    for q in tests:
        s, e = extract_time_range(q)
        print(f"Q: {q}")
        print(f"  → {s.isoformat() if s else None}  to  {e.isoformat() if e else None}\n")
        