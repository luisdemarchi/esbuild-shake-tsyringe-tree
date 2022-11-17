'use strict';

const fs = require('fs');
const Shaker = require('./shaker');
jest.mock('fs/promises');

describe('tree shake test', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        fs.promises.writeFile = jest.fn().mockResolvedValue();
    });

    async function core(filesPath) {
        const shaker = new Shaker();
        const result = await shaker.execute(
            `./tests/stubs/${filesPath}/original.stub.mjs`
        );

        const expected = await fs.promises.readFile(
            `./tests/stubs/${filesPath}/expected.stub.mjs`,
            'utf8'
        );

        expect(result.replace(/\s/g, '')).toEqual(expected.replace(/\s/g, ''));
    }

    it('should remove imports from tsyringe', async () => {
        const filesPath = 'replaceImports';
        await core(filesPath);
    });

    it('should resolve container.register()', async () => {
        const filesPath = 'containerRegister';
        await core(filesPath);
    });

    it('should resolve injects in constructor', async () => {
        const filesPath = 'decoratorsInConstructor';
        await core(filesPath);
    });

    it('should remove unused functions', async () => {
        const filesPath = 'removeUnusedFunctions';
        await core(filesPath);
    });

    it('should remove unused functions singleton', async () => {
        const filesPath = 'removeUnusedSingleton';
        await core(filesPath);
    });
});
