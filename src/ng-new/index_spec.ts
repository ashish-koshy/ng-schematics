import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Schema as NgNewOptions } from '@schematics/angular/ng-new/schema';

describe('Ng New Schematic', () => {
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        require.resolve('../collection.json')
    );
    const defaultOptions: NgNewOptions = {
        name: 'foo',
        directory: 'bar',
        version: '6.0.0',
    };

    it('should create files of a workspace', async () => {
        const options = { ...defaultOptions };

        const tree = await schematicRunner
            .runSchematicAsync('ng-new', options)
            .toPromise();
        const files = tree.files;
        expect(files).toContain('/bar/angular.json');
    });
});
