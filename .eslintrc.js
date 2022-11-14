'use strict';

module.exports = {
    extends: '@hughescr/eslint-config-default',
    rules: {
        'no-sync': 'off',
        'lodash/prefer-lodash-method': 'off',
        'keyword-spacing': 'off',
        'lodash/prefer-constant': 'off',
        'sonarjs/cognitive-complexity': ['error', 25],
    },
    env: {
        jest: true,
    },
};
