'use strict';

const jsEmitter = require('../ast/jsemitter');

class Util {
    static getAllClasses(node) {
        const classes = Util.filterNodesWithType('ClassDeclaration', node);
        const classesDeclarator = Util.filterNodesWithType(
            'ClassExpression',
            node
        );
        classesDeclarator.forEach((item) => {
            item.node.temporaryId = item.declarationRoot.declarations[0].id;
            classes.push(item);
        });

        return classes;
    }
    static codeWithNewImport(node, allLocalNames) {
        let code = jsEmitter.unmapped(node);
        for (const [key, value] of Object.entries(allLocalNames)) {
            const regex = RegExp('\\b' + key + '\\b', 'g');
            let result;
            while ((result = regex.exec(code)) !== null) {
                code = code.replace(result[0], value);
            }
        }

        return code;
    }

    static filterNodesWithType(type, body, declarationRoot) {
        let newDeclarationRoot = declarationRoot;
        const nodes = [];
        if (!body) {
            return [];
        }
        if (
            body.type === 'ExpressionStatement' ||
            (newDeclarationRoot?.type !== 'ExpressionStatement' &&
                body.type === 'VariableDeclaration')
        ) {
            newDeclarationRoot = body;
        }
        if (body?.type === type) {
            nodes.push({ node: body, declarationRoot: newDeclarationRoot });
        }

        if (Array.isArray(body)) {
            const pureObject = body.filter((item) => {
                const type = typeof item;
                return item != null && type === 'object';
            });
            for (const item of pureObject) {
                const result = this.filterNodesWithType(
                    type,
                    item,
                    newDeclarationRoot
                );
                nodes.push(...result);
            }
        } else {
            const objects = Object.values(body).filter((item) => {
                const type = typeof item;
                return item != null && type === 'object';
            });

            for (const object of objects) {
                const result = this.filterNodesWithType(
                    type,
                    object,
                    newDeclarationRoot
                );
                nodes.push(...result);
            }
        }

        return nodes;
    }

    static getFinalVariables(body) {
        const variables = [];
        if (Array.isArray(body)) {
            body.forEach((item) => {
                const result = this.getFinalVariables(item);
                variables.push(...result);
            });
        } else if (body?.declarations) {
            body.declarations.forEach((item) => {
                const result = this.getFinalVariables(item);
                variables.push(...result);
            });
        } else if (body?.init) {
            if (body.init.type === 'ClassExpression') {
                variables.push(...this.getFinalVariables(body.init));
            } else {
                const result = this.filterNodesWithType(
                    'VariableDeclarator',
                    body.init
                );
                if (result?.length > 0) {
                    variables.push(...this.getFinalVariables(result));
                }
            }
        }

        return variables;
    }

    static filterMemberExpression(item, body, parentValue, rootBody) {
        if (item.object) {
            return {
                object:
                    item.object.type === 'ThisExpression'
                        ? item.property || body.object
                        : item.object,
                property: body.property,
                parentValue,
                rootBody,
            };
        } else {
            return {
                object:
                    item.type === 'ThisExpression'
                        ? body.property || body.object
                        : parentValue.object,
                property: body.property,
                parentValue,
                rootBody,
            };
        }
    }

    static _filterObjectsNodeInMemberExpression(body, parentValue, rootBody) {
        const objects = [];
        const result = this.filterObjectsNode(body.object, body, parentValue);
        if (result.length > 0) {
            result.forEach((item) => {
                objects.push({
                    object:
                        item.object.type === 'ThisExpression'
                            ? item.property || body.object
                            : item.object,
                    property: body.property,
                    parentValue,
                    rootBody,
                });
            });
        } else {
            objects.push({
                object: body.object,
                property: body.property,
                parentValue,
                rootBody,
            });
        }

        return objects;
    }

    static filterObjectsNode(body, parentValue, rootBody) {
        const objects = [];
        if (!body) {
            return objects;
        }
        if (Array.isArray(body)) {
            for (const item of body) {
                const result = this.filterObjectsNode(item, body, parentValue);
                if (result) {
                    objects.push(...result);
                }
            }
        } else if (body.type === 'MemberExpression') {
            const result = this._filterObjectsNodeInMemberExpression(
                body,
                parentValue,
                rootBody
            );
            objects.push(...result);
        } else if (body.type === 'Identifier') {
            objects.push({ object: body, parentValue, rootBody });
        } else {
            for (const value of Object.values(body)) {
                const type = typeof value;
                if (value != null && type === 'object') {
                    const result = this.filterObjectsNode(
                        value,
                        body,
                        parentValue
                    );
                    if (result) {
                        objects.push(...result);
                    }
                }
            }
        }

        return objects;
    }

    static findObjectNode(body) {
        const objects = this.filterObjectsNode(body);
        return objects.length > 0 ? objects[0] : undefined;
    }

    static createVariableNewObject(varName, className, orderNumber) {
        return {
            start: orderNumber,
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: varName,
                    },
                    init: {
                        type: 'NewExpression',
                        callee: {
                            type: 'Identifier',
                            name: className,
                        },
                        arguments: [],
                    },
                },
            ],
            kind: 'const',
        };
    }

    static createSingleton(className, orderNumber) {
        return this.createVariableNewObject(
            `__${className}__singleton`,
            className,
            orderNumber + 200
        );
    }

    static getIndexForCodeMap(codeMap, start, isSum) {
        let index = start;
        while (codeMap.has(index)) {
            if (isSum) {
                index += 1;
            } else {
                index -= 1;
            }
        }
        return index;
    }
}

module.exports = { Util };
