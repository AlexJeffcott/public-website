export default `# A Tool of my Own
## Motivation
I wanted to make a writing tool that I would be happy with and use. This tool is not quite there yet, but I am working on it!

## What you can do
### You can connect GitHub to version your files
### You can use LLMs
If you add a hash-bang (`#! `) you will see a “run” button appear above the text editor.

You can add `claude/frontend` or `claude/fullstack` and the text on subsequent lines in the file will be passed to Claude with the specified “persona”.

This will output a file with the same name, in the same directory, with a `.output` extension with the output of the AI assistant.

In the near future, I will be adding `anthropic` and `chatgpt` to this.

## Current Limitations
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

I will return to using the esbuild WASM for transpiling Typescript and aim to be able to run and benchmark code in the browser, as before, as I think this is useful.

### Kinks with the text editor
There are some kinks, still, with the text editor, but I will work those out over time.

## Can I see the code?
Yup, although you should know ahead of time that it is very much a work-in-progress and there are plenty of things-to-improve!

https://github.com/AlexJeffcott/public-website.git`
