'use strict';
const jsEmitter = require('./jsemitter');
const { Util } = require('../util/util');
class ExpressionStatement {
    constructor(imports) {
        this.nodes = [];
        this.imports = imports;
        this.registers = [];
        this.decorators = [];
        this.others = [];
    }

    push(node) {
        this.nodes.push(node);
    }

    execute() {
        for (const node of this.nodes) {
            const expression = node.expression;
            let success;
            if (expression.type === 'CallExpression') {
                success = this.processRegister(node);
            } else if (
                expression.type === 'AssignmentExpression' &&
                expression.right.type === 'CallExpression'
            ) {
                success = this.processDecorator(node);
            }
            if (success) {
                continue;
            }
            this.others.push(node);
        }
    }

    processRegister(node) {
        const expression = node.expression;
        const { object, property } = Util.findObjectNode(expression.callee);
        if (!object) {
            return;
        }
        const objectName =
            object.type === 'MemberExpression'
                ? object.object.name
                : object.name;
        const originalName = this.imports.getOriginalName(objectName);
        if (originalName) {
            const action = property?.name;
            const registerName = jsEmitter.literalOrIdetifier(
                expression.arguments[0]
            );
            const className = jsEmitter.literalOrIdetifier(
                expression.arguments[1]
            );
            this.registers.push({
                order: node.start,
                registerName,
                className,
                node,
                action,
            });
            return true;
        }
    }

    processDecorator(node) {
        const expression = node.expression;
        const functionName = jsEmitter.literalOrIdetifier(
            expression.right.callee
        );
        if (functionName === '__decorateClass') {
            const className = jsEmitter.literalOrIdetifier(
                expression.right.arguments[1]
            );

            const elements = expression.right.arguments[0].elements;
            const action = elements[0];
            if (action.type === 'CallExpression') {
                const { object, property } = Util.findObjectNode(action);

                if (
                    this.imports.isInjectableDecorator(
                        object.name,
                        property?.name
                    )
                ) {
                    return this.handleInjectable(elements, className, node);
                }
            }
        }
    }

    handleInjectable(elements, className, node) {
        const params = elements
            .filter(
                (item) =>
                    item.callee?.name === '__decorateParam' &&
                    item.arguments.length > 1
            )
            .map((item) =>
                item.arguments.find((arg) => arg.type === 'CallExpression')
            );
        const values = params.map((item) => {
            return Array.isArray(item.arguments)
                ? item.arguments[0].value
                : item.arguments.value;
        });
        this.decorators.push({
            order: node.start,
            className,
            values,
            node,
        });
        return true;
    }

    getRegisterClassName(registerName) {
        const result = this.registers.find(
            (item) => item.registerName === registerName
        );
        return result ? result.className : undefined;
    }

    getRegisterActionWithClassName(className) {
        const result = this.registers.find(
            (item) => item.className === className
        );
        return result ? result.action : undefined;
    }

    getRegisterAction(registerName) {
        const result = this.registers.find(
            (item) => item.registerName === registerName
        );
        return result ? result.action : undefined;
    }

    getConstructorValues(className) {
        const result = this.decorators.find(
            (item) => item.className === className
        );
        return result ? result.values : undefined;
    }

    emitter(codeMap) {
        for (const other of this.others) {
            const index = Util.getIndexForCodeMap(codeMap, other.start, true);
            codeMap.set(index, jsEmitter.unmapped(other));
        }
        return codeMap;
    }
}

module.exports = ExpressionStatement;
