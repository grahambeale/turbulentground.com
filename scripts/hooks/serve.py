#!/usr/bin/env python3
"""Static file server for the pre-push smoke run: python3 scripts/hooks/serve.py PORT

`python3 -m http.server` listens with a backlog of 5, so a burst of browser requests
(a page plus its stylesheets, scripts and images, several tabs at once) can get
ECONNRESET and a page renders unstyled. That showed up as an intermittent smoke failure.
This serves the current directory with the same handler, threaded, with a backlog of 512.
"""
import functools
import http.server
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 512
    daemon_threads = True


if __name__ == '__main__':
    port = int(sys.argv[1])
    Server(('127.0.0.1', port), functools.partial(Handler, directory='.')).serve_forever()
