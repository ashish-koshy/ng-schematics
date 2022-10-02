import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as GenerateLibrarySchema } from '@schematics/angular/library/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('schematics/library', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );

    const defaultOptions: GenerateLibrarySchema = {
        name: 'foo',
        entryFile: 'my-index',
        skipPackageJson: false,
        skipTsConfig: false,
        skipInstall: false,
    };
    const workspaceOptions: WorkspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
    };

    let workspaceTree: UnitTestTree;
    beforeEach(async () => {
        workspaceTree = await schematicRunner
            .runSchematicAsync('workspace', workspaceOptions)
            .toPromise();
    });

    it('should create files', async () => {
        const tree = await schematicRunner
            .runSchematicAsync('library', defaultOptions, workspaceTree)
            .toPromise();
        const files = tree.files;
        expect(files).toEqual(
            jasmine.arrayContaining([
                '/projects/foo/ng-package.json',
                '/projects/foo/package.json',
                '/projects/foo/README.md',
                '/projects/foo/tsconfig.lib.json',
                '/projects/foo/tsconfig.lib.prod.json',
                '/projects/foo/src/my-index.ts',
                '/projects/foo/src/lib/foo.module.ts',
                '/projects/foo/src/lib/foo.component.spec.ts',
                '/projects/foo/src/lib/foo.component.ts',
                '/projects/foo/src/lib/foo.service.spec.ts',
                '/projects/foo/src/lib/foo.service.ts',
            ])
        );
    });

    it('should use default value for baseDir and entryFile', async () => {
        const tree = await schematicRunner
            .runSchematicAsync(
                'library',
                {
                    name: 'foobar',
                },
                workspaceTree
            )
            .toPromise();
        expect(tree.files).toContain('/projects/foobar/src/public-api.ts');
    });
});
