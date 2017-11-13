#!/usr/bin/python2.7
import os
from collections import namedtuple

import environs
import httplib2
from flask import (Flask, abort, jsonify, redirect, render_template, request,
                   session, url_for)
from flask_webpack import Webpack
from flask_compress import Compress

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
DEBUG = env.bool('FLASK_DEBUG', default=False)

flow = OAuth2WebServerFlow(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    scope='https://www.googleapis.com/auth/calendar.readonly',
    redirect_uri=REDIRECT_URI,
)
RoomStates = namedtuple('RoomStates', ['free', 'busy'])

app = Flask(__name__)
app.debug = DEBUG
app.secret_key = SECRET_KEY
app.config.update(dict(
    WEBPACK_MANIFEST_PATH='webpack/manifest.json',
))
webpack = Webpack()
webpack.init_app(app)
compress = Compress()
compress.init_app(app)

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
        except Exception:
            app.logger.exception('Error occurred during OAuth flow')
            abort(400)
        session['credentials'] = credentials.to_json()

    return redirect(url_for('index'))

def get_service(error=False):
    if not session.get('credentials'):
        if error:
            abort(401)
        else:
            return False
    try:
        credentials = client.Credentials.new_from_json(session['credentials'])
        http = httplib2.Http()
        http = credentials.authorize(http)
        service = build('calendar', 'v3', http=http)
    except Exception:
        abort(401)
    return service

@app.route('/api/')
def api():
    service = get_service(error=True)
    try:
        free, busy, next_event, email = get_free_and_busy_rooms(service)
    except client.Error:
        abort(401)
    return jsonify({
        'free': free,
        'busy': busy,
        'next_event': next_event,
        'email': email,
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
    return render_template('index.html', DEBUG=DEBUG)

@app.route('/logout')
def logout():
    session['credentials'] = None
    return render_template('logout.html', DEBUG=DEBUG)

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'message': 'Authentication credentials invalid or not provided'
    }), 401

@app.errorhandler(500)
def internal_server_error(error):
    app.logger.error(error)
    return jsonify({
        'message': 'An unexpected error occurred'
    }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0')
