# Spawnmon

Similar to [concurrently](https://www.npmjs.com/package/concurrently) or [npm-run-all](https://www.npmjs.com/package/npm-run-all) but with a few tweaks to make life easier. In particular when a watch stream is idle you can easily run another command or custom callback.

Also built in helpers for pinging a socket ensuring it's live and then firing off another event. This is useful if you want to use Create React App and then fire off a command to connect Electron after it detects CRA is live.

## Using CLI

Using the CLI is pretty straight forward and likely similar to what you've used in the past. Take note of the examples and help.

#### Show Help

```sh
$ spawnmon -h
```

#### Show Examples

```sh
$ spawnmon --examples
```

### Using From Command Line

Commands to be run by Spawnmon should be grouped in single or double quotes with options typically prior to commands.

The following will run rollup then watch for changes and also spin up Create React App.

```sh
$ spawnmon 'rollup -c -w' 'react-scripts start'
```

#### Changing the Prefix

By default each process is preceded by the index of the spawned command e.g. **[0]** then **[1]** for the second spawned command. This can be changed by setting the **"prefix"** option.

The following will change from displaying the index to displaying the command being run.

It's important to note that when using [ or ] in your template you must wrap in quotes.

Internally spawnmon will replace **{index|command|pid|timestamp}** with the corresponding value. 

```sh
$ spawnmon --prefix '[{command}]' 'rollup -c -w' 'react-scripts start'
```

### Advanced Features

Spawnmon can run another command after the previous becomes idle or can use the internal socket connection helper to fire a command after a successfully connected ping.

#### Running Command after Socket Connection

In the below example **"electron"** will only be added to Spawnmon as a runnable command but will not immediatelly be spawned. 

The format here is **parent-command:child-command:host:port**. By default the host and port are set as below so you do not need to provide those if you are for example pinging create react app.

Once Create React App or react-scripts runs it will start pinging. When the socket establishes a connection it will fire up **electron**.

```sh
$ spawnmon --on-pinger react-scripts:electron:127.0.0.1:3000 'electron .' 'rollup -c -w' 'react-scripts start'
```

#### Running Command after Parent is Idle

This is not a perfect science as you need some sort of success or idle condition to be sent from the spawned parent. In order to simplify this and not have to create elaborate success conditions the simple timer assumes when the spawned process quits emitting or writing output and it eclipses an interval without changing that it is in idle. Not perfect but works well in many cases. 

If using this feature programmatically you have much more control over the success or idle condition.

The below will output "rollup done!" once **rollup** is idle and watching for changes.

```sh
$ spawnmon --on-timer rollup:echo 'echo rollup done!' 'rollup -c -w' 'react-scripts start'
```

## Programmatic Usage

As time permits there is much more Spawnmon can do. Here are the basis. However the docs are very detailed, every method has clear comments and typings. You should be able to figure it out in the
meantime.

```js
const { Spawnmon, Pinger } = require('spawnmon');

const sm = new Spawnmon();

// Use "create" here without adding to the runnable group.
// "add" will create the command and add to group.
sm.create('electron', '.');

sm.add('rollup', ['-c', '-w']});

sm.add('react-app-rewired', 'start')
  .setPinger(() => {
    // maybe launch electron???
  });

// OR

// This is the same as above but it will call
// and run the above "electron" command we
// initialized with "create".
sm.add('react-app-rewired', 'start')
  .setPinger('electron');

// Again by using "create" for electron only
// the rollup and react-app-rewired will run here.
sm.run();
```

## Why Another Concurrently or Run-All?

Main reason was to have something a little more focused on API use, solid Typescript typings and be able to easily run things after watch streams go stale or become idle. 

Other than that not a ton to be honest, in fact most of these task runners work about the same really. 

With a little luck, in the end the API for programmatic use might end up hair better.

## Docs

See [https://blujedis.github.io/spawnmon/](https://blujedis.github.io/spawnmon/)

## Change

See [CHANGE.md](CHANGE.md)

## License

See [LICENSE.md](LICENSE)
