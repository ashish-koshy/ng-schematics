import { strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
    filter,
    mergeWith,
    move,
    noop,
    Rule,
    Tree,
    url,
} from '@angular-devkit/schematics';
import { Schema as PipeOptions } from '@schematics/angular/pipe/schema';
import { findModuleFromOptions } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { createDefaultPath } from '@schematics/angular/utility/workspace';
import { addDeclarationToNgModule } from '../utils/add-declaration-to-ng-module';
import { validateClassName } from '../utils/validate-class-name';

export default function (options: PipeOptions): Rule {
    return async (host: Tree) => {
        options.path ??= await createDefaultPath(
            host,
            options.project as string
        );
        options.module = findModuleFromOptions(host, options);

        const parsedPath = parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        validateClassName(strings.classify(options.name));

        const templateSource = apply(url('./files'), [
            options.skipTests
                ? filter((path) => !path.endsWith('.spec.ts.template'))
                : noop(),
            applyTemplates({
                ...strings,
                'if-flat': (s: string) => (options.flat ? '' : s),
                ...options,
            }),
            move(parsedPath.path),
        ]);

        return chain([
            addDeclarationToNgModule({
                type: 'pipe',

                ...options,
            }),
            mergeWith(templateSource),
        ]);
    };
}
