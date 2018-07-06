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
