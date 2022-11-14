'use strict';

const acorn = require('acorn');
const { generate } = require('astring');
const { rollup } = require('rollup');
const virtual = require('@rollup/plugin-virtual');

const fs = require('fs');
const Imports = require('./ast/imports');
const ExpressionStatement = require('./ast/expression_statement');
const VariableDeclaration = require('./ast/variable_declaration');
const ReplaceTsyringe = require('./util/replace_tsyringe');

class Shaker {
    constructor() {}

    reset() {
        this.code = [];
        this.decls = new Map();
        this.calledDecls = [];
        this.imports = new Imports();
        this.expressionStatements = new ExpressionStatement(this.imports);
        this.variableDeclarations = new VariableDeclaration(
            this.imports,
            this.expressionStatements
        );
        this.unmappeds = [];
    }

    async execute(filePath) {
        let code = await fs.promises.readFile(filePath, 'utf8');

        for (let index = 0; index < 2; index++) {
            this.reset();
            const body = acorn.parse(code, {
                sourceType: 'module',
                location: true,
                ecmaVersion: 'latest',
            }).body;
            await this.categorize(body);
            await this.replaceTsyringe();
            this.emitters();
            code = await this.build(filePath);
        }

        await this.writeFile(filePath, code);
        return code;
    }

    async categorize(body) {
        body.forEach((node) => {
            switch (node.type) {
                case 'ImportDeclaration':
                    this.imports.push(node);
                    break;
                case 'ExpressionStatement':
                    this.expressionStatements.push(node);
                    break;
                case 'ClassDeclaration':
                case 'VariableDeclaration':
                    this.variableDeclarations.push(node);
                    break;
                default:
                    this.unmappeds.push(node);
                    break;
            }
        });
    }

    async replaceTsyringe() {
        await this.expressionStatements.execute();
        await this.variableDeclarations.execute();

        const replace = new ReplaceTsyringe(
            this.imports,
            this.variableDeclarations,
            this.expressionStatements
        );
        this.unmappeds.forEach(
            async (node) => await replace.fromContainerResolveToNewObject(node)
        );
    }

    searchAllCalls(body, parentValue) {
        try {
            if (Array.isArray(body)) {
                for (const item of body) {
                    this.searchAllCalls(item, parentValue);
                }
                return;
            }
        } catch (error) {
            console.error('error:', error);
        }

        return '';
    }

    emitters() {
        let codeMap = new Map();
        codeMap = this.imports.emitter(codeMap);
        codeMap = this.expressionStatements.emitter(codeMap);
        codeMap = this.variableDeclarations.emitter(codeMap);
        this.unmappeds.forEach((node) =>
            codeMap.set(node.start, generate(node))
        );
        const codeMapAsc = new Map([...codeMap].sort((a, b) => a[0] - b[0]));

        for (const key of codeMapAsc.keys()) {
            this.code.push(codeMapAsc.get(key), '\n');
        }
    }

    async build(filePath) {
        const codeInLine = this.code
            .filter((item) => (item ? item : ''))
            .join('');
        const inputOptions = {
            input: 'entry',
            onwarn: (warning, handle) => {
                if (warning.code === 'ERROR') {
                    handle(warning);
                }
            },
            plugins: [
                virtual({
                    entry: {
                        code: codeInLine,
                    },
                }),
            ],
        };
        const bundle = await rollup(inputOptions);
        const { output } = await bundle.generate({
            format: 'esm',
            esModule: true,
            file: filePath,
        });

        return output[0].code;
    }

    async writeFile(filePath, code) {
        await fs.promises.writeFile(filePath, code);
    }
}

module.exports = Shaker;
