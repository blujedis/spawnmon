<p>
  <img src="https://github.com/blujedis/spawnmon/blob/main/fixtures/logo.png" />
</p>

Similar to [concurrently](https://www.npmjs.com/package/concurrently) or [npm-run-all](https://www.npmjs.com/package/npm-run-all) but with a few tweaks to make life easier. In particular when a watch stream is idle you can easily run another command or custom callback.

Also built in helpers for pinging a socket ensuring it's live and then firing off another event. Good for connecting say Electron after CRA launches.

## Using CLI

Using the CLI is pretty straight forward and likely similar to what you've used in the past. Take note of the examples and help.

#### Show Help or Examples

```sh
$ spawnmon -h
```
 **Examples**

```sh
$ spawnmon --examples
```

### Using From Command Line

Commands to be run by Spawnmon should be grouped in single or double quotes with options typically prior to commands.

The following will run rollup then watch for changes and also spin up Create React App.

```sh
$ spawnmon 'rollup -c -w' 'react-scripts start'
```

#### Log Prefix

Internally spawnmon will replace **{index|command|pid|timestamp|group}** with the corresponding value. Pass a template with **{key_from_above}** or without a template. One of those five should work for you.

```sh
$ spawnmon --prefix '[{command}]' 'rollup -c -w' 'react-scripts start'
```

### Commands & Syntax

Tinkered around with this a fair amount and the best way is to use indexes. For example say you are running two commands.

```sh
$ spawnmon 'rollup -c w' 'react-scripts start'
```

Now let's consider chaning the color for the prefix for each. Here's how you'd do it.

```sh
$ spawnmon --color cyan,blue 'rollup -c w' 'react-scripts start'
```

In the above it assumes the index of the corresponding command is in sequential order but you could also specify as below and you'd get the same output.

```sh
$ spawnmon --color 1:blue,0:cyan 'rollup -c w' 'react-scripts start'
```

You can also use globstars in the following manner. This would run anything that begins with **"build:"** for example.

If you use this feature with **onTimeout** or **onConnect** flags just note that the target index will be set to the **last** command in the list. This is because we're filtering or looking up multiple commands. If you don't want this you'll have to specify those commands manually. Just keep in mind there's no **!** char that can be used to filter just one specific command in the group. Maybe we can add that later.

```sh
$ spawnmon 'npm run build:*'
```

#### Why use indexes instead of command names?

You could use the same command more than once, you may also want to group them so that the prefixes reflect the group they belong to. This gets messy and LONG! Using the index of the command keeps it much shorter. 

### Cool Features

Spawnmon can run another command after the previous becomes idle or can use the internal socket connection helper to fire a command after a successful ping and connection.

#### Running Command after Socket Connection

In the below example **"electron"** will only be added to Spawnmon as a runnable command but will not immediatelly be spawned. 

The format here is **parent-index:child-index**. The host and port are set to 127.0.0.1:3000. If you want to change that use also <code>--on-connect-address 127.0.0.1:9000</code> or whatever host and port you need.

So here the **2** index command is the **react-scripts** command. Where as **0** is the first or **electron** command. 

Timing not to your liking? Add a delay <code>--delay 0:1000</code> which would add a 1 second delay to the **electron** command once **react-scripts** calls it.

```sh
$ spawnmon --on-connect 2:0 'electron .' 'rollup -c -w' 'react-scripts start'
```

#### Running Command after Parent is Idle

You can also run something after the output stream becomes idle. In short it stops writing to the console. The time checks if it's been updated since the previous tick of the interval. Super simple but works fairly well. Not a perfect science but helpful.

Programmatically you have much more control on the success or "idle" condition.

```sh
$ spawnmon --on-timeout 1:0 'echo rollup done!' 'rollup -c -w' 'react-scripts start'
```

## Options

The screenshot below is a representation of running <code>spawnmon -h</code>

<p>
  <img src="https://github.com/blujedis/spawnmon/blob/main/fixtures/options.png" />
</p>

### See More in Docs

[Spawnmon Instance Options](https://blujedis.github.io/spawnmon/interfaces/types.ispawnmonoptions.html)

[Command Options](https://blujedis.github.io/spawnmon/interfaces/types.icommandoptions.html)

## Examples

Note I would urge you to run <code>spawnmon --examples</code> as things have changed or been tweaked these keep changing but the syntax is reasonably set at this point. Just keep that in mind. The below for brevity only shows command examples. Run the examples to get to get the full list.

<p>
  <img src="https://github.com/blujedis/spawnmon/blob/main/fixtures/command.png" />
</p>


## Programmatic Usage

As time permits there is much more Spawnmon can do. Here are the basis. However the docs are very detailed, every method has clear comments and typings. You should be able to figure it out in the
meantime.

```js
const { Spawnmon } = require('spawnmon');

const sm = new Spawnmon();

// Use "create" here without adding to the runnable group.
// "add" will create the command and add to group.
sm.add('electron', '.')
  .runnable(false); // runnable just updates so sm.run() doesn't auto run this command.

sm.add('rollup', ['-c', '-w']});

sm.add('react-app-rewired', 'start')
  .onConnect(() => {
    // maybe launch electron???
  });

// OR

// This is the same as above but it will call
// and run the above "electron" command we
// initialized with "create".
sm.add('react-app-rewired', 'start')
  .onConnect('electron');

// Again by calling .runnable(false) for electron only
// rollup and react-app-rewired will run here with 
// electron firing up after the socket connects.
sm.run();
```

## Docs

See [https://blujedis.github.io/spawnmon/](https://blujedis.github.io/spawnmon/)

## Change

See [CHANGE.md](CHANGE.md)

## License

See [LICENSE.md](LICENSE)
