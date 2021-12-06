import { writeFileSync } from "fs";
import * as pj from "./package.json";

const outPj =
{
    "name": pj.name,
    "version": pj.version,
    "description": pj.description,
    "main": "index.js",
    "types": "index.d.ts",
    // "type": "module",
    "scripts": {
        "test": "ava"
    },
    "author": "Danilo Tomaccio",
    "license": "ISC",
    "dependencies": pj.dependencies,
    "ava": pj.ava
}

try {
    writeFileSync('./dist/package.json', JSON.stringify(outPj));
} catch (error) {
    console.error(error);
}

