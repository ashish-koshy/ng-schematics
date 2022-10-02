/**
 * This utility function could not be located at @schematics/angular/utility/add-declaration-to-ng-module
 */

import { strings } from '@angular-devkit/core';
import { Rule, Tree } from '@angular-devkit/schematics';
import {
    addDeclarationToModule,
    addSymbolToNgModuleMetadata,
} from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import * as ts from 'typescript';
import { readText } from './read-text';

export interface DeclarationToNgModuleOptions {
    module?: string;
    path?: string;
    name: string;
    flat?: boolean;
    export?: boolean;
    type: string;
    skipImport?: boolean;
    standalone?: boolean;
}

export function addDeclarationToNgModule(
    options: DeclarationToNgModuleOptions
): Rule {
    return (host: Tree) => {
        const modulePath = options.module;
        if (options.skipImport || options.standalone || !modulePath) {
            return host;
        }

        const sourceText = readText(host, modulePath);
        const source = ts.createSourceFile(
            modulePath,
            sourceText,
            ts.ScriptTarget.Latest,
            true
        );
        const filePath =
            `/${options.path}/` +
            (options.flat ? '' : strings.dasherize(options.name) + '/') +
            strings.dasherize(options.name) +
            (options.type ? '.' : '') +
            strings.dasherize(options.type);

        const importPath = buildRelativePath(modulePath, filePath);
        const classifiedName =
            strings.classify(options.name) + strings.classify(options.type);
        const changes = addDeclarationToModule(
            source,
            modulePath,
            classifiedName,
            importPath
        );

        if (options.export) {
            changes.push(
                ...addSymbolToNgModuleMetadata(
                    source,
                    modulePath,
                    'exports',
                    classifiedName
                )
            );
        }

        const recorder = host.beginUpdate(modulePath);
        for (const change of changes) {
            if (change instanceof InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(recorder);

        return host;
    };
}
