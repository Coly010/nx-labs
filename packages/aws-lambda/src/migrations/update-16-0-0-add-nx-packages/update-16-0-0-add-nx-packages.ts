import { formatFiles, Tree } from '@nx/devkit';
import { replaceNrwlPackageWithNxPackage } from '@nx/devkit/src/utils/replace-package';

export default async function replacePackage(tree: Tree): Promise<void> {
  await replaceNrwlPackageWithNxPackage(
    tree,
    '@nrwl/aws-lambda',
    '@nx/aws-lambda'
  );

  await formatFiles(tree);
}
