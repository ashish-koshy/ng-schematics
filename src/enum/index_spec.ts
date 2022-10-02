import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as EnumOptions } from '@schematics/angular/enum/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('Enum Schematic', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );
    const defaultOptions: EnumOptions = {
        name: 'foo',
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

    it('should create an enumeration', async () => {
        const tree = await schematicRunner
            .runSchematicAsync('enum', defaultOptions, appTree)
            .toPromise();
        const files = tree.files;
        expect(files).toContain('/projects/bar/src/app/foo.ts');
    });
});
