import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as DirectiveOptions } from '@schematics/angular/directive/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('schematics/directive', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );

    const defaultOptions: DirectiveOptions = {
        name: 'foo',
        module: undefined,
        export: false,
        prefix: 'app',
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

    it('should create a directive', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner
            .runSchematicAsync('directive', options, appTree)
            .toPromise();
        const files = tree.files;
        expect(files).toContain('/projects/bar/src/app/foo.directive.spec.ts');
        expect(files).toContain('/projects/bar/src/app/foo.directive.ts');
        const moduleContent = tree.readContent(
            '/projects/bar/src/app/app.module.ts'
        );
        expect(moduleContent).toMatch(/import.*Foo.*from '.\/foo.directive'/);
        expect(moduleContent).toMatch(
            /declarations:\s*\[[^\]]+?,\r?\n\s+FooDirective\r?\n/m
        );
    });
});
