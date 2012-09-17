# Slice-n-Dice

node-based image resizing http service.

## Install

First, install graphicsmagick. Then download this git repo and type 'npm install' in the created directory.

## Starting

    PORT=8081 NODE_ENV=production node index.js

### Env Variables
* **PORT** defaults to 8081
* **NODE\_ENV** set to 'production' to turn on clustering

## Usage

example:

    http://127.0.0.1:8081/?u=http://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1077px-FullMoon2010.jpg&w=600&h=100&sw=1077&sh=1024

### Params

* **u** image url to process
* **h** resize height
* **w** resize width
* **sh** _(optional)_ original height
* **sw** _(optional)_ original width

NOTE: including original height and width is much more efficient.

FINAL NOTE: this entire thing could be replaced by a small shell script.
