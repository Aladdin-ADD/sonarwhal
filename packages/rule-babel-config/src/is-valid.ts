/**
 * @fileoverview `babel-config/is-valid` warns against providing an invalid babel configuration file.
 */
import * as ajv from 'ajv';
import * as groupBy from 'lodash.groupby';
import * as map from 'lodash.map';

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';
import { IRule, RuleMetadata } from 'sonarwhal/dist/src/lib/types';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { RuleScope } from 'sonarwhal/dist/src/lib/enums/rulescope';

import { BabelConfigInvalid, BabelConfigInvalidSchema } from '@sonarwhal/parser-babel-config/dist/src/types';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */
export default class BabelConfigIsValidRule implements IRule {
    public static readonly meta: RuleMetadata = {
        docs: {
            category: Category.development,
            description: `'babel-config/is-valid' warns against providing an invalid babel configuration file \`.babelrc\``
        },
        id: 'babel-config/is-valid',
        schema: [],
        scope: RuleScope.local
    }

    public constructor(context: RuleContext) {
        const errorKeywords = {
            additionalProperties: 'additionalProperties',
            enum: 'enum',
            type: 'type'
        };

        /** Returns a readable error for 'additionalProperty' errors. */
        const generateAdditionalPropertiesError = (error: ajv.ErrorObject): string => {
            if (error.keyword !== errorKeywords.additionalProperties) {
                return null;
            }

            const property = error.dataPath.substr(1);
            const additionalProperty = (error.params as ajv.AdditionalPropertiesParams).additionalProperty;

            return `'${property}' ${error.message}. Additional property found '${additionalProperty}'.`;
        };

        /** Returns a readable error for 'enum' errors. */
        const generateEnumError = (error: ajv.ErrorObject): string => {
            if (error.keyword !== errorKeywords.enum) {
                return null;
            }

            const property = error.dataPath.substr(1);
            const allowedValues = (error.params as ajv.EnumParams).allowedValues;

            return `'${property}' ${error.message} '${allowedValues.join(', ')}'. Value found '${error.data}'`;
        };

        const generateTypeError = (error: ajv.ErrorObject) => {
            if (error.keyword !== errorKeywords.type) {
                return null;
            }

            const property = error.dataPath.substr(1);

            return `'${property}' ${error.message.replace(/"/g, '\'')}.`;
        };

        const errorGenerators: Array<((error: ajv.ErrorObject) => string)> = [generateAdditionalPropertiesError, generateEnumError, generateTypeError];

        /** Returns a readable error message. */
        const prettyfy = (error: ajv.ErrorObject): string => {
            return errorGenerators.reduce((message, generator) => {
                const newErrorMessage: string = generator(error);

                if (newErrorMessage) {
                    return newErrorMessage;
                }

                return message;
            }, error.message);
        };

        /** Report all the validation errors received. */
        const report = async (errors: Array<ajv.ErrorObject>, resource: string) => {
            for (const error of errors) {
                await context.report(resource, null, prettyfy(error));
            }
        };

        const invalidJSONFile = async (babelConfigInvalid: BabelConfigInvalid) => {
            const { error, resource } = babelConfigInvalid;

            debug(`parse::babel-config::error::json received`);

            await context.report(resource, null, error.message);
        };

        const invalidSchema = async (fetchEnd: BabelConfigInvalidSchema) => {
            const { errors, resource } = fetchEnd;

            debug(`parse::babel-config::error::schema received`);

            const grouped: _.Dictionary<Array<ajv.ErrorObject>> = groupBy(errors, 'dataPath');
            const promises = map(grouped, (values) => {
                return report(values, resource);
            });

            await Promise.all(promises);
        };

        context.on('parse::babel-config::error::json', invalidJSONFile);
        context.on('parse::babel-config::error::schema', invalidSchema);
    }
}
