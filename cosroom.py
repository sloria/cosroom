import datetime as dt
from collections import namedtuple

import pytz
from urllib.parse import urlencode, quote_plus
import maya

RoomStates = namedtuple('RoomStates', ['free', 'busy', 'next_event'])


def get_calendar_list(service):
    return service.calendarList().list().execute()['items']

def get_primary_calendar(calendar_list):
    return next(
        cal for cal in calendar_list if cal.get('primary', False)
    )

def get_room_calendars(calendar_list):
    return [
        calendar for calendar in calendar_list
        if calendar.get('accessRole') == 'freeBusyReader'
    ]

def get_free_and_busy_rooms(service):
    calendar_list = get_calendar_list(service)
    calendars = get_room_calendars(calendar_list)
    if not calendars:
        return RoomStates([], [], None)
    room_ids = {
        each['id']: each['summary']
        for each in calendars
    }
    timemin = dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    timemax = (dt.datetime.utcnow() + dt.timedelta(hours=24)).replace(tzinfo=pytz.utc)

    primary_calendar = get_primary_calendar(calendar_list)
    primary_events = service.events().list(
        calendarId=primary_calendar['id'],
        orderBy='startTime',
        singleEvents=True,
        timeMin=timemin.isoformat()
    ).execute()['items']
    if primary_events:
        next_event = primary_events[0]

    free = []
    busy = []
    freebusy = service.freebusy().query(body={
        'timeMin': timemin.isoformat(),
        'timeMax': timemax.isoformat(),
        'items': calendars,
    }).execute()
    now = dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    for calendar_id in freebusy['calendars']:
        room_name = room_ids[calendar_id]
        data = freebusy['calendars'][calendar_id]
        if data['busy']:
            next_busy = data['busy'][0]
            start_dt = maya.parse(next_busy['start']).datetime()
            end_dt = maya.parse(next_busy['end']).datetime()
            if (start_dt - now).total_seconds() < 5 * 60:
                busy.append({
                    'id': calendar_id,
                    'name': room_name,
                    'until': next_busy['end'],
                    'create_url': create_event_url(calendar_id,
                                                   start=end_dt,
                                                   end=end_dt + dt.timedelta(seconds=15 * 60)),
                })
            else:
                # If the room is free for over and hour, create URL will
                # default to a 15-min time slot
                if (start_dt - now).total_seconds() > 60 * 60:
                    create_url_end = now + dt.timedelta(seconds=15 * 60)
                else:  # Use the room until the next reservation
                    create_url_end = end_dt
                free.append({
                    'id': calendar_id,
                    'name': room_name,
                    'until': next_busy['start'],
                    'create_url': create_event_url(calendar_id, start=now, end=create_url_end),
                })
        else:
            # Create URL will default to a 15-min time slot
            create_url_end = now + dt.timedelta(seconds=15 * 60)
            free.append({
                'id': calendar_id,
                'name': room_name,
                'create_url': create_event_url(calendar_id, start=now, end=create_url_end),
            })
    free.sort(key=lambda each: each['name'])
    busy.sort(key=lambda each: each['name'])
    return RoomStates(free, busy, next_event)


def create_event_url(
    calendar_id,
    start=None,
    end=None,
    text='busy',
    description=None,
):
    """Build URL for creating a new event, reserving the room with the given calendar_id."""
    dt_format = '%Y%m%dT%H%M%SZ'
    base_url = 'https://calendar.google.com/calendar/render'
    start = start or dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    end = end or start + dt.timedelta(seconds=15 * 60)
    params = {
        'action': 'TEMPLATE',
        'text': text,
        'dates': '{}/{}'.format(start.strftime(dt_format), end.strftime(dt_format)),
        'output': 'xml',
        'add': calendar_id,
    }
    if description:
        params['details'] = quote_plus(description)
    return '?'.join([base_url, urlencode(params)])
