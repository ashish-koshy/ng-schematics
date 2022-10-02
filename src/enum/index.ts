import { Rule } from '@angular-devkit/schematics';
import { Schema as EnumOptions } from '@schematics/angular/enum/schema';
import { generateFromFiles } from '@schematics/angular/utility/generate-from-files';

export default function (options: EnumOptions): Rule {
    options.type = options.type ? `.${options.type}` : '';

    return generateFromFiles(options);
}
