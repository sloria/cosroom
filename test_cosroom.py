import datetime as dt
from pytz import utc
from freezegun import freeze_time

import cosroom as c


def test_get_next_weekday_returns_next_weekday_when_its_the_weekend():
    with freeze_time("2018-07-07T13:34:21.674016"):
        res = c.get_next_weekday()
        assert res.year == 2018
        assert res.month == 7
        assert res.day == 9
        assert res.hour == 0
        assert res.minute == 0


def test_get_next_weekday_returns_current_datetime_when_its_a_weekday():
    with freeze_time("2018-07-09T13:34:21.674016"):
        res = c.get_next_weekday()
        assert res.year == 2018
        assert res.month == 7
        assert res.day == 9
        assert res.hour == 13
        assert res.minute == 34


class TestFindNext:
    def test_find_next_pairing_period(self):
        events = [
            # Scrum from 8-9
            {
                "start": {
                    "dateTime": dt.datetime(2018, 7, 9, 8, 0, tzinfo=utc).isoformat()
                },
                "end": {
                    "dateTime": dt.datetime(2018, 7, 9, 9, 0, tzinfo=utc).isoformat()
                },
                "summary": "Scrum",
            },
            # Available to pair from 8-12
            {
                "start": {
                    "dateTime": dt.datetime(2018, 7, 9, 8, 0, tzinfo=utc).isoformat()
                },
                "end": {
                    "dateTime": dt.datetime(2018, 7, 9, 12, 0, tzinfo=utc).isoformat()
                },
                "summary": "Available to pair",
            },
            # Meeting from 11-12
            {
                "start": {
                    "dateTime": dt.datetime(2018, 7, 9, 11, 0, tzinfo=utc).isoformat()
                },
                "end": {
                    "dateTime": dt.datetime(2018, 7, 9, 12, 0, tzinfo=utc).isoformat()
                },
                "summary": "Meeting",
            },
        ]

        # next pairing period is from 9-11
        start, end = c.find_next_pairing_period(events)
        assert start.hour == 9
        assert end.hour == 11

    def test_find_next_pairing_period2(self):
        events = [
            # Scrum from 8-9
            {
                "start": {
                    "dateTime": dt.datetime(2018, 7, 9, 8, 0, tzinfo=utc).isoformat()
                },
                "end": {
                    "dateTime": dt.datetime(2018, 7, 9, 9, 0, tzinfo=utc).isoformat()
                },
                "summary": "Scrum",
            },
            # Available to pair from 8-12
            {
                "start": {
                    "dateTime": dt.datetime(2018, 7, 9, 8, 0, tzinfo=utc).isoformat()
                },
                "end": {
                    "dateTime": dt.datetime(2018, 7, 9, 12, 0, tzinfo=utc).isoformat()
                },
                "summary": "Available to pair",
            },
            # Meeting from 9-10
            {
                "start": {
                    "dateTime": dt.datetime(2018, 7, 9, 9, 0, tzinfo=utc).isoformat()
                },
                "end": {
                    "dateTime": dt.datetime(2018, 7, 9, 10, 0, tzinfo=utc).isoformat()
                },
                "summary": "Meeting",
            },
        ]

        # next pairing period is from 10-12
        start, end = c.find_next_pairing_period(events)
        assert start.hour == 10
        assert end.hour == 12
