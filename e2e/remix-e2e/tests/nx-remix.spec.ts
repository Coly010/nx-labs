import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runCommandAsync,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nx/plugin/testing';

xdescribe('remix e2e', () => {
  beforeAll(() => {
    ensureNxProject('@nx/remix', 'dist/packages/remix');
  });

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    runNxCommandAsync('reset');
  });

  it('should create a standalone remix app', async () => {
    const appName = uniq('remix');
    await runNxCommandAsync(
      `generate @nx/remix:preset --name ${appName} --verbose`
    );

    // Can import using ~ alias like a normal Remix setup.
    updateFile(`app/foo.ts`, `export const foo = 'foo';`);
    updateFile(
      `app/routes/index.tsx`,
      `
      import { foo } from '~/foo';
      export default function Index() {
        return (
          <h1>{foo}</h1>
        );
      }
    `
    );

    const result = await runNxCommandAsync(`build ${appName}`);
    expect(result.stdout).toContain('Successfully ran target build');
  }, 120_000);

  it('should create app', async () => {
    const plugin = uniq('remix');
    await runNxCommandAsync(`generate @nx/remix:app ${plugin}`);

    const buildResult = await runNxCommandAsync(`build ${plugin}`);
    expect(buildResult.stdout).toContain('Successfully ran target build');

    const testResult = await runNxCommandAsync(`test ${plugin}`);
    expect(testResult.stdout).toContain('Successfully ran target test');
  }, 120000);

  describe('--directory', () => {
    it('should create src in the specified directory --projectNameAndRootFormat=derived', async () => {
      const plugin = uniq('remix');
      const appName = `sub-${plugin}`;
      await runNxCommandAsync(
        `generate @nx/remix:app ${plugin} --directory=sub --projectNameAndRootFormat=derived --rootProject=false`
      );
      const project = readJson(`sub/${plugin}/project.json`);
      expect(project.targets.build.options.outputPath).toEqual(
        `dist/sub/${plugin}`
      );

      const result = await runNxCommandAsync(`build ${appName}`);
      expect(result.stdout).toContain('Successfully ran target build');
    }, 120000);

    it('should create src in the specified directory --projectNameAndRootFormat=as-provided', async () => {
      const plugin = uniq('remix');
      await runNxCommandAsync(
        `generate @nx/remix:app ${plugin} --directory=subdir --projectNameAndRootFormat=as-provided --rootProject=false`
      );
      const project = readJson(`subdir/project.json`);
      expect(project.targets.build.options.outputPath).toEqual(`dist/subdir`);

      const result = await runNxCommandAsync(`build ${plugin}`);
      expect(result.stdout).toContain('Successfully ran target build');
    }, 120000);
  });

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      const plugin = uniq('remix');
      await runNxCommandAsync(
        `generate @nx/remix:app ${plugin} --tags e2etag,e2ePackage`
      );
      const project = readJson(`${plugin}/project.json`);
      expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
    }, 120000);
  });

  describe('--js', () => {
    it('should create js app and build correctly', async () => {
      const plugin = uniq('remix');
      await runNxCommandAsync(`generate @nx/remix:app ${plugin} --js=true`);

      const result = await runNxCommandAsync(`build ${plugin}`);
      expect(result.stdout).toContain('Successfully ran target build');
    }, 120000);
  });

  describe('--unitTestRunner', () => {
    it('should generate a library with vitest and test correctly', async () => {
      const plugin = uniq('remix');
      await runNxCommandAsync(
        `generate @nx/remix:library ${plugin} --unitTestRunner=vitest`
      );

      const result = await runNxCommandAsync(`test ${plugin}`);
      expect(result.stdout).toContain(`Successfully ran target test`);
    }, 120_000);
  });

  describe('error checking', () => {
    const plugin = uniq('remix');

    beforeAll(async () => {
      await runNxCommandAsync(
        `generate @nx/remix:app ${plugin} --tags e2etag,e2ePackage`
      );
    }, 120000);

    it('should check for un-escaped dollar signs in routes', async () => {
      await expect(
        async () =>
          await runNxCommandAsync(
            `generate @nx/remix:route --project ${plugin} --path my.route.$withParams.tsx`
          )
      ).rejects.toThrow();

      await runNxCommandAsync(
        `generate @nx/remix:route --project ${plugin} --path my.route.\\$withParams.tsx`
      );

      expect(() =>
        checkFilesExist(`${plugin}/app/routes/my.route.$withParams.tsx`)
      ).not.toThrow();
    }, 120000);

    it('should pass un-escaped dollar signs in routes with skipChecks flag', async () => {
      await runCommandAsync(
        `someWeirdUseCase=route-segment && yarn nx generate @nx/remix:route --project ${plugin} --path my.route.$someWeirdUseCase.tsx --force`
      );

      expect(() =>
        checkFilesExist(`${plugin}/app/routes/my.route.route-segment.tsx`)
      ).not.toThrow();
    }, 120000);

    it('should check for un-escaped dollar signs in resource routes', async () => {
      await expect(
        async () =>
          await runNxCommandAsync(
            `generate @nx/remix:resource-route --project ${plugin} --path my.route.$withParams.ts`
          )
      ).rejects.toThrow();

      await runNxCommandAsync(
        `generate @nx/remix:resource-route --project ${plugin} --path my.route.\\$withParams.ts`
      );

      expect(() =>
        checkFilesExist(`${plugin}/app/routes/my.route.$withParams.ts`)
      ).not.toThrow();
    }, 120000);

    it('should pass un-escaped dollar signs in resource routes with skipChecks flag', async () => {
      await runCommandAsync(
        `someWeirdUseCase=route-segment && yarn nx generate @nx/remix:resource-route --project ${plugin} --path my.route.$someWeirdUseCase.ts --force`
      );

      expect(() =>
        checkFilesExist(`${plugin}/app/routes/my.route.route-segment.ts`)
      ).not.toThrow();
    }, 120000);
  });
});
