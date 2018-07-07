#!/usr/bin/env python
from setuptools import setup

REQUIREMENTS = [
    "environs>=1.2.0",
    "google-api-python-client>=1.6.3",
    "maya==0.3.2",
    # Web app requirements
    "flask==0.12.2",
    "flask-webpack==0.1.0",
    "flask-compress==1.4.0",
]


def read(fname):
    with open(fname) as fp:
        content = fp.read()
    return content


setup(
    name="cosroom",
    install_requires=REQUIREMENTS,
    version="1.0.0",
    description="Find an open room at COS using the Google Calendar API",
    long_description=read("README.md"),
    long_description_content_type="text/markdown",
    author="Steven Loria",
    author_email="sloria1@gmail.com",
    url="https://github.com/sloria/cosroom",
    py_modules=["cosroom"],
    license="MIT",
)
