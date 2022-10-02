import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import {
    Schema as ApplicationOptions,
} from '@schematics/angular/application/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('schematics/application', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );

    const workspaceOptions: WorkspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
    };

    const defaultOptions: ApplicationOptions = {
        name: 'foo',
        routing: false,
        skipPackageJson: false,
    };

    let workspaceTree: UnitTestTree;
    beforeEach(async () => {
        workspaceTree = await schematicRunner
            .runSchematicAsync('workspace', workspaceOptions)
            .toPromise();
    });

    it('should create all files of an application', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner
            .runSchematicAsync('application', options, workspaceTree)
            .toPromise();
        const files = tree.files;
        expect(files).toEqual(
            jasmine.arrayContaining([
                '/projects/foo/tsconfig.app.json',
                '/projects/foo/tsconfig.spec.json',
                '/projects/foo/src/favicon.ico',
                '/projects/foo/src/index.html',
                '/projects/foo/src/main.ts',
                '/projects/foo/src/styles.scss',
                '/projects/foo/src/app/app.module.ts',
                '/projects/foo/src/app/app.component.html',
                '/projects/foo/src/app/app.component.spec.ts',
                '/projects/foo/src/app/app.component.ts',
                '/projects/foo/src/app/app.component.scss',
            ])
        );
    });
});
