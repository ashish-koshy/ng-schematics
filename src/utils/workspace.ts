/**
 * This utility function could not be identified at @schematics/utility/workspace
 */

import { workspaces } from '@angular-devkit/core';
import { noop, Rule, Tree } from '@angular-devkit/schematics';

const DEFAULT_WORKSPACE_PATH = '/angular.json';

// re-export the workspace definition types for convenience
export type WorkspaceDefinition = workspaces.WorkspaceDefinition;

/**
 * A {@link workspaces.WorkspaceHost} backed by a Schematics {@link Tree} instance.
 */
class TreeWorkspaceHost implements workspaces.WorkspaceHost {
    constructor(private readonly tree: Tree) {}

    async readFile(path: string): Promise<string> {
        return this.tree.read(path)?.toString() || '';
    }

    async writeFile(path: string, data: string): Promise<void> {
        if (this.tree.exists(path)) {
            this.tree.overwrite(path, data);
        } else {
            this.tree.create(path, data);
        }
    }

    async isDirectory(path: string): Promise<boolean> {
        // approximate a directory check
        return (
            !this.tree.exists(path) &&
            this.tree.getDir(path).subfiles.length > 0
        );
    }

    async isFile(path: string): Promise<boolean> {
        return this.tree.exists(path);
    }
}

/**
 * Updates the workspace file (`angular.json`) found within the root of the schematic's tree.
 * The workspace object model can be directly modified within the provided updater function
 * with changes being written to the workspace file after the updater function returns.
 * The spacing and overall layout of the file (including comments) will be maintained where
 * possible when updating the file.
 *
 * @param updater An update function that can be used to modify the object model for the
 * workspace. A {@link WorkspaceDefinition} is provided as the first argument to the function.
 */
export function updateWorkspace(
    updater: (
        workspace: WorkspaceDefinition
    ) => void | Rule | PromiseLike<void | Rule>
): Rule {
    return async (tree: Tree) => {
        const host = new TreeWorkspaceHost(tree);

        const { workspace } = await workspaces.readWorkspace(
            DEFAULT_WORKSPACE_PATH,
            host
        );

        const result = await updater(workspace);

        await workspaces.writeWorkspace(workspace, host);

        return result || noop;
    };
}

// TODO: This should be renamed `readWorkspace` once deep imports are restricted (already exported from `utility` with that name)
/**
 * Reads a workspace file (`angular.json`) from the provided {@link Tree} instance.
 *
 * @param tree A schematics {@link Tree} instance used to access the workspace file.
 * @param path The path where a workspace file should be found. If a file is specified, the file
 * path will be used. If a directory is specified, the file `angular.json` will be used from
 * within the specified directory. Defaults to `/angular.json`.
 * @returns A {@link WorkspaceDefinition} representing the workspace found at the specified path.
 */
export async function getWorkspace(
    tree: Tree,
    path = DEFAULT_WORKSPACE_PATH
): Promise<WorkspaceDefinition> {
    const host = new TreeWorkspaceHost(tree);

    const { workspace } = await workspaces.readWorkspace(path, host);

    return workspace;
}

/**
 * Writes a workspace file (`angular.json`) to the provided {@link Tree} instance.
 * The spacing and overall layout of an exisitng file (including comments) will be maintained where
 * possible when writing the file.
 *
 * @param tree A schematics {@link Tree} instance used to access the workspace file.
 * @param workspace The {@link WorkspaceDefinition} to write.
 * @param path The path where a workspace file should be written. If a file is specified, the file
 * path will be used. If not provided, the definition's underlying file path stored during reading
 * will be used.
 */
export async function writeWorkspace(
    tree: Tree,
    workspace: WorkspaceDefinition,
    path?: string
): Promise<void> {
    const host = new TreeWorkspaceHost(tree);

    return workspaces.writeWorkspace(workspace, host, path);
}
