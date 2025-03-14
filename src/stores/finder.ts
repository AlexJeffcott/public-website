import { type Signal, signal } from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'
import { fsHandlers } from '@/broadcast/main.ts'
import { type FSNode } from '@/types/fs.ts'

function getPlaceholderByExt(ext?: string) {
  switch (ext) {
    case 'ts': {
      return `const defaultArr = new Array(999999).fill(undefined).map(i => i)

function run(arr: number[] = defaultArr): number {
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
            sum += arr[i]
    }
    return sum;
}`
    }
    case 'tsx': {
      return `import { type FunctionComponent, type JSX } from "preact";

handleClick(event: JSX.TargetedMouseEvent<HTMLButtonElement>) {
    alert(event.currentTarget.tagName);
  }

const Card: FunctionComponent<{ title: string }> = ({ title, children }) => {
  return (
    <div class="card">
      <h1>{title}</h1>
      <button onClick={handleClick}>
        {children}
      </button>

      {children}
    </div>
  );
};
`
    }
    case 'js': {
      return `const defaultArr = new Array(999999).fill(undefined).map(i => i)

function run(arr = defaultArr) {
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
            sum += arr[i]
    }
    return sum;
}`
    }
    case 'jsx': {
      return `import { signal } from "@preact/signals";

// Create a signal that can be subscribed to:
const count = signal(0);

function Counter() {
  // Accessing .value in a component automatically re-renders when it changes:
  const value = count.value;

  const increment = () => {
    // A signal is updated by assigning to the ‘.value’ property:
    count.value++;
  }

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={increment}>click me</button>
    </div>
  );
}`
    }
    case 'json': {
      return `{
  "squadName": "Super hero squad",
  "homeTown": "Metro City",
  "formed": 2016,
  "secretBase": "Super tower",
  "active": true,
  "members": [
    {
      "name": "Molecule Man",
      "age": 29,
      "secretIdentity": "Dan Jukes",
      "powers": ["Radiation resistance", "Turning tiny", "Radiation blast"]
    },
    {
      "name": "Madame Uppercut",
      "age": 39,
      "secretIdentity": "Jane Wilson",
      "powers": [
        "Million tonne punch",
        "Damage resistance",
        "Superhuman reflexes"
      ]
    },
    {
      "name": "Eternal Flame",
      "age": 1000000,
      "secretIdentity": "Unknown",
      "powers": [
        "Immortality",
        "Heat Immunity",
        "Inferno",
        "Teleportation",
        "Interdimensional travel"
      ]
    }
  ],
  "from": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON"
}`
    }
    case 'html': {
      return `<!DOCTYPE html>
<html lang="en-us">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>MDN Web Docs Example: Toggling full-screen mode</title>
    <link rel="stylesheet" href="styles.css">
    <style class="editable">
        video::backdrop {
          background-color: #448;
        }
    </style>

    <!-- import the webpage's javascript file -->
    <script src="script.js" defer></script>
  </head>
  <body>
    <section class="preview">
      <video controls
        src="https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4"
        poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217"
        width="620">

        Sorry, your browser doesn't support embedded videos.  Time to upgrade!

      </video>
    </section>

<textarea class="playable playable-css" style="height: 100px;">
video::backdrop {
  background-color: #448;
}
</textarea>

<textarea class="playable playable-html" style="height: 200px;">
<video controls
  src="https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4"
  poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217"
  width="620">
Sorry, your browser doesn't support embedded videos.  Time to upgrade!
</video>
</textarea>

    <div class="playable-buttons">
        <input id="reset" type="button" value="Reset" />
      </div>
    </body>
    <script src="playable.js"></script>
  </body>
</html>`
    }
    case 'css': {
      return `html {
	margin: 0;
	background: black;
	height: 100%;
}

body {
	margin: 0;
	width: 100%;
	height: inherit;
}

/* the three main rows going down the page */

body > div {
  height: 25%;
}

.thumb {
	float: left;
	width: 25%;
	height: 100%;
	object-fit: cover;
}

.main {
  display: none;
}

.blowup {
  display: block;
  position: absolute;
  object-fit: contain;
  object-position: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
}

.darken {
  opacity: 0.4;
}`
    }

    case 'sql': {
      return `USE AdventureWorks2022;
GO
IF OBJECT_ID('dbo.NewProducts', 'U') IS NOT NULL
    DROP TABLE dbo.NewProducts;
GO
ALTER DATABASE AdventureWorks2022 SET RECOVERY BULK_LOGGED;
GO

SELECT * INTO dbo.NewProducts
FROM Production.Product
WHERE ListPrice > $25
AND ListPrice < $100;
GO
ALTER DATABASE AdventureWorks2022 SET RECOVERY FULL;
GO`
    }

    case 'regexp': {
      return `/^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip)(\(.+\))?: .{1,50}/`
    }

    case 'sh': {
      return `#!/bin/sh
# weather.sh
# Copyright 2018 computer-geek64. All rights reserved.

program=Weather
version=1.1
year=2018
developer=computer-geek64

case $1 in
-h | --help)
	echo "$program $version"
	echo "Copyright $year $developer. All rights reserved."
	echo
	echo "Usage: weather [options]"
	echo "Option          Long Option             Description"
	echo "-h              --help                  Show the help screen"
	echo "-l [location]   --location [location]   Specifies the location"
	;;
-l | --location)
	curl https://wttr.in/$2
	;;
*)
	curl https://wttr.in
	;;
esac`
    }

    case 'md': {
      return `An h1 header
============

Paragraphs are separated by a blank line.

2nd paragraph. *Italic*, **bold**, and \`monospace\`. Itemized lists
look like:

  * this one
  * that one
  * the other one

Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.

> Block quotes are
> written like so.
>
> They can span multiple paragraphs,
> if you like.

Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. ☺



An h2 header
------------

Here's a numbered list:

 1. first item
 2. second item
 3. third item

Note again how the actual text starts at 4 columns in (4 characters
from the left side). Here's a code sample:

    # Let me re-iterate ...
    for i in 1 .. 10 { do-something(i) }

As you probably guessed, indented 4 spaces. By the way, instead of
indenting the block, you can use delimited blocks, if you like:

~~~
define foobar() {
    print "Welcome to flavor country!";
}
~~~

(which makes copying & pasting easier). You can optionally mark the
delimited block for Pandoc to syntax highlight it:

~~~python
import time
# Quick, count to ten!
for i in range(10):
    # (but not *too* quick)
    time.sleep(0.5)
    print(i)
~~~



### An h3 header ###

Now a nested list:

 1. First, get these ingredients:

      * carrots
      * celery
      * lentils

 2. Boil some water.

 3. Dump everything in the pot and follow
    this algorithm:

        find wooden spoon
        uncover pot
        stir
        cover pot
        balance wooden spoon precariously on pot handle
        wait 10 minutes
        goto first step (or shut off burner when done)

    Do not bump wooden spoon or it will fall.

Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).

Here's a link to [a website](http://foo.bar), to a [local
doc](local-doc.html), and to a [section heading in the current
doc](#an-h2-header). Here's a footnote [^1].

[^1]: Some footnote text.

Tables can look like this:

Name           Size  Material      Color
------------- -----  ------------  ------------
All Business      9  leather       brown
Roundabout       10  hemp canvas   natural
Cinderella       11  glass         transparent

Table: Shoes sizes, materials, and colors.

(The above is the caption for the table.) Pandoc also supports
multi-line tables:

--------  -----------------------
Keyword   Text
--------  -----------------------
red       Sunsets, apples, and
          other red or reddish
          things.

green     Leaves, grass, frogs
          and other things it's
          not easy being.
--------  -----------------------

A horizontal rule follows.

***

Here's a definition list:

apples
  : Good for making applesauce.

oranges
  : Citrus!

tomatoes
  : There's no "e" in tomatoe.

Again, text is indented 4 spaces. (Put a blank line between each
term and  its definition to spread things out more.)

Here's a "line block" (note how whitespace is honored):

| Line one
|   Line too
| Line tree

and images can be specified like so:

![example image](example-image.jpg "An exemplary image")

Inline math equation: $\omega = d\phi / dt$. Display
math should get its own line like so:

$$I = \int \rho R^{2} dV$$

And note that you can backslash-escape any punctuation characters
which you wish to be displayed literally, ex.: \`foo\`, \*bar\*, etc.

| Syntax | Description |
| ----------- | ----------- |
| Header | Title |
| Paragraph | Text |

- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media`
    }
    case 'txt': {
      return 'This is just some normal text, which is fine.'
    }
    default: {
      return 'I don’t handle this fine extension in any particular way.'
    }
  }
}

export class FinderStore extends BaseStore {
  ls: Signal<FSNode>

  constructor() {
    super('finderStore')
    this.ls = signal<FSNode>({
      name: 'root',
      kind: 'directory',
      path: '',
    })

    this.refreshLs = this.refreshLs.bind(this)
    this.create = this.create.bind(this)
    this.copy = this.copy.bind(this)
    this.delete = this.delete.bind(this)
    this.exists = this.exists.bind(this)

    this.refreshLs()
    this.logger.info('FinderStore initialized')
  }

  refreshLs() {
    fsHandlers.list().then((res) => {
      this.ls.value = res
    })
  }

  exists(fsNode: FSNode) {
    if (fsNode.kind === 'file') {
      return fsHandlers.existsFile(fsNode.path)
    } else {
      return fsHandlers.existsDirectory(fsNode.path)
    }
  }

  create(fsNode: FSNode): void {
    this.exists(fsNode).then((exists) => {
      if (!exists) {
        if (fsNode.kind === 'file') {
          const data = getPlaceholderByExt(fsNode.name.split('.').pop())
          fsHandlers.write(fsNode.path, data).then(() => this.refreshLs())
        } else {
          fsHandlers.createDirectory(fsNode.path).then(() => this.refreshLs())
        }
      } else {
        // TODO: handle this error in some nice way
        // a toast?
        throw new Error(`${fsNode.kind} already exists at that path`)
      }
    })
  }

  delete(fsNode: FSNode): void {
    this.exists(fsNode).then((exists) => {
      if (exists) {
        fsHandlers.delete(fsNode.path).then(() => {
          setTimeout(() => this.refreshLs(), 100)
        })
      } else {
        // TODO: handle this error in some nice way
        // a toast?
        throw new Error(`${fsNode.kind} doesn’t exist at that path`)
      }
    })
  }

  copy(sourceFSNode: FSNode, destinationFSNode: FSNode): void {
    fsHandlers.copy(sourceFSNode.path, destinationFSNode.path).then(() => {
      setTimeout(() => this.refreshLs(), 100)
    })
  }
}
