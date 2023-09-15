# UniversalControlMacros
I was really missing some of the more advanced scene functionality on the old Yamaha 01v96 that I used to use on my PreSonus StudioLive 32.4.2 AI, so I made a program to bring back a lot of the programmability and more. With this program, you create macros by storing only the diff on what you want changed which makes it very customizable.

## Dependencies
For this project, I am using Node v20.6.1. That should be all that you need for this to work

## Setup
1. Make sure that you have Universal Control open. Knowing that a terminal will be open alongside it, place your Universal Control window in a place that you like. For me personally, I keep my Universal Control on the left side of my screen with my terminal on the right side of the screen.
2. On the config.json file, be sure to set your "scaling" value (what your computer scaling is set at. As some examples, I have what it looks like both on my 1440p monitor at 100% scaling and my 1600p laptop screen at 125% scaling in there as defaults), your "environment" (this is supposed to be either "production" or "testing". "production" only recalls the diff while "testing" recalls the entire file. The reason for this difference is because, when on Demo mode in Universal Control, if you send over the diff, it resets everything that isn't sent over. However, on the actual soundboard itself, it behaves as expected and will only send over the diff without touching anything else, and this is the only way for it to recall with reasonable latency...)
   * test
