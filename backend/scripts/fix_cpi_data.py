"""Script to fix CPI values and RBI MPC date in macro_analytics_suite.py"""
import sys, os
target = r"backend\app\services\macro_analytics_suite.py"

with open(target, 'r', encoding='utf-8') as f:
    content = f.read()

before = len(content)

# Fix CPI historical trend
content = content.replace(
    '"FY 2025-26 (Latest)", "headline_cpi": 6.21',
    '"FY 2025-26 (Latest)", "headline_cpi": 6.09'
)

# Fix MPC scheduled_date in economic calendar event
content = content.replace(
    '"scheduled_date": "06 Dec 2026"',
    '"scheduled_date": "04 Dec 2026"'
)

# Fix next_mpc_meeting in RBI policy section
content = content.replace(
    '"next_mpc_meeting": "04 - 06 December 2026"',
    '"next_mpc_meeting": "04 December 2026 (Decision at 10:00 AM IST)"'
)

# Fix actual_result in macro calendar CPI event
content = content.replace(
    '"previous_value": "5.49%",\n                "consensus_forecast": "5.80%",\n                "actual_result": "6.21%",\n                "surprise": "+0.41% (Hawkish Surprise',
    '"previous_value": "5.54%",\n                "consensus_forecast": "5.80%",\n                "actual_result": "6.09%",\n                "surprise": "+0.29% (Hawkish Surprise'
)

# Fix sub_metric headline CPI value
content = content.replace(
    '{"label": "Headline CPI", "value": "6.21%", "status": "Breaches 6% Ceiling"}',
    '{"label": "Headline CPI", "value": "6.09%", "status": "Breaches 6% Ceiling"}'
)

# Fix comparison flow
content = content.replace(
    '"comparison_flow": "Expected (5.80%) \u2192 Previous (5.49%) \u2192 Actual (6.21%) \u2192 Surprise (+0.41%) \u2192 Market Impact: RBI Rate Cut Postponed"',
    '"comparison_flow": "Expected (5.80%) \u2192 Previous (5.54%) \u2192 Actual (6.09%) \u2192 Surprise (+0.29%) \u2192 Market Impact: RBI Rate Cut Delayed"'
)

# Fix headline CPI in surprise analytics actual
content = content.replace(
    '                    "actual": 6.21,\n                    "expected": 5.80,\n                    "previous": 5.49,\n                    "surprise": 0.41,',
    '                    "actual": 6.09,\n                    "expected": 5.80,\n                    "previous": 5.54,\n                    "surprise": 0.29,'
)

# Fix market impact note
content = content.replace(
    'Headline CPI inflation spike to 6.21% YoY breaching RBI 6% tolerance band, pushing rate cuts to mid-2027.',
    'Headline CPI inflation at 6.09% YoY breaching RBI 6% tolerance band; market expects rate cuts from mid-2027.'
)

# Fix CPI headline values in cpi_suite (already fixed by earlier edit, but check bulk ref)
content = content.replace(
    '"headline_cpi\": 6.21,\n', '"headline_cpi": 6.09,\n'
)
content = content.replace(
    '"previous_reading": 5.49,\n', '"previous_reading": 5.54,\n'
)
content = content.replace(
    '"actual_result": 6.21,\n', '"actual_result": 6.09,\n'
)
content = content.replace(
    '"surprise_pct": 0.41,\n', '"surprise_pct": 0.29,\n'
)
content = content.replace(
    '"mom_change_pct": 1.34,\n', '"mom_change_pct": 1.00,\n'
)
content = content.replace(
    '"previous_period_change": 0.72,\n', '"previous_period_change": 0.55,\n'
)
# CPI target breach
content = content.replace(
    '"current_cpi_headline_pct": 6.21,', '"current_cpi_headline_pct": 6.09,'
)

after = len(content)
print(f"File size change: {before} -> {after} bytes (diff: {after-before})")

with open(target, 'w', encoding='utf-8') as f:
    f.write(content)

print("All fixes applied successfully.")
