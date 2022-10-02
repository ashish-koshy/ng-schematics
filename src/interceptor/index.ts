import { Rule } from '@angular-devkit/schematics';
import { Schema as InterceptorOptions } from '@schematics/angular/interceptor/schema';
import { generateFromFiles } from '@schematics/angular/utility/generate-from-files';

export default function (options: InterceptorOptions): Rule {
    // This schematic uses an older method to implement the flat option
    const flat = options.flat;
    options.flat = true;

    return generateFromFiles(options, {
        'if-flat': (s: string) => (flat ? '' : s),
    });
}
