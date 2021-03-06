import * as path from 'path';

import * as ruleRunner from 'sonarwhal/dist/tests/helpers/rule-runner';
import { RuleLocalTest } from 'sonarwhal/dist/tests/helpers/rule-test-type';

const ruleName = 'typescript-config/is-valid';

const tests: Array<RuleLocalTest> = [
    {
        name: 'Valid configuration should pass',
        path: path.join(__dirname, 'fixtures', 'valid')
    },
    {
        name: `If there is no config file, it should pass`,
        path: path.join(__dirname, 'fixtures', 'noconfig')
    },
    {
        name: 'Invalid configuration should fail',
        path: path.join(__dirname, 'fixtures', 'invalidjson'),
        reports: [{ message: `Unexpected token ' in JSON at position 148` }]
    },
    {
        name: 'Invalid configuration should fail',
        path: path.join(__dirname, 'fixtures', 'invalidschemaenum'),
        reports: [{ message: `'compilerOptions.lib[3]' should be equal to one of the allowed values 'es5, es6, es2015, es7, es2016, es2017, es2018, esnext, dom, dom.iterable, webworker, scripthost, es2015.core, es2015.collection, es2015.generator, es2015.iterable, es2015.promise, es2015.proxy, es2015.reflect, es2015.symbol, es2015.symbol.wellknown, es2016.array.include, es2017.object, es2017.sharedmemory, es2017.typedarrays, esnext.array, esnext.asynciterable, esnext.promise'. Value found 'invalidlib'` }]
    },
    {
        name: 'If schema has additional properties, it should fail',
        path: path.join(__dirname, 'fixtures', 'invalidschemaadditional'),
        reports: [{ message: `'compilerOptions' should NOT have additional properties. Additional property found 'invalidProperty'.` }]
    },
    {
        name: 'If schema has an invalid pattern, it should fail',
        path: path.join(__dirname, 'fixtures', 'invalidschemapattern'),
        reports: [
            { message: `'compilerOptions.target' should be equal to one of the allowed values 'es3, es5, es6, es2015, es2016, es2017, esnext'. Value found 'invalid'` },
            { message: `'compilerOptions.target' should match pattern '^([eE][sS]([356]|(201[567])|[nN][eE][xX][tT]))$'. Value found 'invalid'` },
            { message: `'compilerOptions.target' should be equal to one of the allowed values 'es3, es5, es6, es2015, es2016, es2017, esnext'. Value found 'invalid' or 'compilerOptions.target' should match pattern '^([eE][sS]([356]|(201[567])|[nN][eE][xX][tT]))$'. Value found 'invalid'` }
        ]
    }
];

ruleRunner.testLocalRule(ruleName, tests, {parsers: ['typescript-config']});
