#!/usr/bin/env python
# -*- coding: utf-8 -*-
from setuptools import setup

REQUIREMENTS = [
    'environs>=1.2.0',
    'google-api-python-client>=1.6.3',
    'maya==0.3.2',
]
WEB_REQUIREMENTS = [
    'flask==0.12.2',
]
APP_REQUIREMENTS = [
    'rumps==0.2.2',
]

def read(fname):
    with open(fname) as fp:
        content = fp.read()
    return content


setup(
    name='findroom',
    install_requires=REQUIREMENTS,
    version='0.1.0',
    description='Find an open room at COS using the Google Calendar API',
    long_description=read('README.rst'),
    author='Steven Loria',
    author_email='sloria1@gmail.com',
    url='https://github.com/sloria/findroom',
    py_modules=['findroom'],
    extras_require={
        'web': WEB_REQUIREMENTS,
        'app': APP_REQUIREMENTS,
    },
    license='MIT',
    entry_points={
        'console_scripts': [
            'findroom = app:main'
        ]
    },
)
