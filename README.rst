*******
cosroom
*******

Find an open room at COS using the Google Calendar API.


.. image:: https://user-images.githubusercontent.com/2379650/32475872-0dc06754-c342-11e7-8b2a-ca02aed5db95.png
    :alt: Screenshot
    :target: http://rooms.sloria.com


Development
===========

1. Clone this repo.

::

  git clone https://github.com/sloria/cosroom.git
  cd cosroom

2. Create and activate a Python 3 virtualenv.
3. Install requirements.

::

  pip install -e .
  npm install npm@5
  npm install

4. Create a ``.env`` file in this repo's directory and define the following
environment variables:

::

  CLIENT_ID=<Google API Client ID>
  CLIENT_SECRET=<Google API Client Secret>
  SECRET_KEY=<Random secret key>
  REDIRECT_URI=http://localhost:5000/callback


Run the app
-----------

Then run the following command:

::

  npm start


Browse to http://localhost:5000 to view the app.
