import jsonpath = require("jsonpath");
import { setTimeout } from "timers/promises";

export class ValueSetter {
    originalStateObject: any;
    macroSceneObject: any;
    jsonPath: string;
    valueObject: any;
    startTime: number = Date.now();
    timeElapsed: number = 0;

    originalValue: any;
    finalValue: any;

    delayTime: number | undefined;
    fadeTime: number | undefined;
    relative: boolean = false;

    fadeStartTime: number | undefined;

    constructor(originalStateObject: any, macroSceneObject: any, jsonPath: string, valueObject: any)
    {
        this.originalStateObject = originalStateObject;
        this.macroSceneObject = macroSceneObject;
        this.jsonPath = jsonPath;
        this.valueObject = valueObject;

        if ("delay" in this.valueObject)
        {
            this.delayTime = this.valueObject.delay;
        }
        if ("fade" in this.valueObject)
        {
            this.fadeTime = this.valueObject.fade;
        }
        if ("relative" in this.valueObject && this.valueObject.relative == true)
        {
            this.relative = this.valueObject.relative;
            this.finalValue = Number(jsonpath.query(this.originalStateObject, this.jsonPath)) + this.valueObject.value;
        }
        else
        {
            this.finalValue = this.valueObject.value;
        }
        
        this.originalValue = jsonpath.query(this.originalStateObject, this.jsonPath)[0];
    }

    // https://blender.stackexchange.com/a/43802
    lerp = (from: number, to: number, ratio: number): number => {
        //console.log(`lerp from == ${from}, lerp to == ${to}, lerp ratio == ${ratio}`);
        return ((ratio * to) + ((1 - ratio) * from));
    }

    updateValue() {
        if (this.delayTime !== undefined)
        {
            if (((Date.now() - this.startTime)) < (this.valueObject.delay * 1000))
            {
                return {jsonPath: this.jsonPath, value: this.originalValue, done: false};
            }
        }

        if (this.fadeTime !== undefined)
        {
            if (this.fadeStartTime === undefined)
            {
                this.fadeStartTime = Date.now();
            }
            if (((Date.now() - this.fadeStartTime)) < (this.valueObject.fade * 1000))
            {
                return {jsonPath: this.jsonPath, value: this.lerp((this.originalValue as number), this.finalValue, ((Date.now() - this.fadeStartTime)) / (this.valueObject.fade * 1000)), done: false};
            }
        }

        // if ("delay" in this.valueObject)
        // {
        //     if (isNaN(this.valueObject.delay) === false)
        //     {
        //         while (((Date.now() - this.startTime)) < (this.valueObject.delay * 1000))
        //         {
        //         }
        //     }
        //     else
        //     {
        //         console.log(`Delay can only be used with numbers but a delay was declared in ${this.jsonPath}. This is probably unintentional.`);
        //     }
        // }

        // if ("fade" in this.valueObject)
        // {
        //     const fadeStartTime = Date.now();
        //     if (isNaN(this.valueObject.fade) === false)
        //     {
        //         while (((Date.now() - fadeStartTime)) < (this.valueObject.fade * 1000))
        //         {
        //             return {jsonPath: this.jsonPath, value: this.lerp((originalValue as number), value, ((Date.now() - fadeStartTime)) / (this.valueObject.fade * 1000)), done: false};
        //         }
        //     }
        //     else
        //     {
        //         console.log(`Fade can only be used with numbers but a fade was declared in ${this.jsonPath}. This is probably unintentional.`);
        //     }
        // }
        
        // if ("relative" in this.valueObject && this.valueObject.relative == true)
        // {
        //     if (isNaN(this.valueObject.value) === false)
        //     {
        //         value = Number(jsonpath.query(this.macroSceneObject, this.jsonPath)) + this.valueObject.value;
        //     }
        //     else
        //     {
        //         console.log(`Offset can only be used with numbers but an offset was declared in ${this.jsonPath}. This is probably unintentional.`);
        //     }
        // }
        return {jsonPath: this.jsonPath, value: this.finalValue, done: true};
    }
}