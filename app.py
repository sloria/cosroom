"""Menu bar app to find an open room at COS."""
import os
import webbrowser

import environs
import httplib2
import maya

import rumps
from apiclient import discovery
from oauth2client import client, tools
from oauth2client.file import Storage

from findroom import get_free_and_busy_rooms

try:
    import argparse
    flags = argparse.ArgumentParser(parents=[tools.argparser]).parse_args()
except ImportError:
    flags = None

env = environs.Env()
if os.path.exists('.env'):
    env.read_env()

DEBUG = env.bool('RUMPS_DEBUG', default=False)
CLIENT_SECRET_FILE = env.str('CLIENT_SECRET_FILE', required=True)

SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
UPDATE_INTERVAL = env.int('FINDROOM_INTERVAL', default=20)

home_dir = os.path.expanduser('~')
credential_dir = os.path.join(home_dir, '.credentials')
credential_path = os.path.join(credential_dir, 'findroom.json')


def get_credentials():
    """Gets valid user credentials from storage.

    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth2 flow is completed to obtain the new credentials.

    Returns:
        Credentials, the obtained credential.
    """
    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    store = Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = 'Find Room'
        if flags:
            credentials = tools.run_flow(flow, store, flags)
        else:  # Needed only for compatibility with Python 2.6
            credentials = tools.run(flow, store)
        print('Storing credentials to ' + credential_path)
    return credentials

def has_credentials():
    if not os.path.exists(credential_dir):
        return False
    store = Storage(credential_path)
    credentials = store.get()
    return credentials and not credentials.invalid

def get_service():
    credentials = get_credentials()
    http = credentials.authorize(httplib2.Http())
    service = discovery.build('calendar', 'v3', http=http)
    return service

def to_menu_item(data, free=False):
    name = data['name']
    if data.get('until'):
        until_slang = maya.parse(data['until']).slang_time()
        if until_slang.endswith(' from now'):
            until_slang = until_slang[:-len(' from now')]
        pre = 'free in ' if not free else ''
        suffix = ' ({pre}{until})'.format(pre=pre, until=until_slang)
    else:
        suffix = ''
    title = '{}{}'.format(name, suffix)

    if 'create_url' in data:
        def callback(_):
            webbrowser.open_new_tab(data['create_url'])
    else:
        callback = None
    return rumps.MenuItem(title, callback=callback)


class App(rumps.App):

    def __init__(self):
        self.service = None
        self.has_creds = has_credentials()
        if self.has_creds:
            self.service = get_service()
        super(App, self).__init__('R', menu=self.get_menu(), quit_button=None)

    def login(self, sender):
        self.service = get_service()
        self.has_creds = has_credentials()

    def logout(self, sender):
        try:
            os.remove(credential_path)
        except (OSError, IOError):
            pass
        self.has_creds = False
        self.menu.clear()
        self.menu = self.get_menu()

    def get_menu(self):
        quit = rumps.MenuItem('Quit', callback=rumps.quit_application)
        if self.has_creds:
            free, busy = get_free_and_busy_rooms(self.service)
            phone_booths = []
            for each in list(free):
                if each['name'].startswith('Phone Booth'):
                    phone_booths.append(each)
                    free.remove(each)
            menu = [to_menu_item(each, free=True) for each in free]
            if phone_booths:
                menu.append({'Phone Booths': [to_menu_item(each, free=True)
                                              for each in phone_booths]})
            if busy:
                menu.append({'Busy': [to_menu_item(each, free=False) for each in busy]})
            logout = rumps.MenuItem('Log out', callback=self.logout)
            menu.extend([
                None,
                logout,
                None,
                quit,
            ])
        else:
            login = rumps.MenuItem('Log in', callback=self.login)
            menu = [login, quit]
        return menu

    @rumps.timer(UPDATE_INTERVAL)
    def update_menu(self, sender):
        self.menu.clear()
        self.menu = self.get_menu()

def main():
    rumps.debug_mode(DEBUG)
    app = App()
    app.icon = 'icon.png'
    app.run()
