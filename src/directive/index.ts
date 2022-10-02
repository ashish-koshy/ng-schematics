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
    SchematicsException,
    Tree,
    url,
} from '@angular-devkit/schematics';
import { Schema as DirectiveOptions } from '@schematics/angular/directive/schema';
import { findModuleFromOptions } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateHtmlSelector } from '@schematics/angular/utility/validation';
import {
    buildDefaultPath,
    getWorkspace,
} from '@schematics/angular/utility/workspace';
import { addDeclarationToNgModule } from '../utils/add-declaration-to-ng-module';

function buildSelector(options: DirectiveOptions, projectPrefix: string) {
    let selector = options.name;
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    } else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }

    return strings.camelize(selector);
}

export default function (options: DirectiveOptions): Rule {
    return async (host: Tree) => {
        const workspace = await getWorkspace(host);
        const project = workspace.projects.get(options.project as string);
        if (!project) {
            throw new SchematicsException(
                `Project "${options.project}" does not exist.`
            );
        }

        if (options.path === undefined) {
            options.path = buildDefaultPath(project);
        }

        options.module = findModuleFromOptions(host, options);

        const parsedPath = parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector =
            options.selector || buildSelector(options, project.prefix || '');

        options.selector && validateHtmlSelector(options.selector);

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
                type: 'directive',

                ...options,
            }),
            mergeWith(templateSource),
        ]);
    };
}
