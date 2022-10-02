import { join, normalize, strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
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
import { Schema as LibraryOptions } from '@schematics/angular/library/schema';
import {
    addPackageJsonDependency,
    NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import { JSONFile } from '@schematics/angular/utility/json-file';
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

function updateTsConfig(packageName: string, ...paths: string[]) {
    return (host: Tree) => {
        if (!host.exists('tsconfig.json')) {
            return host;
        }

        const file = new JSONFile(host, 'tsconfig.json');
        const jsonPath = ['compilerOptions', 'paths', packageName];
        const value = file.get(jsonPath);
        file.modify(
            jsonPath,
            Array.isArray(value) ? [...value, ...paths] : paths
        );
    };
}

function addDependenciesToPackageJson() {
    return (host: Tree) => {
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
                name: 'ng-packagr',
                version: latestVersions['ng-packagr'],
            },
            {
                type: NodeDependencyType.Default,
                name: 'tslib',
                version: latestVersions['tslib'],
            },
            {
                type: NodeDependencyType.Dev,
                name: 'typescript',
                version: latestVersions['typescript'],
            },
        ].forEach((dependency) => addPackageJsonDependency(host, dependency));

        return host;
    };
}

function addLibToWorkspaceFile(
    options: LibraryOptions,
    projectRoot: string,
    projectName: string
): Rule {
    return updateWorkspace((workspace) => {
        workspace.projects.add({
            name: projectName,
            root: projectRoot,
            sourceRoot: `${projectRoot}/src`,
            projectType: ProjectType.Library,
            prefix: options.prefix,
            targets: {
                build: {
                    builder: Builders.NgPackagr,
                    defaultConfiguration: 'production',
                    options: {
                        project: `${projectRoot}/ng-package.json`,
                    },
                    configurations: {
                        production: {
                            tsConfig: `${projectRoot}/tsconfig.lib.prod.json`,
                        },
                        development: {
                            tsConfig: `${projectRoot}/tsconfig.lib.json`,
                        },
                    },
                },
                test: {
                    builder: Builders.Karma,
                    options: {
                        tsConfig: `${projectRoot}/tsconfig.spec.json`,
                        polyfills: ['zone.js', 'zone.js/testing'],
                    },
                },
            },
        });
    });
}

export default function (options: LibraryOptions): Rule {
    return async (host: Tree) => {
        const prefix = options.prefix;

        // If scoped project (i.e. "@foo/bar"), convert projectDir to "foo/bar".
        const packageName = options.name;
        if (/^@.*\/.*/.test(options.name)) {
            const [, name] = options.name.split('/');
            options.name = name;
        }

        const workspace = await getWorkspace(host);
        const newProjectRoot =
            (workspace.extensions.newProjectRoot as string | undefined) || '';

        let folderName = packageName.startsWith('@')
            ? packageName.slice(1)
            : packageName;
        if (/[A-Z]/.test(folderName)) {
            folderName = strings.dasherize(folderName);
        }

        const projectRoot = join(normalize(newProjectRoot), folderName);
        const distRoot = `dist/${folderName}`;
        const sourceDir = `${projectRoot}/src/lib`;

        const templateSource = apply(url('./files'), [
            applyTemplates({
                ...strings,
                ...options,
                packageName,
                projectRoot,
                distRoot,
                relativePathToWorkspaceRoot:
                    relativePathToWorkspaceRoot(projectRoot),
                prefix,
                angularLatestVersion: latestVersions.Angular.replace(
                    /~|\^/,
                    ''
                ),
                tsLibLatestVersion: latestVersions['tslib'].replace(/~|\^/, ''),
                folderName,
            }),
            move(projectRoot),
        ]);

        return chain([
            mergeWith(templateSource),
            addLibToWorkspaceFile(options, projectRoot, packageName),
            options.skipPackageJson ? noop() : addDependenciesToPackageJson(),
            options.skipTsConfig
                ? noop()
                : updateTsConfig(packageName, distRoot),
            schematic('module', {
                name: options.name,
                commonModule: false,
                flat: true,
                path: sourceDir,
                project: packageName,
            }),
            schematic('component', {
                name: options.name,
                selector: `${prefix}-${options.name}`,
                inlineStyle: true,
                inlineTemplate: true,
                flat: true,
                path: sourceDir,
                export: true,
                project: packageName,
            }),
            schematic('service', {
                name: options.name,
                flat: true,
                path: sourceDir,
                project: packageName,
            }),
            (_tree: Tree, context: SchematicContext) => {
                if (!options.skipPackageJson && !options.skipInstall) {
                    context.addTask(new NodePackageInstallTask());
                }
            },
        ]);
    };
}
