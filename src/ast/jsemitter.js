'use strict';

const { generate } = require('astring');

class JSEmitter {
    // visitUnaryExpression(node) {
    //     if(node.operator === '~' ||
    //         node.operator === '-' ||
    //         node.operator === '+') {
    //         return node.operator + this.visitNode(node.argument);
    //     }
    //     return '(' + node.operator + ' ' + this.visitNode(node.argument) + ')';
    // }
    // visitThisExpression() {
    //     return 'this';
    // }
    // visitObjectExpression(node) {
    //     const props = node.properties;
    //     const ret = [];
    //     for(let i = 0, len = props.length; i < len; ++i) {
    //         const prop = props[i];
    //         ret.push(this.visitNode(prop.key) + ': ' + this.visitNode(prop.value));
    //     }
    //     return '({' + ret.join(',\n') + '})';
    // }
    // NewExpression(node) {
    //     return 'new ' + this.visitNode(node.callee) + '(' + this.visitNode(node.arguments) + ')';
    // }
    // visitVariableDeclaration(node) {
    //     let str = '';
    //     str += node.kind + ' ';
    //     str += this.visitNodes(node.declarations);
    //     return str + '\n';
    // }
    // visitVariableDeclarator(node, kind) {
    //     let str = '';
    //     str += kind ? kind + ' ' : str;
    //     str += this.visitNode(node.id);
    //     str += '=';
    //     str += this.visitNode(node.init);
    //     return `${str};\n`;
    // }
    // visitMemberExpression(node) {
    //     if(node.computed) {
    //         return this.visitNode(node.object) + '[' + this.visitNode(node.property) + ']';
    //     } else {
    //         return this.visitNode(node.object) + '.' + this.visitNode(node.property);
    //     }
    // }
    // visitIdentifier(node) {
    //     return node.name;
    // }
    static unmapped(node) {
        if (node) {
            return generate(node);
        }
    }
    static literalOrIdetifier(node) {
        if (node?.type !== 'Literal' && node?.type !== 'Identifier') {
            return '';
        }
        return node.value || node.name || node.raw;
    }

    visitCallExpression(node) {
        let str = '';
        const callee = this.visitIdentifier(node.callee);
        str += callee + '(';
        for (const arg of node.arguments) {
            str += this.visitNode(arg) + ',';
        }
        str = str.slice(0, str.length - 1);
        str += ');';
        return str + '\n';
    }

    visitNode(node) {
        let str = '';
        switch (node.type) {
            case 'Literal':
                str += this.literalOrIdetifier(node);
                break;
            case 'ImportSpecifier':
                str += this.visitImportSpecifier(node);
                break;
            default:
                break;
        }
        return str;
    }

    run(body) {
        let str = '';
        str += this.visitNodes(body);
        return str;
    }
}
module.exports = JSEmitter;
