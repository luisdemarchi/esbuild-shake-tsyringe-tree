'use strict';

const { Util } = require('./util');

class ReplaceTsyringe {
    constructor(imports, variableDeclarations, expressionStatement) {
        this.imports = imports;
        this.variableDeclarations = variableDeclarations;
        this.expressionStatement = expressionStatement;
    }

    fromContainerResolveToNewObject(body) {
        const result = Util.filterObjectsNode(body);
        if (result) {
            for (const { object, property, parentValue, rootBody } of result) {
                const varName = this.variableDeclarations.getClassName(
                    object?.name
                );
                if (varName === 'container' && property?.name === 'resolve') {
                    const registerName = parentValue.arguments[0].value;
                    const className =
                        this.expressionStatement.getRegisterClassName(
                            registerName
                        );
                    this.handlerContainerRegister(
                        registerName,
                        className,
                        rootBody
                    );
                }
            }
        }
    }

    handlerContainerRegister(registerName, className, body) {
        if (className && body) {
            let node;
            let name;
            const action =
                this.expressionStatement.getRegisterAction(registerName);
            if (action === 'register') {
                node = {
                    type: 'NewExpression',
                    callee: { type: 'Identifier', name: className },
                    arguments: [],
                };
            } else if (action === 'registerSingleton') {
                name = `__${className}__singleton`;
                node = {
                    type: 'Identifier',
                    name,
                };
            }

            body.init = 'init' in body ? node : undefined;
            body.right = 'right' in body ? node : undefined;
            return { action, name };
        }
    }

    fromVariableToNewObject(variableName, classLocalName, body, parentValue) {
        let replaced = false;

        if (Array.isArray(body)) {
            for (const item of body) {
                const result = this.fromVariableToNewObject(
                    variableName,
                    classLocalName,
                    item,
                    parentValue
                );
                if (result) {
                    replaced = true;
                }
            }
            return replaced;
        }
        if (
            parentValue?.type === 'ExpressionStatement' &&
            body.type === 'AssignmentExpression' &&
            body.right.name === variableName
        ) {
            const className =
                this.expressionStatement.getRegisterClassName(classLocalName);
            this.handlerContainerRegister(classLocalName, className, body);
            replaced = true;
        }

        for (const value of Object.values(body)) {
            const type = typeof value;
            if (value != null && type === 'object') {
                const result = this.fromVariableToNewObject(
                    variableName,
                    classLocalName,
                    value,
                    body
                );
                if (result) {
                    replaced = true;
                }
            }
        }

        return replaced;
    }
}
module.exports = ReplaceTsyringe;
