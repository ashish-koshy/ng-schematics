import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as ServiceOptions } from '@schematics/angular/pipe/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('schematics/service', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );
    const defaultOptions: ServiceOptions = {
        name: 'foo',
        flat: false,
        project: 'bar',
    };

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
        skipPackageJson: false,
    };
    let appTree: UnitTestTree;
    beforeEach(async () => {
        appTree = await schematicRunner
            .runSchematicAsync('workspace', workspaceOptions)
            .toPromise();
        appTree = await schematicRunner
            .runSchematicAsync('application', appOptions, appTree)
            .toPromise();
    });

    it('should create a service', async () => {
        const options = { ...defaultOptions };
        const tree = await schematicRunner
            .runSchematicAsync('service', options, appTree)
            .toPromise();
        const files = tree.files;
        expect(files).toContain(
            '/projects/bar/src/app/foo/foo.service.spec.ts'
        );
        expect(files).toContain('/projects/bar/src/app/foo/foo.service.ts');
    });
});
