import { join, JsonObject, normalize, strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
    filter,
    MergeStrategy,
    mergeWith,
    move,
    noop,
    Rule,
    schematic,
    SchematicContext,
    Tree,
    url,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { Schema as ComponentOptions } from '@schematics/angular/component/schema';
import {
    addPackageJsonDependency,
    NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import { latestVersions } from '@schematics/angular/utility/latest-versions';
import { relativePathToWorkspaceRoot } from '@schematics/angular/utility/paths';
import {
    getWorkspace,
    updateWorkspace,
} from '@schematics/angular/utility/workspace';
import {
    Builders,
    ProjectType,
} from '@schematics/angular/utility/workspace-models';

import {
    Schema as ApplicationOptions,
    Style,
} from '@schematics/angular/application/schema';

function addDependenciesToPackageJson(options: ApplicationOptions) {
    return (host: Tree, context: SchematicContext) => {
        [
            {
                type: NodeDependencyType.Dev,
                name: '@angular/compiler-cli',
                version: latestVersions.Angular,
            },
            {
                type: NodeDependencyType.Dev,
                name: '@angular-devkit/build-angular',
                version: latestVersions.DevkitBuildAngular,
            },
            {
                type: NodeDependencyType.Dev,
                name: 'typescript',
                version: latestVersions['typescript'],
            },
        ].forEach((dependency) => addPackageJsonDependency(host, dependency));

        if (!options.skipInstall) {
            context.addTask(new NodePackageInstallTask());
        }

        return host;
    };
}

function addAppToWorkspaceFile(
    options: ApplicationOptions,
    appDir: string,
    folderName: string
): Rule {
    options.style = Style.Scss;
    let projectRoot = appDir;
    if (projectRoot) {
        projectRoot += '/';
    }

    const schematics: JsonObject = {};

    if (
        options.inlineTemplate ||
        options.inlineStyle ||
        options.minimal ||
        options.style !== Style.Scss
    ) {
        const componentSchematicsOptions: JsonObject = {};
        if (options.inlineTemplate ?? options.minimal) {
            componentSchematicsOptions.inlineTemplate = true;
        }
        if (options.inlineStyle ?? options.minimal) {
            componentSchematicsOptions.inlineStyle = true;
        }
        if (options.style && options.style !== Style.Scss) {
            componentSchematicsOptions.style = options.style;
        }

        schematics['@schematics/angular:component'] =
            componentSchematicsOptions;
    }

    if (options.skipTests || options.minimal) {
        const schematicsWithTests = [
            'class',
            'component',
            'directive',
            'guard',
            'interceptor',
            'pipe',
            'resolver',
            'service',
        ];

        schematicsWithTests.forEach((type) => {
            if (!(`@schematics/angular:${type}` in schematics)) {
                schematics[`@schematics/angular:${type}`] = {};
            }
            (
                schematics[`@schematics/angular:${type}`] as JsonObject
            ).skipTests = true;
        });
    }

    const sourceRoot = join(normalize(projectRoot), 'src');
    let budgets = [];
    if (options.strict) {
        budgets = [
            {
                type: 'initial',
                maximumWarning: '500kb',
                maximumError: '1mb',
            },
            {
                type: 'anyComponentStyle',
                maximumWarning: '2kb',
                maximumError: '4kb',
            },
        ];
    } else {
        budgets = [
            {
                type: 'initial',
                maximumWarning: '2mb',
                maximumError: '5mb',
            },
            {
                type: 'anyComponentStyle',
                maximumWarning: '6kb',
                maximumError: '10kb',
            },
        ];
    }

    const inlineStyleLanguage =
        options?.style !== Style.Scss ? options.style : undefined;

    const project = {
        root: normalize(projectRoot),
        sourceRoot,
        projectType: ProjectType.Application,
        prefix: options.prefix || 'app',
        schematics,
        targets: {
            build: {
                builder: Builders.Browser,
                defaultConfiguration: 'production',
                options: {
                    outputPath: `dist/${folderName}`,
                    index: `${sourceRoot}/index.html`,
                    main: `${sourceRoot}/main.ts`,
                    polyfills: ['zone.js'],
                    tsConfig: `${projectRoot}tsconfig.app.json`,
                    inlineStyleLanguage,
                    assets: [
                        `${sourceRoot}/favicon.ico`,
                        `${sourceRoot}/assets`,
                    ],
                    styles: [`${sourceRoot}/styles.${options.style}`],
                    scripts: [],
                },
                configurations: {
                    production: {
                        budgets,
                        outputHashing: 'all',
                    },
                    development: {
                        buildOptimizer: false,
                        optimization: false,
                        vendorChunk: true,
                        extractLicenses: false,
                        sourceMap: true,
                        namedChunks: true,
                    },
                },
            },
            serve: {
                builder: Builders.DevServer,
                defaultConfiguration: 'development',
                options: {},
                configurations: {
                    production: {
                        browserTarget: `${options.name}:build:production`,
                    },
                    development: {
                        browserTarget: `${options.name}:build:development`,
                    },
                },
            },
            'extract-i18n': {
                builder: Builders.ExtractI18n,
                options: {
                    browserTarget: `${options.name}:build`,
                },
            },
            test: options.minimal
                ? undefined
                : {
                      builder: Builders.Karma,
                      options: {
                          polyfills: ['zone.js', 'zone.js/testing'],
                          tsConfig: `${projectRoot}tsconfig.spec.json`,
                          inlineStyleLanguage,
                          assets: [
                              `${sourceRoot}/favicon.ico`,
                              `${sourceRoot}/assets`,
                          ],
                          styles: [`${sourceRoot}/styles.${options.style}`],
                          scripts: [],
                      },
                  },
        },
    };

    return updateWorkspace((workspace) => {
        workspace.projects.add({
            name: options.name,
            ...project,
        });
    });
}
function minimalPathFilter(path: string): boolean {
    return !path.endsWith('tsconfig.spec.json.template');
}

export default function (options: ApplicationOptions): Rule {
    return async (host: Tree) => {
        const appRootSelector = `${options.prefix}-root`;
        const componentOptions: Partial<ComponentOptions> = !options.minimal
            ? {
                  inlineStyle: options.inlineStyle,
                  inlineTemplate: options.inlineTemplate,
                  skipTests: options.skipTests,
                  style: options.style,
                  viewEncapsulation: options.viewEncapsulation,
              }
            : {
                  inlineStyle: options.inlineStyle ?? true,
                  inlineTemplate: options.inlineTemplate ?? true,
                  skipTests: true,
                  style: options.style,
                  viewEncapsulation: options.viewEncapsulation,
              };

        const workspace = await getWorkspace(host);
        const newProjectRoot =
            (workspace.extensions.newProjectRoot as string | undefined) || '';
        const isRootApp = options.projectRoot !== undefined;

        // If scoped project (i.e. "@foo/bar"), convert dir to "foo/bar".
        let folderName = options.name.startsWith('@')
            ? options.name.slice(1)
            : options.name;
        if (/[A-Z]/.test(folderName)) {
            folderName = strings.dasherize(folderName);
        }

        const appDir = isRootApp
            ? normalize(options.projectRoot || '')
            : join(normalize(newProjectRoot), folderName);
        const sourceDir = `${appDir}/src/app`;

        return chain([
            addAppToWorkspaceFile(options, appDir, folderName),
            mergeWith(
                apply(url('./files'), [
                    options.minimal ? filter(minimalPathFilter) : noop(),
                    applyTemplates({
                        utils: strings,
                        ...options,
                        relativePathToWorkspaceRoot:
                            relativePathToWorkspaceRoot(appDir),
                        appName: options.name,
                        isRootApp,
                        folderName,
                    }),
                    move(appDir),
                ]),
                MergeStrategy.Overwrite
            ),
            schematic('module', {
                name: 'app',
                commonModule: false,
                flat: true,
                routing: options.routing,
                routingScope: 'Root',
                path: sourceDir,
                project: options.name,
            }),
            schematic('component', {
                name: 'app',
                selector: appRootSelector,
                flat: true,
                path: sourceDir,
                skipImport: true,
                project: options.name,
                ...componentOptions,
            }),
            mergeWith(
                apply(url('./other-files'), [
                    options.strict
                        ? noop()
                        : filter((path) => path !== '/package.json.template'),
                    componentOptions.inlineTemplate
                        ? filter((path) => !path.endsWith('.html.template'))
                        : noop(),
                    componentOptions.skipTests
                        ? filter((path) => !path.endsWith('.spec.ts.template'))
                        : noop(),
                    applyTemplates({
                        utils: strings,
                        ...options,
                        selector: appRootSelector,
                        ...componentOptions,
                    }),
                    move(sourceDir),
                ]),
                MergeStrategy.Overwrite
            ),
            options.skipPackageJson
                ? noop()
                : addDependenciesToPackageJson(options),
        ]);
    };
}
