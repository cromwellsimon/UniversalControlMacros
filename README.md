# UniversalControlMacros
I was really missing some of the more advanced scene functionality on the old Yamaha 01v96 that I used to use on my PreSonus StudioLive 32.4.2 AI, so I made a program to bring back a lot of the programmability and more. With this program, you create macros by storing only the diff on what you want changed which makes it very customizable.

## Dependencies
For this project, I am using Node v20.6.1. That should be all that you need for this to work

## Credit
The only package that I (actively) use in this is [RobotJS](https://robotjs.io/docs/syntax)

## Setup
1. Make sure that you have Universal Control open. Knowing that a terminal will be open alongside it, place your Universal Control window in a place that you like. For me personally, I keep my Universal Control on the left side of my screen with my terminal on the right side of the screen.
2. Go to the full Scene view in Universal Control (click "Scene", then the button immediately below that to get all of your Scenes)
3. If you don't have one already, make a Local Scene that you will use as a temporary scene that can be overriden by the software. To do so, click the button that says "Local", then click Save to give you the prompt to save a scene. It doesn't matter what you call it but I personally call mine "Macro Scene".
5. On the config.json file, be sure to set:
   * scaling
       * What your computer display scaling is set at. As some examples, I have what it looks like both on my 1440p monitor at 100% scaling and my 1600p laptop screen at 125% scaling in there as defaults
   * environment
       * This is supposed to be either "production" or "testing". "production" only recalls the diff while "testing" recalls the entire file. The reason for this difference is because, when on Demo mode in Universal Control, if you send over the diff, it resets everything that isn't sent over. However, on the actual soundboard itself, it behaves as expected and will only send over the diff without touching anything else, and this is the only way for it to recall with reasonable latency...
   * scenePosition
       * This takes an x coordinate and y coordinate from the top-left corner of your screen. This is where you want your mouse cursor to move and click to whenever selecting the scene. Specifically, set this to be the coordinates of the temporary Local scene that you want to be overridden by the software
   * recallPosition
       * This takes an x coordinate and y coordinate from the top-left corner of your screen. This is where you want your mouse cursor to move and click to in order to get to the "Recall" button on your Universal Control
   * terminalPosition
       * This takes an x coordinate and y coordinate from the top-left corner of your screen. This is where you want your mouse cursor to move and click to in order to get back to the Terminal, so you can select a macro and put you back on the selection screen
   * saving
       * I can probably change this, but in the 'position' object which is inside of here, that's where you set your x coordinate and y coordinate from the top-left corner of your screen. This is where you want your mouse cursor to move and click to in order to select your Local Scene that will be overridden by the software. I have that as a separate sub-object because I thought that I would be using the 'name' string in there for something but that ended up being unused...
   * pollingRate
       * This specifies the number of seconds between spamming the Recall button on the software. The reason for this existing is because the StudioLive AI has a pretty slow recall rate. Simply saving a scene on the soundboard itself and recalling it takes close to a second... sending only the diff speeds it up by almost 10x but still, me having it set to .1 seconds is just a guess at how long it takes to Recall the diff. Feel free to mess around with this but if you set it too fast, it can lock up the controls on the soundboard for a while...
   * macroScenePath
       * This specifies the path to your locally-saved scene on your computer. You can look at my example to see where it'd probably be at and what it'd be called (your Scene name + .scene)
   * macrosPath
       * This specifies the path to the file that contains your Macros. Unless if you choose to move the macros.json file, you should be able to leave this at its default.

Now, whenever you run the program, it will automatically update the current state of your soundboard to the Scene defined in macroScenePath and you will be prompted to select a macro. You can navigate by pressing up or down on the arrow keys and just press enter to start using that macro.
    
## Macros
Feel free to look at my macros.json file to look at several examples, but, as of now, here's the general layout of how it works:
 * aliases
     * This is where you define another name for a particular JSON Path. For example, instead of always referring to Channel 1's volume as "$.line.ch1.username", you can add a new key-value pair to the aliases, with the key being the name you want it to be and the value being the path. If I did "Left Soundpad Volume": "$.line.ch1.volume", I can now refer to that as just "Left Soundpad Volume" in the macros.
 * macros
     * This is where you set your macros. This takes an array of objects that look like:
     * name
         * This is a string. This defines what the macro will show up as in the list of macros.
     * diff
         * This is an object that will contain the diff. Inside of the object looks like this:
         * Path Name (this can either be an Alias or an actual JSON Path. This always starts at the root, so your path must start with $.)
             * value
                 * This is the new value that you want to set the path to
             * relative
                 * For numbers, this states whether or not you want it to set the value relatively or absolutely to its current position. This should be a boolean but it defaults to false if you don't include it (so, it'll be absolute by default)
             * delay
                 * This defines how long until you starting the macro will it start to change anything. This needs to be a number but this should work with either string or number values in the Scene
             * fade
                 * This defines how long it should take to linearly interpolate to the next value. I can only assume this would break if you tried using this with a string value in the Scene so use this only with number values, and more specifically, number values that aren't used as boolean values (for example, even though $.line.ch1.mute is a number, it's really a boolean since it can be only either 0 and 1. I'm not sure what would happen if you were to set it to 0.5 but that's just another example of undefined behavior so preferably don't try it lol)
