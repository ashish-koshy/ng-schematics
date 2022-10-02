import {
    SchematicTestRunner,
    UnitTestTree,
} from '@angular-devkit/schematics/testing';
import {
    Schema as ApplicationOptions,
    Style as AppStyle,
} from '@schematics/angular/application/schema';
import {
    ChangeDetection,
    Schema as ComponentOptions,
} from '@schematics/angular/component/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

describe('schematics/component', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );
    const defaultOptions: ComponentOptions = {
        name: 'foo',
        inlineStyle: false,
        inlineTemplate: false,
        displayBlock: false,
        changeDetection: ChangeDetection.Default,
        style: AppStyle.Scss,
        type: 'Component',
        skipTests: false,
        module: undefined,
        export: false,
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
        style: AppStyle.Scss,
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
    it('should create a component', async () => {
        const options = { ...defaultOptions };
        const tree = await schematicRunner
            .runSchematicAsync('component', options, appTree)
            .toPromise();
        const files = tree.files;
        expect(files).toEqual(
            jasmine.arrayContaining([
                '/projects/bar/src/app/foo/foo.component.scss',
                '/projects/bar/src/app/foo/foo.component.html',
                '/projects/bar/src/app/foo/foo.component.spec.ts',
                '/projects/bar/src/app/foo/foo.component.ts',
            ])
        );
        const moduleContent = tree.readContent(
            '/projects/bar/src/app/app.module.ts'
        );
        expect(moduleContent).toMatch(
            /import.*Foo.*from '.\/foo\/foo.component'/
        );
        expect(moduleContent).toMatch(
            /declarations:\s*\[[^\]]+?,\r?\n\s+FooComponent\r?\n/m
        );
    });
});
