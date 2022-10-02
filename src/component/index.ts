import { strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
    FileOperator,
    filter,
    forEach,
    mergeWith,
    move,
    noop,
    Rule,
    SchematicsException,
    Tree,
    url,
} from '@angular-devkit/schematics';
import {
    Schema as ComponentOptions,
    Style,
} from '@schematics/angular/component/schema';
import { findModuleFromOptions } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateHtmlSelector } from '@schematics/angular/utility/validation';
import {
    buildDefaultPath,
    getWorkspace,
} from '@schematics/angular/utility/workspace';
import { addDeclarationToNgModule } from '../utils/add-declaration-to-ng-module';

function buildSelector(options: ComponentOptions, projectPrefix: string) {
    let selector = strings.dasherize(options.name);
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    } else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }

    return selector;
}

export default function (options: ComponentOptions): Rule {
    options.style = Style.Scss;
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

        const parsedPath = parseName(options.path as string, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector =
            options.selector ||
            buildSelector(options, (project && project.prefix) || '');

        validateHtmlSelector(options.selector);

        const skipStyleFile =
            options.inlineStyle || options.style === Style.None;
        const templateSource = apply(url('./files'), [
            options.skipTests
                ? filter((path) => !path.endsWith('.spec.ts.template'))
                : noop(),
            skipStyleFile
                ? filter((path) => !path.endsWith('.__style__.template'))
                : noop(),
            options.inlineTemplate
                ? filter((path) => !path.endsWith('.html.template'))
                : noop(),
            applyTemplates({
                ...strings,
                'if-flat': (s: string) => (options.flat ? '' : s),
                ...options,
            }),
            !options.type
                ? forEach(((file) => {
                      return file.path.includes('..')
                          ? {
                                content: file.content,
                                path: file.path.replace('..', '.'),
                            }
                          : file;
                  }) as FileOperator)
                : noop(),
            move(parsedPath.path),
        ]);

        return chain([
            addDeclarationToNgModule({
                type: 'component',
                ...options,
            }),
            mergeWith(templateSource),
        ]);
    };
}
