# Spawnmon

Similar to [concurrently](https://www.npmjs.com/package/concurrently) or [npm-run-all](https://www.npmjs.com/package/npm-run-all) but with a few tweaks to make life easier. In particular when a watch stream goes initially stale or is idle.

Also built in helpers for pinging a socket ensuring it's live and then firing off another event.

## What's Working

Programatically it wroks great below is a very crude example but may give you an idea. More examples coming in the next few days.

```js
const { Spawnmon, Pinger } = require('spawnmon');

const sm = new Spawnmon();

// Next release options can be passed or a 
// Pinger instance to the command's options
// so there aren't as many moving pieces, simpler.
// 
// Pinger is very very simple opens a Socket retries
// a defined number of times then exits if not connected
// withing that retry period. Simple works perfect!
const ping = new Pinger({ retries: 10 });

ping.on('retry', (retries) => {
  console.log(`(${retries}) Pinging host 127.0.0.1:3000.`);
});

ping.on('connected', () => {
  // Do something when socket connects
  // something like spinning up Electron?
  console.log('Socket connected!');
});

sm.add('rollup', ['-c', '-w']);

sm.add('react-app-rewired', 'start')

ping.start();

sm.run();
```

## Not Working

The cli companion if you will likely more often used, not pushed yet. Working on it. Find it easier to get API solid first.

## Why Another Concurrently?

Main reason was to have something a little more focused on API used, solid Typescript typings and be able to easily run things afte watch streams got stale or become idle. 

Other than that not a ton to be honest, in fact most of these task runners work about the same really. 

## What's Next

...check back soon work in progress, working out kinks, feel free to comment on Github. Examples and CLI in a couple days.

## Docs

See [https://blujedis.github.io/spawnmon/](https://blujedis.github.io/spawnmon/)

## Change

See [CHANGE.md](CHANGE.md)

## License

See [LICENSE.md](LICENSE)
