import { Rule } from '@angular-devkit/schematics';
import { Schema as ClassOptions } from '@schematics/angular/class/schema';
import { generateFromFiles } from '@schematics/angular/utility/generate-from-files';

export default function (options: ClassOptions): Rule {
    options.type = options.type ? `.${options.type}` : '';

    return generateFromFiles(options);
}
