#!/usr/bin/python2.7
import os
from collections import namedtuple

import environs
import httplib2
from flask import (Flask, abort, jsonify, redirect, render_template, request,
                   session, url_for)

from apiclient.discovery import build
from cosroom import get_free_and_busy_rooms
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

flow = OAuth2WebServerFlow(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    scope='https://www.googleapis.com/auth/calendar.readonly',
    redirect_uri=REDIRECT_URI,
)

RoomStates = namedtuple('RoomStates', ['free', 'busy'])

app = Flask(__name__)
app.secret_key = SECRET_KEY

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
        session['credentials'] = credentials.to_json()

    return redirect(url_for('index'))

def get_service(error=False):
    if not session.get('credentials'):
        if error:
            abort(401)
        else:
            return False
    credentials = client.Credentials.new_from_json(session['credentials'])
    http = httplib2.Http()
    http = credentials.authorize(http)
    service = build('calendar', 'v3', http=http)
    return service

@app.route('/api/')
def api():
    service = get_service(error=True)
    free, busy = get_free_and_busy_rooms(service)
    return jsonify({
        'free': free,
        'busy': busy,
    })

def check_service(service):
    if not service:
        return False
    try:
        service.calendarList().list().execute()
    except Exception:
        return False
    return True

@app.route('/')
def index():
    service = get_service(error=False)
    if not service or not check_service(service):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/logout')
def logout():
    session['credentials'] = None
    return render_template('logout.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0')
