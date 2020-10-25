## Beok / Hysen HVAC javascript lybrary

Simple javascript library that works locally with Beok / Hysen HVAC thermostats.

## Install

To install run:

```console
npm i beok
```

## Usage

```ts
import { Beok } from "beok"

const devices = await Beok.discover(5);
const myTerm = devices[0];

if(myTerm.auth()){
    await myTerm.setTemp(20);
}
```

## Related

- [python-broadlink](https://github.com/mjg59/python-broadlink) - Project in which I found the communication protocol
