'use strict';

const Shaker = require('./src/shaker');
const fs = require('fs');

const shakeTsyringeTree = {
    name: 'shakeTsyringeTree',
    setup(build) {
        const options = build.initialOptions;
        options.metafile = true;

        build.onEnd(async (result) => {
            const filesPath = Object.keys(result.metafile.outputs).filter(
                (filePath) =>
                    filePath.slice(-3) === '.js' ||
                    filePath.slice(-4) === '.mjs'
            );

            await Promise.all(
                filesPath.map(async (filePath) => {
                    const shaker = new Shaker();
                    return shaker.execute(filePath);
                })
            );
        });
    },
};

module.exports = shakeTsyringeTree;
