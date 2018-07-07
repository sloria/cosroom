# cosroom

[![Build Status](https://travis-ci.org/sloria/cosroom.svg?branch=master)](https://travis-ci.org/sloria/cosroom)
[![Greenkeeper badge](https://badges.greenkeeper.io/sloria/cosroom.svg)](https://greenkeeper.io/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black)
[![Code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Find an open room at COS using the Google Calendar API.

<img src="https://user-images.githubusercontent.com/2379650/32475872-0dc06754-c342-11e7-8b2a-ca02aed5db95.png" alt="Screenshot" />

# Development

1.  Clone this repo.

```
git clone https://github.com/sloria/cosroom.git
cd cosroom
```

2.  Create and activate a Python 3 virtualenv.
3.  Install requirements.

```
npm install npm@5
# NOTE: the following will install both node and python dependencies
npm install
```

4.  Create a `.env` file in this repo's directory and define the following environment variables:

```
CLIENT_ID=<Google API Client ID>
CLIENT_SECRET=<Google API Client Secret>
SECRET_KEY=<Random secret key>
REDIRECT_URI=http://localhost:5000/callback
```

## Run the app

Then run the following command:

```
npm run dev
```

Browse to http://localhost:5000 to view the app.

If you need to use a Python debugger (e.g. ipdb), then run the web
server and the webpack server separately

```
FLASK_APP=web/app.py FLASK_DEBUG=1 flask run
```

```
npm run webpack-dev-server
```
