/**
 * This utility function could not be located at @schematics/angular/utility/validation
 */

import { SchematicsException } from '@angular-devkit/schematics';

// See: https://github.com/tc39/proposal-regexp-unicode-property-escapes/blob/fe6d07fad74cd0192d154966baa1e95e7cda78a1/README.md#other-examples
const ecmaIdentifierNameRegExp =
    /^(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*$/u;

export function validateClassName(className: string): void {
    if (!ecmaIdentifierNameRegExp.test(className)) {
        throw new SchematicsException(`Class name "${className}" is invalid.`);
    }
}
