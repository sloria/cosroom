from email.utils import parseaddr
import datetime as dt
from collections import namedtuple

import pytz
from urllib.parse import urlencode, quote_plus
import maya

RoomStates = namedtuple("RoomStates", ["free", "busy", "pairs", "next_event", "email"])

KNOWN_ROOMS = {
    "aberto",
    "aperi",
    "bukas",
    "furan",
    "offnen",
    "opfice",
    "Phone Booth 1",
    "Phone Booth 2",
    "Phone Booth 3",
    "Phone Booth 4",
    "Phone Booth 5",
    "Phone Booth 6",
}
# Many people have both their COS account as their secondary
# account. Therefore, "reserve" links will go to the second (index 1)
# account by default. If there is no secondary account, Google will redirect
# to the primary account
DEFAULT_ACCOUNT_INDEX = 1


def get_calendar_list(service):
    request = service.calendarList().list(showHidden=True)
    response = request.execute()
    calendars = response["items"]
    has_more = bool(response.get("nextPageToken"))
    while has_more:
        request = service.calendarList().list_next(
            previous_request=request, previous_response=response
        )
        response = request.execute()
        calendars.extend(response["items"])
        if not response.get("nextPageToken"):
            has_more = False
    return calendars


def get_primary_calendar(calendar_list):
    return next(cal for cal in calendar_list if cal.get("primary", False))


def get_room_calendars(calendar_list):
    return [
        calendar
        for calendar in calendar_list
        if calendar.get("accessRole") == "freeBusyReader" or
        # Not all room calendars have the freeBusyReader access role,
        # so we need this additional check
        calendar.get("summary").lower() in KNOWN_ROOMS
    ]


# naive implementation, but fine for our purposes
def is_email(s):
    return s and bool(parseaddr(s)[1])


def is_person_calendar(calendar):
    return (
        # it's not a room
        calendar.get("accessRole") == "reader"
        and
        # its id is an email address
        is_email(calendar.get("id"))
        and
        # its not the COS calendar
        calendar.get("id") != "calendar@cos.io"
        and
        # not a shared event calendar
        "group.calendar.google.com" not in calendar.get("id")
        and
        # its actively selected
        calendar.get("selected", False)
    )


def get_people_calendars(calendar_list):
    return [calendar for calendar in calendar_list if is_person_calendar(calendar)]


def get_next_weekday():
    """Return the next weekday as a datetime. If it's already a weekday right now,
    return the current datetime.
    """
    ret = now = dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    if now.weekday() >= 5:  # It's the weekend
        ret = ret.replace(hour=0, minute=0, second=0)
        while ret.weekday() >= 5:
            ret += dt.timedelta(days=1)
    return ret


def get_pairing_events(service, calendar):
    # Optimization: Only search for events during weekdays
    timemin = get_next_weekday()
    events = (
        service.events()
        .list(
            calendarId=calendar["id"],
            orderBy="startTime",
            singleEvents=True,
            timeMin=timemin.isoformat(),
            maxResults=20,
            # TODO: Add timeMax
            # TODO: refine search?
            # 'available pair' does not match "available for pairing"
            q="available",
        )
        .execute()["items"]
    )
    return events


def get_available_pairs(service, calendar_list=None):
    ret = {}
    calendar_list = (
        get_calendar_list(service) if calendar_list is None else calendar_list
    )
    calendars = get_people_calendars(calendar_list)
    for calendar in calendars:
        pairing_events = get_pairing_events(service, calendar)
        if pairing_events:
            ret[calendar["id"]] = pairing_events
    return ret


def get_free_and_busy_rooms(service):
    calendar_list = get_calendar_list(service)
    calendars = get_room_calendars(calendar_list)
    if not calendars:
        return RoomStates([], [], None, None)
    room_ids = {each["id"]: each["summary"] for each in calendars}
    now = dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    timemax = (dt.datetime.utcnow() + dt.timedelta(hours=24)).replace(tzinfo=pytz.utc)

    primary_calendar = get_primary_calendar(calendar_list)
    email = primary_calendar["id"]
    primary_events = (
        service.events()
        .list(
            calendarId=primary_calendar["id"],
            orderBy="startTime",
            singleEvents=True,
            timeMin=now.isoformat(),
        )
        .execute()["items"]
    )

    if primary_events:
        next_event = None
        # Find the next event
        for event in primary_events:
            # Skip all day events
            if "dateTime" not in event["start"]:  # all day event
                continue
            # Skip events where you've marked yourself Available
            if event.get("transparency") == "transparent":
                continue
            next_event = event
            next_event_start = maya.parse(next_event["start"]["dateTime"]).datetime()
            # In a meeting now. Go to next event
            if next_event_start < now:
                continue
            # Declined event
            elif next_event.get("attendees") and any(
                [
                    each.get("responseStatus") == "declined"
                    for each in next_event["attendees"]
                    if each["email"] == email
                ]
            ):
                continue
            # Found next event
            else:
                break
    free = []
    busy = []
    freebusy = (
        service.freebusy()
        .query(
            body={
                "timeMin": now.isoformat(),
                "timeMax": timemax.isoformat(),
                "items": calendars,
            }
        )
        .execute()
    )
    now = dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    for calendar_id in freebusy["calendars"]:
        room_name = room_ids[calendar_id]
        data = freebusy["calendars"][calendar_id]
        if data["busy"]:
            next_busy = data["busy"][0]
            start_dt = maya.parse(next_busy["start"]).datetime()
            end_dt = maya.parse(next_busy["end"]).datetime()
            if (start_dt - now).total_seconds() < 5 * 60:
                busy.append(
                    {
                        "id": calendar_id,
                        "name": room_name,
                        "until": next_busy["end"],
                        "create_url": create_event_url(
                            calendar_id,
                            start=end_dt,
                            end=end_dt + dt.timedelta(seconds=15 * 60),
                            account_index=DEFAULT_ACCOUNT_INDEX,
                        ),
                    }
                )
            else:
                # If the room is free for over an hour, create URL will
                # default to a 15-min time slot
                if (start_dt - now).total_seconds() > 60 * 60:
                    create_url_end = now + dt.timedelta(seconds=15 * 60)
                else:  # Use the room until the next reservation
                    create_url_end = end_dt
                free.append(
                    {
                        "id": calendar_id,
                        "name": room_name,
                        "until": next_busy["start"],
                        "create_url": create_event_url(
                            calendar_id,
                            start=now,
                            end=create_url_end,
                            account_index=DEFAULT_ACCOUNT_INDEX,
                        ),
                    }
                )
        else:
            # Create URL will default to a 15-min time slot
            create_url_end = now + dt.timedelta(seconds=15 * 60)
            free.append(
                {
                    "id": calendar_id,
                    "name": room_name,
                    "create_url": create_event_url(
                        calendar_id,
                        start=now,
                        end=create_url_end,
                        account_index=DEFAULT_ACCOUNT_INDEX,
                    ),
                }
            )
    free.sort(key=lambda each: each["name"])
    busy.sort(key=lambda each: each["name"])
    pairs = get_available_pairs(service, calendar_list=calendar_list)
    return RoomStates(free, busy, pairs, next_event, email)


def create_event_url(
    calendar_id, start=None, end=None, text="busy", description=None, account_index=0
):
    """Build URL for creating a new event, reserving the room with the given calendar_id."""
    dt_format = "%Y%m%dT%H%M%SZ"
    base_url = "https://calendar.google.com/calendar/b/{}/render".format(account_index)
    start = start or dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    end = end or start + dt.timedelta(seconds=15 * 60)
    params = {
        "action": "TEMPLATE",
        "text": text,
        "dates": "{}/{}".format(start.strftime(dt_format), end.strftime(dt_format)),
        "output": "xml",
        "add": calendar_id,
    }
    if description:
        params["details"] = quote_plus(description)
    return "?".join([base_url, urlencode(params)])
