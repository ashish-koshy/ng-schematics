import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as GuardOptions } from '@schematics/angular/guard/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('Guard Schematic', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );
    const defaultOptions: GuardOptions = {
        name: 'foo',
        flat: true,
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
        skipTests: false,
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

    it('should create a guard', async () => {
        const tree = await schematicRunner
            .runSchematicAsync('guard', defaultOptions, appTree)
            .toPromise();
        const files = tree.files;
        expect(files).toContain('/projects/bar/src/app/foo.guard.spec.ts');
        expect(files).toContain('/projects/bar/src/app/foo.guard.ts');
    });
});
