/**
 * This utility function could not be identified in the interface @angular-devkit/schematics: Tree
 */

import { SchematicsException, Tree } from '@angular-devkit/schematics';

export const readText = (host: Tree, path: string) => {
    const text = host?.read(path) || null;
    if (text === null)
        throw new SchematicsException(`File ${path} does not exist.`);
    return text?.toString() || '';
};
