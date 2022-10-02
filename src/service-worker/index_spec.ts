import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as ServiceWorkerOptions } from '@schematics/angular/service-worker/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('Service Worker Schematic', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );
    const defaultOptions: ServiceWorkerOptions = {
        project: 'bar',
        target: 'build',
    };

    let appTree: UnitTestTree;

    const workspaceOptions: WorkspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
    };

    const appOptions: ApplicationOptions = {
        name: 'bar',
        inlineStyle: false,
        inlineTemplate: false,
        routing: false,
        skipTests: false,
        skipPackageJson: false,
    };

    beforeEach(async () => {
        appTree = await schematicRunner
            .runSchematicAsync('workspace', workspaceOptions)
            .toPromise();
        appTree = await schematicRunner
            .runSchematicAsync('application', appOptions, appTree)
            .toPromise();
    });

    it('should add `serviceWorker` option to build target', async () => {
        const tree = await schematicRunner
            .runSchematicAsync('service-worker', defaultOptions, appTree)
            .toPromise();
        const configText = tree.readContent('/angular.json');
        const buildConfig = JSON.parse(configText).projects.bar.architect.build;

        expect(buildConfig.options.serviceWorker).toBeTrue();
    });
});
