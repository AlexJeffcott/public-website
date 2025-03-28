# A Tool of my Own

## Motivation

On the one hand, I wanted to make a writing tool that I would be happy with and use. This tool is not quite there yet, but I am working on it!

On the other hand, I also wanted to consolidate the knowledge and skills that I had acrued from working on new.space.

## What you can do

- You can write text
- You can connect GitHub to persist and version your files
- You can switch between GitHub repos
- You can drag‘n’drop a folder from your OS
- You can watch videos, listen to audio and view images
- You can use LLMs

> If you add a hash-bang (`#! `) you will see a “run” button appear above the text editor.
>
> You can add `claude/frontend` or `claude/fullstack` and the text on subsequent lines in the file will be passed to Claude with the specified “persona”.
>
> This will output a file with the same name, in the same directory, with a `.output` extension with the output of the AI assistant.
>
> In the near future, I will be adding `anthropic` and `chatgpt` to this.

## Current Limitations

### Browser Support

This web app is not designed to be used on a mobile device and there may be issues with older or non-chromium browsers as I am using some fairly bleeding edge APIs like OPFS.

### In-line Rendering of Markdown

Markdown recieves code styling but not a rendered output version. This is something I want to spend more time considering as the UX/UI to implementation complexity caculus is not totally clear to me.

### Collaboration

There are currently no collaborative features whatsoever, at least outside of collaborating on the source files via GitHub.

I do not plan to add collaborative features.

### Encryption

I plan on encryting the files in the client. I need to decide whether I want this encryption layer to sit between the UI and the local files or only between the files and the remote. I feel like the former is less likely to have accidental security leaks, but is also a lot more computation as it would have to encrypt/decrypt on change (every read/write cycle).

### Notifications

It would be interesting and useful to have todos and events.

### Config

I feel like having a root .config file would be useful for adding environment variables and preferences. If it is encrypted then VC shouldn’t be an issue and is probably more secure than using globals like localstorage.

### Getting more out of AIs with an agent

I like the idea of having a single agent interface which can use any of the available AIs and stores in order to achieve some particular task. For example, you could do something like:

```
#! agent

Please create a recurring task at 0800 everyday to start a journal entry for today (eg the current day) with any unchecked todos copied from yesterday (eg the day before).

Please add a couple of prompting questions to help me write my journal entry.

Please add a brief weather and news summary to yesterday’s entry.

If it is Monday, then also add a summary of last week’s activities to the beginning of today’s journal.
```
or 

```
#! agent

Please convert all the Typescript files in the src folder and save them in a build folder.
```

or

```
#! agent

Please extract all the types in libs/fs/mod.ts and put them in libs/fs/mod.d.ts.

Please also create typeguards for all these types and put them in libs/fs/type-guards.ts.
```

### Text editor themes

I use min-light and min-dark themes, which should match your browser settings. It should be easy to open up to a whole myriad of themes - I just need to surface this in the UI.

### The experience for non-text files is a bit… limited

I hadn’t really intended to support non-text files at all, but I thought that it would be interesting to include them in some manner, at least.

Give it a go, drag‘n’drop an .mp4 or .jpg and see how it goes.

I am not really sure how I am going to handle larger files like videos, in terms of the GitHub integration, which is currently how I am persisting files outside of the client. Maybe LFS?

### AI Tooling is limited

I haven’t added support for all the AI tooling that I plan to yet. This is just a question of wiring it up and I will get around to it.

### GitHub Version Control doesn’t do X

There is just enough GitHub integration to get going and be able to wipe out everything locally and be able to restore a previous version. That is good enough for today.

In the furture, I could see that visualising diffs, easily switching between projects, and sufacing status interactively would be useful…

### transpiling used to work…

The eariest versions of this idea used Monaco and was able to run Typescript code as tests and benchmarks. Since ditching Monaco, as I found it unwieldy and bloated, for a more bare-metal approach leveraging Shiki for code formatting (as I would have to be crazy to try and resolve **THAT** problem) I have not reimplimented this functionality.

This is another case of needing to wire up functionality that exists in the codebase so it becomes useful.

I will return to using the esbuild WASM for transpiling Typescript and aim to be able to run and benchmark code in the browser, as before, as I think this is useful but I want to look into sandboxing first.

### Kinks with the text editor

There are some kinks, still, with the text editor, but I will work those out over time.

## Can I see the code?

Yup, although you should know ahead of time that it is very much a work-in-progress and there are plenty of things-to-improve!

https://github.com/AlexJeffcott/public-website.git

