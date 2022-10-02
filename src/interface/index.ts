import { Rule } from '@angular-devkit/schematics';
import { Schema as InterfaceOptions } from '@schematics/angular/interface/schema';
import { generateFromFiles } from '@schematics/angular/utility/generate-from-files';

export default function (options: InterfaceOptions): Rule {
    options.type = options.type ? `.${options.type}` : '';

    return generateFromFiles(options);
}
