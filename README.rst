*******
cosroom
*******

Find an open room at COS using the Google Calendar API. This project
includes both a **web app** and a **macOS menu bar app**.

.. image:: https://user-images.githubusercontent.com/2379650/30677774-c4fa6502-9e5b-11e7-8300-ae7a708ce36f.png
    :alt: Menu bar app

Running the macOS app
=====================

Install requirements
--------------------
::

  pip install git+https://github.com/sloria/cosroom.git#egg=cosroom[app]

Obtaining a client_secret.json file
-----------------------------------

Before proceeding, you must obtain a client_secret.json to use for the
native app.

1. Go to the `this wizard <https://console.developers.google.com/start/api?id=calendar>`_ to
   create or select a project and enable the Calendar API. Click
   **Continue** then **Go to credentials.**
2. Create **Credentials** and select **OAuth client ID**.
3. Select app type **Other**, enter the name "Find Room" and click
   **Create**.
4. Click **OK** to dismiss the dialog
5. Click the **Download JSON** button and save the file as
   **client_secret.json** in your current directory.


Run the app
-----------

To run the native menu bar app:

::

  CLIENT_SECRET_FILE=client_secret.json cosroom


Running the web app
===================

Install requirements
--------------------
::

  pip install git+https://github.com/sloria/cosroom.git#egg=cosroom[web]
  npm install


Define configuration
--------------------

Create a `.env` file in this repo's directory and define the following
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

Development
===========

1. Clone this repo
2. Create and activate a Python 3 virtualenv.
3. Install requirements

::

  pip install -e .\[web\] .\[app\]
  npm install

4. Follow the instructions above to run either the macOS app or the web
   app.
