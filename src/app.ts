import * as robotjs from "robotjs";
import jsonpath = require("jsonpath");
import { readFile, writeFile } from "fs/promises";
import * as file from "fs";
import configuration from "../config.json";
import terminal = require("readline-sync");
import inquirer from "inquirer";
import { setTimeout } from "timers/promises";
import { ValueSetter } from "./valueSetter";
import { Discovery, Client, MessageCode } from "presonus-studiolive-api";

// When running a Universal Control Demo, trying to send over a diff value results in the un-set values being erased.
// However, whenever running with Universal Control connected, sending over a diff value works as expected
// and with drastically reduced latency in comparison to sending over the entire file (the actual soundboard computer takes much less time to parse the JSON).
// So, whenever running the file with configuration.environment set to "production", it will send only the diff. Otherwise, it will send the entire file.

let macroSceneFile: string;
let macroSceneObject: any;
let originalStateObject: any;
let selectedMacroName: string = "CANCEL";
let macrosObject: any = JSON.parse(file.readFileSync(configuration.macrosPath).toString());

// My screen size on my laptop is 125% which is 5/4. Take the reciprocal of that, 4/5, and that's what the "scaling" value needs to be. So, 1.0 if there is no scaling.
// This needs to be done because robotjs does not take scaling into account. For my laptop, the far-right of my 2560x1600 screen is 2047 pixels while the bottom is 1280 pixels.
const scalingReciprocal = (1 / configuration.scaling);

// https://stackoverflow.com/a/75029483
function isWriteable(filePath: string): boolean
{
    let fileAccess: boolean = false;
    try 
    {
        file.closeSync(file.openSync(filePath, "r+"))
        fileAccess = true;
    }
    catch (error)
    {

    }
    finally
    {
        return fileAccess;
    }
}

async function untilFileUnlocked(filePath: string): Promise<void>
{
    let isSaving: boolean = false;
    while (isSaving == false)
    {
        isSaving = isWriteable(configuration.macroScenePath);
    }
}

// Even though in production, we're only sending the diff, we still need to sync the scene with UC
// otherwise stuff like relative offsets will not work since they don't have the original value.
async function syncStateWithUC(): Promise<void>
{
    robotjs.moveMouse(configuration.scenePosition.x * scalingReciprocal, configuration.scenePosition.y * scalingReciprocal);
    robotjs.mouseClick("left");
    robotjs.moveMouse(configuration.saving.position.x * scalingReciprocal, configuration.saving.position.y * scalingReciprocal);
    robotjs.mouseClick("left");
    robotjs.keyTap("enter");

    await untilFileUnlocked(configuration.macroScenePath);
    macroSceneFile = file.readFileSync(configuration.macroScenePath).toString();
    originalStateObject = JSON.parse(macroSceneFile);
    macroSceneObject = {};
    if (configuration.environment !== "production")
    {
        macroSceneObject = structuredClone(originalStateObject);
    }
}

function recallScene(): void
{
    robotjs.moveMouse(configuration.scenePosition.x * scalingReciprocal, configuration.scenePosition.y * scalingReciprocal);
    robotjs.mouseClick("left");
    robotjs.moveMouse(configuration.recallPosition.x * scalingReciprocal, configuration.recallPosition.y * scalingReciprocal);
    robotjs.mouseClick("left");
}

async function promptMacro()
{
    // In case if we add a macro in the middle of the program, I'm re-mapping through this each time I prompt for the macro.
    const macroNames = macrosObject.macros.map((macro: any) => macro.name);
    //macroNames.unshift("SYNC");
    macroNames.unshift("CANCEL");

    robotjs.moveMouse(configuration.terminalPosition.x * scalingReciprocal, configuration.terminalPosition.y * scalingReciprocal);
    robotjs.mouseClick("left");
    return await inquirer.prompt([
        {
            type: "list",
            name: "name",
            message: "Select a Macro from the list below, SYNC to sync your temporary scene with the current soundboard settings, or CANCEL to quit",
            choices: macroNames,
            default: selectedMacroName
        }
    ])
    //return terminal.keyInSelect(macroNames, "Please select which macro you'd like to use");
}

async function main()
{
    await syncStateWithUC();

    let selectedMacro = await promptMacro();
    selectedMacroName = selectedMacro.name;
    
    while (selectedMacroName !== "CANCEL")
    {
        // if (selectedMacro.name === "SYNC")
        // {
        //     await syncMacroSceneWithUC();
        //     selectedMacro = await promptMacro();
        //     continue;
        // }

        await syncStateWithUC();
        const foundMacro: any = macrosObject.macros.find((macro: any) => macro.name === selectedMacro.name);
    
        const diff: any = foundMacro.diff;

        const valueSetters: ValueSetter[] = [];

        Object.keys(diff).forEach((key) => {

            const valueObject: any = diff[key];

            let jsonPath = key;
            if (key.startsWith("$") === false)
            {
                jsonPath = (macrosObject.aliases as any)[key];
            }

            valueSetters.push(new ValueSetter(originalStateObject, macroSceneObject, jsonPath, valueObject));
        });
        
        while (valueSetters.length > 0)
        {
            const originalValueSetters = Array.from(valueSetters);
            const valueSettersLength = valueSetters.length;
            for (let i: number = 0; i < valueSettersLength; i++)
            {
                let valueSetter = originalValueSetters[i];
                const generatedValue = valueSetter.updateValue();
                console.log(generatedValue);
                jsonpath.value(macroSceneObject, generatedValue.jsonPath, generatedValue.value);
                if (generatedValue.done)
                {
                    valueSetters.splice(valueSetters.indexOf(valueSetter), 1);
                }
            }
            file.writeFileSync(configuration.macroScenePath, JSON.stringify(macroSceneObject, null, 4));
            // The soundboard starts lagging if I do this as fast lol
            recallScene();
            await untilFileUnlocked(configuration.macroScenePath);
            if (valueSetters.length > 0)
            {
                await setTimeout(configuration.pollingRate * 1000);
            }
        }
        selectedMacro = await promptMacro();
        selectedMacroName = selectedMacro.name;
    }
}

main();



// To see whether or not the PreSonus StudioLive 32.4.2 AI will even be discovered with this...
// if not, I can't imagine it even being worth trying to reverse engineer everything to work for this.

// Future self note: Discovery works, however, I have yet to get it to connect.
// Though, since I have found a workaround to the latency problem by sending only the diff scene,
// it looks like this probably won't be necessary to mess with anymore.

// const discoveryClient = new Discovery();

// Client.discover().then((devices) => {
//     for (let device of devices) 
//     {
//         console.log(device);
//     }
//     if (devices.length > 0)
//     {
//         const foundDevice = devices[0];
//         const client = new Client({host: foundDevice.ip, port: foundDevice.port}, {autoreconnect: true});
//         const testPromise = client.connect({clientDescription: "Simon"}).then((client) => {
//             console.log(client);
//         })

//         setTimeout(5000).then(() => {
//             console.log(client);
//         })
//     }
// })

// discoveryClient.on("discover", (device) => {
//     console.log(device);
//     const client = new Client(
//             {host: "192.168.24.51", port: 53000},
//             {autoreconnect: true}
//         );
//     client.connect({clientDescription: "Console Remote"}).then((foundClient) => {
//         console.log(foundClient.state.get("line.ch7.mute"));
//     })
//     setTimeout(3000).then(() => {
//         console.log(client);
//     })
//     discoveryClient.stop();
// })

// discoveryClient.start();

// However, if it does work, I am able to set the state very easily from what is essentially a JSON Path (minus the $.) which would be hugely convenient...

// const client = new Client({host: "10.0.0.18", port: 53000});
// client.connect({clientDescription: "Console Remote"}).then(() => {
//     client.state.get("line.ch7.mute");
//     client.state.set("line.ch7.mute", 1);
// })