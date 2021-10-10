# Eye Tracking Focus Demo
This is a demonstration of how (webcam) eye tracking can be used to simulate
eye focusing effect on videos.


## How To Run:

Simply run any http file server from the project root. I use python's http
server, but almost anything will work.ss

```bash
$ python -m http.server
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

Then go to `localhost:8080`. First, you need to calibrate the eye tracking system. Follow the cursor
with your eyes and click a couple times in the corners and edges of the screen. Once calibrated, you
can stop moving the cursor and look anywhere on the screen. The red dot should point where you're
looking and the video should also be focused to that point.
