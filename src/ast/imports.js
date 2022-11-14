'use strict';
const jsEmitter = require('./jsemitter');
const { generate } = require('astring');

class Imports {
    constructor() {
        this.specifiers = [];
        this.others = [];
        this.localNames = {};
        this.namespaces = [];
    }

    _pushOriginal(node) {
        this.others.push(node);
    }

    push(node) {
        const sourceName = jsEmitter.literalOrIdetifier(node.source);
        if (sourceName !== 'tsyringe') {
            this._pushOriginal(node);
            return;
        }

        for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportSpecifier') {
                const importedName = specifier.imported.name;
                const localName = specifier.local.name;

                if (!this.specifiers.includes(importedName)) {
                    this.specifiers.push(importedName);
                }
                if (importedName !== localName) {
                    this.localNames[localName] = importedName;
                }
            } else if (specifier.type === 'ImportNamespaceSpecifier') {
                this.namespaces.push(specifier.local.name);
            }
        }
    }

    getOriginalName(specifierName) {
        const local = this.localNames[specifierName];
        if (local) {
            return local;
        }
        const specifier = this.specifiers.includes(specifierName)
            ? specifierName
            : undefined;

        if (specifier) {
            return specifier;
        }

        return this.namespaces.includes(specifierName)
            ? specifierName
            : undefined;
    }

    isInjectableDecorator(specifierName, secondaryName) {
        const value = this.getOriginalName(specifierName);
        return (
            value === 'injectable' || (value && secondaryName === 'injectable')
        );
    }

    getAllLocalNames() {
        return this.localNames;
    }

    emitter(codeMap) {
        for (let index = 0; index < this.others.length; index++) {
            const other = this.others[index];
            const code = generate(other);
            const order = (this.others.length - index) * -1;
            codeMap.set(order, code);
        }

        return codeMap;
    }
}

module.exports = Imports;
