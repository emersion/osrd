import requests

from .infra import Infra
from .services import EDITOAST_URL
from .timetable_v2 import TimetableV2


def test_get_timetable_v2(
    timetable_v2: TimetableV2,
):
    timetable_id = timetable_v2.id

    response = requests.get(f"{EDITOAST_URL}/v2/timetable/{timetable_id}/")
    assert response.status_code == 200
    json = response.json()
    assert 'id' in json
    assert 'train_ids' in json


def test_conflicts(
    small_infra: Infra,
    timetable_v2: TimetableV2,
    fast_rolling_stock: int
):
    train_schedule_payload = [
        {
          "comfort": "STANDARD",
          "constraint_distribution": "STANDARD",
          "initial_speed": 0,
          "labels": [],
          "options": {
            "use_electrical_profiles": False
          },
          "path": [
            {"id": "start", "track": "TC0", "offset": 185},
            {"id": "stop", "track": "TC0", "offset": 685},
            {"id": "end", "track": "TD0", "offset": 24820},
          ],
          "power_restrictions": [],
          "rolling_stock_name": f"{fast_rolling_stock}",
          "schedule": [
            {
              "at": "start",
            },
            {
              "at": "stop",
              "on_stop_signal": True,
              "stop_for": "PT10M"
            },
            {
              "at": "end",
            },
          ],
          "speed_limit_tag": "MA100",
          "start_time": "2024-05-22T08:00:00.000Z",
          "train_name": "with_stop"
        }
    ]
    response = requests.post(f"{EDITOAST_URL}/v2/timetable/{timetable_v2.id}/train_schedule", json=train_schedule_payload)
    print(response.json())
    response = requests.get(f"{EDITOAST_URL}/v2/timetable/{timetable_v2.id}/conflicts/?infra_id={small_infra.id}")
    print(response)
    assert response.status_code == 200
