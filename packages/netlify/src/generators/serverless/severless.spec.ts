import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from 'nx/src/devkit-testing-exports';
import { serverlessGenerator } from './serverless';
describe('serverless', () => {
  let tree: Tree;

  beforeEach(() => (tree = createTreeWithEmptyWorkspace()));

  it('should be an empty node project', async () => {
    await serverlessGenerator(tree, {
      name: 'api',
    });

    const project = readProjectConfiguration(tree, 'api');
    expect(tree.exists('netlify.toml'));
    expect(tree.exists('functions/hello/hello.ts'));
    expect(project.targets).toMatchObject({
      'serve-functions': {
        command: 'npx netlify dev',
      },
      'deploy-functions': {
        dependsOn: ['lint'],
        command: 'npx netlify deploy',
      },
    });
    expect(tree.exists('src')).toBeFalsy();
    expect(tree.exists('tools')).toBeFalsy();
  });
});
