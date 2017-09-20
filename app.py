#!/usr/bin/python2.7
import os
from collections import namedtuple
import datetime as dt

import pytz
from dateutil.parser import parse
import environs
import httplib2
from flask import (
    Flask, abort, jsonify, redirect, request,
    session, url_for, render_template,
)

from apiclient.discovery import build
from oauth2client import client
from oauth2client.client import OAuth2WebServerFlow

env = environs.Env()
# Read .env file
if os.path.isfile('.env'):
    env.read_env()
CLIENT_ID = env.str('CLIENT_ID', required=True)
CLIENT_SECRET = env.str('CLIENT_SECRET', required=True)
SECRET_KEY = env.str('SECRET_KEY', required=True)
REDIRECT_URI = env.str('REDIRECT_URI', required=True)
DEBUG = env.bool('DEBUG', default=False)

flow = OAuth2WebServerFlow(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    scope='https://www.googleapis.com/auth/calendar.readonly',
    redirect_uri=REDIRECT_URI,
)

RoomStates = namedtuple('RoomStates', ['free', 'busy'])

app = Flask(__name__)


def get_calendars(service):
    return [
        calendar for calendar in service.calendarList().list().execute()['items']
        if calendar['accessRole'] == 'freeBusyReader'
    ]

# TODO: Sort free and busy rooms by availability time
def get_free_and_busy_rooms(service):
    calendars = get_calendars(service)
    room_ids = {
        each['id']: each['summary']
        for each in calendars
    }
    timemin = dt.datetime.utcnow().replace(tzinfo=pytz.utc)
    timemax = (dt.datetime.utcnow() + dt.timedelta(hours=24)).replace(tzinfo=pytz.utc)

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
            start = parse(next_busy['start'])
            if (start - now).total_seconds() < 5 * 60:
                busy.append({
                    'id': calendar_id,
                    'name': room_name,
                    'until': next_busy['end']
                })
            else:
                free.append({
                    'id': calendar_id,
                    'name': room_name,
                    'until': next_busy['start']
                })
        else:
            free.append({
                'id': calendar_id,
                'name': room_name,
            })
    return RoomStates(free, busy)


@app.route('/login')
def login():
    auth_uri = flow.step1_get_authorize_url()
    return redirect(auth_uri)

@app.route('/signout')
def signout():
    del session['credentials']
    session['message'] = "You have logged out"

    return redirect(url_for('index'))

@app.route('/callback')
def oauth2callback():
    code = request.args.get('code')
    if code:
        flow.redirect_uri = request.base_url
        try:
            credentials = flow.step2_exchange(code)
        except Exception as e:
            abort(400)
        # TODO: Store in a db or something
        session['credentials'] = credentials.to_json()

    return redirect(url_for('index'))

@app.route('/api/')
def api():
    try:
        credentials = client.Credentials.new_from_json(session['credentials'])
    except KeyError:
        abort(401)

    http = httplib2.Http()
    http = credentials.authorize(http)
    service = build('calendar', 'v3', http=http)
    free, busy = get_free_and_busy_rooms(service)
    return jsonify({
        'free': free,
        'busy': busy,
    })

@app.route('/')
def index():
    if not session.get('credentials'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/logout')
def logout():
    session['credentials'] = None
    return render_template('logout.html')


if __name__ == '__main__':
    app.secret_key = SECRET_KEY
    app.debug = DEBUG
    app.run(host='0.0.0.0')
