# X-Ember-CLI

This is a tool that corrects, or modifies the behavior of the ember-cli. It utilizes the ember-cli as a peer-dependency, using it underneath to provide the bulk of the desired functionality

Use this the same way as the ember-cli unless for anything stated otherwise, in which case follow the specific instructions to reach the desired outcome

## Usage

Install globally, but only use within an ember project.
The cli looks for the existence of `.ember-cli` file up to the system root, will keep looking until it's found.
Hence, it might seem to hang a bit if there is no `.ember-cli` file in neither the present directory nor any of its parents

```bash
npm install -g x-ember-cli
```

## STATUS AND NOTE
This will fail for everything where an overwrite is to be expected, and also wherever you need to run the destroy command of ember-cli

In this cases, use the ember-cli

This is for now only meant to be used for non-destructive creation commands
