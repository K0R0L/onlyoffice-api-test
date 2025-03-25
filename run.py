#!/usr/bin/env python3
import os
import platform
import subprocess

subprocess.call(["npm", "install", "http-server", "-g"], stderr=subprocess.STDOUT, shell=True)
subprocess.call(["http-server", "-p", "9500", "--cors"], stderr=subprocess.STDOUT, shell=True)
