import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as InterfaceOptions } from '@schematics/angular/interface/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('Interface Schematic', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );
    const defaultOptions: InterfaceOptions = {
        name: 'foo',
        prefix: '',
        type: '',
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

    it('should create one file', async () => {
        const tree = await schematicRunner
            .runSchematicAsync('interface', defaultOptions, appTree)
            .toPromise();
        expect(tree.files).toContain('/projects/bar/src/app/foo.ts');
    });
});
