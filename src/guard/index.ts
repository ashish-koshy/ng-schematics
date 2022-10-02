import { Rule, SchematicsException } from '@angular-devkit/schematics';
import {
    Implement as GuardInterface,
    Schema as GuardOptions,
} from '@schematics/angular/guard/schema';
import { generateFromFiles } from '@schematics/angular/utility/generate-from-files';

export default function (options: GuardOptions): Rule {
    if (!options.implements) {
        throw new SchematicsException('Option "implements" is required.');
    }

    const implementations = options.implements
        .map((implement: string) =>
            implement === 'CanDeactivate' ? 'CanDeactivate<unknown>' : implement
        )
        .join(', ');
    const commonRouterNameImports = [
        'ActivatedRouteSnapshot',
        'RouterStateSnapshot',
    ];
    const routerNamedImports: string[] = [...options.implements, 'UrlTree'];

    if (options.implements.includes(GuardInterface.CanLoad)) {
        routerNamedImports.push('Route', 'UrlSegment');

        if (options.implements.length > 1) {
            routerNamedImports.push(...commonRouterNameImports);
        }
    } else {
        routerNamedImports.push(...commonRouterNameImports);
    }

    routerNamedImports.sort();

    const implementationImports = routerNamedImports.join(', ');

    return generateFromFiles(options, {
        implementations,
        implementationImports,
    });
}
