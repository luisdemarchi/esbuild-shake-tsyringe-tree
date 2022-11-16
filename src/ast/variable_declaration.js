'use strict';
const jsEmitter = require('./jsemitter');
const ReplaceTsyringe = require('../util/replace_tsyringe');
const { Util } = require('../util/util');
class VariableDeclaration {
    constructor(imports, expressionStatement) {
        this.nodes = [];
        this.imports = imports;
        this.expressionStatement = expressionStatement;
        this.variables = [];
        this.allMethodsInClass = [];
        this.others = [];
        this.singletons = [];
        this.methodsUsingSingleton = [];
        this.replace = new ReplaceTsyringe(
            this.imports,
            this,
            this.expressionStatement
        );
    }

    push(node) {
        this.nodes.push(node);
    }

    execute() {
        node: for (const node of this.nodes) {
            let success = undefined;
            if (node.type === 'ClassDeclaration') {
                success = this.processClassExpressionType(
                    node,
                    node,
                    node.start
                );
                if (success) {
                    continue node;
                }
            } else {
                for (const declaration of node.declarations) {
                    success = this.handlerDeclaration(declaration, node);
                    if (success) {
                        continue node;
                    }
                }
            }

            this.replace.fromContainerResolveToNewObject(node);
            this.others.push(node);
        }

        this.methodsUsingSingleton.forEach((method) => {
            const singleton = this.singletons.find(
                (item) => item.name === method.singletonName
            );
            if (singleton.register.start > method.node.start) {
                method.node.start = singleton.register.start + 1;
            }
        });
        this.methodsUsingSingleton.forEach((method) => {
            this.others.push(method.node);
        });

        this.singletons.forEach((singleton) => {
            const isSingletonUsedSingleton =
                this.methodsUsingSingleton.findIndex(
                    (item) => item.className === singleton.className
                );
            singleton.register.start = singleton.node.start + 1;
            if (isSingletonUsedSingleton < 0) {
                this.others.push(singleton.node);
            }
            this.others.push(singleton.register);
        });

        this.removeUnusedFunctions();
    }

    handlerDeclaration(declaration, node) {
        let success = false;
        if (declaration.type === 'VariableDeclarator') {
            switch (declaration.init.type) {
                case 'MemberExpression':
                case 'Identifier':
                    success = this.processObjectNode(declaration, node);
                    break;
                case 'ClassExpression':
                    success = this.processClassExpressionType(
                        declaration,
                        node,
                        node.start
                    );
                    break;

                default:
                    break;
            }
            return success;
        }
    }

    getClassName(varName) {
        const result = this.variables.find((item) => item.id === varName);
        if (result) {
            return result.className;
        }

        return undefined;
    }

    processObjectNode(declaration, node) {
        const id = jsEmitter.literalOrIdetifier(declaration.id);

        const { object, property } = Util.findObjectNode(declaration.init);

        const originalName = this.imports.getOriginalName(object?.name);
        if (originalName) {
            const className = property
                ? `${originalName}${property.name}`
                : originalName;
            this.variables.push({
                order: node.start,
                id,
                className,
                node,
            });
            return true;
        }

        return undefined;
    }

    processClassExpressionType(declaration, node, nodeIndex) {
        let isSingleton = false;
        if (declaration.type === 'VariableDeclarator') {
            const className = jsEmitter.literalOrIdetifier(declaration.id);
            const action =
                this.expressionStatement.getRegisterActionWithClassName(
                    className
                );
            if (action === 'registerSingleton') {
                const singletonRegister = Util.createSingleton(
                    className,
                    nodeIndex
                );
                this.singletons.push({
                    className: className,
                    name: `__${className}__singleton`,
                    register: singletonRegister,
                    node,
                });
                isSingleton = true;
            }

            if (declaration.init.body.type === 'ClassBody') {
                const constructorValues =
                    this.expressionStatement.getConstructorValues(className);
                if (
                    constructorValues &&
                    constructorValues !== null &&
                    constructorValues.length > 0
                ) {
                    const constructor = declaration.init.body.body.find(
                        (item) => item.kind === 'constructor'
                    );
                    const result = this.handlerClassConstructor(
                        constructor,
                        constructorValues,
                        declaration,
                        node
                    );
                    if (result) {
                        return true;
                    }
                }
            }
        }

        return isSingleton;
    }

    handlerClassConstructor(constructor, constructorValues, declaration, node) {
        let usingSingleton = false;
        const params = constructor?.value?.params
            ? constructor.value.params.map((param) =>
                  jsEmitter.literalOrIdetifier(param)
              )
            : [];
        for (let index = 0; index < params.length; index++) {
            const param = params[index];

            const classLocalName = constructorValues[index];

            const replaced = this.replace.fromVariableToNewObject(
                param,
                classLocalName,
                constructor,
                declaration.init.body.body
            );

            if (!replaced) {
                const className =
                    this.expressionStatement.getRegisterClassName(
                        classLocalName
                    );

                const reference = Util.createVariableNewObject(
                    param,
                    className
                );
                const result = this.replace.handlerContainerRegister(
                    classLocalName,
                    className,
                    reference.declarations[0]
                );
                constructor.value.body.body.unshift(reference);
                if (result.name) {
                    this.methodsUsingSingleton.push({
                        className: declaration.id.name,
                        singletonName: result.name,
                        node,
                    });
                    usingSingleton = true;
                }
            }
        }
        if (params.length > 0) {
            constructor.value.params = [];
        }
        return usingSingleton;
    }

    removeUnusedFunctions() {
        let objects = this.catalogNewObject(this.others);
        objects = this.catalogObjectReference(this.others, objects);

        const nodes = [].concat(this.others, this.expressionStatement.others);
        const calls = this.catalogObjectCall(objects, nodes);

        const classes = Util.getAllClasses(this.others);

        let removed = false;

        for (const item of classes) {
            const { node } = item;
            const className = node.id?.name || node.temporaryId?.name;
            const methods = calls[className];
            if (methods) {
                const classBody = Util.filterNodesWithType('ClassBody', node);
                if (classBody?.length > 0) {
                    for (const [
                        index,
                        method,
                    ] of classBody[0].node.body.entries()) {
                        if (method.kind === 'constructor') {
                            const result =
                                this.removeUnusedNewObjectsInConstructor(
                                    method,
                                    objects,
                                    calls
                                );
                            if (result) {
                                removed = true;
                            }
                        } else if (!methods.includes(method.key.name)) {
                            classBody[0].node.body.splice(index, 1);
                            removed = true;
                        }
                    }
                }
            }
        }

        if (removed) {
            this.removeUnusedFunctions();
        }
    }

    removeUnusedNewObjectsInConstructor(method, objects, calls) {
        let removed = false;
        let funcIndex = 0;
        while (funcIndex < method.value.body.body.length) {
            const func = Util.filterNodesWithType(
                'MemberExpression',
                method.value.body.body[funcIndex]
            );

            const names = objects[func[0].node.property?.name];
            if (names) {
                for (const name of names) {
                    if (!calls[name]) {
                        method.value.body.body.splice(funcIndex, 1);

                        funcIndex -= 1;
                        removed = true;
                    }
                }
            }

            funcIndex += 1;
        }

        return removed;
    }

    catalogObjectCall(objects, body) {
        const calls = [];
        let classes = Util.getAllClasses(body);

        const separateFunctions = Util.filterNodesWithType(
            'ArrowFunctionExpression',
            body
        );
        classes = classes.concat(separateFunctions);

        for (const { node: nodeClass } of classes) {
            const activeClassName =
                nodeClass.id?.name || nodeClass.temporaryId?.name;
            const call = Util.filterNodesWithType(
                'MemberExpression',
                nodeClass
            );
            call.forEach((item) => {
                const { node } = item;
                this._catalogObjectCallWithProperty(node, calls, objects);
                if (
                    node.object.type === 'ThisExpression' &&
                    node.property?.name &&
                    activeClassName
                ) {
                    this._catalogObjectToAllFunctions(
                        calls,
                        [activeClassName],
                        node.property.name
                    );
                }
            });
        }

        return calls;
    }

    _catalogObjectToAllFunctions(calls, classes, property) {
        classes.forEach((className) => {
            if (calls[className]) {
                if (!calls[className].includes(property)) {
                    calls[className].push(property);
                }
            } else {
                calls[className] = [property];
            }
        });
    }

    _catalogObjectCallWithProperty(node, calls, objects) {
        if (node.object.type === 'MemberExpression') {
            this._catalogObjectCallWithProperty(node.object, calls, objects);
        }
        const variable = node.object?.name || node.object.property?.name;
        const property = node.property?.name;
        if (variable) {
            const classes = objects[variable];
            if (classes) {
                this._catalogObjectToAllFunctions(calls, classes, property);
            }
        }
    }

    catalogNewObject(body) {
        const objects = {};
        const call = Util.filterNodesWithType('NewExpression', body);

        if (call.length > 0) {
            call.forEach((item) => {
                const rootBody = item.declarationRoot;
                let key = '';
                if (rootBody?.type === 'VariableDeclaration') {
                    key = rootBody.declarations[0].id.name;
                } else if (
                    rootBody?.type === 'ExpressionStatement' &&
                    rootBody.expression.type === 'AssignmentExpression'
                ) {
                    const parentValue = rootBody.expression;
                    const body = parentValue.left;
                    const variable = Util.filterMemberExpression(
                        item,
                        body,
                        parentValue,
                        rootBody
                    );
                    key = variable.object?.name || variable.property?.name;
                }
                if (rootBody.expression || rootBody?.declarations) {
                    const callObjects = Util.filterObjectsNode(item.node);
                    callObjects.forEach((item) => {
                        if (key) {
                            const obj = objects[key] || [];
                            if (
                                item.object.name &&
                                !obj.includes(item.object.name)
                            ) {
                                obj.push(item.object.name);
                            }

                            objects[key] = obj;
                        }
                    });
                }
            });
        }
        return objects;
    }

    catalogObjectReference(body, objects) {
        let call = Util.filterNodesWithType('VariableDeclarator', body);
        call = call.filter((item) => item.node.init?.type === 'Identifier');
        call.forEach((item) => {
            const reference = objects[item.node.init.name];
            if (reference) {
                objects[item.node.id.name] = reference;
            }
        });

        return objects;
    }

    emitter(codeMap) {
        for (const node of this.others) {
            const index = Util.getIndexForCodeMap(codeMap, node.start, true);
            codeMap.set(index, jsEmitter.unmapped(node));
        }
        return codeMap;
    }
}
module.exports = VariableDeclaration;
